$demoPath = Join-Path $PSScriptRoot "..\demos\rate-limiting\index.html"
$resolvedPath = Resolve-Path $demoPath
Start-Process $resolvedPath
