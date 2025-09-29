from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
import asyncio
from typing import List

from database import get_db, Node, Edge
from models import GraphData, InitRequest, StepRequest, NetworkStatus, Node as NodeModel, Edge as EdgeModel
from network_dynamics import NetworkDynamics

app = FastAPI(title="FracMind API", description="Neural network dynamics simulation API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global network dynamics instance
network_dynamics = NetworkDynamics()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove dead connections
                if connection in self.active_connections:
                    self.active_connections.remove(connection)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "FracMind API is running"}

@app.post("/init")
async def initialize_network(request: InitRequest, db: Session = Depends(get_db)):
    """Initialize the network with Watts-Strogatz topology"""
    try:
        result = network_dynamics.create_watts_strogatz(
            db, n=request.n, k=request.k, p=request.p
        )
        
        # Broadcast update to connected clients
        await manager.broadcast(json.dumps({
            "type": "network_initialized",
            "data": result
        }))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/step")
async def simulation_step(request: StepRequest, db: Session = Depends(get_db)):
    """Apply one step of network dynamics"""
    try:
        result = network_dynamics.apply_dynamics_step(
            db, 
            learning_rate=request.learning_rate,
            homeostatic_threshold=request.homeostatic_threshold,
            events=request.events or []
        )
        
        # Get updated graph data
        graph_data = await get_graph_data(db)
        
        # Broadcast update to connected clients
        await manager.broadcast(json.dumps({
            "type": "step_applied",
            "data": {
                "step_result": result,
                "graph": graph_data
            }
        }))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph")
async def get_graph(db: Session = Depends(get_db)):
    """Get current graph state"""
    return await get_graph_data(db)

async def get_graph_data(db: Session) -> dict:
    """Helper function to get formatted graph data"""
    nodes = db.query(Node).all()
    edges = db.query(Edge).all()
    
    # Format for frontend consumption
    node_data = [
        {
            "id": node.id,
            "label": node.label,
            "act": node.act
        }
        for node in nodes
    ]
    
    edge_data = [
        {
            "id": edge.id,
            "source": edge.src,  # D3.js expects 'source' and 'target'
            "target": edge.dst,
            "weight": edge.weight
        }
        for edge in edges
    ]
    
    return {
        "nodes": node_data,
        "links": edge_data  # D3.js expects 'links'
    }

@app.get("/status")
async def get_status(db: Session = Depends(get_db)):
    """Get network status and statistics"""
    return network_dynamics.get_network_status(db)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            
            # Echo back or handle client messages if needed
            await manager.send_personal_message(f"Message received: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/stimulate/{node_id}")
async def stimulate_node(node_id: int, stimulus: float, db: Session = Depends(get_db)):
    """Apply stimulus to a specific node"""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Apply stimulus
    node.act += stimulus
    node.act = max(0, node.act)  # Keep non-negative
    db.commit()
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "node_stimulated",
        "data": {
            "node_id": node_id,
            "new_activity": node.act,
            "stimulus": stimulus
        }
    }))
    
    return {"message": f"Applied stimulus {stimulus} to node {node_id}", "new_activity": node.act}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)