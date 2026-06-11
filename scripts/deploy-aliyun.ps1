#Requires -Version 5.1
<#
.SYNOPSIS
  桃源乡 v2 一键部署到阿里云 ECS（systemd: taoyuan-v2）

.DESCRIPTION
  本机编译前端 docs + Linux 后端，上传到 /opt/taoyuan-v2 并重启服务。

.PARAMETER FrontendOnly
  仅更新前端静态资源（日常改 UI/逻辑时用，最快）

.PARAMETER BackendOnly
  仅更新 Go 后端与知识库（不改前端时用）

.PARAMETER SkipBuild
  跳过本机编译，直接上传已有产物（需已存在 docs/ 与 backend/server-linux）

.PARAMETER Key
  SSH 私钥路径。默认 %USERPROFILE%\Downloads\cursor.pem，或环境变量 TAOYUAN_SSH_KEY

.PARAMETER Remote
  SSH 目标，形如 root@47.108.84.163。默认 root@47.108.84.163，或环境变量 TAOYUAN_REMOTE

.PARAMETER RemoteDir
  服务器部署目录，默认 /opt/taoyuan-v2

.EXAMPLE
  .\scripts\deploy-aliyun.ps1
  全量部署（前端 + 后端 + 知识库）

.EXAMPLE
  .\scripts\deploy-aliyun.ps1 -FrontendOnly
  只部署前端

.EXAMPLE
  $env:TAOYUAN_SSH_KEY = "D:\keys\cursor.pem"; .\scripts\deploy-aliyun.ps1
#>
param(
  [switch]$FrontendOnly,
  [switch]$BackendOnly,
  [switch]$SkipBuild,
  [string]$Key = $env:TAOYUAN_SSH_KEY,
  [string]$Remote = $env:TAOYUAN_REMOTE,
  [string]$RemoteDir = "/opt/taoyuan-v2"
)

$ErrorActionPreference = "Stop"

if ($FrontendOnly -and $BackendOnly) {
  Write-Error "不能同时指定 -FrontendOnly 与 -BackendOnly"
}

$DeployFrontend = -not $BackendOnly
$DeployBackend = -not $FrontendOnly

if (-not $Key) { $Key = Join-Path $env:USERPROFILE "Downloads\cursor.pem" }
if (-not $Remote) { $Remote = "root@47.108.84.163" }

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $Root "backend"
$DocsDir = Join-Path $Root "docs"
$ServerBin = Join-Path $BackendDir "server-linux"
$DocsTar = Join-Path $Root "docs.tar.gz"
$SshArgs = @("-i", $Key, "-o", "StrictHostKeyChecking=accept-new")

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-File([string]$Path, [string]$Hint) {
  if (-not (Test-Path $Path)) {
    Write-Error "缺少文件: $Path`n$Hint"
  }
}

if (-not (Test-Path $Key)) {
  Write-Error "SSH 密钥不存在: $Key`n请指定 -Key 或设置环境变量 TAOYUAN_SSH_KEY"
}

Write-Host "桃源乡 v2 部署" -ForegroundColor Green
Write-Host "  项目: $Root"
Write-Host "  目标: ${Remote}:${RemoteDir}"
$scope = "full"
if ($DeployFrontend -and -not $DeployBackend) { $scope = "frontend" }
if ($DeployBackend -and -not $DeployFrontend) { $scope = "backend" }
Write-Host "  scope: $scope"

