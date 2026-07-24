/**
 * 九章 AI 诊断引擎 - LLM 提示词模块
 * 
 * 定义与大模型交互的提示词模板。
 * 遵循第一性原理设计：仅当规则引擎无法确定时，才调用 LLM。
 * 
 * @module prompts
 */

/**
 * 归因推理提示词
 * 当规则引擎无法确定错误原因时，用 LLM 做深度推理。
 * 
 * 输入：题目 + 标准答案 + 学生答案 + 候选知识点
 * 输出：JSON 格式的归因结果
 */
const ATTRIBUTION_PROMPT = `你是一位经验丰富的 K12 数学诊断专家。
你的任务是对学生的数学错题进行归因分析。

你需要分析：
1. 这道题涉及哪些知识点
2. 学生做错的根本原因是什么（哪个知识点没掌握，包括前序知识点）
3. 诊断的置信度

请严格按以下 JSON 格式输出：
{
  "primary_kp": "主要归因知识点",
  "prerequisite_kp": "前序薄弱知识点（如果有）",
  "error_type": "错误类型（概念不清/计算失误/审题错误/方法不对）",
  "confidence": 0.85,
  "reasoning": "简要说明归因逻辑",
  "suggestion": "针对这个知识点的教学建议"
}

注意：
- 只输出 JSON，不要输出其他内容
- confidence 低于 0.6 时，标记为"无法确定"
- 如果学生答案和标准答案的差异是计算错误而非概念错误，error_type 设为"计算失误"
`;


/**
 * 课程规划生成提示词
 * 根据归因结果生成个性化的周历式课程方案
 */
const COURSE_PLAN_PROMPT = `你是一位经验丰富的 K12 数学教研专家。
请根据学生的诊断结果，生成一份个性化的课程规划方案。

诊断数据：
{diagnosisData}

请按以下 JSON 格式输出课程规划：
{
  "total_hours": 总课时数,
  "weeks": 计划周数,
  "focus_areas": [
    {
      "knowledge_point": "薄弱知识点",
      "hours": 分配课时,
      "priority": "高/中/低",
      "teaching_focus": "教学重点",
      "suggested_materials": "建议使用的教辅材料"
    }
  ],
  "weekly_plan": [
    {
      "week": 1,
      "focus": "本周重点",
      "goals": ["具体目标1", "具体目标2"],
      "homework_suggestion": "作业建议"
    }
  ]
}

注意：
- 总课时根据薄弱点的数量和严重程度合理分配
- 每周安排 2-3 个学习目标
- 先巩固前序知识点，再学习当前知识点
`;


/**
 * 主动分析提示词
 * 对多个学生的诊断数据进行汇总分析，发现共性问题
 */
const AGGREGATE_ANALYSIS_PROMPT = `你是一位 K12 数学教学数据分析专家。
请分析以下诊断数据，找出学生群体的共性薄弱点和教学建议。

诊断数据：{data}

请按以下 JSON 格式输出分析报告：
{
  "common_weak_points": [
    {
      "knowledge_point": "知识点名称",
      "affected_students": "受影响学生数/占比",
      "severity": "严重程度（高/中/低）",
      "suggested_action": "教学调整建议"
    }
  ],
  "top_3_recommendations": [
    "建议1",
    "建议2",
    "建议3"
  ],
  "summary": "总体分析摘要"
}
`;

module.exports = {
  ATTRIBUTION_PROMPT,
  COURSE_PLAN_PROMPT,
  AGGREGATE_ANALYSIS_PROMPT,
};
