const engine = require("./lib/diagnostic-engine");
async function main() {
  console.log("=== Time to test LLM ===");
  const data = { questions: [
    {id:1, question:"x^2-5x+6=0", correctAnswer:"x=2 or 3", studentAnswer:"求根公式代入符号错了", isCorrect:false, relatedKPs:["一元二次方程","因式分解"]},
    {id:2, question:"y=x^2-4x+3顶点", correctAnswer:"(2,-1)", studentAnswer:"配方法常数项算错", isCorrect:false, relatedKPs:["二次函数","配方法"]},
  ]};
  let r1 = await engine.diagnose(data, {enableLLM: false});
  console.log("[规则] 错题:"+r1.summary.wrongCount+" 规则匹配:"+r1.summary.ruleMatchCount+" 耗时:"+r1.summary.processingTime+"ms");
  r1.details.filter(d=>!d.isCorrect).forEach(d=>console.log("  题"+d.questionId+": "+(d.attribution?d.attribution.knowledgePoint:"?")+" ("+d.method+")"));
  console.log("---");
  console.log("[LLM] 正在调用DeepSeek API...");
  const API_KEY = "sk-e43fe3252bbf436f95e4f46b8ddb9819";
  let r2 = await engine.diagnose(data, {enableLLM:true, deepseekApiKey:API_KEY});
  console.log("[LLM] 错题:"+r2.summary.wrongCount+" LLM调用:"+r2.summary.llmFallbackCount+" 耗时:"+r2.summary.processingTime+"ms");
  r2.details.filter(d=>!d.isCorrect).forEach(d=>{
    console.log("  题"+d.questionId+": "+(d.attribution?d.attribution.knowledgePoint:"?")+" ("+d.method+" 置信度:"+d.attribution?.confidence+")");
    if(d.attribution?.prerequisiteKP) console.log("    级联: "+d.attribution.knowledgePoint+" -> "+d.attribution.prerequisiteKP);
  });
  console.log("Done!");
}
main().catch(e=>console.error("Error:",e.message));
