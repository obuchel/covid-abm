import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Layers, Network, GitBranch, Activity } from 'lucide-react';

export default function NetworkVisualization() {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const rendererRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [day, setDay] = useState(0);
  const [config, setConfig] = useState({
    numAgents: 500,
    avgDegree: 5,
    spreadChance: 10,
    initialInfected: 5
  });
  const [stats, setStats] = useState({
    susceptible: 0,
    infected: 0,
    immune: 0,
    longCovid: 0
  });
  const [layout, setLayout] = useState('force');
  const [showClusters, setShowClusters] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [network, setNetwork] = useState(null);
  const animationRef = useRef(null);
  const [sigmaLoaded, setSigmaLoaded] = useState(false);

  // Load Sigma.js
  useEffect(() => {
    if (window.Sigma) {
      setSigmaLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sigma.js/2.4.0/sigma.min.js';
    script.async = true;
    script.onload = () => setSigmaLoaded(true);
    script.onerror = () => console.error('Failed to load Sigma.js');
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize network on first load
  useEffect(() => {
    if (sigmaLoaded) {
      initializeNetwork();
    }
  }, [sigmaLoaded, config.numAgents, config.avgDegree]);

  const getNodeColor = (status) => {
    const colors = {
      susceptible: '#3b82f6',
      infected: '#ef4444',
      immune: '#10b981',
      longcovid: '#f59e0b'
    };
    return colors[status] || '#999';
  };

  const initializeNetwork = () => {
    const n = config.numAgents;
    const nodes = [];
    const edges = [];

    // Create nodes in a circle layout
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI;
      const radius = 250;
      nodes.push({
        id: i,
        x: 400 + radius * Math.cos(angle),
        y: 400 + radius * Math.sin(angle),
        status: 'susceptible',
        infectedDay: -1,
        infectionDuration: 0,
        neighbors: []
      });
    }

    // Create edges (small-world network)
    const k = config.avgDegree;
    for (let i = 0; i < n; i++) {
      for (let j = 1; j <= k / 2; j++) {
        const neighbor = (i + j) % n;
        if (!edges.some(e => 
          (e.source === i && e.target === neighbor) || 
          (e.source === neighbor && e.target === i)
        )) {
          edges.push({ source: i, target: neighbor });
          nodes[i].neighbors.push(neighbor);
          nodes[neighbor].neighbors.push(i);
        }
      }
    }

    // Infect initial agents
    for (let i = 0; i < config.initialInfected && i < n; i++) {
      nodes[i].status = 'infected';
      nodes[i].infectedDay = 0;
      nodes[i].infectionDuration = 10 + Math.floor(Math.random() * 5);
    }

    setNetwork({ nodes, edges });
    updateStats({ nodes, edges });
    setDay(0);
    detectClusters({ nodes, edges });
  };

  const detectClusters = (net) => {
    if (!net) return;
    
    const visited = new Set();
    const detectedClusters = [];
    
    const dfs = (nodeId, cluster) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      cluster.push(nodeId);
      
      net.nodes[nodeId].neighbors.forEach(neighborId => {
        dfs(neighborId, cluster);
      });
    };
    
    net.nodes.forEach((node, idx) => {
      if (!visited.has(idx)) {
        const cluster = [];
        dfs(idx, cluster);
        detectedClusters.push(cluster);
      }
    });
    
    setClusters(detectedClusters.sort((a, b) => b.length - a.length));
  };

  const updateStats = (net) => {
    const s = net.nodes.reduce((acc, n) => {
      acc[n.status]++;
      return acc;
    }, { susceptible: 0, infected: 0, immune: 0, longcovid: 0 });
    
    setStats({
      susceptible: s.susceptible || 0,
      infected: s.infected || 0,
      immune: s.immune || 0,
      longCovid: s.longcovid || 0
    });
  };

  const simulateDay = () => {
    if (!network) return;

    const nodes = [...network.nodes];
    const newInfections = [];

    // Update existing infections
    nodes.forEach(node => {
      if (node.status === 'infected') {
        const daysSinceInfection = day - node.infectedDay;
        
        if (daysSinceInfection >= node.infectionDuration) {
          // Recovery
          if (Math.random() < 0.15) {
            node.status = 'longcovid';
          } else {
            node.status = 'immune';
          }
        } else if (daysSinceInfection >= 1) {
          // Spread infection
          node.neighbors.forEach(neighborId => {
            const neighbor = nodes[neighborId];
            if (neighbor.status === 'susceptible' && 
                Math.random() * 100 < config.spreadChance) {
              newInfections.push(neighborId);
            }
          });
        }
      }
    });

    // Apply new infections
    newInfections.forEach(nodeId => {
      nodes[nodeId].status = 'infected';
      nodes[nodeId].infectedDay = day;
      nodes[nodeId].infectionDuration = 10 + Math.floor(Math.random() * 5);
    });

    setNetwork({ ...network, nodes });
    updateStats({ ...network, nodes });
    setDay(d => d + 1);
  };

  // Animation loop
  useEffect(() => {
    if (isPlaying && network) {
      animationRef.current = setInterval(() => {
        simulateDay();
      }, 100);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, network, day, config]);

  // Initialize/Update Sigma visualization
  useEffect(() => {
    if (!sigmaLoaded || !network || !containerRef.current) return;

    try {
      // Clean up previous renderer
      if (rendererRef.current) {
        rendererRef.current.kill();
        rendererRef.current = null;
      }

      // Create new graph
      const Graph = window.Sigma.Graph || window.graphology?.Graph;
      if (!Graph) return;

      const graph = new Graph();
      graphRef.current = graph;

      // Add nodes
      network.nodes.forEach(node => {
        const clusterIdx = showClusters ? 
          clusters.findIndex(c => c.includes(node.id)) : -1;
        
        graph.addNode(node.id.toString(), {
          x: (node.x - 400) / 100,
          y: (node.y - 400) / 100,
          size: 8,
          label: `Agent ${node.id}`,
          color: showClusters && clusterIdx >= 0 ? 
            getClusterColor(clusterIdx) : 
            getNodeColor(node.status)
        });
      });

      // Add edges
      network.edges.forEach(edge => {
        try {
          graph.addEdge(
            edge.source.toString(), 
            edge.target.toString(), 
            {
              size: 1.5,
              color: '#94a3b8'
            }
          );
        } catch (e) {
          // Edge might already exist
        }
      });

      // Create renderer
      rendererRef.current = new window.Sigma(graph, containerRef.current, {
        renderEdgeLabels: false,
        defaultNodeColor: '#999',
        defaultEdgeColor: '#94a3b8',
        labelSize: 12,
        labelWeight: 'bold',
        enableEdgeEvents: false
      });

      applyLayout();
    } catch (error) {
      console.error('Error initializing visualization:', error);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.kill();
        rendererRef.current = null;
      }
    };
  }, [network, sigmaLoaded, layout, showClusters]);

  // Update node colors when status changes
  useEffect(() => {
    if (!graphRef.current || !network || !sigmaLoaded) return;

    network.nodes.forEach(node => {
      const nodeId = node.id.toString();
      if (graphRef.current.hasNode(nodeId)) {
        const clusterIdx = showClusters ? 
          clusters.findIndex(c => c.includes(node.id)) : -1;
        
        graphRef.current.setNodeAttribute(
          nodeId, 
          'color', 
          showClusters && clusterIdx >= 0 ? 
            getClusterColor(clusterIdx) : 
            getNodeColor(node.status)
        );
      }
    });

    if (rendererRef.current) {
      rendererRef.current.refresh();
    }
  }, [network?.nodes, showClusters, sigmaLoaded]);

  const getClusterColor = (idx) => {
    const colors = [
      '#ef4444', '#3b82f6', '#10b981', '#f59e0b', 
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];
    return colors[idx % colors.length];
  };

  const applyLayout = () => {
    if (!graphRef.current || !sigmaLoaded) return;

    const graph = graphRef.current;
    const nodes = graph.nodes();

    if (layout === 'force') {
      // Simple force-directed layout
      const iterations = 50;
      for (let i = 0; i < iterations; i++) {
        nodes.forEach(node => {
          let fx = 0, fy = 0;
          const pos1 = graph.getNodeAttributes(node);

          // Repulsion
          nodes.forEach(other => {
            if (node === other) return;
            const pos2 = graph.getNodeAttributes(other);
            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            const force = 0.5 / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          });

          // Attraction along edges
          graph.forEachNeighbor(node, neighbor => {
            const pos2 = graph.getNodeAttributes(neighbor);
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            fx += dx * 0.01;
            fy += dy * 0.01;
          });

          graph.setNodeAttribute(node, 'x', pos1.x + fx * 0.1);
          graph.setNodeAttribute(node, 'y', pos1.y + fy * 0.1);
        });
      }
    } else if (layout === 'circular') {
      nodes.forEach((node, idx) => {
        const angle = (idx / nodes.length) * 2 * Math.PI;
        const radius = 3;
        graph.setNodeAttribute(node, 'x', radius * Math.cos(angle));
        graph.setNodeAttribute(node, 'y', radius * Math.sin(angle));
      });
    } else if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(nodes.length));
      nodes.forEach((node, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        graph.setNodeAttribute(node, 'x', (col - cols / 2) * 0.5);
        graph.setNodeAttribute(node, 'y', (row - cols / 2) * 0.5);
      });
    }

    if (rendererRef.current) {
      rendererRef.current.refresh();
    }
  };

  const reset = () => {
    setIsPlaying(false);
    initializeNetwork();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              COVID-19 Network Simulation
            </h1>
            <p className="text-blue-100">
              Agent-Based Model with Interactive Network Visualization
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 p-6">
            {/* Visualization */}
            <div className="lg:col-span-2">
              <div className="bg-slate-50 rounded-xl p-4 relative">
                <div 
                  ref={containerRef}
                  className="w-full bg-white rounded-lg shadow-inner"
                  style={{ height: '600px' }}
                />

                {/* Day counter */}
                <div className="absolute top-6 left-6 bg-white px-4 py-2 rounded-lg shadow-lg">
                  <span className="text-2xl font-bold text-gray-800">Day {day}</span>
                </div>

                {/* Layout controls */}
                <div className="absolute top-6 right-6 flex flex-col gap-2">
                  <button
                    onClick={() => { setLayout('force'); applyLayout(); }}
                    className={`px-3 py-2 rounded-lg shadow-lg transition ${
                      layout === 'force' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                    title="Force-directed layout"
                  >
                    <Network className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setLayout('circular'); applyLayout(); }}
                    className={`px-3 py-2 rounded-lg shadow-lg transition ${
                      layout === 'circular' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                    title="Circular layout"
                  >
                    <Activity className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setLayout('grid'); applyLayout(); }}
                    className={`px-3 py-2 rounded-lg shadow-lg transition ${
                      layout === 'grid' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                    title="Grid layout"
                  >
                    <Layers className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowClusters(!showClusters)}
                    className={`px-3 py-2 rounded-lg shadow-lg transition ${
                      showClusters ? 'bg-purple-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                    title="Show network clusters"
                  >
                    <GitBranch className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Play
                    </>
                  )}
                </button>
                <button
                  onClick={reset}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-gray-700">Susceptible</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{stats.susceptible}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-gray-700">Infected</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">{stats.infected}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-gray-700">Immune</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">{stats.immune}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-medium text-gray-700">Long COVID</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">{stats.longCovid}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${(stats.infected / config.numAgents) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {((stats.infected / config.numAgents) * 100).toFixed(1)}% infected
                  </p>
                </div>
              </div>

              {/* Cluster Analysis */}
              {clusters.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Network Clusters</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-semibold">{clusters.length}</span> connected components detected
                    </p>
                    {clusters.slice(0, 5).map((cluster, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getClusterColor(idx) }}
                          ></div>
                          <span className="text-gray-700">Cluster {idx + 1}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{cluster.length} nodes</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Configuration */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Agents: {config.numAgents}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="50"
                      value={config.numAgents}
                      onChange={(e) => setConfig({...config, numAgents: Number(e.target.value)})}
                      className="w-full"
                      disabled={isPlaying}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avg Connections: {config.avgDegree}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="1"
                      value={config.avgDegree}
                      onChange={(e) => setConfig({...config, avgDegree: Number(e.target.value)})}
                      className="w-full"
                      disabled={isPlaying}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spread Chance: {config.spreadChance}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value={config.spreadChance}
                      onChange={(e) => setConfig({...config, spreadChance: Number(e.target.value)})}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Infected: {config.initialInfected}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={config.initialInfected}
                      onChange={(e) => setConfig({...config, initialInfected: Number(e.target.value)})}
                      className="w-full"
                      disabled={isPlaying}
                    />
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Layouts & Features</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <Network className="w-4 h-4" /> Force-directed layout
                  </p>
                  <p className="flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Circular layout
                  </p>
                  <p className="flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Grid layout
                  </p>
                  <p className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" /> Show network clusters
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