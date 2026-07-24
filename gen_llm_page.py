import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp\public"

llm_page = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>九章 · AI 智能归因</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, "Microsoft YaHei", sans-serif; background: #f5f6fa; color: #2d2d2d; }
.header { background: linear-gradient(135deg, #1B2A4A, #2C4A7C); color: #fff; padding: 20px 24px; }
.header h1 { font-size: 22px; font-weight: 700; }
.header .sub { font-size: 13px; color: #C9A85A; margin-top: 4px; }
.nav { display: flex; gap: 2px; background: #fff; padding: 4px; border-radius: 10px; margin: 16px 24px; border: 1px solid #e8e8ec; }
.nav a { flex: 1; text-align: center; padding: 8px 12px; border-radius: 8px; text-decoration: none; font-size: 13px; color: #5a5a72; transition: all .15s; }
.nav a.active { background: #1B2A4A; color: #fff; font-weight: 600; }
.container { max-width: 800px; margin: 0 auto; padding: 0 16px 40px; }
.card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.card h2 { font-size: 16px; font-weight: 600; color: #1B2A4A; margin-bottom: 12px; }
.card h2 .badge { font-size: 11px; background: #C9A85A; color: #fff; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
.form-grid { display: grid; gap: 10px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 12px; font-weight: 500; color: #555; }
.form-group input, .form-group textarea, .form-group select { font-size: 13px; padding: 8px 10px; border: 1px solid #ddd; border-radius: 8px; outline: none; transition: border .15s; font-family: inherit; }
.form-group input:focus, .form-group textarea:focus { border-color: #1B2A4A; }
.form-group textarea { min-height: 60px; resize: vertical; }
.btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; }
.btn-primary { background: #1B2A4A; color: #fff; }
.btn-primary:hover { background: #2C4A7C; }
.btn-secondary { background: #C9A85A; color: #fff; }
.btn-danger { background: #c0392b; color: #fff; }
.btn-outline { background: transparent; border: 1px solid #ddd; color: #555; }
.btn-outline:hover { border-color: #1B2A4A; color: #1B2A4A; }
.btn-sm { padding: 6px 14px; font-size: 12px; }
.btn-group { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; align-items: center; }
.question-card { background: #f9f9fb; border: 1px solid #eeeef2; border-radius: 10px; padding: 14px; margin-bottom: 10px; }
.question-card .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.question-card .q-num { font-size: 13px; font-weight: 600; color: #1B2A4A; }
.question-card .q-remove { color: #c0392b; cursor: pointer; font-size: 12px; }
.result-section { margin-top: 16px; }
.result-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; margin-bottom: 16px; }
.result-stat { background: #f9f9fb; border-radius: 8px; padding: 12px; text-align: center; }
.result-stat .val { font-size: 20px; font-weight: 700; color: #1B2A4A; }
.result-stat .lbl { font-size: 11px; color: #888; margin-top: 2px; }
.attribution-item { border-left: 3px solid #1B2A4A; padding: 10px 12px; margin-bottom: 8px; background: #f9f9fb; border-radius: 0 8px 8px 0; }
.attribution-item .kp { font-size: 15px; font-weight: 600; color: #1B2A4A; }
.attribution-item .meta { font-size: 12px; color: #888; margin-top: 4px; }
.attribution-item .cascade { font-size: 12px; color: #C9A85A; margin-top: 4px; }
.attribution-item .suggestion { font-size: 12px; color: #27ae60; margin-top: 6px; padding: 6px 8px; background: #f0faf0; border-radius: 6px; }
.attribution-item .method-tag { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 4px; margin-left: 6px; }
.method-rule { background: #e8f0fe; color: #1a5cbb; }
.method-llm { background: #fef7e0; color: #b8860b; }
.kp-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.kp-tag { background: #e8f0fe; padding: 4px 10px; border-radius: 12px; font-size: 12px; color: #1B2A4A; }
.kp-tag .conf { font-size: 10px; color: #888; }
.toggle { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; }
.toggle input[type=checkbox] { width: 18px; height: 18px; cursor: pointer; }
.loading { text-align: center; padding: 30px; color: #888; }
.loading .spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid #ddd; border-top-color: #1B2A4A; border-radius: 50%; animation: spin .6s linear infinite; margin-right: 8px; vertical-align: middle; }
@keyframes spin { to { transform: rotate(360deg); } }
.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1B2A4A; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; z-index: 999; opacity: 0; transition: opacity .3s; }
.toast.show { opacity: 1; }
</style>
</head>
<body>
<div class="header">
  <h1>九章  AI 智能归因</h1>
  <div class="sub">基于规则引擎 + DeepSeek 大模型的智能诊断</div>
</div>
<div class="nav">
  <a href="/">诊断首页</a>
  <a href="/llm-diagnosis.html" class="active">AI 智能归因</a>
  <a href="/history.html">历史记录</a>
</div>
<div class="container">
  
  <div class="card">
    <h2>输入错题 <span class="badge" id="qCount">0 题</span></h2>
    <p style="font-size: 13px; color: #888; margin: -8px 0 12px 0;">输入学生的错题信息，AI 会自动归因到对应的薄弱知识点</p>
    <div id="questionList"></div>
    
    <div class="btn-group">
      <button class="btn btn-secondary btn-sm" onclick="addQuestion()">+ 添加题目</button>
      <button class="btn btn-outline btn-sm" onclick="clearAll()">清空</button>
    </div>
    
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee;">
      <div class="toggle">
        <input type="checkbox" id="enableLLM" checked>
        <label for="enableLLM">启用 LLM 兜底（DeepSeek 推理，处理规则无法覆盖的边缘情况）</label>
      </div>
      <div style="font-size: 11px; color: #aaa; margin: 4px 0 0 24px;">
        规则引擎覆盖约 80% 的常见错误归因（免费、即时）。开启 LLM 后，剩余 20% 的边界情况将由 DeepSeek API 处理。
      </div>
    </div>
    
    <div class="btn-group">
      <button class="btn btn-primary" onclick="runDiagnosis()" id="diagBtn">运行 AI 归因</button>
    </div>
  </div>
  
  <div id="resultArea" style="display:none;">
    <div class="card">
      <h2>归因结果</h2>
      <div id="resultSummary" class="result-summary"></div>
      <div id="kpStats" class="kp-bar"></div>
    </div>
    <div class="card">
      <h2>逐题诊断详情</h2>
      <div id="detailResults"></div>
    </div>
  </div>
  
</div>

<div class="toast" id="toast"></div>

<script>
var questions = [];
var questionIdCounter = 0;

function addQuestion(data) {
  data = data || {};
  var id = ++questionIdCounter;
  questions.push({ id: id, question: data.question || "", correctAnswer: data.correctAnswer || "", studentAnswer: data.studentAnswer || "", isCorrect: false, relatedKPs: data.relatedKPs || [] });
  renderQuestions();
}

function removeQuestion(id) {
  questions = questions.filter(function(q) { return q.id !== id; });
  renderQuestions();
}

function clearAll() {
  questions = [];
  questionIdCounter = 0;
  renderQuestions();
  document.getElementById("resultArea").style.display = "none";
}

function updateQuestion(id, field, value) {
  var q = questions.find(function(q) { return q.id === id; });
  if (q) { q[field] = value; }
}

function renderQuestions() {
  var container = document.getElementById("questionList");
  document.getElementById("qCount").textContent = questions.length + "\u9898";
  
  if (questions.length === 0) {
    container.innerHTML = "<div style=\"text-align:center;padding:20px;color:#aaa;font-size:13px\">\u8bf7\u6dfb\u52a0\u5b66\u751f\u7684\u9519\u9898\u4fe1\u606f</div>";
    return;
  }
  
  var html = "";
  questions.forEach(function(q, i) {
    html += "<div class=\"question-card\">";
    html += "  <div class=\"q-header\">";
    html += "    <span class=\"q-num\">\u7b2c " + (i+1) + " \u9898</span>";
    html += "    <span class=\"q-remove\" onclick=\"removeQuestion(" + q.id + ")\">\u5220\u9664</span>";
    html += "  </div>";
    html += "  <div class=\"form-grid\" style=\"grid-template-columns:1fr 1fr;gap:8px;\">";
    html += "    <div class=\"form-group\" style=\"grid-column:1/-1\">";
    html += "      <label>\u9898\u76ee\u5185\u5bb9</label>";
    html += "      <textarea rows=\"2\" oninput=\"updateQuestion(" + q.id + ",'question',this.value)\">" + esc(q.question) + "</textarea>";
    html += "    </div>";
    html += "    <div class=\"form-group\">";
    html += "      <label>\u6807\u51c6\u7b54\u6848</label>";
    html += "      <input type=\"text\" value=\"" + esc(q.correctAnswer) + "\" oninput=\"updateQuestion(" + q.id + ",'correctAnswer',this.value)\">";
    html += "    </div>";
    html += "    <div class=\"form-group\">";
    html += "      <label>\u5b66\u751f\u7b54\u6848 / \u9519\u8bef\u63cf\u8ff0</label>";
    html += "      <input type=\"text\" value=\"" + esc(q.studentAnswer) + "\" oninput=\"updateQuestion(" + q.id + ",'studentAnswer',this.value)\" placeholder=\"\u4f8b: \u914d\u65b9\u6cd5\u5e38\u6570\u9879\u7b97\u9519\u4e86\">";
    html += "    </div>";
    html += "  </div>";
    html += "</div>";
  });
  container.innerHTML = html;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function runDiagnosis() {
  var enableLLM = document.getElementById("enableLLM").checked;
  var validQ = questions.filter(function(q) { return q.question && q.studentAnswer; });
  
  if (validQ.length === 0) {
    showToast("\u8bf7\u81f3\u5c11\u586b\u5199\u4e00\u9053\u9898\u76ee\u7684\u9898\u76ee\u5185\u5bb9\u548c\u5b66\u751f\u7b54\u6848");
    return;
  }
  
  var btn = document.getElementById("diagBtn");
  var originalText = btn.textContent;
  btn.textContent = "\u5206\u6790\u4e2d...";
  btn.disabled = true;
  
  document.getElementById("resultArea").style.display = "block";
  document.getElementById("resultSummary").innerHTML = "<div class=\"loading\"><span class=\"spinner\"></span>\u6b63\u5728\u8c03\u7528\u89c4\u5219\u5f15\u64ce" + (enableLLM ? " + DeepSeek API" : "") + "\u8fdb\u884c\u5f52\u56e0...</div>";
  document.getElementById("detailResults").innerHTML = "";
  document.getElementById("kpStats").innerHTML = "";
  
  try {
    var resp = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: validQ.map(function(q) { return { id: q.id, question: q.question, correctAnswer: q.correctAnswer || "\u672a\u63d0\u4f9b", studentAnswer: q.studentAnswer, isCorrect: false, errorDescription: q.studentAnswer, relatedKPs: q.relatedKPs }; }), enableLLM: enableLLM })
    });
    
    var result = await resp.json();
    if (!result.success) throw new Error(result.error);
    
    displayResults(result);
  } catch(e) {
    document.getElementById("resultSummary").innerHTML = "<div style=\"color:#c0392b;padding:10px\">\u8bca\u65ad\u5931\u8d25: " + e.message + "</div>";
    showToast("\u8bca\u65ad\u5931\u8d25: " + e.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function displayResults(result) {
  var s = result.summary;
  
  // Summary stats
  document.getElementById("resultSummary").innerHTML =
    "<div class=\"result-stat\"><div class=\"val\">" + s.totalQuestions + "</div><div class=\"lbl\">\u603b\u9898\u6570</div></div>" +
    "<div class=\"result-stat\"><div class=\"val\">" + s.wrongCount + "</div><div class=\"lbl\">\u9519\u9898</div></div>" +
    "<div class=\"result-stat\"><div class=\"val\">" + s.ruleMatchCount + "</div><div class=\"lbl\">\u89c4\u5219\u5339\u914d</div></div>" +
    "<div class=\"result-stat\"><div class=\"val\">" + s.llmFallbackCount + "</div><div class=\"lbl\">LLM \u516c\u8c03\u7528</div></div>" +
    "<div class=\"result-stat\"><div class=\"val\">" + s.processingTime + "ms</div><div class=\"lbl\">\u8017\u65f6</div></div>";
  
  // KP stats
  var kpHtml = "";
  if (result.knowledgePointStats && result.knowledgePointStats.length > 0) {
    result.knowledgePointStats.forEach(function(kp) {
      kpHtml += "<span class=\"kp-tag\">" + kp.knowledgePoint + " <span class=\"conf\">(" + kp.errorCount + "\u6b21, \u7f6e\u4fe1\u5ea6" + kp.avgConfidence + ")</span></span>";
    });
  } else {
    kpHtml = "<span style=\"font-size:12px;color:#888\">\u65e0\u5f52\u56e0\u7ed3\u679c</span>";
  }
  document.getElementById("kpStats").innerHTML = kpHtml;
  
  // Details
  var dHtml = "";
  if (result.details && result.details.length > 0) {
    result.details.forEach(function(d, i) {
      if (d.isCorrect && d.method === "skip") {
        dHtml += "<div class=\"attribution-item\" style=\"border-left-color:#27ae60\">";
        dHtml += "  <div class=\"kp\">\u7b2c " + (i+1) + " \u9898 <span style=\"font-size:12px;color:#27ae60\">\u2713 \u5df2\u505a\u5bf9\uff0c\u65e0\u9700\u5f52\u56e0</span></div>";
        dHtml += "</div>";
        return;
      }
      
      var a = d.attribution;
      var methodClass = d.method === "rule" ? "method-rule" : "method-llm";
      var methodLabel = d.method === "rule" ? "\u89c4\u5219" : "LLM";
      
      dHtml += "<div class=\"attribution-item\" style=\"border-left-color:" + (d.method === "llm" ? "#C9A85A" : "#1B2A4A") + "\">";
      dHtml += "  <div class=\"kp\">\u7b2c " + (i+1) + " \u9898" + (a ? ": " + a.knowledgePoint : "") + " <span class=\"method-tag " + methodClass + "\">" + methodLabel + "</span></div>";
      
      if (a) {
        dHtml += "  <div class=\"meta\">\u9519\u8bef\u7c7b\u578b: " + a.errorType + " | \u7f6e\u4fe1\u5ea6: " + (a.confidence * 100).toFixed(0) + "%</div>";
        if (a.description && a.description !== a.knowledgePoint) {
          dHtml += "  <div class=\"meta\" style=\"color:#555\">" + a.description + "</div>";
        }
        if (d.cascade && d.cascade.length > 1) {
          var cascadeStr = d.cascade.map(function(c) { return c.knowledgePoint; }).join("  \u25b6  ");
          dHtml += "  <div class=\"cascade\">\u7ea7\u8054\u5f52\u56e0: " + cascadeStr + "</div>";
        }
        if (a.suggestion) {
          dHtml += "  <div class=\"suggestion\">" + a.suggestion + "</div>";
        }
        if (d.method === "llm" && a.prerequisiteKP) {
          dHtml += "  <div class=\"cascade\" style=\"color:#c0392b\">\u524d\u5e8f\u8584\u5f31\u70b9: " + a.prerequisiteKP + "</div>";
        }
      } else {
        dHtml += "  <div class=\"meta\" style=\"color:#c0392b\">\u65e0\u6cd5\u5f52\u56e0</div>";
      }
      dHtml += "</div>";
    });
  } else {
    dHtml = "<div style=\"text-align:center;padding:20px;color:#888;font-size:13px\">\u65e0\u8bca\u65ad\u7ed3\u679c</div>";
  }
  document.getElementById("detailResults").innerHTML = dHtml;
  
  showToast("\u8bca\u65ad\u5b8c\u6210! " + (s.llmFallbackCount > 0 ? s.llmFallbackCount + "\u6b21 LLM \u516c\u8c03\u7528" : "\u7eaf\u89c4\u5219\u5f15\u64ce"));
}

function showToast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function() { t.classList.remove("show"); }, 3000);
}

// Add a default question on load
addQuestion({
  question: "x^2 - 5x + 6 = 0",
  correctAnswer: "x = 2 \u6216 x = 3",
  studentAnswer: "\u6c42\u6839\u516c\u5f0f\u4ee3\u5165\u7b26\u53f7\u5199\u9519\u4e86"
});
</script>
</body>
</html>
'''

with open(os.path.join(ws, "llm-diagnosis.html"), "w", encoding="utf-8") as f:
    f.write(llm_page)

# Also update the navigation in index.html to add a link to the new page
import re
idx_path = os.path.join(ws, "index.html")
with open(idx_path, "r", encoding="utf-8") as f:
    idx = f.read()

# Add a link to the LLM diagnosis page in the navigation bar
old_nav = '<a href="/history.html"'
new_nav = '<a href="/llm-diagnosis.html" style="padding:8px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;color:#5a5a72;transition:all .15s">AI 智能归因</a>\n<a href="/history.html"'
if '<a href="/llm-diagnosis.html"' not in idx:
    idx = idx.replace(old_nav, new_nav)
    with open(idx_path, "w", encoding="utf-8") as f:
        f.write(idx)
    print("Updated index.html navigation")
else:
    print("Navigation already has LLM link")

print(f"LLM diagnosis page: {os.path.getsize(os.path.join(ws, 'llm-diagnosis.html')):,} bytes")
print("Done!")
