# Kangaru Scholar AI — Deployment Guide

**Stack:** Node.js + Express + MongoDB Atlas + Mongoose + Ollama (self-hosted)

This guide covers how to deploy the Kangaru Scholar AI platform on **Render** with **MongoDB Atlas** as the database, powered by free, open-source AI models via **Ollama**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Kangaru Scholar AI                    │
├─────────────────────────────────────────────────────────┤
│  Frontend (React + Tailwind)  →  Served by Express      │
│  Backend (Express + tRPC)     →  API routes             │
│  Database (MongoDB Atlas)     →  Mongoose ORM           │
│  AI Models (Ollama)           →  Local or remote server  │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Component | Requirement |
|-----------|-------------|
| Node.js | v18+ |
| MongoDB Atlas | Free tier (M0) or higher |
| Ollama | Installed on a server with sufficient RAM |
| Domain (optional) | For production deployment |

---

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and create a free account
2. Create a new **Shared Cluster** (M0 Free Tier is sufficient)
3. Create a **Database User** with Read/Write permissions
4. Add your IP address to the **Network Access** whitelist (or use `0.0.0.0/0` for development)
5. Click **Connect** → **Connect your application**
6. Copy the connection string, which looks like:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kangaru-scholar?retryWrites=true&w=majority
```

**Important:** Replace `<password>` with your actual database user password.

---

## Step 2: Set Up Ollama (AI Models)

### Option A: Ollama on the Same Server

If your server has at least **8GB RAM** and an Nvidia GPU:

```bash
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull llama3.2:1b
ollama pull qwen2.5:1.5b

# Verify
ollama list
```

### Option B: Ollama on a Separate Server (Recommended for Render)

Since Render's free tier doesn't support GPU workloads, run Ollama on a separate VPS:

```bash
# On your VPS (e.g., DigitalOcean, Linode, Vultr)
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull llama3.2:1b
ollama pull qwen2.5:1.5b

# Start Ollama to listen on all interfaces
OLLAMA_HOST=0.0.0.0 ollama serve
```

Then point your Render app to it via `OLLAMA_BASE_URL`:

```
OLLAMA_BASE_URL=http://<your-vps-ip>:11434
```

### Option C: Use Groq API (No Self-Hosting)

If you don't want to manage Ollama at all, use the free Groq API:

1. Get an API key from [https://console.groq.com/](https://console.groq.com/)
2. Set these environment variables:

```
OLLAMA_BASE_URL=https://api.groq.com/openai/v1
OLLAMA_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```

Then change the model names in `server/routers.ts`:

```ts
const GUEST_MODEL = "llama-3.3-70b-versatile";
const STUDENT_MODEL = "llama-3.3-70b-versatile";
const TEACHER_MODEL = "llama-3.3-70b-versatile";
```

---

## Step 3: Environment Variables

Create a `.env` file (or set these in your hosting platform's environment variables):

```env
# ─── Database (MongoDB Atlas) ───
MONGO_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kangaru-scholar?retryWrites=true&w=majority

# ─── AI Models (Ollama) ───
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_KEY=

# ─── Manus OAuth (keep these for authentication) ───
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=<your-jwt-secret>
OWNER_OPEN_ID=<your-open-id>
VITE_APP_ID=<your-app-id>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<your-frontend-forge-key>
VITE_APP_TITLE=Kangaru Scholar AI
VITE_APP_LOGO=

# ─── Production ───
NODE_ENV=production
```

---

## Step 4: Deploy to Render

### 4.1 Create a Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `kangaru-scholar-ai` |
| **Region** | Closest to your users |
| **Branch** | `main` |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Instance Type** | Free (or Starter for better performance) |
| **Node Version** | 18+ |

### 4.2 Set Environment Variables on Render

In Render's dashboard → your web service → **Environment** tab, add:

```
MONGO_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kangaru-scholar
OLLAMA_BASE_URL=http://<your-vps-ip>:11434
OLLAMA_API_KEY=
JWT_SECRET=<your-jwt-secret>
OWNER_OPEN_ID=<your-open-id>
VITE_APP_ID=<your-app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<your-frontend-forge-key>
VITE_APP_TITLE=Kangaru Scholar AI
NODE_ENV=production
```

### 4.3 Deploy

Click **Create Web Service**. Render will build and deploy automatically.

---

## Step 5: Production Deployment with Docker (Alternative)

If you prefer Docker for more control:

### 5.1 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build frontend
RUN pnpm build

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
```

