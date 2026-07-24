/**
 * 九章 AI 诊断引擎
 * 
 * 基于第一性原理设计的混合诊断架构：
 * 1. 规则引擎 - 覆盖 80% 的标准错误归因（即时、免费）
 * 2. LLM 兜底 - 当规则引擎置信度不足时调用大模型（处理 20% 边界情况）
 *
 * 使用方式：
 *   const engine = require('./lib/diagnostic-engine');
 *   const result = await engine.diagnose(examData);
 *
 * @module diagnostic-engine
 */

const knowledgeGraph = require('./knowledge-graph');
const prompts = require('./prompts');

// ============================================================
// 规则引擎：标准错误模式库
// ============================================================
// 每个标准错误模式包含：
//   - pattern: 匹配规则（关键词或正则）
//   - knowledgePoint: 归因到的知识点
//   - confidence: 匹配置信度
//   - errorType: 错误类型

const STANDARD_ERROR_PATTERNS = [
  // ── 代数错误 ──
  { pattern: /移项.*没变号|符号.*错|移项.*忘/i, kp: '一元一次方程', conf: 0.85, type: '计算失误',
    desc: '移项变号规则不熟练' },
  { pattern: /合并同类项.*错|同类项.*合/i, kp: '整式运算', conf: 0.85, type: '计算失误',
    desc: '合并同类项规则不熟练' },
  { pattern: /去括号.*错|括号.*展/i, kp: '整式运算', conf: 0.80, type: '计算失误',
    desc: '去括号时符号处理有误' },
  { pattern: /配方.*错|完全平方.*错/i, kp: '配方法', conf: 0.85, type: '方法不对',
    desc: '配方法步骤不熟练' },
  { pattern: /因式分解.*错|分解.*因式/i, kp: '因式分解', conf: 0.85, type: '概念不清',
    desc: '因式分解方法掌握不牢固' },
  { pattern: /十字相乘.*错/i, kp: '因式分解', conf: 0.80, type: '方法不对',
    desc: '十字相乘法运用不熟练' },
  { pattern: /判别式.*错|delta.*错|\u0394.*错/i, kp: '一元二次方程', conf: 0.85, type: '概念不清',
    desc: '判别式的概念和计算不清晰' },
  { pattern: /韦达定理.*错|根与系数.*错/i, kp: '一元二次方程', conf: 0.80, type: '概念不清',
    desc: '韦达定理应用不熟练' },

  // ── 函数错误 ──
  { pattern: /定义域.*错|取值范.*错/i, kp: '函数概念', conf: 0.85, type: '概念不清',
    desc: '函数定义域的概念不清晰' },
  { pattern: /值域.*错/i, kp: '函数概念', conf: 0.80, type: '概念不清',
    desc: '函数值域的计算方法不熟练' },
  { pattern: /对称轴.*错|顶点.*错/i, kp: '二次函数', conf: 0.85, type: '方法不对',
    desc: '二次函数对称轴/顶点公式运用不熟练' },
  { pattern: /单调性.*错|单调区.*错/i, kp: '函数性质', conf: 0.85, type: '概念不清',
    desc: '函数单调性的判断方法不清晰' },
  { pattern: /奇偶性.*错|奇函数.*偶函/i, kp: '函数性质', conf: 0.85, type: '概念不清',
    desc: '函数奇偶性的定义不清晰' },
  { pattern: /指数.*运算.*错|幂.*运算.*错/i, kp: '指数函数', conf: 0.80, type: '计算失误',
    desc: '指数/幂运算规则不熟练' },

  // ── 几何错误 ──
  { pattern: /勾股.*用错|勾股定理/i, kp: '勾股定理', conf: 0.85, type: '方法不对',
    desc: '勾股定理的应用场景判断不清' },
  { pattern: /相似.*判断错|相似三角/i, kp: '相似三角形', conf: 0.85, type: '概念不清',
    desc: '相似三角形的判定条件不清晰' },
  { pattern: /全等.*判断错|全等三角/i, kp: '三角形', conf: 0.85, type: '概念不清',
    desc: '全等三角形的判定条件不清晰' },
  { pattern: /三角函数值.*错|sin.*cos.*tan/i, kp: '锐角三角函数', conf: 0.80, type: '计算失误',
    desc: '三角函数值记忆不准确' },
  { pattern: /圆周角.*错|圆心角.*错/i, kp: '圆', conf: 0.85, type: '概念不清',
    desc: '圆的基本性质掌握不牢固' },

  // ── 高中几何 ──
  { pattern: /向量.*夹角.*错/i, kp: '平面向量', conf: 0.85, type: '方法不对',
    desc: '向量夹角公式运用不熟练' },
  { pattern: /直线.*斜率.*错/i, kp: '直线方程', conf: 0.85, type: '概念不清',
    desc: '直线斜率的概念不清晰' },
  { pattern: /圆.*方程.*错|圆心.*半径/i, kp: '圆的方程', conf: 0.85, type: '方法不对',
    desc: '圆的方程形式转换不熟练' },

  // ── 概率统计 ──
  { pattern: /概率.*加.*错|概率.*乘.*错/i, kp: '概率统计', conf: 0.80, type: '概念不清',
    desc: '概率的加法和乘法原理混淆' },
  { pattern: /排列.*组合.*错|A.*C.*计/i, kp: '概率统计', conf: 0.85, type: '方法不对',
    desc: '排列组合公式选用有误' },

  // ── 数列 ──
  { pattern: /等差.*通项.*错/i, kp: '等差数列', conf: 0.85, type: '方法不对',
    desc: '等差数列通项公式运用不熟练' },
  { pattern: /等比.*通项.*错/i, kp: '等比数列', conf: 0.85, type: '方法不对',
    desc: '等比数列通项公式运用不熟练' },
  { pattern: /数列.*求和.*错/i, kp: '数列', conf: 0.80, type: '方法不对',
    desc: '数列求和方法选用不当' },
];


