# ═══════════════════════════════════════════════════════════════════════════════
# 💬 CHAT APIs — curl commands
# Base URL: https://talk-to-family-backend.onrender.com/api/chat
# 🔒 All routes require Authorization header with Bearer token
# ═══════════════════════════════════════════════════════════════════════════════

# 💡 Replace <YOUR_TOKEN> with actual JWT token


# ─────────────────────────────────────────────────────────────────────────────
# 1. SEARCH USER BY PHONE NUMBER
# GET /api/chat/search?phone=9876543210
# ─────────────────────────────────────────────────────────────────────────────

curl -X GET "https://talk-to-family-backend.onrender.com/api/chat/search?phone=9876543210" \
  -H "Authorization: Bearer <YOUR_TOKEN>"


# ─────────────────────────────────────────────────────────────────────────────
# 2. CREATE OR GET 1-TO-1 CHAT
# POST /api/chat
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST https://talk-to-family-backend.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "receiverId": "RECEIVER_USER_ID_HERE"
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 3. GET ALL MY CHATS (chat list)
# GET /api/chat
# ─────────────────────────────────────────────────────────────────────────────

curl -X GET https://talk-to-family-backend.onrender.com/api/chat \
  -H "Authorization: Bearer <YOUR_TOKEN>"


# ─────────────────────────────────────────────────────────────────────────────
# 4. DELETE CHAT
# DELETE /api/chat/:chatId
# ─────────────────────────────────────────────────────────────────────────────

curl -X DELETE https://talk-to-family-backend.onrender.com/api/chat/CHAT_ID_HERE \
  -H "Authorization: Bearer <YOUR_TOKEN>"
