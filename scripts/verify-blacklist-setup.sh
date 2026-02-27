#!/bin/bash

echo "🔍 Verifying Blacklist & Return Analytics Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Source the .env file
source .env

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Supabase credentials not found in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables loaded${NC}"
echo ""

# Check if migration files exist
echo "📁 Checking migration files..."
if [ -f "backend/supabase/migrations/20260227_add_blacklist_and_analytics.sql" ]; then
    echo -e "${GREEN}✓ Blacklist migration file exists${NC}"
else
    echo -e "${RED}❌ Blacklist migration file not found${NC}"
fi

# Check if TypeScript files exist
echo ""
echo "📄 Checking TypeScript files..."

files=(
    "src/pages/admin/CustomerList.tsx"
    "src/pages/admin/AreaAnalytics.tsx"
    "src/types/index.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}❌ $file not found${NC}"
    fi
done

echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Run the migration in Supabase Dashboard:"
echo "   - Go to SQL Editor"
echo "   - Copy content from backend/supabase/migrations/20260227_add_blacklist_and_analytics.sql"
echo "   - Execute the SQL"
echo ""
echo "2. Verify tables created:"
echo "   - Check 'blacklist' table exists"
echo "   - Check 'profiles' table has new columns: return_count, total_returns_value, is_blacklisted"
echo ""
echo "3. Test the features:"
echo "   - Navigate to /admin/customers"
echo "   - Navigate to /admin/area-analytics"
echo "   - Try blacklisting a customer or area"
echo ""
echo -e "${GREEN}✅ Setup verification complete!${NC}"
