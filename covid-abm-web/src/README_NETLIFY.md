# COVID-19 ABM with Netlify Functions

## 🎯 Overview

This setup provides a **secure, serverless backend** for your COVID-19 Agent-Based Model web interface, allowing users to trigger GitHub Actions workflows and view results directly in the browser.

---

## 📊 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        User's Browser                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         React App (GitHubSimulation.jsx)               │  │
│  │                                                         │  │
│  │  • Configure parameters                                │  │
│  │  • Click "Run Simulation"                              │  │
│  │  • View real-time status                               │  │
│  │  • Download results                                    │  │
│  └─────────────────┬──────────────────────────────────────┘  │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     │ HTTPS API Calls
                     │ (/.netlify/functions/*)
                     ↓
┌──────────────────────────────────────────────────────────────┐
│                    Netlify Functions                          │
│                    (Serverless Backend)                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  trigger-workflow.js                                   │  │
│  │    • Receives simulation parameters                    │  │
│  │    • Stores GitHub token securely                      │  │
│  │    • Triggers workflow on GitHub                       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  get-workflow-runs.js                                  │  │
│  │    • Fetches recent workflow runs                      │  │
│  │    • Returns status (queued/running/completed)         │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  get-artifacts.js                                      │  │
│  │    • Lists downloadable artifacts                      │  │
│  │    • Provides download URLs                            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ GitHub API Calls
                       │ (with secure token)
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                      GitHub Actions                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  single-simulation.yml                                 │  │
│  │    • Runs N parallel replications                      │  │
│  │    • Aggregates results                                │  │
│  │    • Produces downloadable artifacts                   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Model

### Before (Insecure):
```
React App → Contains GitHub Token → ❌ EXPOSED TO EVERYONE
```

### After (Secure):
```
React App → Netlify Functions → GitHub Token (env var) → ✅ SECURE
   ↑                                        ↑
Doesn't know                         Only backend
the token                            has access
```

**Benefits:**
- ✅ Token stored in Netlify environment variables
- ✅ Never sent to browser
- ✅ Can't be extracted by users
- ✅ GitHub push protection satisfied

---

## 📂 Files Provided

### Backend Files (Netlify Functions):

| File | Purpose | Lines |
|------|---------|-------|
| `trigger-workflow.js` | Triggers GitHub Actions workflow | ~80 |
| `get-workflow-runs.js` | Fetches recent workflow runs | ~70 |
| `get-artifacts.js` | Gets downloadable results | ~75 |
| `functions-package.json` | Dependencies (node-fetch) | ~7 |

### Frontend Files:

| File | Purpose |
|------|---------|
| `GitHubSimulation.jsx` | Updated React component with Netlify integration |
| `App.js` | Main app (already provided) |

### Configuration:

| File | Purpose |
|------|---------|
| `netlify.toml` | Netlify build configuration |

### Documentation:

| File | Description |
|------|-------------|
| `QUICK_START.md` | ⚡ 5-minute setup guide |
| `NETLIFY_DEPLOYMENT_GUIDE.md` | 📖 Complete deployment instructions |
| `README.md` | This file - architecture overview |

---

## 🚀 Features

### User Experience:

1. **One-Click Execution**
   - Configure parameters with sliders
   - Click "Run Simulation" button
   - Instant feedback

2. **Real-Time Monitoring**
   - Auto-refreshes every 10 seconds
   - Color-coded status badges:
     - 🟡 Queued
     - 🔵 Running (animated)
     - 🟢 Success
     - 🔴 Failed

3. **Run History**
   - View last 10 workflow runs
   - Click to see details
   - Direct links to GitHub

4. **Easy Downloads**
   - Download buttons appear when complete
   - Shows file sizes
   - One-click download

### Developer Experience:

1. **Local Development**
   ```bash
   netlify dev
   # Runs React + Functions locally
   ```

2. **Easy Debugging**
   - View function logs in Netlify Dashboard
   - Test functions individually
   - CORS pre-configured

3. **Automatic Deployment**
   - Push to GitHub → Auto-deploys
   - No manual steps needed

---

## 💰 Cost

**FREE!** Netlify's free tier includes:
- ✅ 300 build minutes/month
- ✅ 125,000 function requests/month
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ CDN distribution

**Your usage:**
- ~1 build per deployment (< 2 minutes)
- ~10-20 function calls per simulation
- Well within free tier limits!

---

## 🛠️ API Endpoints

Your deployed site exposes these endpoints:

### POST `/.netlify/functions/trigger-workflow`
Triggers a new simulation workflow.

**Request body:**
```json
{
  "num_agents": 10000,
  "simulation_days": 180,
  "spread_chance": 10,
  "precaution_rate": 50,
  "vaccination_rate": 80,
  "num_replications": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow triggered successfully"
}
```

### GET `/.netlify/functions/get-workflow-runs`
Gets recent workflow runs.

**Response:**
```json
{
  "runs": [
    {
      "id": 123456,
      "status": "completed",
      "conclusion": "success",
      "created_at": "2025-11-06T12:00:00Z",
      "updated_at": "2025-11-06T12:15:00Z",
      "html_url": "https://github.com/...",
      "run_number": 42
    }
  ]
}
```

### GET `/.netlify/functions/get-artifacts?run_id=123456`
Gets artifacts for a specific run.

**Response:**
```json
{
  "artifacts": [
    {
      "id": 789,
      "name": "aggregated-results",
      "size_in_bytes": 1024000,
      "created_at": "2025-11-06T12:15:00Z",
      "expired": false,
      "download_url": "https://api.github.com/..."
    }
  ]
}
```

---

## 🔄 Data Flow

### Triggering a Simulation:

```
1. User clicks "Run Simulation"
   ↓
2. React app calls POST /.netlify/functions/trigger-workflow
   ↓
3. Netlify function authenticates with GitHub token
   ↓
4. GitHub Actions workflow starts
   ↓
5. React app shows "Workflow triggered successfully!"
   ↓
6. Auto-refresh begins (every 10 seconds)
```

### Monitoring Status:

```
1. Every 10 seconds, React calls GET /.netlify/functions/get-workflow-runs
   ↓
2. Netlify function fetches runs from GitHub API
   ↓
3. Returns formatted run data
   ↓
4. React updates UI with latest status
   ↓
5. When status = "completed", fetch artifacts
```

### Downloading Results:

```
1. User clicks run to see details
   ↓
2. React calls GET /.netlify/functions/get-artifacts?run_id=X
   ↓
3. Netlify function fetches artifact list from GitHub
   ↓
4. Returns download URLs
   ↓
5. User clicks "Download" button
   ↓
6. Browser downloads artifact directly from GitHub
```

---

## 🧪 Testing

### Test Functions Locally:

```bash
# Start dev server
netlify dev

# In another terminal, test trigger:
curl -X POST http://localhost:8888/.netlify/functions/trigger-workflow \
  -H "Content-Type: application/json" \
  -d '{"num_agents":1000,"simulation_days":30,"spread_chance":10,"precaution_rate":50,"vaccination_rate":80,"num_replications":2}'

# Test get runs:
curl http://localhost:8888/.netlify/functions/get-workflow-runs

# Test get artifacts:
curl http://localhost:8888/.netlify/functions/get-artifacts?run_id=123456
```

### Test in Production:

1. Open your Netlify URL
2. Open browser DevTools (Network tab)
3. Click "Run Simulation"
4. Watch API calls in Network tab
5. Check function logs in Netlify Dashboard

---

## 📈 Monitoring

### Netlify Dashboard:

1. **Functions Tab:**
   - View invocation count
   - See execution duration
   - Monitor errors

2. **Logs:**
   - Real-time function logs
   - Error tracking
   - Performance metrics

3. **Analytics:**
   - Traffic overview
   - Bandwidth usage
   - Build history

### GitHub Actions:

1. **Actions Tab:**
   - Workflow run history
   - Execution logs
   - Artifact downloads

---

## 🔧 Customization

### Add More Functions:

1. Create new file in `netlify/functions/`
2. Export handler:
   ```javascript
   exports.handler = async (event, context) => {
     return {
       statusCode: 200,
       body: JSON.stringify({ data: 'your data' })
     };
   };
   ```
3. Deploy (auto-deploys from GitHub)

### Modify UI:

1. Edit `src/GitHubSimulation.jsx`
2. Commit and push
3. Netlify auto-deploys

### Change Polling Interval:

In `GitHubSimulation.jsx`, line ~40:
```javascript
const interval = setInterval(fetchWorkflowRuns, 10000); // 10 seconds
```

Change `10000` to desired milliseconds (e.g., `5000` for 5 seconds)

---

## 🆘 Troubleshooting

### Common Issues:

| Issue | Solution |
|-------|----------|
| "Configuration error" | Add environment variables in Netlify |
| Functions not found | Check `netlify.toml` functions path |
| CORS errors | Verify CORS headers in functions |
| Token expired | Regenerate GitHub token |
| Slow response | Check GitHub API rate limits |

### Debug Steps:

1. **Check Netlify logs:**
   - Functions tab → Click function → View logs

2. **Check GitHub token:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user
   ```

3. **Test functions locally:**
   ```bash
   netlify functions:invoke trigger-workflow --payload '{"num_agents":1000}'
   ```

4. **Check environment variables:**
   ```bash
   netlify env:list
   ```

---

## 📚 Resources

- **Netlify Functions Docs:** https://docs.netlify.com/functions/overview/
- **GitHub Actions API:** https://docs.github.com/en/rest/actions
- **React Documentation:** https://react.dev/

---

## 🎉 Success!

You now have a **production-ready, secure, serverless** backend for your COVID-19 ABM!

**Next Steps:**
1. 📖 Read `QUICK_START.md` for 5-minute setup
2. 🚀 Deploy to Netlify
3. 🧪 Test your interface
4. 📊 Run simulations!

Enjoy! 🦠📈
