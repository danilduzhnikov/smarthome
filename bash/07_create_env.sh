#!/bin/bash

set -e

echo "=================================="
echo "Creating .env..."
echo "=================================="

cat > .env << EOF
SECRET_KEY=django-secret-key

POSTGRES_DB=smart_home
POSTGRES_USER=smart_home_user
POSTGRES_PASSWORD=smart_home_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

REDIS_HOST=127.0.0.1
EOF

echo "=================================="
echo "Setup complete!"
echo "=================================="

echo ""
echo "Activate venv:"
echo "source venv/bin/activate"
