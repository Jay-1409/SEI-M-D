$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $serviceDir

try {
  docker build -t expo-rate-limit-demo:latest .
  docker save expo-rate-limit-demo:latest -o expo-rate-limit-demo.tar
  Write-Host "Created $serviceDir\expo-rate-limit-demo.tar"
}
finally {
  Pop-Location
}
