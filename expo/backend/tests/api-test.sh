#!/bin/bash

# Rork Nightlife API - End-to-End Test Script
# Tests all major endpoints with real data

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "Rork Nightlife API - E2E Tests"
echo "=================================="
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="${5:-200}"

    echo -n "Testing: $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "=== Health & Info ==="
test_endpoint "Health check" "GET" "$BASE_URL/health"
test_endpoint "API info" "GET" "$BASE_URL/"
echo ""

echo "=== Events Endpoints ==="
test_endpoint "Get events (empty)" "GET" "$BASE_URL/api/events"
test_endpoint "Get events (with filter)" "GET" "$BASE_URL/api/events?status=PUBLISHED"
echo ""

echo "=== Social - Challenges ==="
test_endpoint "Get active challenges" "GET" "$BASE_URL/api/social/challenges/active"
test_endpoint "Get challenges (with venue filter)" "GET" "$BASE_URL/api/social/challenges/active?venueId=test-venue-id"
echo ""

echo "=== Social - Crews ==="
test_endpoint "Get active crews" "GET" "$BASE_URL/api/social/crews/discover/active"
test_endpoint "Search crews (no results)" "GET" "$BASE_URL/api/social/crews/search?q=test"
echo ""

echo "=== Chat Endpoints ==="
test_endpoint "Get channel messages" "GET" "$BASE_URL/api/chat/channels/test-channel/messages"
test_endpoint "Send message (401 expected - auth required)" "POST" "$BASE_URL/api/chat/channels/test-channel/messages" '{"content":"test"}' 401
echo ""

echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
