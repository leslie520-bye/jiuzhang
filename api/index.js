const express = require('express');
const cors = require('cors');
const path = require('path');

// 安全加载数据库模块
let db;
try {
  db = require('../database');
} catch(e) {
  console.error('数据库加载失败:', e.message);
  db = { initDB: async () => {}, isReady: true, saveDiagnosis:()=>0, listDiagnoses:()=>[], getDiagnosis:()=>null,
    listStudents:()=>[], deleteDiagnosis:()=>{}, getStudentTrend:()=>[],
    saveCoursePlan:()=>0, listCoursePlans:()=>[], getCoursePlan:()=>null, deleteCoursePlan:()=>{}, updateCoursePlan:()=>{} };
}

const app = express();
app.use(cors());
app.use(express.json({limit:'10mb'}));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(async (req, res, next) => {
  try {
    if (!db.isReady) await db.initDB();
    next();
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === 诊断 API ===
app.post('/api/diagnosis', async (req, res) => {
  try { const id = await db.saveDiagnosis(req.body); res.json({ success: true, id }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/diagnosis', async (req, res) => {
  try { res.json({ success: true, data: await db.listDiagnoses(req.query.student) }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/diagnosis/:id', async (req, res) => {
  try { const d = await db.getDiagnosis(parseInt(req.params.id)); if (!d) return res.status(404).json({ success: false, error: '\u672a\u627e\u5230' }); res.json({ success: true, data: d }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/students', async (req, res) => {
  try { res.json({ success: true, data: await db.listStudents() }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/trend/:student', async (req, res) => {
  try { res.json({ success: true, data: await db.getStudentTrend(req.params.student) }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.delete('/api/diagnosis/:id', async (req, res) => {
  try { await db.deleteDiagnosis(parseInt(req.params.id)); res.json({ success: true }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// === 课程规划 API ===
app.post('/api/courseplan', async (req, res) => {
  try { const id = await db.saveCoursePlan(req.body); res.json({ success: true, id }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/courseplan', async (req, res) => {
  try { res.json({ success: true, data: await db.listCoursePlans(req.query.student) }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/courseplan/:id', async (req, res) => {
  try { const d = await db.getCoursePlan(parseInt(req.params.id)); if (!d) return res.status(404).json({ success: false, error: '\u672a\u627e\u5230' }); res.json({ success: true, data: d }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.put('/api/courseplan/:id', async (req, res) => {
  try { await db.updateCoursePlan(parseInt(req.params.id), req.body); res.json({ success: true }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.delete('/api/courseplan/:id', async (req, res) => {
  try { await db.deleteCoursePlan(parseInt(req.params.id)); res.json({ success: true }); } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = app;
