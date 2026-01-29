# Hiring Predictor - Project Structure

## Root Level Files
```
.env                              # Environment variables
.env.example                      # Example environment configuration
.gitignore                        # Git ignore rules
.replit                          # Replit configuration
package.json                     # Node.js dependencies and scripts
package-lock.json                # Locked dependency versions
tsconfig.json                    # TypeScript configuration
drizzle.config.ts                # Database ORM configuration
vite.config.ts                   # Vite bundler configuration
postcss.config.js                # PostCSS configuration
components.json                  # UI components configuration
vercel.json                      # Vercel deployment configuration
docker-compose.yml               # Docker Compose setup
Dockerfile                       # Docker container configuration
vite-plugin-meta-images.ts       # Custom Vite plugin for image metadata
```

## Root Level Directories

### `/client` - Frontend Application (React/TypeScript)
```
client/
├── index.html                   # Main HTML file
├── public/                      # Static assets
└── src/
    ├── App.tsx                  # Main app component
    ├── main.tsx                 # React entry point
    ├── index.css                # Global styles
    ├── components/              # Reusable React components
    │   ├── analysis-modal.tsx
    │   ├── hiring-trend-chart.tsx
    │   ├── job-card.tsx
    │   ├── job-filters.tsx
    │   ├── JobWhatIfSimulator.tsx
    │   ├── layout.tsx
    │   ├── peer-cluster-map.tsx
    │   ├── probability-gauge.tsx
    │   ├── public-layout.tsx
    │   ├── theme-provider.tsx
    │   ├── dashboard/           # Dashboard-specific components
    │   └── ui/                  # UI library components
    ├── pages/                   # Page components
    │   ├── app-jobs.tsx
    │   ├── auth.tsx
    │   ├── auth-new.tsx
    │   ├── dashboard.tsx
    │   ├── favourites.tsx
    │   ├── internships.tsx
    │   ├── job-details.tsx
    │   ├── jobs.tsx
    │   ├── landing.tsx
    │   ├── landing.css
    │   ├── not-found.tsx
    │   ├── profile.tsx
    │   ├── public-jobs.tsx
    │   ├── reset-password.tsx
    │   └── settings.tsx
    ├── hooks/                   # Custom React hooks
    ├── lib/                     # Utility libraries and helpers
    └── index.css                # Global styles
```

### `/server` - Backend Application (Node.js/Express/TypeScript)
```
server/
├── index.ts                     # Server entry point
├── routes.ts                    # Main routing configuration
├── auth.ts                      # Authentication logic
├── auth-providers.ts            # OAuth/Auth provider setup
├── email.ts                     # Email service
├── storage.ts                   # File storage handling
├── static.ts                    # Static file serving
├── vite.ts                      # Vite integration
├── config/                      # Configuration files
├── api/                         # API routes
│   └── skill-mapping.routes.ts
├── routes/                      # Additional route handlers (if any)
├── services/                    # Business logic services
│   ├── ai-simulation.service.ts
│   ├── ai.service.ts
│   ├── analysis-engine.ts
│   ├── intelligence.service.ts
│   ├── job-what-if-simulator.ts
│   ├── jobSources.service.ts
│   ├── ml/                      # Machine learning services
│   ├── probability-engine.ts
│   ├── resume-parser.service.ts
│   ├── role-specific-intelligence.ts
│   ├── semantic-embeddings.service.ts
│   ├── skill-role-mapping.config.ts
│   ├── skill-role-mapping.demo.ts
│   ├── skill-role-mapping.service.ts
│   ├── skill-role-mapping.test.ts
│   ├── what-if-simulator.ts
│   ├── what-if-simulator-prompt.ts
│   ├── SKILL_ROLE_MAPPING_README.md
│   └── (other service files)
├── jobs/                        # Job-related logic
├── ml/                          # Machine learning models and utilities
├── utils/                       # Utility functions
├── test-db.ts                   # Database testing
├── debug-register.ts            # Debug registration utilities
├── hash-update-user.js          # User hash update utility
└── (other configuration files)
```

### `/shared` - Shared Code Between Client and Server
```
shared/
├── schema.ts                    # Shared data schemas
└── roles.ts                     # Role definitions
```

