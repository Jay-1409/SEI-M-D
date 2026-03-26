$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $serviceDir

try {
  docker build -t expo-api-key-demo:latest .
  docker save expo-api-key-demo:latest -o expo-api-key-demo.tar
  Write-Host "Created $serviceDir\expo-api-key-demo.tar"
}
finally {
  Pop-Location
}
