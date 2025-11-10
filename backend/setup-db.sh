#!/bin/bash
# backend/setup-db.sh
# Quick database setup script
# Run with: bash setup-db.sh

echo "🗄️  Setting up PostgreSQL database for HITCHR..."
echo ""

# Check if running as postgres user or with sudo
if [ "$EUID" -ne 0 ] && [ "$USER" != "postgres" ]; then
    echo "⚠️  This script needs to run as postgres user or with sudo"
    echo "   Run: sudo -u postgres bash setup-db.sh"
    echo "   Or: sudo bash setup-db.sh"
    exit 1
fi

# Database configuration
DB_NAME="hitch_db"
DB_USER="hitch_user"
DB_PASSWORD="hitch_password_123"

echo "📋 Configuration:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""

# Create database
echo "🔄 Creating database..."
psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "   Database might already exist"

# Create user
echo "🔄 Creating user..."
psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "   User might already exist"

# Grant privileges
echo "🔄 Granting privileges..."
psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# Enable extensions
echo "🔄 Enabling extensions..."
psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d $DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📝 Update your .env file with:"
echo "   DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "🧪 Test connection:"
echo "   node test-db-connection.js"

