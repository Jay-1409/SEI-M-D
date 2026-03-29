# Run this script directly from this directory to build the tar file:
# .\build-demo-target.ps1

Write-Host "Building expo-unified-target image..."
docker build -t expo-unified-target:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Saving expo-unified-target image to tar..."
docker save expo-unified-target:latest -o expo-unified-target.tar

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker save failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Done! You can now deploy expo-unified-target.tar to the platform." -ForegroundColor Green
