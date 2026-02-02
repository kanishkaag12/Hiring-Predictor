# 🚀 Hiring Predictor - Complete Setup Guide

This guide walks your team through installing all dependencies needed to run the Hiring Predictor project locally.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** 18+ and npm ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/))
- **PostgreSQL** 12+ OR a cloud PostgreSQL service like **Neon** ([Sign up](https://neon.tech/))

### Required API Keys & Credentials
- **Google Cloud Credentials** (for Gemini AI features)
  - Sign up at [Google Cloud Console](https://console.cloud.google.com/)
  - Create a Generative AI API key
- **Resend API Key** (for email services, optional)
  - Sign up at [Resend](https://resend.com/)
- **OAuth Credentials** (GitHub and/or Google)
  - GitHub: [GitHub Developer Settings](https://github.com/settings/developers)
  - Google: [Google Cloud Console OAuth](https://console.cloud.google.com/)

---

## 🛠️ Step-by-Step Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Hiring-Predictor
```

---

### Step 2: Install Node.js Dependencies

Install all npm packages for the frontend and backend:

```bash
npm install
```

This installs:
- **Frontend**: React 18, Vite, TypeScript, Radix UI, TailwindCSS
- **Backend**: Express, Drizzle ORM, Passport.js
- **APIs**: Google Generative AI SDK, email services
- **Database**: PostgreSQL drivers
- **UI Libraries**: Lucide icons, Recharts, Framer Motion, and more

**Expected time**: 2-5 minutes

### Step 3: Set Up Python Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

You should see `(.venv)` prefix in your terminal prompt.

### Step 4: Install Python Dependencies

With the virtual environment activated, install Python packages for resume parsing and ML models:

```bash
pip install -r scripts/resume-parser/resume_parser_requirements.txt
```

Additionally, install ML/data science packages:

```bash
pip install pandas numpy scikit-learn joblib
```

This installs:
- **Resume Parsing**: 
  - `pdfplumber` (0.10.3) - For parsing PDF resumes
  - `python-docx` (0.8.11) - For parsing DOCX resumes
- **Machine Learning**:
  - `pandas` - Data manipulation and analysis
  - `numpy` - Numerical computing
  - `scikit-learn` - ML algorithms and model training
  - `joblib` - Model serialization and loading

**Expected time**: 2-3 minutes

### Step 5: Set Up ML Models

The project includes machine learning models for candidate shortlisting and job matching. Follow these steps to set them up:

#### Option A: Using Pre-trained Models (Recommended for Quick Start)

If pre-trained models are available in the repository:

```bash
# Models are typically stored in the models/ directory
# No additional setup needed - they're loaded automatically at runtime
python python/ml_predictor.py --check
```

#### Option B: Training Models from Scratch

If you need to train ML models with your own data:

**1. Prepare Training Data**

Create a CSV file with the following columns:
```csv
skill_match_score,experience_gap_score,resume_completeness_score,behavioral_intent_score,market_demand_score,competition_score,shortlist_label
0.85,0.2,0.9,0.8,0.7,0.5,1
0.3,0.9,0.6,0.0,0.7,0.5,0
```

- All feature scores should be normalized (0-1)
- `shortlist_label`: 0 (not shortlisted) or 1 (shortlisted)

**2. Train the Shortlist Model**

```bash
# Train with default logistic regression
python scripts/ml-training/train_shortlist_model.py \
  --data scripts/ml-training/sample_training_data.csv \
  --model logistic \
  --output models/shortlist_model.pkl

# Or use gradient boosting for better non-linear patterns
python scripts/ml-training/train_shortlist_model.py \
  --data scripts/ml-training/sample_training_data.csv \
  --model gradient_boosting \
  --output models/shortlist_model_gb.pkl
```

**3. Run Inference**

```bash
python scripts/ml-training/run_inference.py \
  --model models/shortlist_model.pkl \
  --test-file scripts/ml-training/sample_training_data.csv
```

#### ML Model Components

- **shortlist_model.pkl** - Predicts candidate shortlist probability
- **placement_random_forest_model.pkl** - Candidate strength prediction
- **job_embeddings.pkl** - Pre-computed job embeddings
- **job_texts.pkl** - Job descriptions for embedding generation

For detailed ML model information, see [ML Training Guide](scripts/ml-training/README.md)

### Step 6: Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hirepulse
# OR for Neon PostgreSQL:
# DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require

# Google API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_GENERATIVE_AI_KEY=your_gemini_api_key

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email Service
EMAIL_PASS=your_resend_api_key
RESEND_API_KEY=your_resend_api_key

# Application Settings
SESSION_SECRET=your_random_session_secret
APP_BASE_URL=http://localhost:5000
NODE_ENV=development
```

**Generating SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 7: Set Up the Database

**Option A: Using Local PostgreSQL**

1. Create a database:
```sql
CREATE DATABASE hirepulse;
```

2. Run migrations:
```bash
npm run db:push
```

**Option B: Using Neon (Recommended for Development)**

1. Create a free Neon project at [neon.tech](https://neon.tech/)
2. Copy the connection string and add it to your `.env.local` file as `DATABASE_URL`
3. Run migrations:
```bash
npm run db:push
```

### Step 8: Verify Installation

Run the following commands to verify everything is set up correctly:

```bash
# Check TypeScript compilation
npm run check

# List installed npm packages
npm list

# Check Python packages (with virtual environment active)
pip list
```

---

## 🚀 Starting the Development Server

### Start Backend (Node.js/Express)

```bash
npm run dev
```

The backend server will start on `http://localhost:3001`

### Start Frontend (React/Vite)

In a new terminal (without deactivating the Python environment):

```bash
npm run dev:client
```

The frontend will start on `http://localhost:5000`

### Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 🐳 Docker Setup (Optional)

If your team prefers using Docker:

### Prerequisites
- **Docker** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (included with Docker Desktop)

### Start Services with Docker

```bash
docker-compose up --build
```

This starts:
- The application on `http://localhost:3001`
- PostgreSQL database on `localhost:5432`

To stop:
```bash
docker-compose down
```

---

## 📝 Project Structure

```
Hiring-Predictor/
├── client/                  # React frontend
│   ├── src/
│   ├── index.html
│   └── vite.config.ts
├── server/                  # Express backend
│   ├── index.ts
│   ├── routes/
│   ├── middleware/
│   └── db/
├── python/                  # Python ML models
│   ├── ml_predictor.py
│   ├── resume_parser.py
│   └── test_ml_models.py
├── scripts/
│   ├── resume-parser/       # Resume parsing utilities
│   │   └── resume_parser_requirements.txt
│   ├── ml-training/         # ML model training
│   └── testing/
├── migrations/              # Database migrations
├── package.json
├── tsconfig.json
├── docker-compose.yml
└── .env.local              # Create this file with environment variables
```

---

## 🧪 Testing the Setup

### Test Backend API

```bash
curl http://localhost:3001/api/health
```

### Test Database Connection

```bash
npm run db:push
```

### Test Python Environment

```bash
python -c "import pdfplumber; print('pdfplumber installed')"
python -c "from docx import Document; print('python-docx installed')"
python -c "import pandas; print('pandas installed')"
python -c "import sklearn; print('scikit-learn installed')"
```

### Test ML Models

```bash
# Check if models can be loaded
python python/ml_predictor.py --check

# Run inference test
python scripts/ml-training/run_inference.py \
  --model models/shortlist_model.pkl \
  --test-file scripts/ml-training/sample_training_data.csv
```

---

## 🐛 Troubleshooting

### Node Modules Issues

If you encounter issues with dependencies:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -r node_modules
npm install
```

### Python Virtual Environment Issues

If the virtual environment isn't activating:

**Windows:**
```powershell
# Try this if Activate.ps1 fails
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

### Database Connection Errors

1. Verify PostgreSQL is running:
   ```bash
   psql -U postgres -d hirepulse
   ```

2. Check `DATABASE_URL` in `.env.local` is correct

3. For Neon, ensure SSL mode is enabled in connection string

### Port Already in Use

If ports 3001 or 5000 are in use:

```bash
# Find and kill process using port 3001
# Windows:
netstat -ano | findstr :3001

# macOS/Linux:
lsof -i :3001
```

### Missing Dependencies

If you see module not found errors:

```bash
# Reinstall all dependencies
npm install
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Python Virtual Environments](https://docs.python.org/3/tutorial/venv.html)

---

## ✅ Checklist for Team Members

- [ ] Cloned repository
- [ ] Installed Node.js 18+ and npm
- [ ] Installed Python 3.8+
- [ ] Ran `npm install`
- [ ] Set up Python virtual environment (.venv)
- [ ] Installed Python dependencies
- [ ] Created `.env.local` with all required variables
- [ ] Set up database (local PostgreSQL or Neon)
- [ ] Ran database migrations (`npm run db:push`)
- [ ] Started backend server (`npm run dev`)
- [ ] Started frontend server (`npm run dev:client`)
- [ ] Accessed application at `http://localhost:5000`

---

## 💬 Getting Help

If team members encounter issues:

1. Check the **Troubleshooting** section above
2. Review the existing [README.md](README.md) for project overview
3. Check error logs in the terminal output
4. Contact the project lead

---

**Last Updated**: February 2, 2026