// ============================================================
// 诊断引擎核心
// ============================================================

/**
 * 用规则引擎匹配错误模式
 * @param {string} errorDesc - 错误描述（从解题过程中提取）
 * @returns {Object|null} 匹配结果
 */
function matchRulePattern(errorDesc) {
  for (const rule of STANDARD_ERROR_PATTERNS) {
    if (rule.pattern.test(errorDesc)) {
      return {
        knowledgePoint: rule.kp,
        confidence: rule.conf,
        errorType: rule.type,
        description: rule.desc,
        isLLMFallback: false,
      };
    }
  }
  return null;
}

/**
 * 调用 DeepSeek API 做 LLM 归因
 * @param {object} questionData - 题目数据
 * @param {string} apiKey - DeepSeek API Key
 * @returns {Promise<object>} LLM 归因结果
 */
async function llmAttribution(questionData, apiKey) {
  const { ATTRIBUTION_PROMPT } = prompts;
  
  const prompt = ATTRIBUTION_PROMPT + "\n\n题目：" + questionData.question + "\n标准答案：" + questionData.correctAnswer + "\n学生答案：" + questionData.studentAnswer + "\n涉及知识点：" + (questionData.relatedKPs || []).join(", ");
  
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) throw new Error("API error: " + response.status);
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // 解析 JSON
    const jsonMatch = content.match(/{[\s\S]*}/);
    if (!jsonMatch) throw new Error('No JSON found in LLM response');
    
    const result = JSON.parse(jsonMatch[0]);
    return {
      knowledgePoint: result.primary_kp || '未知',
      prerequisiteKP: result.prerequisite_kp || null,
      confidence: result.confidence || 0.5,
      errorType: result.error_type || '未知',
      description: result.reasoning || '',
      suggestion: result.suggestion || '',
      isLLMFallback: true,
    };
  } catch (err) {
    console.error('LLM attribution error:', err.message);
    return {
      knowledgePoint: '无法确定',
      confidence: 0.3,
      errorType: '未知',
      description: 'LLM 归因失败: ' + err.message,
      isLLMFallback: true,
      llmError: true,
    };
  }
}

/**
 * 执行级联归因 —— 追溯前序薄弱知识点
 * @param {object} attribution - 初次归因结果
 * @returns {Array} 级联归因链
 */