if (-not $SkipBuild) {
  if ($DeployFrontend) {
    Write-Step "编译前端 (vite build -> docs/)"
    Push-Location $Root
    try {
      pnpm exec vite build
      if ($LASTEXITCODE -ne 0) { throw "vite build 失败 (exit $LASTEXITCODE)" }
    } finally {
      Pop-Location
    }
    Assert-File $DocsDir "请先成功执行 vite build"
  }

  if ($DeployBackend) {
    Write-Step "编译 Linux 后端 (GOOS=linux GOARCH=amd64)"
    Push-Location $BackendDir
    try {
      $env:GOOS = "linux"
      $env:GOARCH = "amd64"
      go build -o server-linux ./cmd/server/
      if ($LASTEXITCODE -ne 0) { throw "go build 失败 (exit $LASTEXITCODE)" }
    } finally {
      Remove-Item Env:GOOS -ErrorAction SilentlyContinue
      Remove-Item Env:GOARCH -ErrorAction SilentlyContinue
      Pop-Location
    }
    Assert-File $ServerBin "请先成功执行 go build"
  }
} else {
  if ($DeployFrontend) { Assert-File $DocsDir "缺少 docs/，去掉 -SkipBuild 或先手动 build" }
  if ($DeployBackend) { Assert-File $ServerBin "缺少 backend/server-linux，去掉 -SkipBuild 或先手动 build" }
}

$uploadBackend = $false
$uploadDocs = $false

try {
  if ($DeployBackend) {
    Write-Step "上传后端二进制到服务器 /tmp"
    & scp @SshArgs $ServerBin "${Remote}:/tmp/server-linux-new"
    if ($LASTEXITCODE -ne 0) { throw "scp server-linux 失败" }
    $uploadBackend = $true

    Write-Step "上传知识库 internal/knowledge"
    & scp @SshArgs -r (Join-Path $BackendDir "internal\knowledge") "${Remote}:/tmp/taoyuan-knowledge"
    if ($LASTEXITCODE -ne 0) { throw "scp knowledge 失败" }
  }

  if ($DeployFrontend) {
    Write-Step "打包并上传前端 docs"
    Push-Location $Root
    try {
      if (Test-Path $DocsTar) { Remove-Item $DocsTar -Force }
      & tar -czf docs.tar.gz docs
      if ($LASTEXITCODE -ne 0) { throw "tar 打包失败" }
    } finally {
      Pop-Location
    }
    & scp @SshArgs $DocsTar "${Remote}:/tmp/taoyuan-docs.tar.gz"
    if ($LASTEXITCODE -ne 0) { throw "scp docs.tar.gz 失败" }
    $uploadDocs = $true
  }

  Write-Step "服务器：停服、替换文件、重启"
  $remoteScript = @"
set -e
systemctl stop taoyuan-v2
"@
  if ($uploadBackend) {
    $remoteScript += @"

cp /tmp/server-linux-new ${RemoteDir}/server-linux
chmod +x ${RemoteDir}/server-linux
rm -rf ${RemoteDir}/internal/knowledge
mkdir -p ${RemoteDir}/internal
cp -r /tmp/taoyuan-knowledge ${RemoteDir}/internal/knowledge
"@
  }
  if ($uploadDocs) {
    $remoteScript += @"

cd ${RemoteDir}
rm -rf docs
tar -xzf /tmp/taoyuan-docs.tar.gz
rm -f /tmp/taoyuan-docs.tar.gz
"@
  }
  $remoteScript += @"

systemctl start taoyuan-v2
sleep 2
systemctl is-active taoyuan-v2
curl -s -o /dev/null -w 'health:%{http_code}\n' http://127.0.0.1:8005/
"@

  $remoteOutput = & ssh @SshArgs $Remote $remoteScript 2>&1
  $remoteOutput | ForEach-Object { Write-Host $_ }
  if ($LASTEXITCODE -ne 0) { throw "远程部署命令失败" }

  if ($remoteOutput -notmatch "active") {
    Write-Warning "服务可能未正常启动，请 SSH 登录检查: journalctl -u taoyuan-v2 -n 50"
  }
} finally {
  if (Test-Path $DocsTar) { Remove-Item $DocsTar -Force }
}

Write-Host ""
Write-Host "部署完成。" -ForegroundColor Green
Write-Host "  访问: http://47.108.84.163:8005/"
Write-Host "  强刷: Ctrl+F5"
Write-Host "  日志: ssh -i `"$Key`" $Remote journalctl -u taoyuan-v2 -f"
