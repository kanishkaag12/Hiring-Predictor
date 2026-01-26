# Team Setup Guide

## ✅ Code Sync Complete!

Your code has been successfully synced from `C:\Hiring-Predictor\Hiring-Predictor` to `C:\Hiring-Predictor`.

**All team members should now work from: `C:\Hiring-Predictor`**

---

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
cd C:\Hiring-Predictor
npm install
```

### 2. Setup Environment
Ensure `.env` file exists with all required variables:
- Database credentials
- OAuth credentials (Google, GitHub)
- API keys (Gemini, SendGrid)

### 3. Start Development Server
```powershell
npm run dev
```

The app will be available at: **http://localhost:3001**

---

## 📁 Project Structure

```
C:\Hiring-Predictor/
├── client/          # React frontend code
├── server/          # Express backend code
├── shared/          # Shared TypeScript types
├── python/          # Resume parser and ML scripts
├── uploads/         # File uploads storage
├── migrations/      # Database migrations
├── models/          # ML models
├── .env             # Environment variables (DO NOT COMMIT)
└── package.json     # Dependencies
```

---

## 🔧 Important Notes

1. **Always work from `C:\Hiring-Predictor`** (outer folder)
2. The inner `Hiring-Predictor` folder is a duplicate - you can ignore or delete it
3. Run `npm install` after pulling new changes
4. Email service errors during startup are expected if credentials aren't configured

---

## 🛠️ Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |

---

## 🐛 Troubleshooting

### Module Not Found Errors
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

### Server Won't Start
- Check if port 3001 is already in use
- Ensure `.env` file exists
- Verify database connection

### Python Scripts Failing
- Ensure Python virtual environment is activated
- Check `python/resume_parser.py` exists
- Install required Python packages

---

## 📞 Need Help?

Check the documentation files:
- `START_HERE.md` - Getting started guide
- `QUICK_REFERENCE.md` - Quick command reference
- `DOCUMENTATION_INDEX.md` - Complete documentation index

---

**Last Updated:** January 26, 2026
