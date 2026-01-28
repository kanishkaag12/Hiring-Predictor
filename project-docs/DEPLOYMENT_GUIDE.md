# 🚀 HirePulse Deployment Guide

Complete guide to deploy your HirePulse application to production.

## 📋 Pre-Deployment Checklist

- [ ] Push all code to GitHub
- [ ] Set up production database (Neon/Railway/Supabase)
- [ ] Obtain OAuth credentials (Google & GitHub)
- [ ] Get Resend API key for emails
- [ ] Verify Python dependencies work
- [ ] Test build locally: `npm run build`

---

## 🎯 Recommended: Deploy to Render (Full-Stack)

**Render deploys BOTH frontend + backend + database together!**

### Step 1: Prepare Database

**Option A: Use Neon (Current)**
```bash
# You already have DATABASE_URL in .env
# Copy it for Render deployment
```

**Option B: Create new on Render**
- In Render dashboard, create a **PostgreSQL** database
- Copy the **External Database URL**

### Step 2: Deploy Application

1. **Go to** [render.com](https://render.com) → Sign up/Login

2. **New Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub account
   - Select your `Hiring-Predictor` repository

3. **Configure Build:**
   ```
   Name: hirepulse
   Region: Choose closest to your users
   Branch: main
   Root Directory: (leave blank)
   Runtime: Node
   Build Command: npm install
   Start Command: npm run build && npm start
   ```
   
   **This single service handles:**
   - ✅ React frontend (built and served by Express)
   - ✅ Express backend (API routes)
   - ✅ Python ML inference
   - ✅ Database connection

4. **Add Environment Variables:**
   
   Click **"Advanced"** → **"Add Environment Variable"**
   
   ```env
   DATABASE_URL=postgresql://your-database-url
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   SESSION_SECRET=generate-random-secret-here
   NODE_ENV=production
   PORT=3001
   EMAIL_HOST=smtp.resend.com
   EMAIL_PORT=465
   EMAIL_USER=resend
   EMAIL_PASS=your-resend-api-key
   EMAIL_FROM=onboarding@resend.dev
   APP_BASE_URL=https://your-app.onrender.com
   ```

5. **Deploy:**
   - Click **"Create Web Service"**
   - Wait 5-10 minutes for build
   - Render automatically serves your built React frontend
   - Your app (frontend + backend + API) will be at `https://your-app.onrender.com`
   
   **What you get with ONE Render service:**
   - 🎨 React frontend (automatic static site generation)
   - 🔌 Express API endpoints
   - 🤖 Python ML inference
   - 💾 PostgreSQL database
   - 🔄 Auto-scaling & uptime monitoring

### Step 3: Update OAuth Redirect URIs

**Google Cloud Console:**
- Authorized redirect URIs: `https://your-app.onrender.com/auth/google/callback`

**GitHub OAuth Settings:**
- Authorization callback URL: `https://your-app.onrender.com/auth/github/callback`

### Step 4: Run Database Migrations

```bash
# Connect to Render shell (in dashboard) or run locally:
npm run db:push
```

---

## � Comparison: All Deployment Options

| Option | Frontend | Backend | Database | Best For | Cost |
|--------|----------|---------|----------|----------|------|
| **Option 1: Render** | ✅ Included | ✅ Included | ✅ Included | Beginners, all-in-one | Free tier available |
| **Option 2: Vercel + Railway** | ✅ Vercel | ✅ Railway | ✅ Railway | Optimize frontend speed | Free tier available |
| **Option 3: Railway** | ✅ Included | ✅ Included | ✅ Included | Simple full-stack | Free $5/month |
| **Option 4: Docker** | ✅ Included | ✅ Included | ✅ Optional | Maximum control | Depends on host |

---

## ⚡ Why Option 1 (Render) is Best for You

**Single Service = Everything**
```
Your GitHub → Render → 1 Web Service
                       ├── React Frontend (served as static site)
                       ├── Express Backend (API routes)
                       ├── Python ML (resume parser)
                       └── PostgreSQL Database
```

**No Complex Setup:**
- ✅ Deploy frontend and backend together
- ✅ No need to manage separate services
- ✅ Database automatically configured
- ✅ Environment variables shared
- ✅ One deployment command
- ✅ Free tier available

---

### Build and Run Locally

```bash
# Build image
docker build -t hirepulse .

# Run with environment file
docker run -p 3001:3001 --env-file .env hirepulse
```

### Using Docker Compose

```bash
# Start everything (app + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Deploy to Cloud

**AWS ECS / Azure Container Apps / Google Cloud Run:**

```bash
# Build and push
docker build -t hirepulse .
docker tag hirepulse your-registry/hirepulse:latest
docker push your-registry/hirepulse:latest

# Deploy using cloud provider CLI
```

---

## ⚡ Vercel + Railway Split Deployment

### Frontend on Vercel

1. **Import Project** at [vercel.com](https://vercel.com)
2. **Framework Preset:** Other
3. **Build Settings:**
   ```
   Build Command: npm run build
   Output Directory: dist/public
   Install Command: npm install
   ```

4. **Environment Variables:**
   ```env
   VITE_API_URL=https://your-backend.railway.app
   ```

5. **Deploy** - Auto-deploys on push

### Backend on Railway

1. **New Project** at [railway.app](https://railway.app)
2. **Deploy from GitHub**
3. **Add PostgreSQL** service
4. **Environment Variables:** (same as Render list above)
5. **Custom Start Command:**
   ```
   npm run build && npm start
   ```

---

## 🔧 Railway Full-Stack Deployment

1. **Go to** [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. **Add Service** → **Database** → **PostgreSQL**
4. **Link DATABASE_URL** automatically
5. **Add other environment variables**
6. **Deploy** - Railway auto-detects Node.js

**Advantages:**
- Auto-scaling
- Free $5/month credit
- Easy database integration
- GitHub auto-deploy

---

## 🌐 Custom VPS Deployment (DigitalOcean, AWS EC2, etc.)

### Prerequisites
- Ubuntu 22.04 server
- Domain name (optional)

### Setup Script

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Python
sudo apt install -y python3 python3-pip

# 4. Install PM2 (process manager)
sudo npm install -g pm2

# 5. Clone repository
git clone https://github.com/your-username/Hiring-Predictor.git
cd Hiring-Predictor

# 6. Install dependencies
npm install
pip3 install -r scripts/resume-parser/requirements.txt

# 7. Create .env file
nano .env  # Add your production variables

# 8. Build
npm run build

# 9. Start with PM2
pm2 start dist/index.cjs --name hirepulse
pm2 save
pm2 startup  # Follow instructions

# 10. Setup Nginx (optional, for custom domain)
sudo apt install -y nginx
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔐 Environment Variables Reference

Required for all deployments:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | From Google Cloud Console |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | From GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | From GitHub Developer Settings |
| `SESSION_SECRET` | Random secret for sessions | Generate: `openssl rand -base64 32` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |
| `EMAIL_PASS` | Resend API key | From resend.com |
| `APP_BASE_URL` | Your production URL | `https://your-app.com` |

---

## ✅ Post-Deployment Verification

1. **Health Check:**
   ```bash
   curl https://your-app.com/api/health
   ```

2. **Test Authentication:**
   - Register new account
   - Login with Google
   - Login with GitHub

3. **Test Resume Upload:**
   - Upload a sample resume
   - Verify parsing works

4. **Monitor Logs:**
   ```bash
   # Render: View in dashboard
   # Railway: railway logs
   # PM2: pm2 logs hirepulse
   # Docker: docker logs <container-id>
   ```

---

## 🐛 Troubleshooting

### Build Fails

**Error:** `Python not found`
```bash
# Render: Add Python buildpack in settings
# Docker: Already included in Dockerfile
# VPS: Install python3
```

**Error:** `Module not found`
```bash
# Clear cache and rebuild
npm cache clean --force
rm -rf node_modules
npm install
```

### Runtime Errors

**Database Connection Failed:**
- Verify `DATABASE_URL` is correct
- Check database is running
- Whitelist deployment IP in database settings

**OAuth Redirect Mismatch:**
- Update callback URLs in Google/GitHub settings
- Ensure `APP_BASE_URL` matches your domain

**Resume Parser Not Found:**
- Verify `python/resume_parser.py` exists
- Check Python dependencies installed
- Server continues but uploads degrade gracefully

---

## 📊 Monitoring & Maintenance

### Setup Monitoring

**Render:**
- Built-in metrics dashboard
- Configure alerts in settings

**Railway:**
- Resource usage graphs
- Deploy logs auto-retained

**Custom Server:**
```bash
# Install monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M

# View metrics
pm2 monit
```

### Database Backups

**Neon:** Auto-backups enabled

**Railway:** 
```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

**Self-hosted:**
```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +%Y%m%d).sql.gz
```

---

## 🚀 Quick Start Commands

**Test build locally:**
```bash
npm run build
npm start
```

**Deploy to Render:** Use dashboard (easiest)

**Deploy with Docker:**
```bash
docker-compose up -d
```

**Deploy to Railway:**
```bash
railway login
railway up
```

---

## 📝 Need Help?

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs

---

**Recommended for beginners:** Start with **Render** - easiest setup with database included!
