# ═══════════════════════════════════════════════════════════════════════════════
# 📨 MESSAGE APIs — curl commands
# Base URL: http://localhost:3600/api/message
# 🔒 All routes require Authorization header with Bearer token
# ═══════════════════════════════════════════════════════════════════════════════

# 💡 Replace <YOUR_TOKEN> with actual JWT token


# ─────────────────────────────────────────────────────────────────────────────
# 1. SEND TEXT MESSAGE
# POST /api/message
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST http://localhost:3600/api/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "chatId": "CHAT_ID_HERE",
    "content": "Hello bhai! Kya haal hai? 😊",
    "replyTo": null
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 2. SEND TEXT MESSAGE WITH REPLY
# POST /api/message
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST http://localhost:3600/api/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "chatId": "CHAT_ID_HERE",
    "content": "Haan bhai sab badhiya! 🔥",
    "replyTo": "MESSAGE_ID_TO_REPLY"
  }'


# ─────────────────────────────────────────────────────────────────────────────
# 3. SEND FILE/IMAGE/VIDEO MESSAGE
# POST /api/message (multipart/form-data)
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST http://localhost:3600/api/message \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "chatId=CHAT_ID_HERE" \
  -F "content=Check this out! 📎" \
  -F "replyTo=" \
  -F "file=@/path/to/your/image.jpg"


# ─────────────────────────────────────────────────────────────────────────────
# 4. SEND FILE ONLY (no text)
# POST /api/message (multipart/form-data)
# ─────────────────────────────────────────────────────────────────────────────

curl -X POST http://localhost:3600/api/message \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "chatId=CHAT_ID_HERE" \
  -F "file=@/path/to/document.pdf"


# ─────────────────────────────────────────────────────────────────────────────
# 5. GET ALL MESSAGES OF A CHAT (with pagination)
# GET /api/message/:chatId?page=1&limit=50
# ─────────────────────────────────────────────────────────────────────────────

curl -X GET "http://localhost:3600/api/message/CHAT_ID_HERE?page=1&limit=50" \
  -H "Authorization: Bearer <YOUR_TOKEN>"


# ─────────────────────────────────────────────────────────────────────────────
# 6. MARK MESSAGES AS READ
# PUT /api/message/read/:chatId
# ─────────────────────────────────────────────────────────────────────────────

curl -X PUT http://localhost:3600/api/message/read/CHAT_ID_HERE \
  -H "Authorization: Bearer <YOUR_TOKEN>"


# ─────────────────────────────────────────────────────────────────────────────
# 7. DELETE MESSAGE FOR ME
# DELETE /api/message/:messageId
# ─────────────────────────────────────────────────────────────────────────────

curl -X DELETE http://localhost:3600/api/message/MESSAGE_ID_HERE \
  -H "Authorization: Bearer <YOUR_TOKEN>"


# ─────────────────────────────────────────────────────────────────────────────
# 8. DELETE MESSAGE FOR EVERYONE
# DELETE /api/message/everyone/:messageId
# ─────────────────────────────────────────────────────────────────────────────

curl -X DELETE http://localhost:3600/api/message/everyone/MESSAGE_ID_HERE \
  -H "Authorization: Bearer <YOUR_TOKEN>"
