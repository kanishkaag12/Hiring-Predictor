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
- **React** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe development
- **Radix UI** - Accessible component library
- **TailwindCSS** - Utility-first styling

### Backend
- **Node.js/Express** - Server runtime and web framework
- **TypeScript** - Type-safe backend development
- **Drizzle ORM** - Type-safe database ORM
- **PostgreSQL** - Primary database (via Neon)
- **Google Generative AI** - AI-powered analysis and predictions
- **Passport.js** - Authentication middleware

### Additional Tools
- **Multer** - File upload handling
- **Resend** - Email service for password resets
- **Docker** - Containerization
- **Vercel** - Deployment platform

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ (for resume parsing)
- **PostgreSQL** database (or Neon serverless PostgreSQL)
- **Google API Key** (for Gemini AI features)
- **Resend API Key** (for email services)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd Hiring-Predictor
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Fill in required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth credentials
- `EMAIL_PASS` - Resend API key (for password reset emails)
- `SESSION_SECRET` - Secure random string for session management

### 3. Set Up Python Virtual Environment
Create and activate a Python virtual environment:

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
python -m venv .venv
source .venv/bin/activate
```

### 4. Install Python Dependencies
With the virtual environment activated:
```bash
pip install -r scripts/resume-parser/resume_parser_requirements.txt
```

### 5. Set Up Database
```bash
npm run db:push
npm run db:migrate
```

### 6. Start Development Server
```bash
npm run dev
```

The application will start at `http://localhost:5000`

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:client      # Start client-only (Vite on port 5000)

# Database
npm run db:push        # Push schema changes to database
npm run db:migrate     # Run database migrations

# Building
npm run build          # Build for production
npm start              # Run production build

# Quality Assurance
npm run check          # Run TypeScript type checking
```

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

## 🐛 Troubleshooting

**Database Connection Issues**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- See [DATABASE_TROUBLESHOOTING.md](project-docs/DATABASE_TROUBLESHOOTING.md)

**Resume Parsing Errors**
- Ensure Python dependencies are installed
- Check resume file format (PDF or DOCX)
- Verify file path and permissions

**Build Issues**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `npm run check`
- Check Node.js version compatibility

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

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the [documentation](project-docs/)
- Review existing issues
- Create a new issue with detailed information

## 🎓 Learning Resources

- [Resume Parser Documentation](project-docs/GETTING_STARTED.md)
- [AI Systems Overview](project-docs/AI_SYSTEMS_OVERVIEW.md)
- [Implementation Guides](project-docs/implementation-guides/)
- [Troubleshooting Guides](project-docs/)

---

**Made with ❤️ for smarter hiring decisions**
