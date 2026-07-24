const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// In-memory database
var _dbStore = {diags:[], mods:[], subs:[], courses:[]};
var db = {
  initDB: async()=>{}, isReady:true,
  saveDiagnosis: function(d) {
    var id = Date.now();
    var avg = (d.modules||[]).length ? Math.round(d.modules.reduce(function(s,m){return s+(m.module_avg||0)},0)/d.modules.length) : 0;
    _dbStore.diags.push({id:id,student_name:d.student_name||'',grade:d.grade||'',current_score:d.current_score||'',target_score:d.target_score||'',teacher_observation:d.teacher_observation||'',parent_requirement:d.parent_requirement||'',student_feedback:d.student_feedback||'',avg_percentage:avg,exam_scores:JSON.stringify(d.exam_scores||[]),cause_data:JSON.stringify(d.cause_data||{}),full_report:d.full_report||'',created_at:new Date().toISOString()});
    if(d.modules) d.modules.forEach(function(m){var mid=id+1+_dbStore.mods.length;_dbStore.mods.push({id:mid,diagnosis_id:id,module_name:m.module_name||'',module_avg:m.module_avg||0,error_types:JSON.stringify(m.error_types||[])});if(m.subtopics)m.subtopics.forEach(function(s){_dbStore.subs.push({id:mid+1+_dbStore.subs.length,module_result_id:mid,subtopic_name:s.name||'',percentage:s.pct||0})});});
    return id;
  },
  listDiagnoses: function(sn){var t=_dbStore.diags;if(sn)t=t.filter(function(d){return d.student_name.indexOf(sn)>=0});return t.map(function(d){return{id:d.id,student_name:d.student_name,grade:d.grade,avg_percentage:d.avg_percentage,created_at:d.created_at,current_score:d.current_score,target_score:d.target_score}});},
  getDiagnosis: function(id){var d=_dbStore.diags.find(function(x){return x.id===id});if(!d)return null;var r=Object.assign({},d);r.modules=_dbStore.mods.filter(function(m){return m.diagnosis_id===id}).map(function(m){var mr=Object.assign({},m);mr.subtopics=_dbStore.subs.filter(function(s){return s.module_result_id===mr.id});try{mr.error_types=JSON.parse(mr.error_types)}catch(e){}return mr});try{r.exam_scores=JSON.parse(r.exam_scores)}catch(e){}try{r.cause_data=JSON.parse(r.cause_data)}catch(e){}return r;},
  listStudents: function(){var n=[];_dbStore.diags.forEach(function(d){if(n.indexOf(d.student_name)<0&&d.student_name)n.push(d.student_name)});return n.map(function(x){return{student_name:x}});},
  deleteDiagnosis: function(id){_dbStore.diags=_dbStore.diags.filter(function(d){return d.id!==id});_dbStore.mods=_dbStore.mods.filter(function(m){return m.diagnosis_id!==id});},
  getStudentTrend: function(sn){return _dbStore.diags.filter(function(d){return d.student_name===sn}).map(function(d){var r={id:d.id,student_name:d.student_name,grade:d.grade,avg_percentage:d.avg_percentage,created_at:d.created_at,current_score:d.current_score,target_score:d.target_score};r.modules=_dbStore.mods.filter(function(m){return m.diagnosis_id===d.id});return r});},
  saveCoursePlan: function(d){var id=Date.now()+1;_dbStore.courses.push({id:id,diagnosis_id:d.diagnosis_id||0,student_name:d.student_name,grade:d.grade,total_hours:d.total_hours||0,weeks_count:d.weeks_count||0,plan_data:JSON.stringify(d.plan_data||{}),created_at:new Date().toISOString()});return id;},
  listCoursePlans: function(sn){var t=_dbStore.courses;if(sn)t=t.filter(function(c){return c.student_name.indexOf(sn)>=0});return t.map(function(c){return{id:c.id,student_name:c.student_name,grade:c.grade,total_hours:c.total_hours,weeks_count:c.weeks_count,created_at:c.created_at}});},
  getCoursePlan: function(id){var c=_dbStore.courses.find(function(x){return x.id===id});if(!c)return null;var r=Object.assign({},c);try{r.plan_data=JSON.parse(r.plan_data)}catch(e){}return r;},
  deleteCoursePlan: function(id){_dbStore.courses=_dbStore.courses.filter(function(c){return c.id!==id});},
  updateCoursePlan: function(id,d){var c=_dbStore.courses.find(function(x){return x.id===id});if(c){c.total_hours=d.total_hours||0;c.weeks_count=d.weeks_count||0;c.plan_data=JSON.stringify(d.plan_data||{})}}
};

const app = express();
app.use(cors());
app.use(express.json({limit:'50mb'}));
app.use(express.static(path.join(__dirname, '..', 'public')));

const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) try { fs.mkdirSync(UPLOAD_DIR); } catch(e) {}