### `/python` - Python Services
```
python/
├── resume_parser.py             # Resume parsing Python service
└── __pycache__/                 # Python cache directory
```

### `/migrations` - Database Migrations (Drizzle ORM)
```
migrations/
├── 0000_burly_lilith.sql
├── 0000_safe_ben_urich.sql
├── 0001_short_payback.sql
├── 0002_add_profile_fields.sql
├── 0003_add_parsed_resume_fields.sql
├── 0003_add_password_reset_tokens.sql
├── 0004_add_resume_parsing_error.sql
├── 0005_add_profile_image.sql
├── 0006_add_missing_user_columns.sql
├── 0007_fix_full_name_constraint.sql
├── 0008_create_missing_core_tables.sql
├── 0009_add_missing_jobs_columns.sql
└── meta/                        # Migration metadata
```

### `/models` - Data Models
```
models/
└── (TypeScript/Database model definitions)
```

### `/docs` - Documentation
```
docs/
├── ai-alignment/                # AI alignment documentation
├── fit-calibration/             # Fit calibration guides
├── implementation-guides/       # Implementation documentation
└── resume-parsing/              # Resume parsing documentation
```

### `/project-docs` - Project Documentation
```
project-docs/
├── ACCURACY_IMPROVEMENT_GUIDE.md
├── ACCURACY_IMPROVEMENT_PLAN.md
├── AI_SYSTEMS_OVERVIEW.md
├── ARCHITECTURE_DIAGRAMS.md
├── AUTH_FIX_QUICK_REF.md
├── AUTO_REFRESH_IMPLEMENTATION_GUIDE.md
├── DASHBOARD_UNLOCK_FIX.md
├── DATABASE_CONNECTION_AUTH_FIX.md
├── DATABASE_TROUBLESHOOTING.md
├── DEPLOYMENT_GUIDE.md
├── DOCUMENTATION_INDEX.md
├── EMAIL_AUTH_FIX_GUIDE.md
├── FILE_INDEX.md
├── GEMINI_API_SETUP.md
├── GETTING_STARTED.md
├── IMPLEMENTATION_CHECKLIST.md
├── IMPLEMENTATION_COMPLETE.md
├── MARKET_DATA_AGGREGATION_COMPLETE.md
├── ML_INFERENCE_CRASH_FIX.md
├── OAUTH_SETUP.md
├── PHASE1_IMPLEMENTATION_COMPLETE.md
└── (additional documentation)
```

### `/scripts` - Build and Utility Scripts
```
scripts/
└── (Various utility and build scripts)
```

### `/script` - Additional Scripts
```
script/
└── build.ts                     # Build script
```

### `/attached_assets` - Generated Media Assets
```
attached_assets/
└── generated_images/            # AI-generated images
```

### `/uploads` - User Uploads Directory
```
uploads/
└── (User-uploaded files like resumes, profiles)
```

### `/dist` - Build Output
```
dist/
└── (Compiled production build)
```

## Ignored Directories (Not Tracked in Git)
```
node_modules/                    # NPM dependencies
.venv/                          # Python virtual environment
.git/                           # Git repository
.pytest_cache/                  # Pytest cache
__pycache__/                    # Python bytecode cache
```

## Testing Files
```
test_parser.py                  # Python parser tests
test-auth-performance.js        # Auth performance tests
test-email.ts                   # Email service tests
test-upload.js                  # Upload functionality tests
```

## Utility Files
```
check-db-schema.js              # Database schema checker
get-schema.js                   # Schema retrieval utility
run-migration.js                # Migration runner
run-all-migrations.js           # Run all migrations utility
```

## Documentation Files
```
AI_MODEL_FIX_GUIDE.md           # AI model configuration guide
DATABASE_SETUP_GUIDE.md         # Database setup instructions
```

## Log Files
```
server-log.txt                  # Server logs
server-error.log                # Server error logs
```

---

## Technology Stack Overview

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: Drizzle ORM with migrations
- **AI/ML**: Python services for resume parsing and analysis
- **Authentication**: OAuth, Email-based auth
- **Deployment**: Docker, Vercel
- **Build Tools**: Vite, PostCSS

