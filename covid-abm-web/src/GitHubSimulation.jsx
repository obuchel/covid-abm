import { useState } from 'react';
import { Play, Download, AlertCircle, ExternalLink, Github } from 'lucide-react';

export default function GitHubSimulation() {
  const [config, setConfig] = useState({
    num_agents: 10000,
    simulation_days: 180,
    spread_chance: 10,
    precaution_rate: 50,
    vaccination_rate: 80,
    num_replications: 5
  });

  // Set your repository details here (these are public, so they're safe)
  const REPO_OWNER = 'obuchel';
  const REPO_NAME = 'covid-abm';
  const WORKFLOW_FILE = 'single-simulation.yml';

  const generateWorkflowCommand = () => {
    return `gh workflow run ${WORKFLOW_FILE} \\
  -f num_agents=${config.num_agents} \\
  -f simulation_days=${config.simulation_days} \\
  -f spread_chance=${config.spread_chance} \\
  -f precaution_rate=${config.precaution_rate} \\
  -f vaccination_rate=${config.vaccination_rate} \\
  -f num_replications=${config.num_replications}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const githubActionsUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}`;
  const githubWorkflowUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-600 rounded-xl p-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">COVID-19 Agent-Based Model</h1>
              <p className="text-gray-600 mt-1">GPU-Accelerated Epidemic Simulation with Long COVID</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Agents
                  </label>
                  <input
                    type="number"
                    value={config.num_agents}
                    onChange={(e) => setConfig({...config, num_agents: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Simulation Days
                  </label>
                  <input
                    type="number"
                    value={config.simulation_days}
                    onChange={(e) => setConfig({...config, simulation_days: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spread Chance: {config.spread_chance}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.spread_chance}
                    onChange={(e) => setConfig({...config, spread_chance: Number(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precaution Rate: {config.precaution_rate}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.precaution_rate}
                    onChange={(e) => setConfig({...config, precaution_rate: Number(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vaccination Rate: {config.vaccination_rate}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.vaccination_rate}
                    onChange={(e) => setConfig({...config, vaccination_rate: Number(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Parallel Replications
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={config.num_replications}
                    onChange={(e) => setConfig({...config, num_replications: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Github className="w-5 h-5" />
                Run on GitHub Actions
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-2">
                      For security, workflows must be triggered from GitHub
                    </p>
                    <p className="text-sm text-blue-800 mb-4">
                      GitHub tokens should never be in client-side code. Use one of the methods below:
                    </p>
                  </div>
                </div>
              </div>

              {/* Method 1: GitHub Actions UI */}
              <div className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Method 1: GitHub Actions Web UI
                </h3>
                <ol className="text-sm text-gray-700 space-y-2 mb-4 list-decimal list-inside">
                  <li>Click the button below to open GitHub Actions</li>
                  <li>Click "Run workflow" button</li>
                  <li>Enter your parameters manually</li>
                  <li>Click "Run workflow" to start</li>
                </ol>
                <a
                  href={githubActionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open GitHub Actions
                </a>
              </div>

              {/* Method 2: GitHub CLI */}
              <div className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Method 2: GitHub CLI Command
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  If you have <a href="https://cli.github.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub CLI</a> installed:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 mb-3 relative">
                  <pre className="text-green-400 text-xs overflow-x-auto">
                    <code>{generateWorkflowCommand()}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(generateWorkflowCommand())}
                    className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Check Status */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Monitor Your Runs</h3>
                <p className="text-sm text-gray-700 mb-4">
                  View workflow status, logs, and download results:
                </p>
                <a
                  href={githubWorkflowUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  View Workflow Runs
                </a>
              </div>

              {/* How it Works */}
              <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                <h3 className="font-semibold mb-3 text-indigo-900">How it works:</h3>
                <ol className="text-sm text-indigo-800 space-y-2 list-decimal list-inside">
                  <li>Configure simulation parameters above</li>
                  <li>Trigger workflow using GitHub Actions or CLI</li>
                  <li>GitHub Actions runs {config.num_replications} replications in parallel</li>
                  <li>Results are aggregated automatically</li>
                  <li>Download combined results from GitHub artifacts</li>
                </ol>
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-xs text-indigo-700">
                    <strong>Current Config:</strong> {config.num_agents.toLocaleString()} agents × {config.simulation_days} days × {config.num_replications} replications
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>  
      </div>
    </div>
  );
}