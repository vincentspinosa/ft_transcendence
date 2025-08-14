#!/bin/bash

# Generate self-signed SSL certificates for development
echo "🔐 Generating self-signed SSL certificates for development..."

# Create certificates directory if it doesn't exist
mkdir -p certs

# Generate private key
openssl genrsa -out certs/key.pem 2048

# Generate certificate signing request
openssl req -new -key certs/key.pem -out certs/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -in certs/cert.csr -signkey certs/key.pem -out certs/cert.pem -days 365

# Set proper permissions
chmod 600 certs/key.pem
chmod 644 certs/cert.pem

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificates location: ./certs/"
echo "🔑 Private key: certs/key.pem"
echo "📜 Certificate: certs/cert.pem"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   Your browser will show a security warning - this is normal for development."
