param(
    [string[]]$Spec = @()
)

$ErrorActionPreference = 'Stop'

$frontendDir = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $frontendDir 'scripts\run-playwright-fullstack.mjs'
$node = 'C:\Program Files\nodejs\node.exe'

$args = @($runner)
foreach ($item in $Spec) {
    $args += '--spec'
    $args += $item
}

& $node $args
exit $LASTEXITCODE
