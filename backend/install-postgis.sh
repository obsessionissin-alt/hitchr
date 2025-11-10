#!/bin/bash
# backend/install-postgis.sh
# Install PostGIS extension for PostgreSQL

echo "🗺️  Installing PostGIS Extension"
echo "=================================="
echo ""

# Check PostgreSQL version
PG_VERSION=$(sudo -u postgres psql -tAc "SELECT version();" | grep -oP '\d+' | head -1)
echo "📋 PostgreSQL version detected: $PG_VERSION"

# Install PostGIS
echo ""
echo "🔄 Installing PostGIS..."
echo "   This may require sudo password"

# Try to install PostGIS
if command -v apt-get &> /dev/null; then
    echo "   Using apt-get (Ubuntu/Debian)"
    sudo apt-get update
    sudo apt-get install -y postgresql-16-postgis-3 postgresql-16-postgis-3-scripts
elif command -v yum &> /dev/null; then
    echo "   Using yum (RHEL/CentOS)"
    sudo yum install -y postgis33_16
else
    echo "   ⚠️  Could not detect package manager"
    echo "   Please install PostGIS manually:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql-16-postgis-3"
    echo "   RHEL/CentOS: sudo yum install postgis33_16"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "   ✅ PostGIS installed successfully"
else
    echo "   ❌ Failed to install PostGIS"
    echo "   You may need to install it manually"
    exit 1
fi

# Enable PostGIS extension in database
echo ""
echo "🔄 Enabling PostGIS extension in hitch_db..."
sudo -u postgres psql -d hitch_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d hitch_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

if [ $? -eq 0 ]; then
    echo "   ✅ Extensions enabled"
else
    echo "   ❌ Failed to enable extensions"
    exit 1
fi

echo ""
echo "✅ PostGIS installation complete!"
echo ""
echo "🧪 Testing database connection..."
cd /home/internt-zato/Documents/hitchr/backend
node test-db-connection.js

echo ""
echo "📋 Next step: Run migrations"
echo "   npm run migrate"

