# 九章 · AI 数学诊断专家

> 面向初一至高三学生的 AI 数学诊断工作台。上传试卷、诊断薄弱点、生成课程规划、追踪进步轨迹。

## 功能概览

```
┌─────────────────────────────────────────────┐
│              九章 · 核心闭环                 │
│                                              │
│  诊断 ──→ 报告 ──→ 课程规划 ──→ 追踪       │
│    ↑                               │        │
│    └────────── 历史回溯 ────────────┘        │
└─────────────────────────────────────────────┘
```

### 诊断（Diagnosis）
- 上传试卷照片，AI 自动分析错题（支持 DeepSeek Vision）
- 按年级（初一至高三）展示对应知识点网格
- 子知识点级正确率录入，实时计算模块平均
- 学习习惯、考试策略、竞争力三大维度量化评估
- 一键生成科学诊断报告（七段式结构）

### 课程规划（Course Planning）
- 基于诊断结果自动生成周历式课程规划
- 智能课时分配算法（薄弱模块分配更多课时）
- 可编辑教学重点和教辅材料
- 保存规划 / 导出课程 PDF

### 历史记录（History）
- 诊断记录：搜索、查看详情、删除
- 课程规划：搜索、查看详情、跳转编辑、删除
- 统计概览：学生人数、诊断次数、平均正确率

## 快速开始

### 前置要求

- Node.js 18+
- （可选）DeepSeek API Key —— 用于 AI 试卷分析

### 安装与启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（可选）
cp .env.example .env
# 编辑 .env，填入你的 DeepSeek API Key（不填则使用模拟数据）

# 3. 启动服务
npm start

# 4. 打开浏览器
# 访问 http://localhost:3456
```

### 使用流程

1. **上传试卷** —— 拍照上传学生试卷，点击"开始分析"（或直接手动填写）
2. **填写诊断** —— 确认学生信息，在各模块子知识点填入正确率
3. **补充信息** —— 填写学习习惯、考试策略、竞争力评估
4. **生成报告** —— 点击"生成科学诊断报告"，查看七段式诊断报告
5. **保存数据** —— 点击"保存"，诊断记录存入数据库
6. **生成规划** —— 切换到"课程规划"标签，点击"生成规划"
7. **编辑微调** —— 调整课时、教学重点、教辅材料
8. **保存规划** —— 点击"保存规划"，形成可执行的课程方案
9. **持续追踪** —— 在"历史记录"中查看所有诊断和规划记录

## 技术架构

```
┌─────────────────────────────────────────┐
│              前端（单页应用）             │
│  index.html / history.html / styles.css │
│  纯原生 JS · 无框架依赖 · PWA 支持      │
└──────────────────┬──────────────────────┘
                   │ HTTP / REST
┌──────────────────▼──────────────────────┐
│             后端（Express）              │
│  server.js / api/index.js              │
│  诊断 API · 课程规划 API · 文件上传    │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│             数据库（SQLite）             │
│  diagnoses.db                           │
│  diagnoses · module_results             │
│  subtopic_results · course_plans        │
└─────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML/CSS/JavaScript · 响应式设计 · PWA |
| 后端 | Node.js · Express |
| 数据库 | SQLite（通过 sql.js） |
| AI 分析 | DeepSeek Vision API（可选，无 Key 则用 Mock 数据） |
| 样式 | CSS 变量 · 深色主题 · 移动端适配 |
| 部署 | 本地 Node 服务 / Vercel（api/index.js） |

### API 端点

| 端点 | 说明 |
|------|------|
| `POST /api/diagnosis` | 保存诊断（含模块 + 子知识点） |
| `GET /api/diagnosis` | 诊断列表（?student=搜索词） |
| `GET /api/diagnosis/:id` | 诊断详情 |
| `DELETE /api/diagnosis/:id` | 删除诊断 |
| `GET /api/students` | 学生列表 |
| `GET /api/trend/:student` | 学生历次诊断 |
| `POST /api/courseplan` | 保存课程规划 |
| `GET /api/courseplan` | 规划列表 |
| `GET /api/courseplan/:id` | 规划详情 |
| `PUT /api/courseplan/:id` | 更新规划 |
| `DELETE /api/courseplan/:id` | 删除规划 |
| `POST /api/upload` | 上传试卷图片 |
| `POST /api/analyze` | AI 分析试卷 |

## 项目结构

```
.
├── api/                  # Vercel 部署入口
│   └── index.js
├── data/                 # 数据库文件（gitignored）
├── public/               # 前端静态资源
│   ├── index.html        # 主页面（诊断 + 课程规划）
│   ├── history.html      # 历史记录页面
│   ├── report.html       # PDF 报告页面
│   ├── styles.css        # 共享样式
│   ├── manifest.json     # PWA 清单
│   ├── sw.js            # Service Worker
│   └── icon-*.svg       # 应用图标
├── uploads/              # 上传的试卷图片（gitignored）
├── server.js             # 本地服务器入口
├── database.js           # 云端数据库（Turso）
├── database-local.js     # 本地 SQLite 数据库
├── package.json
└── .env                  # 环境变量配置（gitignored）
```

## 数据库设计

```sql
-- 诊断主表
diagnoses (id, student_name, grade, current_score, target_score,
           teacher_observation, parent_requirement, student_feedback,
           avg_percentage, exam_scores, cause_data,
           learning_habits, competitive_position, exam_strategy,
           full_report, created_at)

-- 模块结果（一对多）
module_results (id, diagnosis_id, module_name, module_avg, error_types)

-- 子知识点（一对多）
subtopic_results (id, module_result_id, subtopic_name, percentage)

-- 课程规划
course_plans (id, diagnosis_id, student_name, grade,
              total_hours, weeks_count, plan_data, created_at)
```

## 知识点体系

覆盖初中（初一至初三）和高中（高一至高三）的完整数学知识体系，按年级加载对应模块：

**初中（共 20+ 模块）**：有理数运算、整式、一元一次方程、二元一次方程组、不等式与不等式组、几何初步、实数与坐标系、三角形、因式分解、分式、二次根式、正比例与反比例函数、二次函数、相似三角形、锐角三角函数、圆、统计初步……

**高中（共 15+ 模块）**：集合与命题、函数概念与性质、幂指对函数、三角函数、平面向量、数列、解析几何初步、立体几何、概率统计、导数及其应用、解析几何综合、数列与不等式……

## 许可

MIT
