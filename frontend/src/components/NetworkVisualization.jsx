import { useEffect, useRef } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

const NetworkVisualization = ({ graphData, onNodeClick }) => {
  const fgRef = useRef()

  useEffect(() => {
    // Auto-fit graph when data changes
    if (fgRef.current && graphData.nodes.length > 0) {
      fgRef.current.zoomToFit(400)
    }
  }, [graphData])

  const handleNodeClick = (node, event) => {
    // Apply stimulus when node is clicked
    const stimulus = event.shiftKey ? -0.2 : 0.2 // Negative stimulus with Shift key
    onNodeClick(node.id, stimulus)
  }

  const nodeColor = (node) => {
    // Color nodes based on activity level
    const activity = Math.max(0, Math.min(1, node.act))
    const red = Math.floor(255 * activity)
    const blue = Math.floor(255 * (1 - activity))
    return `rgb(${red}, 0, ${blue})`
  }

  const nodeSize = (node) => {
    // Size nodes based on activity level
    return 3 + (node.act || 0) * 7
  }

  const linkColor = (link) => {
    // Color links based on weight
    const weight = link.weight || 0
    const opacity = Math.min(1, Math.abs(weight))
    return weight >= 0 
      ? `rgba(0, 150, 0, ${opacity})` 
      : `rgba(150, 0, 0, ${opacity})`
  }

  const linkWidth = (link) => {
    // Width based on weight magnitude
    return Math.max(0.5, Math.abs(link.weight || 0) * 2)
  }

  return (
    <div className="w-full h-96 bg-gray-50 rounded border">
      {graphData.nodes.length > 0 ? (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeLabel={(node) => `Node ${node.id}: Activity ${node.act?.toFixed(3) || '0.000'}`}
          nodeColor={nodeColor}
          nodeVal={nodeSize}
          onNodeClick={handleNodeClick}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          backgroundColor="#f8fafc"
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTicks={100}
          d3AlphaDecay={0.0228}
          d3VelocityDecay={0.4}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">No Network Data</div>
            <div className="text-sm">Initialize a network to begin visualization</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NetworkVisualization