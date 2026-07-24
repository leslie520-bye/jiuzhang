import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
path = os.path.join(ws, "api", "index.js")

with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add diagnostic engine import after crypto require
engine_import = 'const crypto = require("crypto");\nconst diagnosticEngine = require("../lib/diagnostic-engine");\n'
if "diagnosticEngine" not in code:
    code = code.replace('const crypto = require("crypto");', engine_import)
    print("Added diagnostic engine import")
else:
    print("Engine already imported")

# 2. Add /api/diagnose endpoint before Payment section
diag_endpoint = """
// === LLM Diagnosis Endpoints ===
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

app.post("/api/analyze-llm", async (req, res) => {
  try {
    const { wrongQuestions, enableLLM } = req.body;
    if (!wrongQuestions || !wrongQuestions.length) {
      return res.status(400).json({ success: false, error: "no questions" });
    }
    const questions = wrongQuestions.map(function(q, i) {
      return {
        id: i + 1,
        question: q.topic || q.question || "",
        correctAnswer: q.correctAnswer || "",
        studentAnswer: q.errorDescription || q.studentAnswer || "",
        isCorrect: false,
        errorDescription: q.errorDescription || q.errorType || "",
        relatedKPs: q.relatedKPs || [],
      };
    });
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

"""

if "/api/diagnose" not in code:
    code = code.replace("// === Payment API (PayJS / Mock) ===", diag_endpoint + "// === Payment API (PayJS / Mock) ===")
    print("Added /api/diagnose endpoint")
else:
    print("Endpoint already exists")

with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print(f"File updated: {len(code)} chars")
print(f"Has diagnosticEngine: {'diagnosticEngine' in code}")
print(f"Has /api/diagnose: {'/api/diagnose' in code}")
