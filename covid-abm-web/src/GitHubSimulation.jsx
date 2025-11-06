import { useState, useEffect } from 'react';
import { Play, Download, RefreshCw, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export default function GitHubSimulation() {
  const [config, setConfig] = useState({
    num_agents: 10000,
    simulation_days: 180,
    spread_chance: 10,
    precaution_rate: 50,
    vaccination_rate: 80,
    num_replications: 5
  });

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);

  // API base URL - works both locally and on Netlify
  const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8888/.netlify/functions'
    : '/.netlify/functions';

  // Fetch workflow runs on component mount and every 10 seconds when polling
  useEffect(() => {
    fetchWorkflowRuns();
    const interval = setInterval(fetchWorkflowRuns, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch artifacts when a run is selected
  useEffect(() => {
    if (selectedRun?.id) {
      fetchArtifacts(selectedRun.id);
    }
  }, [selectedRun]);

  const fetchWorkflowRuns = async () => {
    try {
      const response = await fetch(`${API_BASE}/get-workflow-runs`);
      const data = await response.json();
      
      if (response.ok) {
        setWorkflowRuns(data.runs);
        
        // Auto-select the most recent run if none selected
        if (!selectedRun && data.runs.length > 0) {
          setSelectedRun(data.runs[0]);
        } else if (selectedRun) {
          // Update the selected run if it exists in the new data
          const updatedRun = data.runs.find(r => r.id === selectedRun.id);
          if (updatedRun) {
            setSelectedRun(updatedRun);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching workflow runs:', err);
    }
  };

  const fetchArtifacts = async (runId) => {
    try {
      const response = await fetch(`${API_BASE}/get-artifacts?run_id=${runId}`);
      const data = await response.json();
      
      if (response.ok) {
        setArtifacts(data.artifacts);
      }
    } catch (err) {
      console.error('Error fetching artifacts:', err);
    }
  };

  const triggerWorkflow = async () => {
    setIsRunning(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/trigger-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Workflow triggered successfully! Refreshing runs...');
        // Refresh workflow runs after a short delay
        setTimeout(() => {
          fetchWorkflowRuns();
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.error || 'Failed to trigger workflow');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (status, conclusion) => {
    if (status === 'completed') {
      if (conclusion === 'success') {
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Success</span>;
      } else if (conclusion === 'failure') {
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">✗ Failed</span>;
      }
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{conclusion}</span>;
    } else if (status === 'in_progress') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold animate-pulse">⟳ Running</span>;
    } else if (status === 'queued') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">◷ Queued</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{status}</span>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuration
              </h2>

              <div className="space-y-4 mb-6">
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

              {/* Trigger Button */}
              <button
                onClick={triggerWorkflow}
                disabled={isRunning}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Triggering...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Simulation
                  </>
                )}
              </button>

              {/* Status Messages */}
              {success && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-green-800 text-sm">{success}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Runs Panel */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Workflow Runs
                </span>
                <button
                  onClick={fetchWorkflowRuns}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </h2>

              {workflowRuns.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">No workflow runs yet. Click "Run Simulation" to start!</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {workflowRuns.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRun(run)}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        selectedRun?.id === run.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">Run #{run.run_number}</span>
                        {getStatusBadge(run.status, run.conclusion)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Started: {formatDate(run.created_at)}</div>
                        <div>Updated: {formatDate(run.updated_at)}</div>
                      </div>
                      <a
                        href={run.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Artifacts Section */}
              {selectedRun && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Results & Artifacts
                  </h3>

                  {selectedRun.status !== 'completed' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        Workflow is {selectedRun.status}. Artifacts will be available when the run completes.
                      </p>
                    </div>
                  ) : artifacts.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        No artifacts found for this run.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {artifacts.map((artifact) => (
                        <div
                          key={artifact.id}
                          className="border border-gray-200 rounded-lg p-4 bg-white"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">{artifact.name}</div>
                              <div className="text-sm text-gray-600">
                                Size: {formatFileSize(artifact.size_in_bytes)} • 
                                Created: {formatDate(artifact.created_at)}
                              </div>
                            </div>
                            <a
                              href={artifact.download_url}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* How it Works */}
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="font-semibold mb-3 text-indigo-900">How it works:</h3>
            <ol className="text-sm text-indigo-800 space-y-2 list-decimal list-inside">
              <li>Configure your simulation parameters above</li>
              <li>Click "Run Simulation" to trigger GitHub Actions</li>
              <li>Monitor real-time status of your workflow runs</li>
              <li>Download results when complete (automatically refreshes every 10 seconds)</li>
              <li>View detailed logs on GitHub by clicking "View on GitHub"</li>
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
  );
}
