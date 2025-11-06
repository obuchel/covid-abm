# Netlify Functions Deployment Guide

## 🎯 What You're Getting

A complete serverless backend that allows you to:
- ✅ Trigger GitHub workflows directly from your web interface
- ✅ See real-time status updates (auto-refreshes every 10 seconds)
- ✅ View all recent workflow runs
- ✅ Download results directly from the interface
- ✅ Secure token storage (never exposed to users)

---

## 📁 File Structure

```
covid-abm/
├── netlify/
│   └── functions/
│       ├── trigger-workflow.js      # Triggers simulations
│       ├── get-workflow-runs.js     # Gets run status
│       ├── get-artifacts.js         # Gets downloadable results
│       └── package.json             # Function dependencies
├── src/
│   ├── App.js                       # Main app (already updated)
│   └── GitHubSimulation.jsx         # Updated with Netlify integration
├── netlify.toml                     # Netlify configuration
└── package.json                     # Your existing package.json
```

---

## 🚀 Deployment Steps

### Step 1: Copy Files to Your Project

```bash
cd covid-abm

# Create netlify functions directory
mkdir -p netlify/functions

# Copy function files
cp trigger-workflow.js netlify/functions/
cp get-workflow-runs.js netlify/functions/
cp get-artifacts.js netlify/functions/
cp netlify-functions/package.json netlify/functions/

# Copy React component
cp GitHubSimulation_netlify.jsx src/GitHubSimulation.jsx

# Copy Netlify config
cp netlify.toml .

# Commit changes
git add .
git commit -m "Add Netlify Functions for secure GitHub integration"
git push origin main
```

### Step 2: Deploy to Netlify

#### Option A: Connect via Netlify Dashboard (Recommended)

1. **Go to Netlify:** https://app.netlify.com/
2. **Sign up/Login** (free account)
3. **Click "Add new site" → "Import an existing project"**
4. **Choose "GitHub"** and authorize Netlify
5. **Select your repository:** `obuchel/covid-abm`
6. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions` (should auto-detect)
7. **Click "Deploy site"**

#### Option B: Use Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize (in your repo directory)
netlify init

# Follow prompts:
# - Create & configure new site
# - Connect to GitHub repo
# - Build command: npm run build
# - Publish directory: build

# Deploy
netlify deploy --prod
```

### Step 3: Configure Environment Variables

**CRITICAL:** Add your GitHub token to Netlify (this keeps it secure!)

1. **In Netlify Dashboard:**
   - Go to: Site Settings → Environment Variables
   - Click "Add a variable"

2. **Add these three variables:**

```
GITHUB_TOKEN = your_github_personal_access_token
REPO_OWNER = obuchel
REPO_NAME = covid-abm
```

