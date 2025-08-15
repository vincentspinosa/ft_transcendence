#!/bin/bash

# Transcendence Backend SSL Certificate Generation Script
# 
# This script generates self-signed SSL certificates for development purposes.
# It creates the necessary cryptographic files needed to enable HTTPS on the
# local development server.
# 
# WARNING: These are self-signed certificates intended ONLY for development.
# They will trigger browser security warnings and should NEVER be used in
# production environments.
# 
# Features:
# - Automatic creation of certificates directory
# - Generation of 2048-bit RSA private key
# - Creation of certificate signing request (CSR)
# - Generation of self-signed certificate valid for 365 days
# - Proper file permissions for security
# - Clear output messages and instructions
# 
# Security Notes:
# - Private key is set to 600 permissions (owner read/write only)
# - Certificate is set to 644 permissions (owner read/write, others read)
# - 2048-bit RSA provides adequate security for development
# - 365-day validity prevents frequent regeneration needs
# 
# @author Vincent Spinosa
# @version 1.0.0
# @usage ./generate-certs.sh

# Display informative header message
echo "🔐 Generating self-signed SSL certificates for development..."

# Create certificates directory if it doesn't exist
# This ensures the script can run successfully even on fresh installations
mkdir -p certs

# Generate private key using OpenSSL
# - genrsa: Generate RSA private key
# - -out certs/key.pem: Output file path for the private key
# - 2048: Key size in bits (provides adequate security for development)
echo "🔑 Generating 2048-bit RSA private key..."
openssl genrsa -out certs/key.pem 2048

# Generate certificate signing request (CSR)
# - req -new: Create new certificate signing request
# - -key certs/key.pem: Use the private key we just generated
# - -out certs/cert.csr: Output file for the CSR
# - -subj: Subject information for the certificate
#   - /C=US: Country (United States)
#   - /ST=State: State or Province
#   - /L=City: Locality (City)
#   - /O=Organization: Organization name
#   - /CN=localhost: Common Name (hostname for the certificate)
echo "📝 Creating certificate signing request..."
openssl req -new -key certs/key.pem -out certs/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate from the CSR
# - x509 -req: Process certificate request
# - -in certs/cert.csr: Input CSR file
# - -signkey certs/key.pem: Use our private key to sign the certificate
# - -out certs/cert.pem: Output file for the final certificate
# - -days 365: Certificate validity period (1 year)
echo "📜 Generating self-signed certificate valid for 365 days..."
openssl x509 -req -in certs/cert.csr -signkey certs/key.pem -out certs/cert.pem -days 365

# Set proper file permissions for security
# Private key should only be readable by the owner (600)
# This prevents other users from accessing the private key
echo "🔒 Setting secure file permissions..."
chmod 600 certs/key.pem

# Certificate can be readable by others (644)
# This allows the web server to read the certificate
chmod 644 certs/cert.pem

# Display success message with helpful information
echo "✅ SSL certificates generated successfully!"
echo "📁 Certificates location: ./certs/"
echo "🔑 Private key: certs/key.pem (600 permissions - owner only)"
echo "📜 Certificate: certs/cert.pem (644 permissions - readable by all)"
echo ""

# Display important security warnings and usage notes
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   - These are SELF-SIGNED certificates for DEVELOPMENT ONLY"
echo "   - Your browser will show security warnings - this is NORMAL"
echo "   - Click 'Advanced' and 'Proceed to localhost' to continue"
echo "   - NEVER use these certificates in production environments"
echo "   - For production, use certificates from a trusted Certificate Authority (CA)"
echo ""
echo "🚀 Your development server is now ready to use HTTPS!"
echo "   The backend will automatically load these certificates on startup."
