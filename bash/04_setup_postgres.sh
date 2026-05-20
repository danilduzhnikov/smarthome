#!/bin/bash

set -e

echo "=================================="
echo "Creating PostgreSQL database..."
echo "=================================="

sudo -u postgres psql << EOF
CREATE DATABASE smart_home;

CREATE USER smart_home_user
WITH PASSWORD 'smart_home_password';

ALTER ROLE smart_home_user
SET client_encoding TO 'utf8';

ALTER ROLE smart_home_user
SET default_transaction_isolation TO 'read committed';

ALTER ROLE smart_home_user
SET timezone TO 'UTC';

GRANT ALL PRIVILEGES
ON DATABASE smart_home
TO smart_home_user;
EOF