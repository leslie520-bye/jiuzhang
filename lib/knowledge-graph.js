/**
 * 九章 AI 诊断引擎 - 知识图谱模块
 * 
 * 定义 K12 数学知识点之间的前序依赖关系。
 * 核心用途：级联归因——当学生做错一道题时，不仅归因到当前知识点，
 * 还能追溯可能的前序薄弱点。
 * 
 * @module knowledge-graph
 */

// 知识点关系定义：每个知识点列出其前序依赖
const PREREQUISITE_MAP = {
  // ── 初中 ──
  "一元二次方程": ["因式分解", "平方根", "一元一次方程"],
  "二次函数": ["一元二次方程", "配方法", "函数概念"],
  "二次根式": ["平方根", "实数运算"],
  "相似三角形": ["三角形", "比例"],
  "锐角三角函数": ["相似三角形", "勾股定理"],
  "圆": ["三角形", "勾股定理"],
  "一元一次不等式": ["一元一次方程", "有理数运算"],
  "二元一次方程组": ["一元一次方程"],
  "因式分解": ["整式乘法", "多项式"],
  "分式": ["因式分解", "整式运算"],
  "函数概念": ["坐标系", "一元一次方程"],
  "正比例与反比例函数": ["函数概念", "比例"],
  "实数": ["有理数", "平方根"],
  "勾股定理": ["平方根", "三角形面积"],
  "配方法": ["完全平方公式", "因式分解"],

  // ── 高中 ──
  "函数性质（单调/奇偶/周期）": ["函数概念", "不等式"],
  "幂函数": ["函数概念", "实数运算"],
  "指数函数": ["幂函数", "指数运算"],
  "对数函数": ["指数函数", "对数运算"],
  "三角函数": ["函数概念", "圆", "锐角三角函数"],
  "三角恒等变换": ["三角函数", "代数运算"],
  "数列": ["函数概念", "一元一次方程"],
  "等差数列": ["数列", "一元一次方程"],
  "等比数列": ["数列", "指数运算"],
  "平面向量": ["坐标系", "三角函数"],
  "解析几何初步": ["坐标系", "一元二次方程"],
  "直线方程": ["坐标系", "二元一次方程组"],
  "圆的方程": ["直线方程", "配方法"],
  "圆锥曲线": ["解析几何初步", "一元二次方程"],
  "立体几何": ["平面几何", "空间想象"],
  "空间向量": ["平面向量", "立体几何"],
  "概率统计": ["计数原理", "数据分析"],
  "导数": ["函数性质", "极限概念"],
  "导数的应用": ["导数", "不等式"],
  "数列与不等式综合": ["数列", "不等式", "导数"],
  "解析几何综合": ["圆锥曲线", "直线方程", "代数运算"],
};

/**
 * 获取一个知识点的所有前序知识点（递归）
 * @param {string} kp - 知识点名称
 * @param {number} depth - 当前递归深度
 * @returns {Array<{name: string, depth: number}>}
 */
function getPrerequisites(kp, depth = 0) {
  const direct = PREREQUISITE_MAP[kp] || [];
  const result = [];
  for (const pre of direct) {
    result.push({ name: pre, depth: depth + 1, direct: true });
    // 递归获取前序的前序（最多3层）
    if (depth < 3) {
      const indirect = getPrerequisites(pre, depth + 1);
      for (const item of indirect) {
        // 避免重复
        if (!result.find(r => r.name === item.name)) {
          result.push({ ...item, direct: false });
        }
      }
    }
  }
  return result;
}

/**
 * 计算两个知识点之间的关联强度
 * @param {string} kp1 - 知识点1
 * @param {string} kp2 - 知识点2  
 * @returns {number} 0-1 之间的关联强度
 */
function getRelevance(kp1, kp2) {
  if (kp1 === kp2) return 1.0;
  
  // 检查 kp1 的前序是否包含 kp2
  const pre1 = getPrerequisites(kp1);
  const p2 = pre1.find(p => p.name === kp2);
  if (p2) return Math.max(0.3, 1.0 - p2.depth * 0.25);
  
  // 检查 kp2 的前序是否包含 kp1
  const pre2 = getPrerequisites(kp2);
  const p1 = pre2.find(p => p.name === kp1);
  if (p1) return Math.max(0.3, 1.0 - p1.depth * 0.25);
  
  return 0;
}

/**
 * 获取所有知识点列表
 * @returns {string[]}
 */
function getAllKnowledgePoints() {
  const all = new Set(Object.keys(PREREQUISITE_MAP));
  for (const [, pres] of Object.entries(PREREQUISITE_MAP)) {
    for (const pre of pres) all.add(pre);
  }
  return [...all].sort();
}

module.exports = {
  PREREQUISITE_MAP,
  getPrerequisites,
  getRelevance,
  getAllKnowledgePoints,
};
