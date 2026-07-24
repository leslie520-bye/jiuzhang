import os

ws = r"C:\Users\Lenovo\Documents\九章bp\jiuzhang-temp"

# 1. Write .gitignore
gitignore = """node_modules/
.git/
.env
.env.production
data/
uploads/
*.db
*.log
.DS_Store
.vscode/
.idea/
__pycache__/
*.pyc
"""

with open(os.path.join(ws, ".gitignore"), "w", encoding="utf-8") as f:
    f.write(gitignore)

# 2. Write deployment script
deploy_ps1 = """# 九章一键部署脚本
# 运行前请确保已执行: gh auth login

Write-Host "=== 九章部署脚本 ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to GitHub
Write-Host "[1/4] 检查 GitHub 登录状态..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "请先登录 GitHub:" -ForegroundColor Yellow
    Write-Host "  gh auth login" -ForegroundColor Green
    exit 1
}
Write-Host "  GitHub 已登录" -ForegroundColor Green

# Step 2: Create GitHub repo
Write-Host "[2/4] 创建 GitHub 仓库..." -ForegroundColor Yellow
$repoName = "jiuzhang"
$repoExists = gh repo view "$repoName" 2>&1
if ($LASTEXITCODE -ne 0) {
    gh repo create $repoName --public --description "九章AI数学诊断专家" --source .
    Write-Host "  仓库已创建: https://github.com/(你的用户名)/$repoName" -ForegroundColor Green
} else {
    Write-Host "  仓库已存在" -ForegroundColor Green
}

# Step 3: Push code
Write-Host "[3/4] 推送代码..." -ForegroundColor Yellow
git push -u origin main
Write-Host "  代码已推送" -ForegroundColor Green

# Step 4: Deploy to Vercel
Write-Host "[4/4] 部署到 Vercel..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "  请手动部署:" -ForegroundColor Yellow
    Write-Host "  1. 打开 https://vercel.com" -ForegroundColor Green
    Write-Host "  2. 导入 GitHub 仓库" -ForegroundColor Green
    Write-Host "  3. 添加环境变量 DEEPSEEK_API_KEY" -ForegroundColor Green
    Write-Host "  4. 绑定域名 mathjiuzhang.cn" -ForegroundColor Green
} else {
    vercel --prod
}

Write-Host ""
Write-Host "=== 部署完成! ===" -ForegroundColor Cyan
Write-Host "访问: https://mathjiuzhang.cn" -ForegroundColor Green
"""

with open(os.path.join(ws, "deploy.ps1"), "w", encoding="utf-8") as f:
    f.write(deploy_ps1)

# Also create a bash version
deploy_sh = """#!/bin/bash
echo "=== \u4e5d\u7ae0\u90e8\u7f72\u811a\u672c ==="

# Step 1: Check gh auth
echo "[1/4] \u68c0\u67e5 GitHub \u767b\u5f55..."
gh auth status 2>/dev/null
if [ $? -ne 0 ]; then
    echo "\u8bf7\u5148\u767b\u5f55 GitHub:"
    echo "  gh auth login"
    exit 1
fi
echo "  GitHub \u5df2\u767b\u5f55"

# Step 2: Create repo
echo "[2/4] \u521b\u5efa GitHub \u4ed3\u5e93..."
gh repo create jiuzhang --public --description "\u4e5d\u7ae0AI\u6570\u5b66\u8bca\u65ad\u4e13\u5bb6" --source . 2>/dev/null || echo "  \u4ed3\u5e93\u5df2\u5b58\u5728"

# Step 3: Push
echo "[3/4] \u63a8\u9001\u4ee3\u7801..."
git push -u origin main

echo "[4/4] \u90e8\u7f72\u5b8c\u6210"
echo "\u8bbf\u95ee: https://mathjiuzhang.cn"
"""

with open(os.path.join(ws, "deploy.sh"), "w", encoding="utf-8") as f:
    f.write(deploy_sh)

print(f".gitignore: {os.path.getsize(os.path.join(ws, '.gitignore'))} bytes")
print(f"deploy.ps1: {os.path.getsize(os.path.join(ws, 'deploy.ps1'))} bytes")
print(f"deploy.sh: {os.path.getsize(os.path.join(ws, 'deploy.sh'))} bytes")
