# 九章一键部署脚本
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
