const StatusPanel = ({ status }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Network Status</h2>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Nodes:</span>
            <span className="font-medium">{status.num_nodes}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Edges:</span>
            <span className="font-medium">{status.num_edges}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Steps:</span>
            <span className="font-medium">{status.step_count}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Mean Activity:</span>
            <span className="font-medium">
              {status.mean_activity?.toFixed(4) || '0.0000'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Total Weight:</span>
            <span className="font-medium">
              {status.total_weight?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
        
        {/* Activity Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Activity Level</span>
            <span>{((status.mean_activity || 0) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (status.mean_activity || 0) * 100)}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatusPanel