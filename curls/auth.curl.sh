# ═══════════════════════════════════════════════════════════════════════════════
# 📲 AUTH APIs — curl commands
# Base URL: https://talk-to-family-backend.onrender.com/api/auth
# ═══════════════════════════════════════════════════════════════════════════════


# ─────────────────────────────────────────────────────────────────────────────
# 1. SEND OTP
# POST /api/auth/send-otp
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST https://talk-to-family-backend.onrender.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210"
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 2. VERIFY OTP
# POST /api/auth/verify-otp
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST https://talk-to-family-backend.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "otp": "123456"
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 3. REGISTER (after OTP verification)
# POST /api/auth/register
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST https://talk-to-family-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "name": "Abhay Vishwakarma",
    "password": "Test@123",
    "email": "abhay@example.com"
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 4. LOGIN (phone + password)
# POST /api/auth/login
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST https://talk-to-family-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "password": "Test@123"
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 5. RESEND OTP
# POST /api/auth/resend-otp
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST https://talk-to-family-backend.onrender.com/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210"
  }'
