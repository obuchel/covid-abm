import { useState } from 'react';
import GitHubSimulation from './GitHubSimulation';
import NetworkVisualization from './NetworkVisualization';

export default function App() {
  const [activeTab, setActiveTab] = useState('github');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('github')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'github'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              GitHub Parallel Simulation
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'network'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Network Visualization
            </button>
          </nav>
        </div>
      </div>

      <div>
        {activeTab === 'github' && <GitHubSimulation />}
        {activeTab === 'network' && <NetworkVisualization />}
      </div>
    </div>
  );
}