function cascadeAttribution(attribution) {
  const chain = [];
  const visited = new Set();
  
  let current = attribution.knowledgePoint;
  while (current && !visited.has(current)) {
    visited.add(current);
    const pres = knowledgeGraph.getPrerequisites(current);
    chain.push({
      knowledgePoint: current,
      confidence: attribution.confidence,
      errorType: attribution.errorType,
      description: attribution.description,
    });
    
    // 如果有前序知识点，继续追溯
    if (pres.length > 0) {
      current = pres[0].name;
      // 降低后续归因的置信度
      attribution.confidence *= 0.85;
    } else {
      current = null;
    }
  }
  
  return chain;
}

/**
 * 完整诊断流程
 * @param {object} examData - 试卷数据
 * @param {object} options - 配置选项
 * @param {string} options.deepseekApiKey - DeepSeek API Key
 * @param {boolean} options.enableLLM - 是否启用 LLM 兜底
 * @returns {Promise<object>} 诊断报告
 */
async function diagnose(examData, options = {}) {
  const {
    deepseekApiKey = process.env.DEEPSEEK_API_KEY || '',
    enableLLM = true,
  } = options;
  
  const startTime = Date.now();
  const results = [];
  
  for (const question of (examData.questions || [])) {
    // Step 1: 先尝试规则引擎
    const errorDesc = question.errorDescription || question.studentAnswer || '';
    const ruleResult = matchRulePattern(errorDesc);
    
    if (ruleResult && ruleResult.confidence >= 0.7) {
      // 规则引擎匹配成功，直接使用
      results.push({
        questionId: question.id || results.length + 1,
        question: question.question || '',
        isCorrect: question.isCorrect,
        attribution: ruleResult,
        cascade: cascadeAttribution(ruleResult),
        method: 'rule',
      });
      continue;
    }
    
    // Step 2: 规则引擎匹配失败或置信度低，尝试 LLM
    if (enableLLM && deepseekApiKey && question.isCorrect === false) {
      const llmResult = await llmAttribution({
        question: question.question,
        correctAnswer: question.correctAnswer,
        studentAnswer: question.studentAnswer,
        relatedKPs: question.relatedKPs,
      }, deepseekApiKey);
      
      results.push({
        questionId: question.id || results.length + 1,
        question: question.question || '',
        isCorrect: question.isCorrect,
        attribution: llmResult,
        cascade: cascadeAttribution(llmResult),
        method: llmResult.llmError ? 'rule' : 'llm',
      });
      continue;
    }
    
    // Step 3: 兜底——做对或无法判断的
    results.push({
      questionId: question.id || results.length + 1,
      question: question.question || '',
      isCorrect: question.isCorrect,
      attribution: null,
      cascade: [],
      method: 'skip',
    });
  }
  
  // 汇总统计
  const totalQuestions = results.length;
  const correctCount = results.filter(r => r.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;
  const ruleCount = results.filter(r => r.method === 'rule').length;
  const llmCount = results.filter(r => r.method === 'llm').length;
  
  // 收集所有归因到的知识点
  const kpStats = {};
  for (const r of results) {
    if (r.attribution) {
      const kp = r.attribution.knowledgePoint;
      if (!kpStats[kp]) kpStats[kp] = { count: 0, avgConf: 0 };
      kpStats[kp].count++;
      kpStats[kp].avgConf = (kpStats[kp].avgConf * (kpStats[kp].count - 1) + r.attribution.confidence) / kpStats[kp].count;
    }
  }
  
  return {
    summary: {
      totalQuestions,
      correctCount,
      wrongCount,
      accuracy: totalQuestions > 0 ? Math.round(correctCount / totalQuestions * 100) : 0,
      ruleMatchCount: ruleCount,
      llmFallbackCount: llmCount,
      llmRatio: totalQuestions > 0 ? Math.round(llmCount / wrongCount * 100) : 0,
      processingTime: Date.now() - startTime,
    },
    knowledgePointStats: Object.entries(kpStats).map(([kp, stats]) => ({
      knowledgePoint: kp,
      errorCount: stats.count,
      avgConfidence: Math.round(stats.avgConf * 100) / 100,
    })).sort((a, b) => b.errorCount - a.errorCount),
    details: results,
  };
}

module.exports = {
  diagnose,
  matchRulePattern,
  cascadeAttribution,
};
