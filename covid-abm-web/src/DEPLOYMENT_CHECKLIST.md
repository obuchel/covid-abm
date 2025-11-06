# 📋 Netlify Functions - File Deployment Checklist

## 🎯 What You Have

All the files needed for a complete Netlify Functions deployment!

---

## 📂 File Placement Guide

### ✅ Backend Files (Netlify Functions)

Copy these to `netlify/functions/`:

```bash
mkdir -p netlify/functions
```

| File | Destination | Purpose |
|------|-------------|---------|
| `trigger-workflow.js` | → `netlify/functions/trigger-workflow.js` | Triggers simulations |
| `get-workflow-runs.js` | → `netlify/functions/get-workflow-runs.js` | Gets run status |
| `get-artifacts.js` | → `netlify/functions/get-artifacts.js` | Gets results |
| `functions-package.json` | → `netlify/functions/package.json` | Dependencies |

### ✅ Frontend Files

| File | Destination | Purpose |
|------|-------------|---------|
| `GitHubSimulation.jsx` | → `src/GitHubSimulation.jsx` | Updated UI component |
| `App.js` | → `src/App.js` | Main app (if not already updated) |

### ✅ Configuration

| File | Destination | Purpose |
|------|-------------|---------|
| `netlify.toml` | → `netlify.toml` (root) | Netlify configuration |

### ✅ GitHub Workflows

| File | Destination | Purpose |
|------|-------------|---------|
| `single-simulation.yml` | → `.github/workflows/single-simulation.yml` | Workflow definition |
| `deploy.yml` | → `.github/workflows/deploy.yml` | Fixed deployment workflow |

---

## 🚀 Quick Setup Commands

```bash
cd covid-abm

# Create directories
mkdir -p netlify/functions
mkdir -p .github/workflows

# Copy backend files
cp trigger-workflow.js netlify/functions/
cp get-workflow-runs.js netlify/functions/
cp get-artifacts.js netlify/functions/
cp functions-package.json netlify/functions/package.json

# Copy frontend files
cp GitHubSimulation.jsx src/
cp App.js src/  # if needed

# Copy config
cp netlify.toml .

# Copy workflows
cp single-simulation.yml .github/workflows/
cp deploy.yml .github/workflows/

# Commit everything
git add .
git commit -m "Add Netlify Functions and updated workflows"
git push origin main
```

---

## 📚 Documentation Files

**Start here:** [View QUICK_START.md](computer:///mnt/user-data/outputs/QUICK_START.md)

Then reference as needed:
- **README_NETLIFY.md** - Architecture and API reference
- **NETLIFY_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **COMPLETE_SETUP_GUIDE.md** - Original setup guide (GitHub CLI method)

---

## ✅ Deployment Checklist

### Step 1: Local Setup
- [ ] Copy all files to correct locations (see above)
- [ ] Commit changes: `git add . && git commit -m "Add Netlify Functions"`
- [ ] Push to GitHub: `git push origin main`

### Step 2: Netlify Setup
- [ ] Sign up at https://app.netlify.com (free)
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Choose GitHub → Select your repo
- [ ] Click "Deploy site" (defaults are correct)

### Step 3: Configure Secrets
- [ ] Go to Site Settings → Environment Variables
- [ ] Add `GITHUB_TOKEN` (get from https://github.com/settings/tokens)
  - Required scopes: `repo` + `workflow`
- [ ] Add `REPO_OWNER` = `obuchel`
- [ ] Add `REPO_NAME` = `covid-abm`
- [ ] Trigger redeploy (Deploys tab → Trigger deploy)

### Step 4: Test
- [ ] Visit your Netlify URL
- [ ] Configure simulation parameters
- [ ] Click "Run Simulation"
- [ ] Verify workflow appears in GitHub Actions
- [ ] Wait for completion
- [ ] Download results

---

## 🎯 Your Target Structure

```
covid-abm/
├── netlify/
│   └── functions/
│       ├── trigger-workflow.js      ✅
│       ├── get-workflow-runs.js     ✅
│       ├── get-artifacts.js         ✅
│       └── package.json             ✅
├── .github/
│   └── workflows/
│       ├── single-simulation.yml    ✅
│       ├── parameter-sweep.yml      (keep existing)
│       └── deploy.yml              ✅ (updated)
├── src/
│   ├── App.js                      ✅
│   ├── GitHubSimulation.jsx        ✅ (updated)
│   └── NetworkVisualization.jsx     (keep existing)
├── netlify.toml                    ✅
└── package.json                     (keep existing)
```

---

## 🔐 Environment Variables

In Netlify Dashboard (Site Settings → Environment Variables):

```
GITHUB_TOKEN     = ghp_xxxxxxxxxxxxxxxxxxxx
REPO_OWNER       = obuchel
REPO_NAME        = covid-abm
```

**Important:** 
- Never commit these values to git!
- Token needs `repo` + `workflow` scopes
- Redeploy after adding variables

---

## 💡 What Happens After Deployment

1. **Netlify builds your site:**
   - Runs `npm run build`
   - Publishes `build/` folder
   - Sets up serverless functions

2. **Your site is live at:**
   - `https://your-site-name.netlify.app`
   - Custom domain (optional)

3. **Functions are available at:**
   - `https://your-site-name.netlify.app/.netlify/functions/trigger-workflow`
   - `https://your-site-name.netlify.app/.netlify/functions/get-workflow-runs`
   - `https://your-site-name.netlify.app/.netlify/functions/get-artifacts`

4. **Auto-deployment enabled:**
   - Push to GitHub → Auto-deploys to Netlify
   - No manual steps needed!

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Netlify build succeeds (green checkmark)
- ✅ Functions appear in Netlify Functions tab
- ✅ Site loads at your Netlify URL
- ✅ "Run Simulation" button triggers workflows
- ✅ Status updates automatically
- ✅ Results download successfully

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check `netlify.toml` is in root directory |
| Functions 404 | Verify files are in `netlify/functions/` |
| "Configuration error" | Add environment variables in Netlify |
| Token issues | Regenerate token with correct scopes |
| CORS errors | Already fixed in provided files |

---

## 📞 Need Help?

1. Check **QUICK_START.md** for setup
2. See **NETLIFY_DEPLOYMENT_GUIDE.md** for troubleshooting
3. View function logs in Netlify Dashboard
4. Check GitHub Actions for workflow errors

---

## 🚀 Ready to Deploy?

Follow **QUICK_START.md** for the fastest path to deployment!

Time needed: **5-10 minutes** ⏱️

---

## 📊 Expected Results

After deployment, your interface will:
- ✅ Trigger simulations with one click
- ✅ Show real-time status (auto-refresh every 10 seconds)
- ✅ Display run history
- ✅ Download results directly
- ✅ All secure (token never exposed)

**Cost:** FREE (Netlify free tier) 💰

---

Happy deploying! 🎉
