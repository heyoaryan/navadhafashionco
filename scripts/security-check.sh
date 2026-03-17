#!/bin/bash

# Security Check Script for Navadha Fashion Co
# Run this before deployment

echo "🔒 Running Security Checks..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: Environment variables
echo "1. Checking environment variables..."
if [ -f .env ]; then
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
        echo -e "${RED}❌ CRITICAL: Service role key found in .env file!${NC}"
        echo "   Remove it immediately - this key should NEVER be in frontend!"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ No service role key in .env${NC}"
    fi
    
    if grep -q "your_supabase_url" .env; then
        echo -e "${YELLOW}⚠ WARNING: Default placeholder values in .env${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ Environment variables configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠ WARNING: .env file not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 2: Dependencies vulnerabilities
echo ""
echo "2. Checking for vulnerable dependencies..."
if command -v npm &> /dev/null; then
    npm audit --audit-level=high > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ No high-severity vulnerabilities found${NC}"
    else
        echo -e "${RED}❌ Vulnerabilities found! Run: npm audit fix${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠ npm not found, skipping dependency check${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 3: Git secrets
echo ""
echo "3. Checking for exposed secrets in git..."
if [ -d .git ]; then
    if git log --all --full-history --source -- .env | grep -q "SUPABASE"; then
        echo -e "${RED}❌ CRITICAL: .env file found in git history!${NC}"
        echo "   Secrets may be exposed. Consider rotating keys."
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ No .env file in git history${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Not a git repository${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 4: HTTPS configuration
echo ""
echo "4. Checking HTTPS configuration..."
if [ -f "vite.config.ts" ]; then
    if grep -q "https:" vite.config.ts; then
        echo -e "${GREEN}✓ HTTPS configured in Vite${NC}"
    else
        echo -e "${YELLOW}⚠ WARNING: HTTPS not configured for development${NC}"
        echo "   Consider adding HTTPS for local development"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Check 5: Security headers
echo ""
echo "5. Checking security utilities..."
if [ -f "src/lib/security.ts" ]; then
    echo -e "${GREEN}✓ Security utilities found${NC}"
else
    echo -e "${RED}❌ Security utilities missing!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Database migrations
echo ""
echo "6. Checking database security migrations..."
if [ -f "backend/supabase/migrations/20260224_complete_security_setup.sql" ]; then
    echo -e "${GREEN}✓ Security migration found${NC}"
else
    echo -e "${RED}❌ Security migration missing!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 7: .gitignore
echo ""
echo "7. Checking .gitignore..."
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        echo -e "${GREEN}✓ .env is in .gitignore${NC}"
    else
        echo -e "${RED}❌ .env not in .gitignore!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ .gitignore file missing!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "================================"
echo "Security Check Summary"
echo "================================"
echo -e "Errors: ${RED}${ERRORS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All security checks passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Security checks passed with warnings${NC}"
    exit 0
else
    echo -e "${RED}❌ Security checks failed! Fix errors before deployment.${NC}"
    exit 1
fi
