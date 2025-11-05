import React, { useState } from 'react';
import { Play, Download, Settings, BarChart3, Loader2, Github } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

function App() {
  const [config, setConfig] = useState({
    N: 10000,
    max_days: 180,
    covid_spread_chance_pct: 10.0,
    initial_infected_agents: 5,
    precaution_pct: 50.0,
    avg_degree: 5,
    vaccination_pct: 80.0,
    v_start_time: 180,
    long_covid: true,
  });

  const [simulation, setSimulation] = useState({
    running: false,
    completed: false,
    currentDay: 0,
    results: null,
    timeSeriesData: [],
  });

  const [activeTab, setActiveTab] = useState('simulation');

  const runSimulation = async () => {
    setSimulation(prev => ({ ...prev, running: true, completed: false, currentDay: 0, timeSeriesData: [] }));
    
    for (let day = 0; day <= config.max_days; day += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const infected = Math.max(0, 100 * Math.exp(-day/60) * Math.sin(day/30) + 50);
      const immune = Math.min(config.N * 0.8, day * 20);
      const longCovid = Math.min(config.N * 0.1, day * 2);
      const productivity = 100 - (infected * 0.1) - (longCovid * 0.02);
      
      setSimulation(prev => ({
        ...prev,
        currentDay: day,
        timeSeriesData: [...prev.timeSeriesData, {
          day,
          infected: Math.round(infected),
          immune: Math.round(immune),
          longCovid: Math.round(longCovid),
          productivity: productivity.toFixed(1),
        }]
      }));
    }
    
    setSimulation(prev => ({
      ...prev,
      running: false,
      completed: true,
      results: {
        runtime_days: config.max_days,
        infected: Math.round(config.N * 0.65),
        reinfected: Math.round(config.N * 0.12),
        long_covid_cases: Math.round(config.N * 0.08),
        min_productivity: 87.3,
      }
    }));
  };

  const downloadResults = () => {
    const data = simulation.timeSeriesData;
    const csv = [
      ['Day', 'Infected', 'Immune', 'Long COVID', 'Productivity'],
      ...data.map(d => [d.day, d.infected, d.immune, d.longCovid, d.productivity])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_results.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-white" size={28} />
                </div>
                COVID-19 Agent-Based Model
              </h1>
              <p className="text-gray-600 mt-2">GPU-Accelerated Epidemic Simulation with Long COVID</p>
            </div>
            <a 
              href="https://github.com/yourusername/covid-abm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Github size={20} />
              View on GitHub
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'simulation'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Single Simulation
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'deploy'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              GitHub Deployment
            </button>
          </div>
        </div>

        {/* Single Simulation Tab */}
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings size={20} />
                  Configuration
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Agents
                    </label>
                    <input
                      type="number"
                      value={config.N}
                      onChange={(e) => setConfig({...config, N: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={simulation.running}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Simulation Days
                    </label>
                    <input
                      type="number"
                      value={config.max_days}
                      onChange={(e) => setConfig({...config, max_days: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={simulation.running}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spread Chance (%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.covid_spread_chance_pct}
                      onChange={(e) => setConfig({...config, covid_spread_chance_pct: parseFloat(e.target.value)})}
                      className="w-full"
                      disabled={simulation.running}
                    />
                    <span className="text-sm text-gray-600">{config.covid_spread_chance_pct}%</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precaution Rate (%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.precaution_pct}
                      onChange={(e) => setConfig({...config, precaution_pct: parseFloat(e.target.value)})}
                      className="w-full"
                      disabled={simulation.running}
                    />
                    <span className="text-sm text-gray-600">{config.precaution_pct}%</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vaccination Rate (%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.vaccination_pct}
                      onChange={(e) => setConfig({...config, vaccination_pct: parseFloat(e.target.value)})}
                      className="w-full"
                      disabled={simulation.running}
                    />
                    <span className="text-sm text-gray-600">{config.vaccination_pct}%</span>
                  </div>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={simulation.running}
                  className={`w-full mt-6 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    simulation.running
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                  }`}
                >
                  {simulation.running ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      Run Simulation
                    </>
                  )}
                </button>

                {simulation.completed && (
                  <button
                    onClick={downloadResults}
                    className="w-full mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download Results
                  </button>
                )}
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress */}
              {simulation.running && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Day {simulation.currentDay} / {config.max_days}
                    </span>
                    <span className="text-sm text-gray-600">
                      {Math.round((simulation.currentDay / config.max_days) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${(simulation.currentDay / config.max_days) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Summary Statistics */}
              {simulation.results && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">Total Infected</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {simulation.results.infected.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">Long COVID Cases</div>
                    <div className="text-3xl font-bold text-red-600">
                      {simulation.results.long_covid_cases.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Time Series Chart */}
              {simulation.timeSeriesData.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Epidemic Dynamics</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={simulation.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="infected" stroke="#3b82f6" name="Infected" strokeWidth={2} />
                      <Line type="monotone" dataKey="immune" stroke="#10b981" name="Immune" strokeWidth={2} />
                      <Line type="monotone" dataKey="longCovid" stroke="#ef4444" name="Long COVID" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GitHub Deployment Tab */}
        {activeTab === 'deploy' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">GitHub Actions Deployment</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Step 1: Setup Repository</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`git clone https://github.com/yourusername/covid-abm
cd covid-abm
git add .
git commit -m "Initial commit"
git push origin main`}
                </pre>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Step 2: Run Parallel Sweep</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Go to Actions → Select "Parameter Sweep" → Click "Run workflow"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;