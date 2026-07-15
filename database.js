const https = require('https');
let dbReady = false;
const TURSO_HOST = (process.env.TURSO_URL||'').replace('libsql://','');
const TURSO_TOKEN = process.env.TURSO_TOKEN||'';

function _req(host, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opt = { hostname: host, port: 443, path: path, method: 'POST',
      headers: { 'Authorization': 'Bearer '+TURSO_TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const r = https.request(opt, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{resolve(JSON.parse(d))}catch(e){reject(d)}}); });
    r.on('error',reject); r.write(data); r.end();
  });
}

async function _q(sql, params) {
  const data = await _req(TURSO_HOST, '/v2/pipeline', { requests: [{ type: 'execute', stmt: { sql, args: params||[] } }] });
  if (data.error) throw new Error(data.error.message);
  const result = data.results?.[0]?.response?.result;
  if (!result || !result.cols) return [];
  const cols = result.cols.map(c => c.name || c);
  return result.rows.map(r => { const o={}; cols.forEach((c,i)=>o[c]=r[i]); return o; });
}

async function _run(sql, params) {
  const data = await _req(TURSO_HOST, '/v2/pipeline', { requests: [{ type: 'execute', stmt: { sql, args: params||[] } }] });
  if (data.error) throw new Error(data.error.message);
}

async function initDB() {
  if (dbReady) return;
  if (!TURSO_HOST) throw new Error('TURSO_URL not set');
  await _run("CREATE TABLE IF NOT EXISTS diagnoses (id INTEGER PRIMARY KEY AUTOINCREMENT,student_name TEXT NOT NULL,grade TEXT NOT NULL,current_score TEXT DEFAULT '',target_score TEXT DEFAULT '',teacher_observation TEXT DEFAULT '',parent_requirement TEXT DEFAULT '',student_feedback TEXT DEFAULT '',avg_percentage REAL DEFAULT 0,exam_scores TEXT DEFAULT '[]',cause_data TEXT DEFAULT '{}',full_report TEXT DEFAULT '',created_at TEXT DEFAULT (datetime('now','localtime')))");
  await _run("CREATE TABLE IF NOT EXISTS module_results (id INTEGER PRIMARY KEY AUTOINCREMENT,diagnosis_id INTEGER NOT NULL,module_name TEXT NOT NULL,module_avg REAL DEFAULT 0,error_types TEXT DEFAULT '[]',FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id) ON DELETE CASCADE)");
  await _run("CREATE TABLE IF NOT EXISTS subtopic_results (id INTEGER PRIMARY KEY AUTOINCREMENT,module_result_id INTEGER NOT NULL,subtopic_name TEXT NOT NULL,percentage REAL DEFAULT 0,FOREIGN KEY (module_result_id) REFERENCES module_results(id) ON DELETE CASCADE)");
  await _run("CREATE TABLE IF NOT EXISTS course_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,diagnosis_id INTEGER DEFAULT 0,student_name TEXT NOT NULL,grade TEXT NOT NULL,total_hours INTEGER DEFAULT 0,weeks_count INTEGER DEFAULT 0,plan_data TEXT DEFAULT '{}',created_at TEXT DEFAULT (datetime('now','localtime')))");
  dbReady = true;
}

async function saveDiagnosis(data) {
  const avg = (data.modules||[]).length ? Math.round(data.modules.reduce((s,m)=>s+(m.module_avg||0),0)/data.modules.length) : 0;
  const r = await _q("INSERT INTO diagnoses(student_name,grade,current_score,target_score,teacher_observation,parent_requirement,student_feedback,avg_percentage,exam_scores,cause_data,full_report) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING id",
    [data.student_name,data.grade,data.current_score||'',data.target_score||'',data.teacher_observation||'',data.parent_requirement||'',data.student_feedback||'',avg,JSON.stringify(data.exam_scores||[]),JSON.stringify(data.cause_data||{}),data.full_report||'']);
  const diagId = Number(r[0].id);
  if (data.modules) for (const m of data.modules) {
    const mr = await _q("INSERT INTO module_results(diagnosis_id,module_name,module_avg,error_types) VALUES(?,?,?,?) RETURNING id",
      [diagId, m.module_name, m.module_avg||0, JSON.stringify(m.error_types||[])]);
    const mid = Number(mr[0].id);
    if (m.subtopics) for (const s of m.subtopics) await _run("INSERT INTO subtopic_results(module_result_id,subtopic_name,percentage) VALUES(?,?,?)", [mid, s.name, s.pct]);
  }
  return diagId;
}