**To create a GitHub token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: "Netlify COVID ABM"
4. Scopes: Select `repo` and `workflow`
5. Click "Generate token"
6. Copy the token (you won't see it again!)
7. Paste into Netlify environment variable

3. **Redeploy after adding variables:**
   - Click "Deploys" tab
   - Click "Trigger deploy" → "Clear cache and deploy site"

---

## ✅ Verify Deployment

### Test Your Functions

After deployment, your site will be at: `https://your-site-name.netlify.app`

1. **Test workflow trigger:**
   ```bash
   curl -X POST https://your-site-name.netlify.app/.netlify/functions/trigger-workflow \
     -H "Content-Type: application/json" \
     -d '{"num_agents":1000,"simulation_days":30,"spread_chance":10,"precaution_rate":50,"vaccination_rate":80,"num_replications":2}'
   ```

2. **Test get runs:**
   ```bash
   curl https://your-site-name.netlify.app/.netlify/functions/get-workflow-runs
   ```

### Test Your Interface

1. Open your deployed site
2. Configure parameters
3. Click "Run Simulation"
4. You should see:
   - Success message
   - New run appearing in the list
   - Status updating automatically
   - Download button when complete

---

## 🔧 Local Development

Test everything locally before deploying:

```bash
# Install Netlify CLI (if not already)
npm install -g netlify-cli

# In your project directory
cd covid-abm

# Install dependencies
npm install
cd netlify/functions && npm install && cd ../..

# Create .env file for local testing
cat > .env << 'EOF'
GITHUB_TOKEN=your_github_token_here
REPO_OWNER=obuchel
REPO_NAME=covid-abm
EOF

# Run Netlify dev server (runs both React and Functions)
netlify dev

# Your app will be at: http://localhost:8888
# Functions will be at: http://localhost:8888/.netlify/functions/
```

Test locally:
- Visit http://localhost:8888
- Configure and run a simulation
- Check that it triggers on GitHub

---

## 📊 How It Works

```
┌─────────────────┐
│  React App      │
│  (Your Browser) │
└────────┬────────┘
         │ 1. Click "Run Simulation"
         ↓
┌─────────────────┐
│ Netlify         │
│ Functions       │ 2. Securely stores GitHub token
│ (Serverless)    │ 3. Calls GitHub API
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ GitHub Actions  │ 4. Runs your simulation
│                 │ 5. Produces results
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ React App       │ 6. Fetches and displays results
│ (Auto-refresh)  │
└─────────────────┘
```

---

## 🎨 Features You Get

### In Your Web Interface:

1. **One-Click Execution**
   - No need to visit GitHub
   - Immediate feedback

2. **Real-Time Status**
   - Auto-refreshes every 10 seconds
   - See exactly when runs complete

3. **Run History**
   - View last 10 runs
   - Click to see details
   - Color-coded status badges

4. **Easy Downloads**
   - Download buttons for artifacts
   - Shows file sizes
   - Direct download links

5. **Error Handling**
   - Clear error messages
   - Success confirmations
   - Network error recovery

---

## 🔐 Security Benefits

| Before | After |
|--------|-------|
| ❌ Token in JavaScript | ✅ Token in Netlify env vars |
| ❌ Exposed to all users | ✅ Only backend has access |
| ❌ Can't deploy to GitHub Pages | ✅ Deploys successfully |
| ❌ GitHub blocks push | ✅ No secrets in code |

---

## 🆘 Troubleshooting

### Functions not working?

**Check environment variables:**
```bash
netlify env:list
```

Should show:
- GITHUB_TOKEN
- REPO_OWNER
- REPO_NAME

**View function logs:**
```bash
netlify functions:list
netlify functions:invoke trigger-workflow --payload '{"num_agents":1000}'
```

Or in Netlify Dashboard: Functions → [function name] → Logs

### "Configuration error"?

This means environment variables aren't set. Go to:
- Netlify Dashboard → Site Settings → Environment Variables
- Add GITHUB_TOKEN, REPO_OWNER, REPO_NAME
- Redeploy

### CORS errors?

Make sure your functions have CORS headers:
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
}
```

(Already included in the provided functions)

### "Workflow not found"?

Make sure `single-simulation.yml` exists in your repo at:
`.github/workflows/single-simulation.yml`

---

## 💰 Costs

**Netlify Free Tier includes:**
- ✅ 300 build minutes/month (plenty for your site)
- ✅ 125K function requests/month
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Continuous deployment from GitHub

**This project will fit comfortably in the free tier!**

---

## 🚀 Next Steps

After deploying:

1. **Test the interface** - Run a small simulation
2. **Monitor GitHub Actions** - Verify workflows trigger
3. **Download results** - Test the artifact download
4. **Share your site** - Show off your work!

Your deployed site URL will be: `https://your-site-name.netlify.app`

You can customize the domain in Netlify Settings → Domain management

---

## 📝 Summary Checklist

- [ ] Created netlify/functions directory
- [ ] Copied all 3 function files
- [ ] Copied function package.json
- [ ] Updated GitHubSimulation.jsx
- [ ] Copied netlify.toml
- [ ] Committed and pushed to GitHub
- [ ] Created Netlify account
- [ ] Connected GitHub repo to Netlify
- [ ] Added environment variables (GITHUB_TOKEN, REPO_OWNER, REPO_NAME)
- [ ] Deployed site successfully
- [ ] Tested triggering a simulation
- [ ] Verified results download

---

## 🎉 You're Done!

You now have a fully functional web interface with secure backend that:
- Triggers simulations with one click
- Shows real-time status
- Downloads results automatically
- Keeps your GitHub token secure

Enjoy your COVID-19 ABM! 🦠📊
