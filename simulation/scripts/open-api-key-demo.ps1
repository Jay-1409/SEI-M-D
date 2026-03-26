$demoPath = Join-Path $PSScriptRoot "..\demos\api-key-protection\index.html"
$resolvedPath = Resolve-Path $demoPath
Start-Process $resolvedPath
