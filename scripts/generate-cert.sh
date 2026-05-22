#!/usr/bin/env bash
# Generates a self-signed TLS cert at ./certs/{fullchain,privkey}.pem
# using the alpine/openssl Docker image. Run from the repo root.
set -euo pipefail

CERT_DIR="$(pwd)/certs"
mkdir -p "$CERT_DIR"

echo "Generating self-signed cert in $CERT_DIR ..."

docker run --rm -v "$CERT_DIR:/certs" alpine sh -c '
apk add --no-cache openssl >/dev/null 2>&1
openssl req -x509 -newkey rsa:4096 -nodes -days 365 \
  -keyout /certs/privkey.pem \
  -out /certs/fullchain.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
'

echo "Done. Cert: $CERT_DIR/fullchain.pem  Key: $CERT_DIR/privkey.pem"
echo "Browsers will warn about the self-signed cert — accept the exception for local testing."
