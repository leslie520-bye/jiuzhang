const path = require('path');
const fs = require('fs');
let db = null;
const DB_PATH = path.join(__dirname, 'data', 'diagnoses.db');

async function initDB(SQL) {
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  db.run("PRAGMA foreign_keys = ON");
  db.run("CREATE TABLE IF NOT EXISTS diagnoses (id INTEGER PRIMARY KEY AUTOINCREMENT,student_name TEXT NOT NULL,grade TEXT NOT NULL,current_score TEXT DEFAULT '',target_score TEXT DEFAULT '',teacher_observation TEXT DEFAULT '',parent_requirement TEXT DEFAULT '',student_feedback TEXT DEFAULT '',avg_percentage REAL DEFAULT 0,exam_scores TEXT DEFAULT '[]',cause_data TEXT DEFAULT '{}',full_report TEXT DEFAULT '',created_at DATETIME DEFAULT (datetime('now','localtime')))");
  db.run("CREATE TABLE IF NOT EXISTS module_results (id INTEGER PRIMARY KEY AUTOINCREMENT,diagnosis_id INTEGER NOT NULL,module_name TEXT NOT NULL,module_avg REAL DEFAULT 0,error_types TEXT DEFAULT '[]',FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id) ON DELETE CASCADE)");
  db.run("CREATE TABLE IF NOT EXISTS subtopic_results (id INTEGER PRIMARY KEY AUTOINCREMENT,module_result_id INTEGER NOT NULL,subtopic_name TEXT NOT NULL,percentage REAL DEFAULT 0,FOREIGN KEY (module_result_id) REFERENCES module_results(id) ON DELETE CASCADE)");
  _save();
  console.log('[DB] 本地数据库已初始化');
}

function _save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function _q(sql, params) {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const cols = stmt.getColumnNames();
  const rows = [];
  while (stmt.step()) rows.push(stmt.get());
  stmt.free();
  return rows.map(r => { const o = {}; cols.forEach((c,i) => o[c]=r[i]); return o; });
}

function _run(sql, params) { db.run(sql, params); _save(); }

function saveDiagnosis(data) {
  const avg = (data.modules||[]).length > 0 ? Math.round(data.modules.reduce((s,m) => s+(m.module_avg||0),0)/data.modules.length) : 0;
 _run("INSERT INTO diagnoses(student_name,grade,current_score,target_score,teacher_observation,parent_requirement,student_feedback,avg_percentage,exam_scores,cause_data,learning_habits,competitive_position,exam_strategy,full_report) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
   [data.student_name, data.grade, data.current_score||'', data.target_score||'', data.teacher_observation||'', data.parent_requirement||'', data.student_feedback||'', avg, JSON.stringify(data.exam_scores||[]), JSON.stringify(data.cause_data||{}), JSON.stringify(data.learning_habits||{}), JSON.stringify(data.competitive_position||{}), JSON.stringify(data.exam_strategy||{}), data.full_report||'']);
  const rows = _q("SELECT last_insert_rowid() as id"); const diagId = rows[0].id;
  if (data.modules) data.modules.forEach(m => {
    _run("INSERT INTO module_results(diagnosis_id,module_name,module_avg,error_types) VALUES(?,?,?,?)", [diagId, m.module_name, m.module_avg||0, JSON.stringify(m.error_types||[])]);
    const mr = _q("SELECT last_insert_rowid() as id"); const mid = mr[0].id;
    if (m.subtopics) m.subtopics.forEach(s => _run("INSERT INTO subtopic_results(module_result_id,subtopic_name,percentage) VALUES(?,?,?)", [mid, s.name, s.pct]));
  });
  return diagId;
}

function listDiagnoses(sn) {
  if (sn) return _q("SELECT id,student_name,grade,avg_percentage,created_at,current_score,target_score FROM diagnoses WHERE student_name LIKE ? ORDER BY created_at DESC LIMIT 100", ['%'+sn+'%']);
  return _q("SELECT id,student_name,grade,avg_percentage,created_at,current_score,target_score FROM diagnoses ORDER BY created_at DESC LIMIT 100");
}

function getDiagnosis(id) {
  const rows = _q("SELECT * FROM diagnoses WHERE id=?", [id]); if (!rows.length) return null;
  const d = rows[0];
  d.modules = _q("SELECT * FROM module_results WHERE diagnosis_id=?", [id]);
  d.modules.forEach(m => {
    m.subtopics = _q("SELECT * FROM subtopic_results WHERE module_result_id=?", [m.id]);
    try { m.error_types = JSON.parse(m.error_types); } catch(e) { m.error_types = []; }
  });
  try { d.exam_scores = JSON.parse(d.exam_scores); } catch(e) { d.exam_scores = []; }
  try { d.cause_data = JSON.parse(d.cause_data); } catch(e) { d.cause_data = {}; }
  return d;
}

function listStudents() { return _q("SELECT DISTINCT student_name FROM diagnoses ORDER BY student_name"); }
function deleteDiagnosis(id) { _run("DELETE FROM diagnoses WHERE id=?", [id]); }
function getStudentTrend(sn) {
  const ds = _q("SELECT id,student_name,grade,avg_percentage,created_at,current_score,target_score FROM diagnoses WHERE student_name=? ORDER BY created_at ASC", [sn]);
  ds.forEach(d => { d.modules = _q("SELECT * FROM module_results WHERE diagnosis_id=?", [d.id]); });
  return ds;
}

 function saveCoursePlan(data) {
   _run("INSERT INTO course_plans(diagnosis_id,student_name,grade,total_hours,weeks_count,plan_data) VALUES(?,?,?,?,?,?)",
     [data.diagnosis_id||0, data.student_name, data.grade, data.total_hours||0, data.weeks_count||0, JSON.stringify(data.plan_data||{})]);
   const rows = _q("SELECT last_insert_rowid() as id");
   return rows[0].id;
 }
 function listCoursePlans(sn) {
   if (sn) return _q("SELECT id,student_name,grade,total_hours,weeks_count,created_at FROM course_plans WHERE student_name LIKE ? ORDER BY created_at DESC LIMIT 100", ['%'+sn+'%']);
   return _q("SELECT id,student_name,grade,total_hours,weeks_count,created_at FROM course_plans ORDER BY created_at DESC LIMIT 100");
 }
 function getCoursePlan(id) {
   const rows = _q("SELECT * FROM course_plans WHERE id=?", [id]);
   if (!rows.length) return null;
   try { rows[0].plan_data = JSON.parse(rows[0].plan_data); } catch(e) {}
   return rows[0];
 }
 function deleteCoursePlan(id) { _run("DELETE FROM course_plans WHERE id=?", [id]); }
 
 function updateCoursePlan(id, data) {
   _run("UPDATE course_plans SET total_hours=?, weeks_count=?, plan_data=? WHERE id=?", [data.total_hours||0, data.weeks_count||0, JSON.stringify(data.plan_data||{}), id]);
 }
 module.exports = { initDB, saveDiagnosis, listDiagnoses, getDiagnosis, listStudents, deleteDiagnosis, getStudentTrend, saveCoursePlan, listCoursePlans, getCoursePlan, deleteCoursePlan, updateCoursePlan };
