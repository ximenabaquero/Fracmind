import { useState, useEffect, useCallback } from 'react'
import NetworkVisualization from './components/NetworkVisualization'
import ControlPanel from './components/ControlPanel'
import StatusPanel from './components/StatusPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { networkAPI } from './services/api'

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [networkStatus, setNetworkStatus] = useState({
    num_nodes: 0,
    num_edges: 0,
    mean_activity: 0,
    total_weight: 0,
    step_count: 0
  })
  const [isRunning, setIsRunning] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1000) // ms

  // WebSocket connection for real-time updates
  const { lastMessage, connectionStatus } = useWebSocket('ws://localhost:8000/ws')

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data)
        
        if (message.type === 'step_applied' && message.data.graph) {
          setGraphData(message.data.graph)
        } else if (message.type === 'network_initialized') {
          // Refresh graph data when network is initialized
          fetchGraphData()
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
  }, [lastMessage])

  // Fetch initial data
  const fetchGraphData = useCallback(async () => {
    try {
      const data = await networkAPI.getGraph()
      setGraphData(data)
    } catch (error) {
      console.error('Failed to fetch graph data:', error)
    }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const status = await networkAPI.getStatus()
      setNetworkStatus(status)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    }
  }, [])

  useEffect(() => {
    fetchGraphData()
    fetchStatus()
  }, [fetchGraphData, fetchStatus])

  // Auto-simulation logic
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(async () => {
      try {
        await networkAPI.step({
          events: [],
          learning_rate: 0.01,
          homeostatic_threshold: 0.5
        })
        // Graph data will be updated via WebSocket
        fetchStatus()
      } catch (error) {
        console.error('Simulation step failed:', error)
        setIsRunning(false)
      }
    }, simulationSpeed)

    return () => clearInterval(interval)
  }, [isRunning, simulationSpeed, fetchStatus])

  const handleInitialize = async (params) => {
    try {
      await networkAPI.initialize(params)
      await fetchGraphData()
      await fetchStatus()
    } catch (error) {
      console.error('Network initialization failed:', error)
    }
  }

  const handleStep = async (params) => {
    try {
      await networkAPI.step(params)
      await fetchStatus()
    } catch (error) {
      console.error('Step failed:', error)
    }
  }

  const handleStimulateNode = async (nodeId, stimulus) => {
    try {
      await networkAPI.stimulateNode(nodeId, stimulus)
      await fetchGraphData()
      await fetchStatus()
    } catch (error) {
      console.error('Node stimulation failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">FracMind</h1>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'Connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {connectionStatus}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <ControlPanel
                onInitialize={handleInitialize}
                onStep={handleStep}
                isRunning={isRunning}
                onToggleRunning={() => setIsRunning(!isRunning)}
                simulationSpeed={simulationSpeed}
                onSpeedChange={setSimulationSpeed}
              />
              <StatusPanel status={networkStatus} />
            </div>
          </div>

          {/* Network Visualization */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Network Visualization</h2>
              </div>
              <div className="p-4">
                <NetworkVisualization
                  graphData={graphData}
                  onNodeClick={handleStimulateNode}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
