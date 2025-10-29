# Deployment Guide - FBLA Job Board

## Pre-Deployment Checklist

### 1. Environment Variables Setup

#### Backend (.env)
```env
# Server
PORT=5002
NODE_ENV=production

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets (generate strong secrets!)
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=https://your-frontend-url.com

# Email (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
```

### 2. Code Preparations

#### Backend Package.json
Make sure you have these scripts:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts"
  }
}
```

#### Frontend Package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

## Deployment Options

### Option 1: Vercel + Railway (RECOMMENDED)

#### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` directory

3. **Add MongoDB Database**
   - In your project, click "New"
   - Select "Database" → "MongoDB"
   - Railway will automatically create and connect it

4. **Set Environment Variables**
   - Click on your backend service
   - Go to "Variables" tab
   - Add all environment variables from above
   - Railway auto-provides `MONGODB_URI` from the database

5. **Configure Build**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

6. **Deploy**
   - Railway auto-deploys on push
   - Copy your backend URL (e.g., `https://your-app.railway.app`)

#### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` directory

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Set Environment Variables**
   - Add `VITE_API_URL` with your Railway backend URL
   - Example: `https://your-backend.railway.app/api`

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - You'll get a URL like `https://your-app.vercel.app`

6. **Update Backend CORS**
   - Go back to Railway
   - Update `CORS_ORIGIN` to your Vercel URL

---

### Option 2: Heroku (Full Stack)

#### Prerequisites
```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login
```

#### Deploy Backend
```bash
cd backend

# Create Heroku app
heroku create your-app-backend

# Add MongoDB
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_ACCESS_SECRET=your_secret
heroku config:set JWT_REFRESH_SECRET=your_secret
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix backend heroku main
```

#### Deploy Frontend
```bash
cd frontend

# Create Heroku app
heroku create your-app-frontend

# Set environment variables
heroku config:set VITE_API_URL=https://your-app-backend.herokuapp.com/api

# Deploy
git subtree push --prefix frontend heroku main
```

---

### Option 3: DigitalOcean App Platform

1. **Create Account**
   - Go to https://digitalocean.com
   - Sign up (get $200 student credit!)

2. **Create App**
   - Click "Create" → "Apps"
   - Connect GitHub repository

3. **Configure Services**
   
   **Backend Service:**
   - Type: Web Service
   - Source Directory: `/backend`
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`
   - HTTP Port: 5002

   **Frontend Service:**
   - Type: Static Site
   - Source Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`

4. **Add Database**
   - Click "Add Component" → "Database"
   - Select MongoDB
   - DigitalOcean will provision and connect it

5. **Set Environment Variables**
   - Add all required variables for both services
   - Use the auto-generated database connection string

6. **Deploy**
   - Click "Create Resources"
   - Wait for deployment to complete

---

## Post-Deployment Steps

### 1. Update Frontend API URL
Make sure your frontend is pointing to the correct backend URL:

```typescript
// frontend/src/api/axios.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
```

### 2. Test the Application
- [ ] User registration works
- [ ] User login works
- [ ] Job posting works
- [ ] Email application links work
- [ ] Admin dashboard accessible

### 3. Set Up Custom Domain (Optional)

#### Vercel:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

#### Railway:
1. Go to your service settings
2. Click "Settings" → "Domains"
3. Add custom domain
4. Update DNS records

### 4. Enable HTTPS
Most platforms (Vercel, Railway, Heroku) provide automatic HTTPS. Just ensure:
- Your API calls use `https://`
- Update CORS settings to allow your HTTPS domain

### 5. Monitor Your Application
- Set up error tracking (Sentry)
- Monitor performance
- Check logs regularly

---

## Database Migration

If you have existing data, migrate it to production:

```bash
# Export from local
mongodump --uri="mongodb://localhost:27017/fbla_job_board" --out=./backup

# Import to production
mongorestore --uri="your_production_mongodb_uri" ./backup
```

Or run the migration script:
```bash
npx ts-node scripts/add-application-email-to-jobs.ts
```

---

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGIN` in backend matches frontend URL
   - Ensure no trailing slashes

2. **Database Connection Failed**
   - Verify `MONGODB_URI` is correct
   - Check if IP whitelist includes your hosting provider

3. **Build Fails**
   - Check Node version compatibility
   - Ensure all dependencies are in `package.json`
   - Run `npm install` locally first

4. **Environment Variables Not Working**
   - Restart the service after adding variables
   - Check variable names match exactly
   - For Vite, variables must start with `VITE_`

---

## Security Checklist

- [ ] Strong JWT secrets (at least 32 characters)
- [ ] Environment variables are not in code
- [ ] CORS is configured correctly
- [ ] MongoDB connection uses authentication
- [ ] HTTPS is enabled
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] Sensitive data is not logged

---

## Cost Estimates

### Free Tier Options
- **Vercel + Railway:** $0/month (with limits)
- **Render:** $0/month (with sleep after inactivity)
- **MongoDB Atlas:** $0/month (512MB storage)

### Paid Options
- **Heroku Hobby:** ~$7/month per dyno
- **DigitalOcean:** ~$12/month (but $200 student credit)
- **AWS:** Variable, ~$10-30/month for small apps

---

## Recommended Stack for FBLA Project

**Best for beginners:**
- Frontend: **Vercel** (free, fast, easy)
- Backend: **Railway** (free tier, easy setup)
- Database: **MongoDB Atlas** (free tier)

**Total Cost:** $0/month
**Setup Time:** ~30 minutes
**Difficulty:** Easy ⭐⭐☆☆☆

---

## Need Help?

If you encounter issues:
1. Check the platform's documentation
2. Look at deployment logs
3. Verify environment variables
4. Test locally first
5. Check CORS and network settings

Good luck with your deployment! 🚀

