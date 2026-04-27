# Academia Link Desktop App - Client Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn
- macOS, Windows, or Linux

---

## Step 1: Download/Transfer the Project

Transfer the entire `Academia-Link-2` folder to the client's machine via:
- USB drive
- Cloud storage (Google Drive, Dropbox, etc.)
- Zip file transfer

---

## Step 2: Install Dependencies

Open terminal/command prompt and run:

```bash
# Navigate to the project folder
cd /path/to/Academia-Link-2

# Install backend dependencies
npm install

# Install frontend dependencies
cd welcome-hub-main
npm install

# Go back to root
cd ..
```

---

## Step 3: Configure Environment

Edit the `.env` file in the root folder (`/path/to/Academia-Link-2/.env`):

```env
# Database (optional for desktop mode - uses JSON files instead)
DATABASE_URL=postgresql://user:pass@localhost:5432/academia

# Session secret (change this to a random string)
SESSION_SECRET=your-secret-key-here-change-this

# AI Configuration (choose ONE)
# Option A: OpenAI
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-openai-key
OPENAI_API_KEY=sk-your-openai-key

# Option B: Local Ollama (free, runs on client's machine)
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Server settings
PORT=5050
NODE_ENV=development
```

### For Local AI (Ollama - Free):
If using Ollama instead of OpenAI:

```bash
# Install Ollama from https://ollama.com
# Then pull the model:
ollama pull llama3.2
```

---

## Step 4: Start the Application

You need to run TWO terminals/windows:

### Terminal 1: Start Backend Server

```bash
cd /path/to/Academia-Link-2
npx tsx -r dotenv/config server/index.ts
```

Wait for: `Server running on port 5050`

### Terminal 2: Start Desktop App

```bash
cd /path/to/Academia-Link-2/welcome-hub-main
npm run desktop:dev
```

The Electron desktop window will open automatically.

---

## Step 5: First Time Setup

1. **Create an account** in the desktop app
2. **Login** with your credentials
3. Start using features:
   - AI Tutor
   - My Courses
   - Quiz Generator
   - Lecture Notes
   - Essay Writer

---

## Data Storage Location

All data is saved locally on the client's machine:

- **macOS/Linux**: `/tmp/academia-data/`
- **Windows**: `C:\tmp\academia-data\`

Files stored:
- `courses.json` - All courses
- `quizzes.json` - All quizzes
- `notes.json` - All lecture notes
- `essays.json` - All essays
- `users-by-email.json` - User accounts
- `users-by-id.json` - User mappings

---

## Troubleshooting

### Port already in use (5050)
```bash
# Find and kill process using port 5050
lsof -i :5050  # macOS/Linux
netstat -ano | findstr :5050  # Windows
```

### Backend won't start
```bash
# Check for errors
cd /path/to/Academia-Link-2
npx tsc --noEmit
```

### Desktop shows "Connection Refused"
1. Make sure backend is running (Terminal 1)
2. Check firewall isn't blocking port 5050
3. Verify `.env` file exists and has correct settings

### AI features not working
- If using OpenAI: Check API key is valid
- If using Ollama: Run `ollama list` to verify model is installed

---

## Production Build (Optional)

To create a standalone executable:

```bash
cd /path/to/Academia-Link-2/welcome-hub-main
npm run desktop:build
```

Output will be in `dist/` folder.

---

## Quick Start Script (Save as `start-app.sh` or `start-app.bat`)

### macOS/Linux (`start-app.sh`):
```bash
#!/bin/bash
cd "$(dirname "$0")"

# Start backend
npx tsx -r dotenv/config server/index.ts &
BACKEND_PID=$!

# Wait for backend
sleep 5

# Start desktop
cd welcome-hub-main
npm run desktop:dev

# Cleanup
kill $BACKEND_PID 2>/dev/null
```

Make executable: `chmod +x start-app.sh`

### Windows (`start-app.bat`):
```batch
@echo off
cd /d "%~dp0"

start cmd /k "npx tsx -r dotenv/config server/index.ts"
timeout /t 5 /nobreak >nul

cd welcome-hub-main
npm run desktop:dev
```

---

## Support

For issues, check:
1. Backend logs in Terminal 1
2. Browser DevTools in desktop app (Ctrl+Shift+I)
3. Data files in `/tmp/academia-data/`
