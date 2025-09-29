import { useState } from 'react'

const ControlPanel = ({ 
  onInitialize, 
  onStep, 
  isRunning, 
  onToggleRunning, 
  simulationSpeed, 
  onSpeedChange 
}) => {
  const [networkParams, setNetworkParams] = useState({
    n: 80,
    k: 6,
    p: 0.1
  })

  const [stepParams, setStepParams] = useState({
    learning_rate: 0.01,
    homeostatic_threshold: 0.5
  })

  const handleInitialize = () => {
    onInitialize(networkParams)
  }

  const handleStep = () => {
    onStep({
      events: [],
      ...stepParams
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Control Panel</h2>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Network Initialization */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Network Initialization</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nodes (n)
              </label>
              <input
                type="number"
                value={networkParams.n}
                onChange={(e) => setNetworkParams({
                  ...networkParams,
                  n: parseInt(e.target.value)
                })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                min="10"
                max="200"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Connections (k)
              </label>
              <input
                type="number"
                value={networkParams.k}
                onChange={(e) => setNetworkParams({
                  ...networkParams,
                  k: parseInt(e.target.value)
                })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                min="2"
                max="20"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rewiring Probability (p)
              </label>
              <input
                type="number"
                step="0.01"
                value={networkParams.p}
                onChange={(e) => setNetworkParams({
                  ...networkParams,
                  p: parseFloat(e.target.value)
                })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                min="0"
                max="1"
              />
            </div>
            
            <button
              onClick={handleInitialize}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Initialize Network
            </button>
          </div>
        </div>

        {/* Simulation Controls */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Simulation Controls</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Learning Rate (η)
              </label>
              <input
                type="number"
                step="0.001"
                value={stepParams.learning_rate}
                onChange={(e) => setStepParams({
                  ...stepParams,
                  learning_rate: parseFloat(e.target.value)
                })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                min="0.001"
                max="0.1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Homeostatic Threshold (τ)
              </label>
              <input
                type="number"
                step="0.01"
                value={stepParams.homeostatic_threshold}
                onChange={(e) => setStepParams({
                  ...stepParams,
                  homeostatic_threshold: parseFloat(e.target.value)
                })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                min="0.1"
                max="2.0"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Speed (ms)
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={simulationSpeed}
                onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{simulationSpeed}ms</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleStep}
                disabled={isRunning}
                className="bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Single Step
              </button>
              
              <button
                onClick={onToggleRunning}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isRunning
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRunning ? 'Stop' : 'Run'}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <div><strong>Click nodes</strong> to stimulate (+0.2)</div>
          <div><strong>Shift+Click</strong> for negative stimulus (-0.2)</div>
          <div><strong>Drag nodes</strong> to reposition</div>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel