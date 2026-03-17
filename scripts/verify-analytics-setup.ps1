# Analytics Setup Verification Script (PowerShell)
# This script checks if analytics tracking is properly configured

Write-Host "🔍 Analytics Setup Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check if analytics utility exists
if (Test-Path "src/utils/analytics.ts") {
    Write-Host "✅ Analytics utility file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Analytics utility file missing" -ForegroundColor Red
    $allGood = $false
}

# Check if page tracking hook exists
if (Test-Path "src/hooks/usePageTracking.tsx") {
    Write-Host "✅ Page tracking hook exists" -ForegroundColor Green
} else {
    Write-Host "❌ Page tracking hook missing" -ForegroundColor Red
    $allGood = $false
}

# Check if analytics page exists
if (Test-Path "src/pages/admin/Analytics.tsx") {
    Write-Host "✅ Analytics admin page exists" -ForegroundColor Green
} else {
    Write-Host "❌ Analytics admin page missing" -ForegroundColor Red
    $allGood = $false
}

# Check if migration file exists
if (Test-Path "backend/supabase/migrations/20260227_create_analytics_tables.sql") {
    Write-Host "✅ Analytics migration file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Analytics migration file missing" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "📝 Checking tracking implementation..." -ForegroundColor Cyan
Write-Host ""

# Check if App.tsx has tracking enabled
$appContent = Get-Content "src/App.tsx" -Raw
if ($appContent -match "usePageTracking") {
    Write-Host "✅ Page tracking enabled in App.tsx" -ForegroundColor Green
} else {
    Write-Host "❌ Page tracking not enabled in App.tsx" -ForegroundColor Red
    $allGood = $false
}

# Check if ProductDetail has tracking
$productDetailContent = Get-Content "src/pages/ProductDetail.tsx" -Raw
if ($productDetailContent -match "trackProductAction") {
    Write-Host "✅ Product tracking enabled in ProductDetail.tsx" -ForegroundColor Green
} else {
    Write-Host "❌ Product tracking not enabled in ProductDetail.tsx" -ForegroundColor Red
    $allGood = $false
}

# Check if ProductCard has tracking
$productCardContent = Get-Content "src/components/ProductCard.tsx" -Raw
if ($productCardContent -match "trackProductAction") {
    Write-Host "✅ Product click tracking enabled in ProductCard.tsx" -ForegroundColor Green
} else {
    Write-Host "❌ Product click tracking not enabled in ProductCard.tsx" -ForegroundColor Red
    $allGood = $false
}

# Check if Auth has signup tracking
$authContent = Get-Content "src/pages/Auth.tsx" -Raw
if ($authContent -match "trackSignup") {
    Write-Host "✅ Signup tracking enabled in Auth.tsx" -ForegroundColor Green
} else {
    Write-Host "❌ Signup tracking not enabled in Auth.tsx" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✨ All checks passed! Analytics is properly configured." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some checks failed. Please review the issues above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Make sure Supabase migrations are applied" -ForegroundColor White
Write-Host "2. Visit your website and browse pages" -ForegroundColor White
Write-Host "3. Click on products and add to cart" -ForegroundColor White
Write-Host "4. Login as admin and check /admin/analytics" -ForegroundColor White
Write-Host ""