### 5.2 docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGO_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kangaru-scholar
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_API_KEY=
      - JWT_SECRET=your-jwt-secret
      - OWNER_OPEN_ID=your-open-id
      - VITE_APP_ID=your-app-id
      - OAUTH_SERVER_URL=https://api.manus.im
      - VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
      - VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key
      - VITE_APP_TITLE=Kangaru Scholar AI
      - NODE_ENV=production
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

volumes:
  ollama_data:
```

### 5.3 Build and Run

```bash
docker compose up -d
```

---

## Step 6: Nginx Reverse Proxy (Optional)

If you're self-hosting with a custom domain:

```nginx
server {
    listen 80;
    server_name kangaru-scholar.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable with SSL:

```bash
sudo ln -s /etc/nginx/sites-available/kangaru-scholar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d kangaru-scholar.example.com
```

---

## Step 7: Integration with Your Main Website

Since both your main website and this AI module use **MongoDB Atlas + Mongoose**, integration is straightforward.

### Shared Authentication

You can share the same MongoDB cluster and even the same `users` collection:

```ts
// In your main website, import the same models:
import { User, ChatHistory } from "./server/models";
```

### API Integration

The AI module exposes tRPC endpoints that your main site can call:

```ts
// From your main website's backend:
const response = await fetch(
  "https://kangaru-scholar.example.com/api/trpc/chat.guestChat",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: {
        message: "Tell me about the school",
        conversationHistory: [],
      },
    }),
  }
);
```

### Embedded iframe

You can also embed the AI portal as an iframe in your main site:

```html
<iframe
  src="https://kangaru-scholar.example.com/guest-chat"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
```

---

## Troubleshooting

### MongoDB Connection Issues

```
# Error: "Cannot get user: MongoDB not connected"
# Solution: Check MONGO_URL in environment variables
# Make sure the IP is whitelisted in MongoDB Atlas Network Access
```

### Ollama Connection Issues

```
# Error: "LLM service unavailable"
# Solution: Verify OLLAMA_BASE_URL is reachable
# Test with: curl http://<ollama-host>:11434/api/tags
```

### Model Loading Time

```
# First request may be slow as Ollama loads the model into memory
# Solution: Send a warm-up request after deployment:
curl -X POST http://localhost:11434/api/generate \
  -d '{"model":"llama3.2:1b","prompt":"hello"}'
```

### Memory Issues on Render Free Tier

```
# Render free tier has 512MB RAM — MongoDB Atlas runs in the cloud
# but if you also run Ollama on the same service, it will crash
# Solution: Run Ollama on a separate server (VPS) or use Groq API
```

---

## Model Selection Guide

| Model | RAM Required | Quality | Speed | Best For |
|-------|-------------|---------|-------|----------|
| llama3.2:1b | 2 GB | Basic | Very Fast | Guest chatbot, simple Q&A |
| qwen2.5:1.5b | 2.5 GB | Good | Fast | Student revision |
| llama3.2:1b:8b | 8 GB | Excellent | Moderate | All portals (recommended) |
| qwen2.5:14b | 16 GB | Excellent | Slower | Teacher tools, complex reasoning |
| mistral:7b | 6 GB | Very Good | Fast | General purpose alternative |

---

## Security Notes

1. **Never expose Ollama directly to the internet** — it has no authentication by default
2. Use a firewall to restrict port 11434 to localhost only:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw deny 11434
   ```
3. Set a strong `JWT_SECRET` (at least 32 random characters)
4. Enable HTTPS with Let's Encrypt
5. Keep Ollama and models updated: `ollama pull <model>` periodically
6. Restrict MongoDB Atlas network access to only your Render/production IPs

---

## Customization

### Changing the AI model

Edit `server/routers.ts` to change which models are used:

```typescript
const GUEST_MODEL = "llama3.2:1b";     // Change to any Ollama model
const STUDENT_MODEL = "qwen2.5:1.5b";   // Change to any Ollama model
const TEACHER_MODEL = "qwen2.5:1.5b";   // Change to any Ollama model
```

### Changing the school information

Edit the system prompts in `server/routers.ts`:
- `GUEST_SYSTEM_PROMPT` — School facts and contact info
- `STUDENT_SYSTEM_PROMPT` — Revision assistant behavior
- `TEACHER_LESSON_SYSTEM_PROMPT` — Lesson plan format
- `TEACHER_TIMETABLE_SYSTEM_PROMPT` — Timetable format

### Changing the theme

Edit `client/src/index.css` to modify colors, fonts, and branding.
