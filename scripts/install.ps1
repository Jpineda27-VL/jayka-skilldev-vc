# Copies the jayka-* skills to ~/.claude/skills. It does not overwrite existing ones (use -Force to replace them).
# The recommended way is the plugin (see README). Use this only if you want the commands without the /jay-ka: prefix.
param([switch]$Force)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root 'plugins\jay-ka\skills'
$base = if ($env:CLAUDE_HOME) { $env:CLAUDE_HOME } else { Join-Path $HOME '.claude' }
$target = Join-Path $base 'skills'

New-Item -ItemType Directory -Force -Path $target | Out-Null
$copied = 0
$skipped = 0
foreach ($skill in Get-ChildItem -Directory $source) {
    $destination = Join-Path $target $skill.Name
    if ((Test-Path $destination) -and -not $Force) {
        Write-Host "Already exists, skipped: $($skill.Name) (use -Force to replace it)"
        $skipped++
        continue
    }
    if (Test-Path $destination) { Remove-Item -Recurse -Force $destination }
    Copy-Item -Recurse $skill.FullName $destination
    Write-Host "Installed: $($skill.Name)"
    $copied++
}
Write-Host "Done: $copied installed, $skipped skipped. Folder: $target"
