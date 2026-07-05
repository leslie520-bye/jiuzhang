# API 参考文档

## Base URL

本地：http://localhost:3456/api/
线上：https://math-diagnosis.vercel.app/api/

## 诊断 API

### 保存诊断报告

POST /api/diagnosis

请求体：
```json
{
  "student_name": "张同学",
  "grade": "高二",
  "current_score": "95/150",
  "target_score": "125/150",
  "teacher_observation": "综合题容易放弃",
  "parent_requirement": "希望高考数学120+",
  "student_feedback": "函数题做不完",
  "modules": [
    {
      "module_name": "函数与导数综合",
      "module_avg": 55,
      "subtopics": [
        { "name": "函数性质综合", "pct": 60 },
        { "name": "导数与切线极值", "pct": 50 }
      ],
      "error_types": ["c", "m"]
    }
  ],
  "cause_data": { "a": 20, "b": 30, "c": 40, "d": 10 },
  "exam_scores": ["87/150", "92/150", "95/150"],
  "learning_habits": {
    "ct": { "v": 1, "l": "偶尔记一下" },
    "dr": { "v": 2, "l": "有些结构" }
  },
  "competitive_position": {
    "class": "15/45",
    "grade": "120/500",
    "level": "mid_top"
  },
  "exam_strategy": {
    "time": { "v": 0, "l": "经常做不完" },
    "skip": { "v": 1, "l": "写了第一问就放弃" }
  }
}
```

返回：
```json
{ "success": true, "id": 1 }
```

### 查询诊断列表

GET /api/diagnosis
GET /api/diagnosis?student=张

返回：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_name": "张同学",
      "grade": "高二",
      "avg_percentage": 55,
      "created_at": "2026-07-05 14:30:00",
      "current_score": "95/150",
      "target_score": "125/150"
    }
  ]
}
```

### 查看诊断详情

GET /api/diagnosis/1

返回：完整诊断数据（含 modules, cause_data, exam_scores 等）

### 删除诊断

DELETE /api/diagnosis/1

返回：{ "success": true }

### 学生列表

GET /api/students

返回：
```json
{ "success": true, "data": [{ "student_name": "张同学" }] }
```

### 学生趋势

GET /api/trend/张同学

返回：该学生所有诊断记录（含 modules）

## 课程规划 API

### 保存课程规划

POST /api/courseplan

```json
{
  "student_name": "张同学",
  "grade": "高二",
  "total_hours": 24,
  "weeks_count": 5,
  "plan_data": {
    "weeks": [
      {
        "items": [
          { "name": "函数综合", "hours": 5, "focus": "突破零点问题" },
          { "name": "数列", "hours": 3, "focus": "裂项相消法" }
        ],
        "th": 8
      }
    ]
  }
}
```

### 查询规划列表

GET /api/courseplan
GET /api/courseplan?student=张

### 查看规划详情

GET /api/courseplan/1

### 更新规划

PUT /api/courseplan/1
Body: 同保存接口

### 删除规划

DELETE /api/courseplan/1

## 工具 API

### 上传图片

POST /api/upload

```json
{
  "images": [
    { "data": "data:image/jpeg;base64,...", "name": "paper1.jpg" }
  ]
}
```

返回：
```json
{ "success": true, "files": [{ "filename": "paper_xxx_0.jpg", "url": "/uploads/paper_xxx_0.jpg" }] }
```

### AI 分析试卷

POST /api/analyze

```json
{
  "files": [{ "filename": "paper_xxx_0.jpg" }],
  "grade": "高二"
}
```

返回（有 API Key 时调用 DeepSeek，否则返回 Mock 数据）：
```json
{
  "success": true,
  "student_name": "",
  "score": "待确认",
  "wrong_questions": [...],
  "weak_modules": [...],
  "error_distribution": { "c": 2, "l": 3, "m": 5, "e": 1 },
  "cause_analysis": { "a": 20, "b": 30, "c": 40, "d": 10 },
  "summary": "..."
}
```
