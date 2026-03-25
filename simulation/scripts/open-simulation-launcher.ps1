$launcherPath = Join-Path $PSScriptRoot "..\index.html"
$resolvedPath = Resolve-Path $launcherPath
Start-Process $resolvedPath
