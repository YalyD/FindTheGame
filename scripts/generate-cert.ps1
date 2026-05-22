# Generates a self-signed TLS certificate at ./certs/{fullchain,privkey}.pem
# using the alpine/openssl Docker image — no openssl install required on the host.
# Run from the repository root.

$certDir = Join-Path (Get-Location) 'certs'
if (-not (Test-Path $certDir)) { New-Item -ItemType Directory -Path $certDir | Out-Null }

Write-Host "Generating self-signed cert in $certDir ..."

# Note: openssl writes progress dots to stderr. PowerShell 5.1 treats native-command
# stderr as errors, so we explicitly merge streams and check exit code instead.
$null = docker run --rm -v "${certDir}:/certs" alpine sh -c @'
apk add --no-cache openssl >/dev/null 2>&1
openssl req -x509 -newkey rsa:4096 -nodes -days 365 \
  -keyout /certs/privkey.pem \
  -out /certs/fullchain.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>&1
'@ 2>&1

if ($LASTEXITCODE -ne 0) {
  Write-Error "openssl failed (exit $LASTEXITCODE)"
  exit 1
}
if (-not (Test-Path (Join-Path $certDir 'fullchain.pem'))) {
  Write-Error "cert file was not produced"
  exit 1
}

Write-Host "Done. Cert: $certDir\fullchain.pem  Key: $certDir\privkey.pem"
Write-Host "Browsers will warn about the self-signed cert - accept the exception for local testing."
