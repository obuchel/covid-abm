# 🚀 Quick Start: Netlify Functions Setup

## 📦 What You're Installing

A secure backend that lets you trigger and monitor GitHub workflows directly from your web interface!

---

## ⚡ 5-Minute Setup

### 1. Copy Files

```bash
cd covid-abm

# Create directory
mkdir -p netlify/functions

# Copy Netlify functions
cp trigger-workflow.js netlify/functions/
cp get-workflow-runs.js netlify/functions/
cp get-artifacts.js netlify/functions/
cp functions-package.json netlify/functions/package.json

# Copy React component
cp GitHubSimulation.jsx src/

# Copy config
cp netlify.toml .

# Push to GitHub
git add .
git commit -m "Add Netlify Functions"
git push origin main
```

### 2. Deploy to Netlify

1. Go to: **https://app.netlify.com/**
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** → Select **obuchel/covid-abm**
4. Click **"Deploy site"** (defaults are correct)

### 3. Add Environment Variables

In Netlify Dashboard:
1. Go to: **Site Settings → Environment Variables**
2. Add:
   ```
   GITHUB_TOKEN = your_personal_access_token
   REPO_OWNER = obuchel
   REPO_NAME = covid-abm
   ```
3. Get token from: https://github.com/settings/tokens
   - Scopes needed: `repo` + `workflow`

4. **Redeploy:** Deploys tab → Trigger deploy → Clear cache and deploy

---

## ✅ Test It!

1. Visit your Netlify URL: `https://your-site.netlify.app`
2. Configure parameters
3. Click **"Run Simulation"**
4. Watch it work! ✨

---

## 📁 File Structure

```
covid-abm/
├── netlify/
│   └── functions/
│       ├── trigger-workflow.js
│       ├── get-workflow-runs.js
│       ├── get-artifacts.js
│       └── package.json
├── src/
│   └── GitHubSimulation.jsx (updated)
└── netlify.toml
```

---

## 🎯 What You Get

✅ **One-click simulations** - No GitHub navigation needed
✅ **Real-time status** - Auto-refreshes every 10 seconds
✅ **Download results** - Direct from the interface
✅ **Secure** - Token never exposed to users
✅ **Free** - Netlify free tier is plenty

---

## 🆘 Need Help?

See **NETLIFY_DEPLOYMENT_GUIDE.md** for:
- Detailed instructions
- Troubleshooting
- Local development
- Advanced features

---

## 🎉 That's It!

You now have a production-ready, secure web interface for your COVID-19 ABM simulations!