async function listDiagnoses(sn) {
  if (sn) return await _q("SELECT id,student_name,grade,avg_percentage,created_at,current_score,target_score FROM diagnoses WHERE student_name LIKE ? ORDER BY created_at DESC LIMIT 100", ['%'+sn+'%']);
  return await _q("SELECT id,student_name,grade,avg_percentage,created_at,current_score,target_score FROM diagnoses ORDER BY created_at DESC LIMIT 100");
}

async function getDiagnosis(id) {
  const rows = await _q("SELECT * FROM diagnoses WHERE id=?", [id]); if (!rows.length) return null;
  const d = { ...rows[0] };
  d.modules = await _q("SELECT * FROM module_results WHERE diagnosis_id=?", [id]);
  for (const m of d.modules) { m.subtopics = await _q("SELECT * FROM subtopic_results WHERE module_result_id=?", [m.id]); try { m.error_types=JSON.parse(m.error_types); } catch(e) {} }
  try { d.exam_scores=JSON.parse(d.exam_scores); } catch(e) {} try { d.cause_data=JSON.parse(d.cause_data); } catch(e) {}
  return d;
}

async function listStudents() { return await _q("SELECT DISTINCT student_name FROM diagnoses ORDER BY student_name"); }
async function deleteDiagnosis(id) { await _run("DELETE FROM diagnoses WHERE id=?", [id]); }

async function getStudentTrend(sn) {
  const ds = await _q("SELECT id,student_name,grade,avg_percentage,created_at,current_score,target_score FROM diagnoses WHERE student_name=? ORDER BY created_at ASC", [sn]);
  for (const d of ds) d.modules = await _q("SELECT * FROM module_results WHERE diagnosis_id=?", [d.id]);
  return ds;
}

async function saveCoursePlan(data) {
  await _run("INSERT INTO course_plans(diagnosis_id,student_name,grade,total_hours,weeks_count,plan_data) VALUES(?,?,?,?,?,?)",
    [data.diagnosis_id||0, data.student_name, data.grade, data.total_hours||0, data.weeks_count||0, JSON.stringify(data.plan_data||{})]);
  return Number((await _q("SELECT last_insert_rowid() as id"))[0].id);
}
async function listCoursePlans(sn) {
  if (sn) return await _q("SELECT id,student_name,grade,total_hours,weeks_count,created_at FROM course_plans WHERE student_name LIKE ? ORDER BY created_at DESC LIMIT 100", ['%'+sn+'%']);
  return await _q("SELECT id,student_name,grade,total_hours,weeks_count,created_at FROM course_plans ORDER BY created_at DESC LIMIT 100");
}
async function getCoursePlan(id) {
  const rows = await _q("SELECT * FROM course_plans WHERE id=?", [id]); if (!rows.length) return null;
  try { rows[0].plan_data=JSON.parse(rows[0].plan_data); } catch(e) {}
  return rows[0];
}
async function deleteCoursePlan(id) { await _run("DELETE FROM course_plans WHERE id=?", [id]); }
async function updateCoursePlan(id, data) {
  await _run("UPDATE course_plans SET total_hours=?,weeks_count=?,plan_data=? WHERE id=?", [data.total_hours||0, data.weeks_count||0, JSON.stringify(data.plan_data||{}), id]);
}

module.exports = { initDB, saveDiagnosis, listDiagnoses, getDiagnosis, listStudents, deleteDiagnosis, getStudentTrend, saveCoursePlan, listCoursePlans, getCoursePlan, deleteCoursePlan, updateCoursePlan, isReady: dbReady };
