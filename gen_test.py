import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"

with open(os.path.join(ws, "test-llm.js"), "w", encoding="utf-8") as f:
    f.write('const engine = require("./lib/diagnostic-engine");\n')
    f.write('async function main() {\n')
    f.write('  console.log("=== Time to test LLM ===");\n')
    f.write('  const data = { questions: [\n')
    f.write('    {id:1, question:"x^2-5x+6=0", correctAnswer:"x=2 or 3", studentAnswer:"求根公式代入符号错了", isCorrect:false, relatedKPs:["一元二次方程","因式分解"]},\n')
    f.write('    {id:2, question:"y=x^2-4x+3顶点", correctAnswer:"(2,-1)", studentAnswer:"配方法常数项算错", isCorrect:false, relatedKPs:["二次函数","配方法"]},\n')
    f.write('  ]};\n')
    f.write('  let r1 = await engine.diagnose(data, {enableLLM: false});\n')
    f.write('  console.log("[规则] 错题:"+r1.summary.wrongCount+" 规则匹配:"+r1.summary.ruleMatchCount+" 耗时:"+r1.summary.processingTime+"ms");\n')
    f.write('  r1.details.filter(d=>!d.isCorrect).forEach(d=>console.log("  题"+d.questionId+": "+(d.attribution?d.attribution.knowledgePoint:"?")+" ("+d.method+")"));\n')
    f.write('  console.log("---");\n')
    f.write('  console.log("[LLM] 正在调用DeepSeek API...");\n')
    f.write('  const API_KEY = "sk-e43fe3252bbf436f95e4f46b8ddb9819";\n')
    f.write('  let r2 = await engine.diagnose(data, {enableLLM:true, deepseekApiKey:API_KEY});\n')
    f.write('  console.log("[LLM] 错题:"+r2.summary.wrongCount+" LLM调用:"+r2.summary.llmFallbackCount+" 耗时:"+r2.summary.processingTime+"ms");\n')
    f.write('  r2.details.filter(d=>!d.isCorrect).forEach(d=>{\n')
    f.write('    console.log("  题"+d.questionId+": "+(d.attribution?d.attribution.knowledgePoint:"?")+" ("+d.method+" 置信度:"+d.attribution?.confidence+")");\n')
    f.write('    if(d.attribution?.prerequisiteKP) console.log("    级联: "+d.attribution.knowledgePoint+" -> "+d.attribution.prerequisiteKP);\n')
    f.write('  });\n')
    f.write('  console.log("Done!");\n')
    f.write('}\n')
    f.write('main().catch(e=>console.error("Error:",e.message));\n')

print(f"test-llm.js: {os.path.getsize(os.path.join(ws, 'test-llm.js')):,} bytes")
