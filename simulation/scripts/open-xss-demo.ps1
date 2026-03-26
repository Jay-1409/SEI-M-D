$demoPath = Join-Path $PSScriptRoot "..\demos\xss-feedback-wall\index.html"
$resolvedPath = Resolve-Path $demoPath
Start-Process $resolvedPath
