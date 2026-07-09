$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$source = Join-Path $repoRoot 'skill\goal-draft-policy\SKILL.md'
$destinationDir = Join-Path $HOME '.agents\skills\goal-draft-policy'
$destination = Join-Path $destinationDir 'SKILL.md'

if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "Source Skill file が見つかりません: $source"
}

if (-not (Test-Path -LiteralPath $destinationDir -PathType Container)) {
    New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
}

Copy-Item -LiteralPath $source -Destination $destination -Force

$sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
$destinationHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash

if ($sourceHash -ne $destinationHash) {
    throw "Skill sync に失敗しました: source と destination の hash が一致しません。"
}

Write-Host "Skill sync が完了しました。"
Write-Host "Source: $source"
Write-Host "Destination: $destination"
Write-Host "SHA256: $sourceHash"
