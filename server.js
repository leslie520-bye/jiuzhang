try { require('fs').readFileSync('.env','utf-8').split('\n').filter(l=>l.trim()).forEach(l=>{var p=l.split('=');process.env[p[0].trim()]=p.slice(1).join('=').trim()}); } catch(e) {}
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const db = require('./database-local');

const app = express();
const PORT = 3456;
app.use(cors());
app.use(express.json({limit:'50mb'}));
app.use(express.static(path.join(__dirname, 'public')));
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) try { fs.mkdirSync(UPLOAD_DIR); } catch(e) {}
app.use('/uploads', express.static(UPLOAD_DIR));

async function start() {
  const SQL = await initSqlJs();
  await db.initDB(SQL);

  app.post('/api/diagnosis', (req, res) => {
    try { const id = db.saveDiagnosis(req.body); res.json({ success: true, id }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get('/api/diagnosis', (req, res) => {
    try { res.json({ success: true, data: db.listDiagnoses(req.query.student) }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get('/api/diagnosis/:id', (req, res) => {
    try { const d = db.getDiagnosis(parseInt(req.params.id)); if (!d) return res.status(404).json({ success: false, error: '\u672a\u627e\u5230' }); res.json({ success: true, data: d }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get('/api/students', (req, res) => {
    try { res.json({ success: true, data: db.listStudents() }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get('/api/trend/:student', (req, res) => {
    try { res.json({ success: true, data: db.getStudentTrend(req.params.student) }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.delete('/api/diagnosis/:id', (req, res) => {
    try { db.deleteDiagnosis(parseInt(req.params.id)); res.json({ success: true }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });

  app.post('/api/courseplan', (req, res) => {
    try { const id = db.saveCoursePlan(req.body); res.json({ success: true, id }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get('/api/courseplan', (req, res) => {
    try { res.json({ success: true, data: db.listCoursePlans(req.query.student) }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get('/api/courseplan/:id', (req, res) => {
    try { const d = db.getCoursePlan(parseInt(req.params.id)); if (!d) return res.status(404).json({ success: false, error: '\u672a\u627e\u5230' }); res.json({ success: true, data: d }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.put('/api/courseplan/:id', (req, res) => {
    try { db.updateCoursePlan(parseInt(req.params.id), req.body); res.json({ success: true }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.delete('/api/courseplan/:id', (req, res) => {
    try { db.deleteCoursePlan(parseInt(req.params.id)); res.json({ success: true }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
  // Upload exam paper images (base64)
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

  // Analyze exam paper (OpenAI Vision or mock)
  app.post('/api/analyze', async (req, res) => {
    try {
      const { files, grade } = req.body;
      if (!files || !files.length) return res.status(400).json({ success: false, error: 'no files' });
      const apiKey = process.env.OPENAI_API_KEY || '';
      let result;
      if (apiKey && apiKey.length > 10) {
        result = await analyzeWithDeepSeek(files, grade || '', apiKey);
      } else {
        result = analyzeWithMock(files, grade || '');
      }
      res.json({ success: true, ...result });
    } catch(e) { res.status(500).json({ success: false, error: e.message }); }
  });
app.listen(PORT, () => { console.log('[Server] AI\u6570\u5b66\u8bca\u65ad\u5de5\u4f5c\u53f0\u5df2\u542f\u52a8'); console.log('[Server] \u8bbf\u95ee: http://localhost:' + PORT); });
}

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
            { type: 'text', text: '你是上海' + grade + '数学教师。分析试卷，严格按JSON返回：{"student_name":"","score":"","wrong_questions":[{"number":1,"topic":"","error_type":"概念|计算|方法|审题"}],"weak_modules":[{"name":"","avg":0}],"error_distribution":{"c":0,"l":0,"m":0,"e":0},"cause_analysis":{"a":0,"b":0,"c":0,"d":0},"summary":""}' },
            ...images
          ]
        }],
        max_tokens: 2000
      })
    });
    var data = await resp.json();
    var text = data.choices?.[0]?.message?.content || '';
    try {
      var cleaned = text.replace(/^```json\s*|```\s*$/g, '').trim();
      return JSON.parse(cleaned);
    } catch(e2) {
      return { student_name: '', score: '', wrong_questions: [], weak_modules: [], error_distribution: {}, cause_analysis: {}, summary: text.substring(0, 500) };
    }
  } catch(e3) {
    return { student_name: '', score: '', wrong_questions: [], weak_modules: [], error_distribution: {}, cause_analysis: {}, summary: 'AI分析失败: ' + e3.message };
  }
}

function analyzeWithMock(files, grade) {
  return {
    student_name: '',
    score: '待确认',
    wrong_questions: [
      { number: 12, topic: '函数零点与参数范围', error_type: '方法' },
      { number: 19, topic: '数列通项与求和', error_type: '计算' },
      { number: 21, topic: '圆锥曲线定点定值', error_type: '方法' }
    ],
    weak_modules: [
      { name: '函数与导数综合', avg: 55 },
      { name: '解析几何综合', avg: 40 },
      { name: '数列与不等式', avg: 60 }
    ],
    error_distribution: { c: 2, l: 3, m: 5, e: 1 },
    cause_analysis: { a: 20, b: 30, c: 40, d: 10 },
    summary: '薄弱点主要在解析几何和函数综合题。建议加强圆锥曲线和函数零点的训练。'
  };
}
start().catch(e => { console.error('\u542f\u52a8\u5931\u8d25:', e); process.exit(1); });








