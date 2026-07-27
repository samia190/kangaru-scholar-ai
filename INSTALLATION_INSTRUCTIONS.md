# Scholar AI Backend - Installation Instructions

## Files to Update/Create

### 1. Install CORS Package
Run this command in your Scholar AI project root:

```bash
npm install cors
```

### 2. Replace File: `server/_core/context.ts`
- **Location:** `server/_core/context.ts`
- **Action:** Replace the entire content with the provided `server/_core/context.ts` file
- **Note:** This removes Manus OAuth and instead extracts JWT from Authorization header

### 3. Replace File: `server/_core/trpc.ts`
- **Location:** `server/_core/trpc.ts`
- **Action:** Replace the entire content with the provided `server/_core/trpc.ts` file
- **Note:** This implements role-based access control (student, teacher, admin, etc.)

### 4. Replace File: `server/_core/index.ts`
- **Location:** `server/_core/index.ts`
- **Action:** Replace the entire content with the provided `server/_core/index.ts` file
- **Note:** This adds CORS middleware and removes OAuth routes

### 5. Replace File: `server/routers.ts`
- **Location:** `server/routers.ts`
- **Action:** Replace the entire content with the provided `server/routers.ts` file
- **Note:** This updates procedures to use role-based access instead of Manus OAuth

### 6. Update File: `.env`
- **Location:** `.env` (in your project root)
- **Action:** Update with the following changes:

```env
# ─── REMOVE THESE LINES (no longer needed) ───
# VITE_APP_ID=...
# OAUTH_SERVER_URL=...

# ─── ADD/UPDATE THESE LINES ───
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://kangarugirls.sc.ke

# Keep your existing variables:
DATABASE_URL=your_database_url
NODE_ENV=production
PORT=3000
OLLAMA_BASE_URL=http://localhost:11434
```

## File Structure After Installation

```
scholar-ai-project/
├── server/
│   ├── _core/
│   │   ├── context.ts                 (REPLACED)
│   │   ├── trpc.ts                    (REPLACED)
│   │   └── index.ts                   (REPLACED)
│   ├── routers.ts                     (REPLACED)
│   └── ...
├── .env                               (UPDATED)
├── package.json                       (UPDATED - cors added)
└── ...
```

## Important Changes Summary

### What Changed:
1. **Removed Manus OAuth** - No more internal authentication
2. **Added JWT extraction** - Extracts JWT from Authorization header
3. **Added role-based access** - Different procedures for different roles
4. **Added CORS** - Allows requests from your website domain
5. **Updated database layer** - Uses website user IDs instead of Manus user IDs

### What Stayed the Same:
- Ollama LLM integration
- Chat history persistence
- System prompts for guest/student/teacher
- All existing procedures (guestChat, studentRevision, etc.)

## Testing

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Test guest chat (no auth needed):**
   ```bash
   curl -X POST http://localhost:3000/api/trpc/chat.guestChat \
     -H "Content-Type: application/json" \
     -d '{"json":{"message":"Hello","conversationHistory":[]}}'
   ```

4. **Test student chat (with JWT):**
   ```bash
   # First, get a JWT token from your website
   # Then:
   curl -X POST http://localhost:3000/api/trpc/chat.studentRevision \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"json":{"message":"Explain photosynthesis","curriculum":"8-4-4","conversationHistory":[]}}'
   ```

## Deployment to Render

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: Remove Manus OAuth, integrate with website role-based auth"
   ```

2. **Push to GitHub:**
   ```bash
   git push
   ```

3. **Render will automatically:**
   - Detect the changes
   - Install new dependencies (cors)
   - Restart the server
   - Deploy the updated backend

4. **Verify deployment:**
   - Check Render dashboard for successful deployment
   - Test the API from your website

## Troubleshooting

### Issue: "Cannot find module 'cors'"
- **Solution:** Run `npm install cors` and commit package-lock.json

### Issue: "CORS error" from website
- **Solution:** Verify your website URL is in `ALLOWED_ORIGINS` in `.env`

### Issue: "Authentication required" error
- **Solution:** Verify JWT token is being sent in Authorization header from website

### Issue: "This feature requires student role"
- **Solution:** Verify the JWT token has the correct role in its payload

### Issue: Ollama not responding
- **Solution:** Verify Ollama is running and models are pulled on the Scholar AI server

## Environment Variables Reference

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Yes | MongoDB connection string |
| `NODE_ENV` | Yes | Set to `production` for Render |
| `PORT` | Yes | Server port (usually 3000) |
| `OLLAMA_BASE_URL` | Yes | Ollama server URL |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed domains |

## Next Steps

1. Replace all files as instructed above
2. Update `.env` with correct values
3. Commit and push to GitHub
4. Wait for Render to auto-deploy
5. Test from your website
6. Monitor logs for any errors

## Support

If you encounter issues:
1. Check Render logs for error messages
2. Verify `.env` variables are correct
3. Check that Ollama is running
4. Verify CORS configuration
5. Check browser console for frontend errors