// Provide in-memory fallback when DB is not available
function makeFallbackDB() {
  var fn = function() { return []; };
  var idFn = function() { return Date.now(); };
  return {
    initDB: async()=>{}, isReady:true,
    saveDiagnosis: idFn, listDiagnoses: fn, getDiagnosis: function() { return null; },
    listStudents: fn, deleteDiagnosis: function() {}, getStudentTrend: fn,
    saveCoursePlan: idFn, listCoursePlans: fn, getCoursePlan: function() { return null; },
    deleteCoursePlan: function() {}, updateCoursePlan: function() {}
  };
}

app.use(async (req, res, next) => {
  try {
    if (!db.isReady && db.initDB) {
      try { await db.initDB(); } catch(e) {
        console.error('DB init failed, using in-memory:', e.message);
        db = makeFallbackDB();
      }
    }
    db.isReady = true;
    next();
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// === Diagnosis CRUD ===
app.post('/api/diagnosis', async (req, res) => { try { const id = await db.saveDiagnosis(req.body); res.json({ success: true, id }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.get('/api/diagnosis', async (req, res) => { try { res.json({ success: true, data: await db.listDiagnoses(req.query.student) }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.get('/api/diagnosis/:id', async (req, res) => { try { const d = await db.getDiagnosis(parseInt(req.params.id)); if (!d) return res.status(404).json({ success: false, error: 'not found' }); res.json({ success: true, data: d }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.get('/api/students', async (req, res) => { try { res.json({ success: true, data: await db.listStudents() }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.get('/api/trend/:student', async (req, res) => { try { res.json({ success: true, data: await db.getStudentTrend(req.params.student) }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.delete('/api/diagnosis/:id', async (req, res) => { try { await db.deleteDiagnosis(parseInt(req.params.id)); res.json({ success: true }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.get('/api/history', async (req, res) => { try { res.json({ success: true, data: await db.listDiagnoses() }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });

// === Course Plan CRUD ===
app.post('/api/courseplan', async (req, res) => { try { const id = await db.saveCoursePlan(req.body); res.json({ success: true, id }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.get('/api/courseplan', async (req, res) => { try { res.json({ success: true, data: await db.listCoursePlans(req.query.student) }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.get('/api/courseplan/:id', async (req, res) => { try { const d = await db.getCoursePlan(parseInt(req.params.id)); if (!d) return res.status(404).json({ success: false, error: 'not found' }); res.json({ success: true, data: d }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.put('/api/courseplan/:id', async (req, res) => { try { await db.updateCoursePlan(parseInt(req.params.id), req.body); res.json({ success: true }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
app.delete('/api/courseplan/:id', async (req, res) => { try { await db.deleteCoursePlan(parseInt(req.params.id)); res.json({ success: true }); } catch(e) { res.status(500).json({ success: false, error: e.message }); } });
// === Image Upload ===
app.post('/api/upload', (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !images.length) return res.status(400).json({ success: false, error: 'no images' });
    const saved = [];
    images.forEach((img, i) => {
      const match = (img.data || img).match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) { saved.push({ filename: null, error: 'invalid format' }); return; }
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const filename = 'paper_' + Date.now() + '_' + i + '.' + ext;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), match[2], 'base64');
      saved.push({ filename, url: '/uploads/' + filename, originalName: img.name || filename });
    });
    res.json({ success: true, files: saved });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// === AI Analyze (DeepSeek Vision) ===
app.post('/api/analyze', async (req, res) => {
  try {
    const { files, grade } = req.body;
    if (!files || !files.length) return res.status(400).json({ success: false, error: 'no files' });
    const apiKey = process.env.DEEPSEEK_API_KEY || '';
    let result;
    if (apiKey && apiKey.length > 10) {
      result = await analyzeWithDeepSeek(files, grade || '', apiKey);
    } else {
      result = analyzeWithMock(files, grade || '');
    }
    res.json({ success: true, ...result });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

async function analyzeWithDeepSeek(files, grade, apiKey) {
  const images = files.map(function(f) {
    var p = path.join(UPLOAD_DIR, f.filename);
    if (!fs.existsSync(p)) return null;
    var d = fs.readFileSync(p).toString('base64');
    var ext = path.extname(p).replace('.','');
    return { type: 'image_url', image_url: { url: 'data:image/' + ext + ';base64,' + d } };
  }).filter(Boolean);
  if (!images.length) throw new Error('No valid images');
  try {
    var resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: 'deepseek-vl2',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze these math exam papers for ' + grade + '. Return JSON: {student_name,score,wrong_questions:[{number,topic,error_type}],weak_modules:[{name,avg}],error_distribution:{c,l,m,e},cause_analysis:{a,b,c,d},summary}' },
            ...images
          ]
        }],
        max_tokens: 2000
      })
    });
    var data = await resp.json();
    var text = data.choices?.[0]?.message?.content || '';
    try {
      var cleaned = text.replace(/^`json\s*|`\s*$/g, '').trim();
      return JSON.parse(cleaned);
    } catch(e2) {
      return { student_name: '', score: '', wrong_questions: [], weak_modules: [], error_distribution: {}, cause_analysis: {}, summary: text.substring(0, 500) };
    }
  } catch(e3) {
    return { student_name: '', score: '', wrong_questions: [], weak_modules: [], error_distribution: {}, cause_analysis: {}, summary: 'AI analysis failed: ' + e3.message };
  }
}

function analyzeWithMock(files, grade) {
  return {
    student_name: '',
    score: 'pending',
    wrong_questions: [
      { number: 12, topic: 'Quadratic function range', error_type: 'concept' },
      { number: 19, topic: 'Geometry proof', error_type: 'approach' },
      { number: 21, topic: 'Conic constant value', error_type: 'calculation' }
    ],
    weak_modules: [
      { name: 'Functions & Derivatives', avg: 55 },
      { name: 'Analytic Geometry', avg: 40 },
      { name: 'Sequences & Inequalities', avg: 60 }
    ],
    error_distribution: { c: 2, l: 3, m: 5, e: 1 },
    cause_analysis: { a: 20, b: 30, c: 40, d: 10 },
    summary: 'Weak areas: analytic geometry and function problems. Recommend focused practice.'
  };
}


// === LLM-Powered Diagnosis ===
app.post("/api/diagnose", async (req, res) => {
  try {
    const { questions, enableLLM } = req.body;
    if (!questions || !questions.length) {
      return res.status(400).json({ success: false, error: "no questions" });
    }
    const result = await diagnosticEngine.diagnose(
      { questions },
      {
        deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
        enableLLM: enableLLM !== false,
      }
    );
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === Analyze with LLM Attribution ===
app.post("/api/analyze-llm", async (req, res) => {
  try {
    const { wrongQuestions, enableLLM } = req.body;
    if (!wrongQuestions || !wrongQuestions.length) {
      return res.status(400).json({ success: false, error: "no questions" });
    }
    const questions = wrongQuestions.map((q, i) => ({
      id: i + 1,
      question: q.topic || q.question || "",
      correctAnswer: q.correctAnswer || "",
      studentAnswer: q.errorDescription || q.studentAnswer || "",
      isCorrect: false,
      errorDescription: q.errorDescription || q.errorType || "",
      relatedKPs: q.relatedKPs || [],
    }));
    const result = await diagnosticEngine.diagnose(
      { questions },
      {
        deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
        enableLLM: enableLLM !== false,
      }
    );
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === Payment API (PayJS / Mock) ===
const crypto = require('crypto');

app.post('/api/payment/create', async (req, res) => {
  try {
    const payjsMerchantId = process.env.PAYJS_MERCHANT_ID || '';
    const payjsKey = process.env.PAYJS_KEY || '';
    const mockMode = !payjsMerchantId || !payjsKey;
    if (mockMode) {
      return res.json({ success: true, mock: true, message: 'Payment test mode', payjs_order_id: 'mock_' + Date.now() });
    }
    const amount = req.body.amount || 990;
    const orderId = 'jz_' + Date.now();
    const payData = { mchid: payjsMerchantId, total_fee: amount, out_trade_no: orderId, body: 'AI Math Diagnosis', notify_url: (process.env.SITE_URL||'') + '/api/payment/notify', callback_url: '' };
    var signStr = Object.keys(payData).sort().map(k => k + '=' + payData[k]).join('&') + '&key=' + payjsKey;
    payData.sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
    var payResp = await fetch('https://payjs.cn/api/native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payData).toString()
    });
    var payResult = await payResp.json();
    if (payResult.return_code === 1) {
      res.json({ success: true, qrcode: payResult.qrcode, payjs_order_id: payResult.payjs_order_id, out_trade_no: orderId });
    } else {
      res.json({ success: false, error: payResult.msg || 'Payment failed' });
    }
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/payment/check', async (req, res) => {
  try {
    const { out_trade_no } = req.query;
    if (!out_trade_no) return res.status(400).json({ success: false, error: 'missing out_trade_no' });
    const payjsKey = process.env.PAYJS_KEY || '';
    const mockMode = !payjsKey;
    if (mockMode) return res.json({ success: true, paid: true, mock: true });
    var checkStr = 'payjs_order_id=' + out_trade_no;
    var sign = crypto.createHash('md5').update(checkStr + '&key=' + payjsKey).digest('hex').toUpperCase();
    var cr = await fetch('https://payjs.cn/api/check', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'payjs_order_id=' + out_trade_no + '&sign=' + sign });
    var cj = await cr.json();
    res.json({ success: true, paid: cj.status === 1 });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/payment/notify', (req, res) => {
  try {
    console.log('[Payment] Callback:', req.body);
    res.send('success');
  } catch(e) { res.status(500).send('fail'); }
});

// Static files
app.use('/uploads', express.static(UPLOAD_DIR));

module.exports = app;


