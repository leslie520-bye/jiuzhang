const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Database module - Turso first, fallback to local SQLite
let db;
try {
  db = require('../database');
} catch(e) {
  console.error('Turso failed:', e.message);
  try {
    db = require('../database-local');
    console.log('Fallback to local SQLite');
  } catch(e2) {
    db = { initDB: async()=>{}, isReady:true, saveDiagnosis:()=>0, listDiagnoses:()=>[], getDiagnosis:()=>null, listStudents:()=>[], deleteDiagnosis:()=>{}, getStudentTrend:()=>[], saveCoursePlan:()=>0, listCoursePlans:()=>[], getCoursePlan:()=>null, deleteCoursePlan:()=>{}, updateCoursePlan:()=>{} };
  }
}

const app = express();
app.use(cors());
app.use(express.json({limit:'50mb'}));
app.use(express.static(path.join(__dirname, '..', 'public')));

const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) try { fs.mkdirSync(UPLOAD_DIR); } catch(e) {}

app.use(async (req, res, next) => {
  try { if (!db.isReady && db.initDB) await db.initDB(); db.isReady = true; next(); }
  catch(e) { res.status(500).json({ success: false, error: e.message }); }
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
