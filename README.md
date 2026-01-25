# HirePulse - AI-Powered Hiring Readiness Platform

An intelligent platform that analyzes user profiles, parses resumes, and predicts hiring readiness across technical roles using machine learning and semantic analysis.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Python** 3.8+
- **PostgreSQL** 14+ (or Neon cloud)

### Setup
```bash
# 1. Clone and install
git clone https://github.com/kanishkaag12/Hiring-Predictor.git
cd Hiring-Predictor

# 2. Install dependencies
cd Hiring-Predictor && npm install && cd ..

# 3. Setup Python environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r scripts/resume-parser/requirements.txt

# 4. Configure environment
cp Hiring-Predictor/.env.example Hiring-Predictor/.env
# Edit .env with your credentials

# 5. Run migrations
cd Hiring-Predictor && npm run db:push && cd ..

# 6. Start development
cd Hiring-Predictor && npm run dev
```

Server runs on `http://localhost:3001`

## 📖 Documentation

- **Getting Started**: [GETTING_STARTED.md](GETTING_STARTED.md)
- **Full Documentation Index**: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- **Application**: [Hiring-Predictor/](Hiring-Predictor/)

---

## 📁 Project Structure

```
Hiring-Predictor/
├── Hiring-Predictor/          # Main application code
│   ├── client/                # React frontend
│   ├── server/                # Express backend + ML services
│   ├── migrations/            # Database migrations
│   └── shared/                # Shared types & utilities
│
├── docs/                      # All documentation
│   ├── ai-alignment/          # AI Alignment feature docs
│   ├── resume-parsing/        # Resume parser documentation
│   ├── fit-calibration/       # Fit score calibration docs
│   └── implementation-guides/ # Implementation & integration guides
│
└── scripts/                   # Utility scripts
    ├── resume-parser/         # Resume parsing Python scripts
    └── testing/               # Test files & utilities
```

---

## 📚 Documentation

### AI Alignment for User-Selected Roles
**Location:** `docs/ai-alignment/`

Users see how AI evaluates their readiness for their personally selected career goals.

- **[Start Here](docs/ai-alignment/FINAL_DELIVERY_AI_ALIGNMENT.md)** - Complete overview
- **[Quick Reference](docs/ai-alignment/AI_ALIGNMENT_QUICK_REF.md)** - Developer guide
- **[UX Guide](docs/ai-alignment/AI_ALIGNMENT_UX_GUIDE.md)** - Design & user experience
- **[Documentation Index](docs/ai-alignment/AI_ALIGNMENT_DOCUMENTATION_INDEX.md)** - Navigate all docs

### Resume Parsing
**Location:** `docs/resume-parsing/`

Section-agnostic, format-flexible resume parser with business taxonomy.

- **[Main README](docs/resume-parsing/RESUME_PARSER_README.md)** - Parser overview
- **[Implementation Guide](docs/resume-parsing/RESUME_PARSING_INTEGRATION.md)** - Integration details
- **[Quick Reference](docs/resume-parsing/RESUME_PARSING_QUICK_REF.md)** - Usage examples

### Fit Score Calibration
**Location:** `docs/fit-calibration/`

Context-aware scoring that provides meaningful, motivating percentages.

- **[Calibration Guide](docs/fit-calibration/FIT_SCORE_CALIBRATION.md)** - Complete implementation
- **[Quick Reference](docs/fit-calibration/CALIBRATION_QUICK_REF.md)** - Developer guide
- **[Validation Checklist](docs/fit-calibration/VALIDATION_CHECKLIST.md)** - Testing guide

### Implementation Guides
**Location:** `docs/implementation-guides/`

System-wide implementation documentation and integration guides.

- **[Final Delivery Report](docs/implementation-guides/FINAL_DELIVERY_REPORT.md)** - Project summary
- **[Implementation Checklist](docs/implementation-guides/IMPLEMENTATION_CHECKLIST.md)** - Complete checklist
- **[Integration Guide](docs/implementation-guides/INTEGRATION_GUIDE.md)** - System integration

---

## 🚀 Development

### Setup
```bash
cd Hiring-Predictor
npm install
npm run dev
```

### Key Technologies
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **ML/AI**: Semantic similarity, TF-IDF, role embeddings
- **Resume Parsing**: Python with spaCy

---

## 🎯 Key Features

✅ **AI Career Path Recommendations** - Semantic similarity-based role matching  
✅ **User-Selected Role Alignment** - See how AI evaluates your personal goals  
✅ **Fit Score Calibration** - Context-aware, motivating percentages  
✅ **Resume Parsing** - Section-agnostic skill extraction  
✅ **Growth Trajectory** - Career progression suggestions  
✅ **What-If Simulator** - Experiment with skill additions  

---

## 📦 Scripts & Utilities

### Resume Parser Scripts
**Location:** `scripts/resume-parser/`

- `resume_parser.py` - Main parser module
- `resume_parser_api.py` - API wrapper
- `demo_resume_parser.py` - Demo & examples
- `resume_parser_requirements.txt` - Python dependencies

### Testing
**Location:** `scripts/testing/`

- Test files for various features
- Calibration tests
- Resume parsing tests

---

## 🔗 Quick Links

| Resource | Location |
|----------|----------|
| Main App Code | `Hiring-Predictor/` |
| All Documentation | `docs/` |
| Getting Started | `GETTING_STARTED.md` |
| Doc Navigation | `DOCUMENTATION_INDEX.md` |
| AI Alignment Docs | `docs/ai-alignment/` |
| Resume Parser Docs | `docs/resume-parsing/` |

---

## 📊 Project Status

✅ AI Alignment Implementation - **COMPLETE**  
✅ Resume Parsing Integration - **COMPLETE**  
✅ Fit Score Calibration - **COMPLETE**  
✅ Dashboard Simplification - **COMPLETE**  
✅ User-Selected Roles UI - **COMPLETE**  
✅ Documentation - **COMPREHENSIVE**  

**Status:** Production-ready, fully documented

---

**Last Updated:** January 25, 2026  
**Documentation:** Comprehensive  
**Production Ready:** YES
