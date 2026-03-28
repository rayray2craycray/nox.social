#!/bin/bash

# Test script for critical security fixes

echo "=== Testing Critical Security Fixes ==="
echo ""

# Valid token from env
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZjNTg5YjA1YmNjYjNjNjFiYjNhY2QiLCJlbWFpbCI6InNtb2tldGVzdDJAZXhhbXBsZS5jb20iLCJpYXQiOjE3Njg3MDgyNTcsImV4cCI6MTc2OTMxMzA1N30.DNZ_d8aHJjo44moxMlfQAnwblgbba-q8egD_NF4iLQ0"

echo "1. Testing Authentication (no token - should fail)"
curl -s -X POST http://localhost:3000/api/business/register \
  -H "Content-Type: application/json" \
  -d '{"venueName":"Test","businessEmail":"test@example.com","location":{"address":"123 St","city":"City","state":"ST"},"businessType":"BAR"}' \
  | python3 -m json.tool
echo ""

echo "2. Testing Email Validation (invalid email - should fail)"
curl -s -X POST http://localhost:3000/api/business/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"venueName":"Test Venue","businessEmail":"not-an-email","location":{"address":"123 St","city":"City","state":"ST"},"businessType":"BAR"}' \
  | python3 -m json.tool
echo ""

echo "3. Testing Venue Name Validation (too short - should fail)"
curl -s -X POST http://localhost:3000/api/business/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"venueName":"T","businessEmail":"test@example.com","location":{"address":"123 St","city":"City","state":"ST"},"businessType":"BAR"}' \
  | python3 -m json.tool
echo ""

echo "4. Testing Missing Required Fields (should fail)"
curl -s -X POST http://localhost:3000/api/business/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"venueName":"Test Venue"}' \
  | python3 -m json.tool
echo ""

echo "5. Testing Rate Limiting (attempt 4 registrations rapidly)"
for i in {1..4}; do
  echo "  Attempt $i:"
  curl -s -X POST http://localhost:3000/api/business/register \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{\"venueName\":\"Test $i\",\"businessEmail\":\"test$i@example.com\",\"location\":{\"address\":\"123 St\",\"city\":\"City\",\"state\":\"ST\"},\"businessType\":\"BAR\"}" \
    | python3 -m json.tool | head -5
  sleep 1
done
echo ""

echo "6. Checking logs were created"
ls -lh /Users/rayan/rork-nightlife-app/backend/logs/
echo ""

echo "=== Test Complete ==="
