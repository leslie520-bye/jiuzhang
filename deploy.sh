#!/bin/bash
echo "=== 九章部署脚本 ==="

# Step 1: Check gh auth
echo "[1/4] 检查 GitHub 登录..."
gh auth status 2>/dev/null
if [ $? -ne 0 ]; then
    echo "请先登录 GitHub:"
    echo "  gh auth login"
    exit 1
fi
echo "  GitHub 已登录"

# Step 2: Create repo
echo "[2/4] 创建 GitHub 仓库..."
gh repo create jiuzhang --public --description "九章AI数学诊断专家" --source . 2>/dev/null || echo "  仓库已存在"

# Step 3: Push
echo "[3/4] 推送代码..."
git push -u origin main

echo "[4/4] 部署完成"
echo "访问: https://mathjiuzhang.cn"
