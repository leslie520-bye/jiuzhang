# 启动/重启诊断服务器
$serverPath = Join-Path $PSScriptRoot ".." | Join-Path -ChildPath ".." | Join-Path -ChildPath ".."
$serverPath = Resolve-Path $serverPath

Write-Host "=== 数学诊断工作台 ===" -ForegroundColor Cyan
Write-Host "服务器路径: $serverPath" -ForegroundColor Gray

# Kill existing server
$existing = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "server.js" }
if ($existing) {
    Write-Host "停止已有服务..." -ForegroundColor Yellow
    $existing | Stop-Process -Force
    Start-Sleep -Seconds 1
}

# Start server
Set-Location $serverPath
Write-Host "启动服务器 (port:3456)..." -ForegroundColor Green
Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "server.js"
Start-Sleep -Seconds 2

# Verify
$process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "server.js" }
if ($process) {
    Write-Host "服务器已启动!" -ForegroundColor Green
    Write-Host "诊断工作台: http://localhost:3456/" -ForegroundColor Cyan
    Write-Host "历史记录: http://localhost:3456/history.html" -ForegroundColor Cyan
} else {
    Write-Host "启动失败，尝试手动运行: npm start" -ForegroundColor Red
}
