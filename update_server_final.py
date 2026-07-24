import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
path = os.path.join(ws, "server.js")

# Read as gbk
with open(path, "r", encoding="gbk") as f:
    code = f.read()

# 1. Add engine import
code = code.replace(
    "const db = require('./database-local');",
    "const db = require('./database-local');\nconst diagnosticEngine = require('./lib/diagnostic-engine');\n"
)

# 2. Add LLM endpoints
diag_code = "\n// === LLM Diagnosis ===\n"
diag_code += "app.post('/api/diagnose', async (req, res) => {\n"
diag_code += "  try {\n"
diag_code += "    const { questions, enableLLM } = req.body;\n"
diag_code += "    if (!questions || !questions.length) {\n"
diag_code += "      return res.status(400).json({ success: false, error: 'no questions' });\n"
diag_code += "    }\n"
diag_code += "    const result = await diagnosticEngine.diagnose(\n"
diag_code += "      { questions },\n"
diag_code += "      {\n"
diag_code += "        deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',\n"
diag_code += "        enableLLM: enableLLM !== false,\n"
diag_code += "      }\n"
diag_code += "    );\n"
diag_code += "    res.json({ success: true, ...result });\n"
diag_code += "  } catch (e) {\n"
diag_code += "    res.status(500).json({ success: false, error: e.message });\n"
diag_code += "  }\n"
diag_code += "});\n"

diag_code += "\napp.post('/api/analyze-llm', async (req, res) => {\n"
diag_code += "  try {\n"
diag_code += "    const { wrongQuestions, enableLLM } = req.body;\n"
diag_code += "    if (!wrongQuestions || !wrongQuestions.length) {\n"
diag_code += "      return res.status(400).json({ success: false, error: 'no questions' });\n"
diag_code += "    }\n"
diag_code += "    const questions = wrongQuestions.map(function(q, i) {\n"
diag_code += "      return {\n"
diag_code += "        id: i + 1,\n"
diag_code += "        question: q.topic || q.question || '',\n"
diag_code += "        correctAnswer: q.correctAnswer || '',\n"
diag_code += "        studentAnswer: q.errorDescription || q.studentAnswer || '',\n"
diag_code += "        isCorrect: false,\n"
diag_code += "        errorDescription: q.errorDescription || q.errorType || '',\n"
diag_code += "        relatedKPs: q.relatedKPs || [],\n"
diag_code += "      };\n"
diag_code += "    });\n"
diag_code += "    const result = await diagnosticEngine.diagnose(\n"
diag_code += "      { questions },\n"
diag_code += "      {\n"
diag_code += "        deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',\n"
diag_code += "        enableLLM: enableLLM !== false,\n"
diag_code += "      }\n"
diag_code += "    );\n"
diag_code += "    res.json({ success: true, ...result });\n"
diag_code += "  } catch (e) {\n"
diag_code += "    res.status(500).json({ success: false, error: e.message });\n"
diag_code += "  }\n"
diag_code += "});\n\n"

code = code.replace("app.listen(PORT,", diag_code + "app.listen(PORT,")

with open(path, "w", encoding="gbk") as f:
    f.write(code)

print(f"server.js updated: {len(code)} chars")
print(f"Has diagnosticEngine: {'diagnosticEngine' in code}")
print(f"Has /api/diagnose: {'/api/diagnose' in code}")
