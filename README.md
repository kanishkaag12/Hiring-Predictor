# 🎯 Hiring Predictor

An AI-powered hiring assistant that uses machine learning to predict candidate fit for job roles, parse resumes intelligently, and provide data-driven hiring insights.

## ✨ Features

- **Resume Parsing** - Automatically extract skills, education, experience, and project information from PDF and DOCX resumes
- **Role Prediction** - ML-powered predictions on candidate fit for specific job roles with accuracy scoring
- **What-If Simulator** - Explore hypothetical scenarios to understand how changes affect hiring predictions
- **Job Matching** - Intelligent job recommendations based on candidate skills and experience
- **Authentication** - Secure user authentication with OAuth and email-based sign-in
- **Dashboard** - Comprehensive analytics and visualization of hiring trends and candidate data
- **Resume Analysis** - Detailed candidate assessments with skill recommendations

## 🛠 Tech Stack

### Frontend
- **React** 18.3.1 - UI framework
- **Vite** 7.1.9 - Build tool and dev server
- **TypeScript** 5.6.3 - Type-safe development
- **Radix UI** - Accessible component library
- **TailwindCSS** 4.1.14 - Utility-first styling

### Backend
- **Node.js/Express** - Server runtime and web framework
- **TypeScript** 5.6.3 - Type-safe backend development
- **Drizzle ORM** 0.39.3 - Type-safe database ORM
- **PostgreSQL** - Primary database (via Neon)
- **Google Generative AI** 0.24.1 - AI-powered analysis and predictions
- **Passport.js** - Authentication middleware

### Additional Tools
- **Multer** - File upload handling
- **Resend** - Email service for password resets
- **Docker** - Containerization
- **Vercel** - Deployment platform

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** version 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**
- **Python** 3.8 or higher ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/downloads))

