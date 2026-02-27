#!/bin/bash

# Analytics Setup Verification Script
# This script checks if analytics tracking is properly configured

echo "🔍 Analytics Setup Verification"
echo "================================"
echo ""

# Check if analytics utility exists
if [ -f "src/utils/analytics.ts" ]; then
    echo "✅ Analytics utility file exists"
else
    echo "❌ Analytics utility file missing"
fi

# Check if page tracking hook exists
if [ -f "src/hooks/usePageTracking.tsx" ]; then
    echo "✅ Page tracking hook exists"
else
    echo "❌ Page tracking hook missing"
fi

# Check if analytics page exists
if [ -f "src/pages/admin/Analytics.tsx" ]; then
    echo "✅ Analytics admin page exists"
else
    echo "❌ Analytics admin page missing"
fi

# Check if migration file exists
if [ -f "backend/supabase/migrations/20260227_create_analytics_tables.sql" ]; then
    echo "✅ Analytics migration file exists"
else
    echo "❌ Analytics migration file missing"
fi

echo ""
echo "📝 Checking tracking implementation..."
echo ""

# Check if App.tsx has tracking enabled
if grep -q "usePageTracking" src/App.tsx; then
    echo "✅ Page tracking enabled in App.tsx"
else
    echo "❌ Page tracking not enabled in App.tsx"
fi

# Check if ProductDetail has tracking
if grep -q "trackProductAction" src/pages/ProductDetail.tsx; then
    echo "✅ Product tracking enabled in ProductDetail.tsx"
else
    echo "❌ Product tracking not enabled in ProductDetail.tsx"
fi

# Check if ProductCard has tracking
if grep -q "trackProductAction" src/components/ProductCard.tsx; then
    echo "✅ Product click tracking enabled in ProductCard.tsx"
else
    echo "❌ Product click tracking not enabled in ProductCard.tsx"
fi

# Check if Auth has signup tracking
if grep -q "trackSignup" src/pages/Auth.tsx; then
    echo "✅ Signup tracking enabled in Auth.tsx"
else
    echo "❌ Signup tracking not enabled in Auth.tsx"
fi

echo ""
echo "================================"
echo "✨ Verification Complete!"
echo ""
echo "Next Steps:"
echo "1. Make sure Supabase migrations are applied"
echo "2. Visit your website and browse pages"
echo "3. Click on products and add to cart"
echo "4. Login as admin and check /admin/analytics"
echo ""
