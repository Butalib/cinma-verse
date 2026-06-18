@echo off
setlocal enabledelayedexpansion

echo === PAYLOAD 1 ===
echo {
echo   "email": "test1@example.com",
echo   "password": "Password1",
echo   "firstName": "John",
echo   "lastName": "Doe",
echo   "dateOfBirth": "2004-12-19"
echo }

echo.
echo === RESPONSE 1 ===

REM Test payload 1
curl -i -X POST https://cinmaverse-api.tryasp.net/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"test1@example.com\", \"password\": \"Password1\", \"firstName\": \"John\", \"lastName\": \"Doe\", \"dateOfBirth\": \"2004-12-19\"}"

echo.
echo.
echo === PAYLOAD 2 ===
echo {
echo   "email": "test2@example.com",
echo   "password": "Aa1!aaaa",
echo   "firstName": "Jane",
echo   "lastName": "Smith",
echo   "dateOfBirth": "2004-12-19T00:00:00Z"
echo }

echo.
echo === RESPONSE 2 ===

REM Test payload 2
curl -i -X POST https://cinmaverse-api.tryasp.net/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"test2@example.com\", \"password\": \"Aa1!aaaa\", \"firstName\": \"Jane\", \"lastName\": \"Smith\", \"dateOfBirth\": \"2004-12-19T00:00:00Z\"}"