### Required Accounts & Services
- **PostgreSQL Database** - Get a free database from [Neon](https://neon.tech/) (recommended) or use local PostgreSQL
- **Google Cloud Console** - For Google OAuth and Gemini AI API ([Console](https://console.cloud.google.com/))
- **GitHub Developer Settings** - For GitHub OAuth (optional) ([Settings](https://github.com/settings/developers))
- **Resend Account** - For password reset emails ([Sign up](https://resend.com/))

---

## 🚀 Complete Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/Hiring-Predictor.git
cd Hiring-Predictor
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

This will install all required packages including:
- React, Express, TypeScript
- Drizzle ORM, PostgreSQL drivers
- Passport.js for authentication
- Google Generative AI SDK
- All UI components and utilities

**Expected time:** 2-5 minutes

### Step 3: Set Up Python Virtual Environment

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

You should see `(.venv)` prefix in your terminal prompt.

### Step 4: Install Python Dependencies

With the virtual environment activated:

```bash
pip install -r scripts/resume-parser/resume_parser_requirements.txt
```

This installs:
- `pdfplumber` - For parsing PDF resumes
- `python-docx` - For parsing DOCX resumes

### Step 5: Set Up Environment Variables

1. **Copy the example file:**

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

2. **Edit `.env` file with your credentials:**

```env
# Database (Required)
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Google OAuth (Required for login)
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Session Secret (Required - generate a random string)
SESSION_SECRET=your_super_secret_random_string_min_32_chars

# Email Configuration (Required for password reset)
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=465
EMAIL_USER=resend
EMAIL_PASS=re_YourResendAPIKey
EMAIL_FROM=onboarding@resend.dev

# Base URL (Update for production)
APP_BASE_URL=http://localhost:5000
NODE_ENV=development
PORT=3001
```

### Step 6: Get Required API Keys

#### 6.1 PostgreSQL Database (Neon - Recommended)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Paste it as `DATABASE_URL` in `.env`

**Format:** `postgresql://user:password@host.neon.tech/database?sslmode=require`

#### 6.2 Google OAuth & Gemini AI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. **Enable APIs:**
   - Google+ API (for OAuth)
   - Generative Language API (for Gemini AI)
4. **Create OAuth 2.0 Credentials:**
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
   - Copy Client ID and Client Secret to `.env`

#### 6.3 Resend API Key (Email Service)

1. Go to [Resend](https://resend.com/)
2. Sign up and verify your email
3. Go to API Keys → Create API Key
4. Copy the key (starts with `re_`)
5. Paste as `EMAIL_PASS` in `.env`

#### 6.4 Session Secret

Generate a secure random string (32+ characters):

**Windows (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**macOS/Linux:**
```bash
openssl rand -base64 32
```

### Step 7: Set Up Database Schema

Run database migrations to create all necessary tables:

```bash
npm run db:push
npm run db:migrate
```

This creates tables for:
- Users and authentication
- Jobs and applications
- Resumes and parsed data
- Predictions and analytics

### Step 8: Verify Installation

Check for any TypeScript errors:

```bash
npm run check
```

### Step 9: Start Development Server

```bash
npm run dev
```

The application will start at:
- **Frontend:** http://localhost:5000
- **Backend API:** http://localhost:3001

You should see:
```
✓ Vite dev server running
✓ Express server listening on port 3001
✓ Database connected
```

---

## 🎯 Quick Start Commands

```bash
# Clone and navigate
git clone <repository-url>
cd Hiring-Predictor

# Install Node.js dependencies
npm install

# Set up Python environment
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate    # macOS/Linux

# Install Python dependencies
pip install -r scripts/resume-parser/resume_parser_requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
npm run db:push
npm run db:migrate

# Start development
npm run dev
```

---

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start full-stack development server
npm run dev:client       # Start client-only (Vite on port 5000)

# Database
npm run db:push          # Push schema changes to database
npm run db:migrate       # Run database migrations
npm run migrate          # Alias for db:migrate

# Building & Production
npm run build            # Build for production
npm start                # Run production build
npm run check            # Run TypeScript type checking

# Testing
npm run test:ingest      # Test job ingestion endpoint
```

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "npm install" fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json  # macOS/Linux
Remove-Item -Recurse -Force node_modules, package-lock.json  # Windows

# Reinstall
npm install
```

### Issue 2: Python virtual environment activation fails

**Windows PowerShell Error:**
```
cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 3: Database connection fails

**Symptoms:**
- "Connection refused" error
- "Invalid connection string"

**Solutions:**
1. Verify `DATABASE_URL` format in `.env`:
   ```
   postgresql://user:password@host/database?sslmode=require
   ```
2. Test connection:
   ```bash
   npm run db:push
   ```
3. Check Neon dashboard for database status

### Issue 4: Port already in use

**Error:**
```
EADDRINUSE: address already in use :::3001
```

**Solution:**

**Windows:**
```powershell
# Find process using port 3001
netstat -ano | findstr :3001
# Kill process (replace PID)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
```

### Issue 5: Python module not found

**Error:**
```
ModuleNotFoundError: No module named 'pdfplumber'
```

**Solution:**
```bash
# Activate virtual environment first
.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate    # macOS/Linux

# Reinstall dependencies
pip install -r scripts/resume-parser/resume_parser_requirements.txt
```

### Issue 6: OAuth redirect URI mismatch

**Error:**
```
redirect_uri_mismatch
```

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Credentials → Your OAuth 2.0 Client
3. Add authorized redirect URIs:
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`

### Issue 7: "npm run dev" exits with code 1

**Common causes:**
- Missing `.env` file
- Invalid environment variables
- Database connection issues
- TypeScript compilation errors

**Solution:**
```bash
# Check for TypeScript errors
npm run check

# Verify .env exists and is properly configured
cat .env  # macOS/Linux
Get-Content .env  # Windows

# Check logs for specific errors
```

---

## 🌍 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret | `GOCSPX-xxxxx` |
| `GITHUB_CLIENT_ID` | ⚠️ | GitHub OAuth Client ID (optional) | `Iv1.xxxxx` |
| `GITHUB_CLIENT_SECRET` | ⚠️ | GitHub OAuth Client Secret (optional) | `xxxxx` |
| `SESSION_SECRET` | ✅ | Random string for sessions (32+ chars) | `your_random_string_here` |
| `EMAIL_HOST` | ✅ | SMTP host for emails | `smtp.resend.com` |
| `EMAIL_PORT` | ✅ | SMTP port | `465` |
| `EMAIL_USER` | ✅ | SMTP username | `resend` |
| `EMAIL_PASS` | ✅ | Resend API key | `re_xxxxx` |
| `EMAIL_FROM` | ✅ | Sender email address | `onboarding@resend.dev` |
| `APP_BASE_URL` | ✅ | Application base URL | `http://localhost:5000` |
| `NODE_ENV` | ⚠️ | Environment mode | `development` or `production` |
| `PORT` | ⚠️ | Backend server port | `3001` |
| `USE_PG_SESSION` | ⚠️ | Use PostgreSQL for sessions | `false` |

✅ = Required | ⚠️ = Optional

---

## 🎯 First-Time Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.8+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] `npm install` completed successfully
- [ ] Python virtual environment created
- [ ] Python dependencies installed
- [ ] `.env` file created from `.env.example`
- [ ] Database URL configured in `.env`
- [ ] Google OAuth credentials added to `.env`
- [ ] Resend API key added to `.env`
- [ ] Session secret generated and added to `.env`
- [ ] Database migrations run (`npm run db:migrate`)
- [ ] `npm run dev` starts without errors
- [ ] Application accessible at http://localhost:5000

---

## 📁 Project Structure

### `/client` - Frontend Application
- React components and pages
- Dashboard and visualization components
- Authentication UI
- Job card and filter components
- Real-time What-If Simulator UI

### `/server` - Backend Application
- Express API routes
- Authentication logic
- Resume parsing service
- ML inference engine
- Job matching and prediction services
- Email and storage services

### `/migrations` - Database Schema
- Drizzle ORM migration files
- Schema definitions and updates

### `/python` - Machine Learning
- Resume parser implementation
- AI models and inference logic

### `/scripts` - Utility Scripts
- Resume parser utilities
- Database migration scripts
- Test scripts

### `/project-docs` - Documentation
- Implementation guides
- Architecture documentation
- Setup instructions
- Troubleshooting guides

---

## 🔑 Key Modules

### Resume Parsing
Extract structured data from resumes:
```bash
python resume_parser.py path/to/resume.pdf
```

Outputs: skills, education, experience duration, projects, completeness score

### AI Services
- **AI Simulation Service** - Generate hypothetical scenarios
- **Probability Engine** - Calculate candidate fit probabilities
- **Skill Role Mapping** - Map skills to job roles
- **Semantic Embeddings** - Advanced skill and role analysis

### Job Matching
- Semantic similarity matching
- Skill requirement analysis
- Experience duration validation
- What-If simulation for hiring scenarios

## 🗄️ Database Schema

Key tables:
- `users` - User accounts and profiles
- `jobs` - Job listings
- `candidates` - Candidate information
- `resumes` - Parsed resume data
- `predictions` - ML prediction results
- `applications` - Job applications

See migrations for complete schema details.

## 🔐 Authentication

- Email/password authentication
- OAuth provider support (Google, GitHub, etc.)
- Password reset functionality
- Session management

## 🐳 Docker Support

Build and run with Docker:
```bash
docker-compose up
```

## 📊 Performance

- Optimized resume parsing with multi-format support
- Efficient ML inference with caching
- Database query optimization with Drizzle ORM
- Real-time dashboard updates with React Query

## 📚 Documentation

Comprehensive documentation available in `/project-docs`:
- [GETTING_STARTED.md](project-docs/GETTING_STARTED.md) - Detailed setup guide
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Complete project structure
- [AI_SYSTEMS_OVERVIEW.md](project-docs/AI_SYSTEMS_OVERVIEW.md) - AI architecture
- [DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md) - Database configuration
- Additional guides for specific features

---

## 🐛 Additional Support Resources

**Database Connection Issues**
- Verify PostgreSQL is running
- Check `DATABASE_URL` format in `.env`
- See [DATABASE_TROUBLESHOOTING.md](project-docs/DATABASE_TROUBLESHOOTING.md)

**Resume Parsing Errors**
- Ensure Python virtual environment is activated
- Check Python dependencies are installed
- Verify resume file format (PDF or DOCX supported)
- Check file path and permissions

**Build/Compilation Issues**
- Run `npm run check` to see TypeScript errors
- Delete `node_modules` and reinstall: `npm install`
- Clear any build caches
- Verify Node.js version is 18+

---

## 🚀 Deployment

### Vercel Deployment
```bash
npm run build
vercel deploy
```

### Docker Deployment
```bash
docker-compose up -d
```

See [DEPLOYMENT_GUIDE.md](project-docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📝 License

MIT License

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Submit a pull request

---

## 📞 Support & Contact

For issues and questions:
- 📖 Check the [documentation](project-docs/)
- 🐛 Review existing GitHub issues
- ✉️ Create a new issue with detailed information
- 📧 Contact the development team

---

## 🎓 Learning Resources

- [Resume Parser Documentation](project-docs/GETTING_STARTED.md) - How resume parsing works
- [AI Systems Overview](project-docs/AI_SYSTEMS_OVERVIEW.md) - AI architecture and models
- [Implementation Guides](project-docs/implementation-guides/) - Feature implementation details
- [Troubleshooting Guides](project-docs/) - Common issues and solutions

---

## 👥 Team Setup Guide

**For Team Members:**

1. **Get access to shared resources:**
   - Database credentials (from team lead)
   - Google OAuth credentials (from Google Cloud Console admin)
   - Resend API key (from account admin)

2. **Follow installation steps 1-4** (Clone, npm install, Python setup)

3. **Request `.env` file** from team lead or copy values from team documentation

4. **Run migrations:** `npm run db:migrate`

5. **Start development:** `npm run dev`

6. **Verify setup:**
   - Can access http://localhost:5000
   - Can log in with Google OAuth
   - Database queries work

---

**Made with ❤️ for smarter hiring decisions**
