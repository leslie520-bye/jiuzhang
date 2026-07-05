---
name: math-diagnosis-workbench
description: AI数学诊断工作台 | Codex 技能。用于诊断学生数学知识点掌握情况、分析失分原因、制定改进方案和课程规划。让 Codex 能够启动诊断服务、调用诊断 API、生成报告和改进方案。
metadata:
 short-description: 数学诊断工作台 — 启动诊断服务、查询诊断数据、生成改进方案
 triggers:
 - 数学诊断
 - 诊断工作台
 - 知识点诊断
 - 试卷分析
 - 课程规划
 - 改进方案
 - 数学提分
---

# AI 数学诊断工作台（Codex 技能）

## 技能概述

本技能赋予 Codex 操作 AI 数学诊断工作台的能力。工作台是一个基于 Node.js + Express + SQLite 的本地 Web 应用，面向初高中学生（初一至高三）提供数学知识点诊断、失分原因分析、改进方案生成和课程规划等功能。

## 适用场景

- 启动/停止本地诊断服务
- 通过 API 查询诊断数据
- 基于诊断结果生成改进方案
- 生成课程规划
- 分析学生学习习惯和考试策略

## 快速开始

### 启动诊断服务

在 diagnosis-server 目录下执行：
```powershell
# 方式一
.\start.bat

# 方式二
npm start
```

服务启动后访问：
- http://localhost:3456/ — 诊断工作台
- http://localhost:3456/history.html — 历史记录

### 环境变量

见 .env.example：
- OPENAI_API_KEY — DeepSeek API 密钥（用于 AI 试卷分析）
- TURSO_URL / TURSO_TOKEN — Turso 云数据库配置（Vercel 部署用）

## 知识点体系

工作台覆盖初一至高三共 40 个模块、约 160 个子知识点：

| 年级 | 模块数 | 模块清单 |
|------|--------|---------|
| 初一 | 7 | 有理数运算、整式、一元一次方程、二元一次方程组、不等式与不等式组、几何初步、实数与坐标系 |
| 初二 | 7 | 三角形、整式乘除与因式分解、分式、二次根式、一次函数与反比例函数、四边形与勾股定理、数据分析 |
| 初三 | 6 | 一元二次方程、二次函数、旋转与圆、相似三角形、锐角三角函数、概率初步 |
| 高一 | 7 | 集合与逻辑、一元二次函数与不等式、函数概念与性质、指数与对数函数、三角函数、平面向量、立体几何初步 |
| 高二 | 7 | 数列、不等式、空间向量与立体几何、解析几何、导数及其应用、计数原理、随机变量与统计 |
| 高三 | 6 | 函数与导数综合、三角函数与解三角形、数列与不等式综合、立体几何综合、解析几何综合、概率统计与计数 |

## 错误类型编码

| 编码 | 含义 | 典型表现 |
|------|------|----------|
| c | 概念理解不清 | 公式记错、概念混淆 |
| l | 计算能力不足 | 运算速度慢、粗心大意 |
| m | 解题方法缺失 | 不知从何入手 |
| e | 审题与考试策略 | 漏条件、时间分配不合理 |

## 扩展诊断维度

学习习惯（6维度0-3分）：错题本使用、草稿纸习惯、限时训练、课堂提问、课后复习、作业独立性
竞争力：班级排名、年级排名、自我定位（前10%优等→靠后）
考试策略（6维度0-3分）：时间充裕度、压轴题策略、考试焦虑、检查习惯、做题顺序、计算失误

## API 概览

所有 API 位于 http://localhost:3456/api/：

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | /api/diagnosis | 保存诊断报告 |
| GET | /api/diagnosis | 查询诊断列表 |
| GET | /api/diagnosis/:id | 查看诊断详情 |
| GET | /api/students | 学生列表 |
| GET | /api/trend/:student | 学生趋势 |
| DELETE | /api/diagnosis/:id | 删除诊断 |
| POST | /api/courseplan | 保存课程规划 |
| GET | /api/courseplan | 查询规划列表 |
| GET | /api/courseplan/:id | 查看规划详情 |
| PUT | /api/courseplan/:id | 更新规划 |
| DELETE | /api/courseplan/:id | 删除规划 |
| POST | /api/analyze | AI 分析试卷 |
| POST | /api/upload | 上传图片 |

## 诊断报告数据结构

```typescript
{
  student_name: string,        // 学生姓名
  grade: string,               // 年级
  current_score: string,       // 当前分数
  target_score: string,        // 目标分数
  teacher_observation: string, // 教师观察
  parent_requirement: string,  // 家长需求
  student_feedback: string,    // 学生自述
  modules: [{                  // 模块诊断
    module_name: string,
    module_avg: number,        // 0-100
    subtopics: [{ name: string, pct: number }],
    error_types: string[]      // ["c","l","m","e"]
  }],
  cause_data: { a,b,c,d },     // 失分原因占比
  exam_scores: string[],
  learning_habits: {},
  competitive_position: {},
  exam_strategy: {},
  full_report: string
}
```

## 参考资源

- references/api-spec.md — API 完整参考
- references/knowledge-base.md — 各年级知识点详情
- scripts/start.ps1 — 启动脚本
