# Copia las skills jayka-* a ~/.claude/skills. No pisa las que ya existen (usa -Force para reemplazarlas).
param([switch]$Force)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$origen = Join-Path $raiz 'plugins\jay-ka\skills'
$base = if ($env:CLAUDE_HOME) { $env:CLAUDE_HOME } else { Join-Path $HOME '.claude' }
$destino = Join-Path $base 'skills'

New-Item -ItemType Directory -Force -Path $destino | Out-Null
$copiadas = 0
$saltadas = 0
foreach ($skill in Get-ChildItem -Directory $origen) {
    $objetivo = Join-Path $destino $skill.Name
    if ((Test-Path $objetivo) -and -not $Force) {
        Write-Host "Ya existe, se salta: $($skill.Name) (usa -Force para reemplazarla)"
        $saltadas++
        continue
    }
    if (Test-Path $objetivo) { Remove-Item -Recurse -Force $objetivo }
    Copy-Item -Recurse $skill.FullName $objetivo
    Write-Host "Instalada: $($skill.Name)"
    $copiadas++
}
Write-Host "Listo: $copiadas instaladas, $saltadas saltadas. Carpeta: $destino"
