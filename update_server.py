import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
path = os.path.join(ws, "server.js")

with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# Add engine import
code = code.replace(
    "const db = require('./database-local');",
    "const db = require('./database-local');\nconst diagnosticEngine = require('./lib/diagnostic-engine');\n"
)

# Add LLM endpoints before app.listen
diag_code = """
// === LLM Diagnosis ===
app.post('/api/diagnose', async (req, res) => {
  try {
    const { questions, enableLLM } = req.body;
    if (!questions || !questions.length) {
      return res.status(400).json({ success: false, error: 'no questions' });
    }
    const result = await diagnosticEngine.diagnose(
      { questions },
      {
        deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
        enableLLM: enableLLM !== false,
      }
    );
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/analyze-llm', async (req, res) => {
  try {
    const { wrongQuestions, enableLLM } = req.body;
    if (!wrongQuestions || !wrongQuestions.length) {
      return res.status(400).json({ success: false, error: 'no questions' });
    }
    const questions = wrongQuestions.map(function(q, i) {
      return {
        id: i + 1,
        question: q.topic || q.question || '',
        correctAnswer: q.correctAnswer || '',
        studentAnswer: q.errorDescription || q.studentAnswer || '',
        isCorrect: false,
        errorDescription: q.errorDescription || q.errorType || '',
        relatedKPs: q.relatedKPs || [],
      };
    });
    const result = await diagnosticEngine.diagnose(
      { questions },
      {
        deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
        enableLLM: enableLLM !== false,
      }
    );
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

"""

code = code.replace("app.listen(PORT,", diag_code + "\napp.listen(PORT,")

with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print(f"server.js updated: {len(code)} chars")
print(f"Has diagnosticEngine: {'diagnosticEngine' in code}")
print(f"Has /api/diagnose: {'/api/diagnose' in code}")
