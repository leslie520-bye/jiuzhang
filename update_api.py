import os

path = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp\api\index.js"

with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add engine import
code = code.replace(
    "const crypto = require(\"crypto\");",
    "const crypto = require(\"crypto\");\nconst diagnosticEngine = require(\"../lib/diagnostic-engine\");\n"
)

# 2. Add LLM endpoints before payment section
new_endpoint = "\n// === LLM-Powered Diagnosis ===\n"
new_endpoint += 'app.post("/api/diagnose", async (req, res) => {\n'
new_endpoint += '  try {\n'
new_endpoint += '    const { questions, enableLLM } = req.body;\n'
new_endpoint += '    if (!questions || !questions.length) {\n'
new_endpoint += '      return res.status(400).json({ success: false, error: "no questions" });\n'
new_endpoint += '    }\n'
new_endpoint += '    const result = await diagnosticEngine.diagnose(\n'
new_endpoint += '      { questions },\n'
new_endpoint += '      {\n'
new_endpoint += '        deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",\n'
new_endpoint += '        enableLLM: enableLLM !== false,\n'
new_endpoint += '      }\n'
new_endpoint += '    );\n'
new_endpoint += '    res.json({ success: true, ...result });\n'
new_endpoint += '  } catch (e) {\n'
new_endpoint += '    res.status(500).json({ success: false, error: e.message });\n'
new_endpoint += '  }\n'
new_endpoint += '});\n\n'
new_endpoint += '// === Analyze with LLM Attribution ===\n'
new_endpoint += 'app.post("/api/analyze-llm", async (req, res) => {\n'
new_endpoint += '  try {\n'
new_endpoint += '    const { wrongQuestions, enableLLM } = req.body;\n'
new_endpoint += '    if (!wrongQuestions || !wrongQuestions.length) {\n'
new_endpoint += '      return res.status(400).json({ success: false, error: "no questions" });\n'
new_endpoint += '    }\n'
new_endpoint += '    const questions = wrongQuestions.map((q, i) => ({\n'
new_endpoint += '      id: i + 1,\n'
new_endpoint += '      question: q.topic || q.question || "",\n'
new_endpoint += '      correctAnswer: q.correctAnswer || "",\n'
new_endpoint += '      studentAnswer: q.errorDescription || q.studentAnswer || "",\n'
new_endpoint += '      isCorrect: false,\n'
new_endpoint += '      errorDescription: q.errorDescription || q.errorType || "",\n'
new_endpoint += '      relatedKPs: q.relatedKPs || [],\n'
new_endpoint += '    }));\n'
new_endpoint += '    const result = await diagnosticEngine.diagnose(\n'
new_endpoint += '      { questions },\n'
new_endpoint += '      {\n'
new_endpoint += '        deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",\n'
new_endpoint += '        enableLLM: enableLLM !== false,\n'
new_endpoint += '      }\n'
new_endpoint += '    );\n'
new_endpoint += '    res.json({ success: true, ...result });\n'
new_endpoint += '  } catch (e) {\n'
new_endpoint += '    res.status(500).json({ success: false, error: e.message });\n'
new_endpoint += '  }\n'
new_endpoint += '});\n\n'

code = code.replace("// === Payment API (PayJS / Mock) ===", new_endpoint + "// === Payment API (PayJS / Mock) ===")

with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print(f"Updated: {len(code)} chars")
print(f"Has engine: {'diagnosticEngine' in code}")
print(f"Has /api/diagnose: {'/api/diagnose' in code}")
print(f"Has /api/analyze-llm: {'/api/analyze-llm' in code}")
