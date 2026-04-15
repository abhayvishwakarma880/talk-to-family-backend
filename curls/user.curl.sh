# ═══════════════════════════════════════════════════════════════════════════════
# 👤 USER APIs — curl commands
# Base URL: http://localhost:3600/api/user
# 🔒 All routes require Authorization header with Bearer token
# ═══════════════════════════════════════════════════════════════════════════════

# 💡 Replace <YOUR_TOKEN> with actual JWT token from login/register response


# ─────────────────────────────────────────────────────────────────────────────
# 1. GET MY PROFILE
# GET /api/user/profile
# ─────────────────────────────────────────────────────────────────────────────

curl -X GET http://localhost:3600/api/user/profile \
  -H "Authorization: Bearer <YOUR_TOKEN>"


# ─────────────────────────────────────────────────────────────────────────────
# 2. UPDATE PROFILE (name, about, email)
# PUT /api/user/profile
# ─────────────────────────────────────────────────────────────────────────────

curl -X PUT http://localhost:3600/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Abhay Vishwakarma",
    "about": "Hey there! I am using TalkToFamily 🚀",
    "email": "abhay@example.com"
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 3. UPDATE AVATAR (profile picture upload)
# PUT /api/user/avatar
# Content-Type: multipart/form-data
# ─────────────────────────────────────────────────────────────────────────────

curl -X PUT http://localhost:3600/api/user/avatar \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "file=@/path/to/your/image.jpg"


# ─────────────────────────────────────────────────────────────────────────────
# 4. REMOVE AVATAR
# DELETE /api/user/avatar
# ─────────────────────────────────────────────────────────────────────────────

curl -X DELETE http://localhost:3600/api/user/avatar \
  -H "Authorization: Bearer <YOUR_TOKEN>"


# ─────────────────────────────────────────────────────────────────────────────
# 5. CHANGE PASSWORD
# PUT /api/user/change-password
# ─────────────────────────────────────────────────────────────────────────────

curl -X PUT http://localhost:3600/api/user/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "oldPassword": "Test@123",
    "newPassword": "NewPass@456"
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 6. UPDATE PRIVACY SETTINGS
# PUT /api/user/privacy
# ─────────────────────────────────────────────────────────────────────────────

curl -X PUT http://localhost:3600/api/user/privacy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "lastSeen": "everyone",
    "profilePhoto": "contacts",
    "about": "everyone",
    "status": "contacts",
    "readReceipts": true,
    "groups": "everyone"
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 7. DELETE ACCOUNT (soft delete)
# DELETE /api/user/account
# ─────────────────────────────────────────────────────────────────────────────

curl -X DELETE http://localhost:3600/api/user/account \
  -H "Authorization: Bearer <YOUR_TOKEN>"
