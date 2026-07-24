// 九章诊断引擎测试脚本
// 运行: node test-diagnose.js
// 说明: 验证规则引擎 + LLM 混合诊断是否正常工作

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const engine = require("./lib/diagnostic-engine");

async function main() {
  console.log("\n=== 九章诊断引擎测试 ===\n");
  
  // 测试数据：3道典型错题
  const testData = {
    questions: [
      {
        id: 1,
        question: "解方程: x^2 - 5x + 6 = 0",
        correctAnswer: "x=2 或 x=3",
        studentAnswer: "用了求根公式但代入时符号算错了，得到 x=1 和 x=6",
        errorDescription: "求根公式代入符号错误",
        isCorrect: false,
        relatedKPs: ["一元二次方程", "因式分解"],
      },
      {
        id: 2,
        question: "求二次函数 y = x^2 - 4x + 3 的顶点坐标",
        correctAnswer: "顶点(2, -1)",
        studentAnswer: "用了配方法：y=(x-2)^2 - 4 + 4 然后算错了常数项",
        errorDescription: "配方法计算错误",
        isCorrect: false,
        relatedKPs: ["二次函数", "配方法"],
      },
      {
        id: 3,
        question: "证明：三角形 ABC 中，若 AB = AC，则角 B = 角 C",
        correctAnswer: "等腰三角形底角相等",
        studentAnswer: "正确证明了",
        isCorrect: true,
      },
    ],
  };

  // 测试1: 纯规则引擎
  console.log("--- 测试1: 纯规则引擎模式 ---");
  const result1 = await engine.diagnose(testData, { enableLLM: false });
  printResult(result1);
  
  // 测试2: 规则 + LLM 混合（需要 DEEPSEEK_API_KEY）
  const apiKey = process.env.DEEPSEEK_API_KEY || "";
  if (apiKey && apiKey.length > 10 && !apiKey.includes("your-deepseek")) {
    console.log("\n--- 测试2: 规则 + LLM 混合模式 ---");
    const result2 = await engine.diagnose(testData, { enableLLM: true, deepseekApiKey: apiKey });
    printResult(result2);
  } else {
    console.log("\n--- 测试2: 跳过（需要设置 DEEPSEEK_API_KEY）---");
  }
  
  // 总结
  console.log("\n=== 测试完成 ===");
  console.log("规则引擎覆盖率: " + result1.summary.ruleMatchCount + "/" + result1.summary.wrongCount);
  console.log("LLM 兜底次数: " + result1.summary.llmFallbackCount);
}

function printResult(r) {
  console.log("总题数: " + r.summary.totalQuestions);
  console.log("错题数: " + r.summary.wrongCount);
  console.log("规则匹配: " + r.summary.ruleMatchCount);
  console.log("LLM兜底: " + r.summary.llmFallbackCount);
  console.log("处理耗时: " + r.summary.processingTime + "ms");
  
  if (r.knowledgePointStats.length > 0) {
    console.log("\n归因统计:");
    r.knowledgePointStats.forEach(function(kp) {
      console.log("  - " + kp.knowledgePoint + ": " + kp.errorCount + "次错误 (置信度" + kp.avgConfidence + ")");
    });
  }
  
  if (r.details.length > 0) {
    console.log("\n逐题诊断:");
    r.details.forEach(function(d) {
      if (!d.isCorrect) {
        console.log("  题" + d.questionId + ": " + (d.attribution ? d.attribution.knowledgePoint + " (方法:" + d.method + ")" : "未归因"));
        if (d.cascade && d.cascade.length > 1) {
          console.log("    级联: " + d.cascade.map(function(c) { return c.knowledgePoint; }).join(" -> "));
        }
      }
    });
  }
}

main().catch(console.error);
