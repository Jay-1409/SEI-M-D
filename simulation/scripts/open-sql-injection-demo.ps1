$demoPath = Join-Path $PSScriptRoot "..\demos\sql-injection\index.html"
$resolvedPath = Resolve-Path $demoPath
Start-Process $resolvedPath
