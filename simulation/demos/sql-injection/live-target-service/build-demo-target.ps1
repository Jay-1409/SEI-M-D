$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $serviceDir

try {
  docker build -t expo-sqli-demo:latest .
  docker save expo-sqli-demo:latest -o expo-sqli-demo.tar
  Write-Host "Created $serviceDir\expo-sqli-demo.tar"
}
finally {
  Pop-Location
}
