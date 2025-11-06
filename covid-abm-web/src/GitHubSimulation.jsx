import React, { useState, useEffect } from 'react';

const GitHubSimulation = () => {
  // GitHub configuration
  const GITHUB_OWNER = 'obuchel';
  const GITHUB_REPO = 'covid-abm';
  const WORKFLOW_FILE = 'single-simulation.yml';
  
  // You'll need to set this as an environment variable or GitHub secret
  // For development, you can create a .env.local file with:
  // REACT_APP_GITHUB_TOKEN=your_token_here
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
  
  const [config, setConfig] = useState({
    num_agents: 10000,
    simulation_days: 180,
    spread_chance: 10,
    precaution_rate: 50,
    vaccination_rate: 80,
    num_replications: 5
  });

  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch workflow runs directly from GitHub API
  const fetchWorkflowRuns = async () => {
    if (!GITHUB_TOKEN) {
      setError('GitHub token not configured. Please add REACT_APP_GITHUB_TOKEN to your environment.');
      return;
    }

    try {
      setError(null);
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/runs`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      setWorkflowRuns(data.workflow_runs.slice(0, 10) || []);
    } catch (err) {
      console.error('Error fetching workflow runs:', err);
      setError(err.message);
    }
  };

  // Auto-refresh workflow runs
  useEffect(() => {
    if (GITHUB_TOKEN) {
      fetchWorkflowRuns();
      const interval = setInterval(fetchWorkflowRuns, 10000);
      return () => clearInterval(interval);
    }
  }, [GITHUB_TOKEN]);

  // Trigger simulation via GitHub API
  const runSimulation = async () => {
    if (!GITHUB_TOKEN) {
      alert('GitHub token not configured. Please add REACT_APP_GITHUB_TOKEN to your environment.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            num_agents: config.num_agents.toString(),
            simulation_days: config.simulation_days.toString(),
            spread_chance: config.spread_chance.toString(),
            precaution_rate: config.precaution_rate.toString(),
            vaccination_rate: config.vaccination_rate.toString(),
            num_replications: config.num_replications.toString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `GitHub API error: ${response.status}`);
      }

      alert('Workflow triggered successfully!');
      
      setTimeout(fetchWorkflowRuns, 2000);
    } catch (err) {
      console.error('Error triggering workflow:', err);
      setError(err.message);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const isConfigured = !!GITHUB_TOKEN;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-2xl">🦠</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">COVID-19 Agent-Based Model</h1>
            <p className="text-gray-600">GPU-Accelerated Epidemic Simulation with Long COVID</p>
          </div>
        </div>

        {!isConfigured && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Configuration Required</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  You need to add a GitHub Personal Access Token to use this app.
                </p>
                <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">GitHub Settings → Tokens</a></li>
                  <li>Generate a new token with <code className="bg-yellow-100 px-1 rounded">repo</code> and <code className="bg-yellow-100 px-1 rounded">workflow</code> scopes</li>
                  <li>Add <code className="bg-yellow-100 px-1 rounded">REACT_APP_GITHUB_TOKEN=your_token</code> to <code className="bg-yellow-100 px-1 rounded">.env.local</code></li>
                  <li>Restart your development server</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              ⚙️ Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Agents
                </label>
                <input
                  type="number"
                  value={config.num_agents}
                  onChange={(e) => handleInputChange('num_agents', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Simulation Days
                </label>
                <input
                  type="number"
                  value={config.simulation_days}
                  onChange={(e) => handleInputChange('simulation_days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spread Chance: {config.spread_chance}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={config.spread_chance}
                  onChange={(e) => handleInputChange('spread_chance', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precaution Rate: {config.precaution_rate}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={config.precaution_rate}
                  onChange={(e) => handleInputChange('precaution_rate', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vaccination Rate: {config.vaccination_rate}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={config.vaccination_rate}
                  onChange={(e) => handleInputChange('vaccination_rate', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Parallel Replications
                </label>
                <input
                  type="number"
                  value={config.num_replications}
                  onChange={(e) => handleInputChange('num_replications', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                onClick={runSimulation}
                disabled={loading || !isConfigured}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? '⏳ Running...' : '▶️ Run Simulation'}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                🕐 Recent Workflow Runs
              </h2>
              <button
                onClick={fetchWorkflowRuns}
                disabled={!isConfigured}
                className="text-blue-600 hover:text-blue-800 text-sm disabled:text-gray-400"
              >
                🔄 Refresh
              </button>
            </div>

            {workflowRuns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No workflow runs yet. Click "Run Simulation" to start!
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {workflowRuns.map((run) => (
                  <div
                    key={run.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Run #{run.run_number}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        run.status === 'completed' 
                          ? run.conclusion === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                          : run.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {run.status === 'completed' ? run.conclusion : run.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(run.created_at).toLocaleString()}
                    </div>
                    <a
                      href={run.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View on GitHub →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Configure your simulation parameters above</li>
            <li>Click "Run Simulation" to trigger GitHub Actions directly</li>
            <li>Monitor real-time status of your workflow runs</li>
            <li>Download results from GitHub when complete (automatically refreshes every 10 seconds)</li>
            <li>View detailed logs on GitHub by clicking "View on GitHub"</li>
          </ol>
          <div className="mt-3 text-xs text-blue-700">
            <strong>Current Config:</strong> {config.num_agents.toLocaleString()} agents × {config.simulation_days} days × {config.num_replications} replications
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubSimulation;