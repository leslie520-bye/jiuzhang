import os
ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"
path = os.path.join(ws, "lib", "diagnostic-engine.js")
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()
new_line = '  const prompt = ATTRIBUTION_PROMPT + "\\n\\n题目：" + questionData.question + "\\n标准答案：" + questionData.correctAnswer + "\\n学生答案：" + questionData.studentAnswer + "\\n涉及知识点：" + (questionData.relatedKPs || []).join(", ");\n'
lines[128] = new_line
with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Fixed line 129")
