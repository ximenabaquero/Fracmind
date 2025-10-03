# FracMind

A neural network dynamics simulation platform implementing Hebbian learning with homeostatic scaling and small-world network topology.

## Features

- **Small-World Networks**: Watts-Strogatz topology initialization
- **Hebbian Learning**: Dynamic weight updates based on correlated activity
- **Homeostatic Scaling**: Automatic activity regulation to prevent runaway dynamics
- **Real-time Visualization**: Interactive network graph with D3.js
- **WebSocket Updates**: Live simulation updates
- **ε-greedy Perturbation**: Automatic perturbation when dynamics reach plateau

## Architecture

### Backend (FastAPI)
- PostgreSQL database with `nodes` and `edges` tables
- REST API endpoints: `/init`, `/step`, `/graph`, `/status`
- WebSocket support for real-time updates
- NetworkX for graph generation and analysis

### Frontend (React + Vite + Tailwind)
- Interactive network visualization using react-force-graph-2d
- Control panel for network parameters and simulation controls  
- Real-time status monitoring
- Node stimulation through click interactions

### Database Schema
```sql
-- Nodes table
nodes(id, label, act, created_at, updated_at)

-- Edges table  
edges(id, src, dst, weight, created_at, updated_at)
```

## Quick Start

1. **Start all services with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:5432

## API Endpoints

### POST /init
Initialize network with Watts-Strogatz topology
```json
{
  "n": 80,        // Number of nodes
  "k": 6,         // Initial connections per node
  "p": 0.1        // Rewiring probability
}
```

### POST /step
Apply one dynamics step
```json
{
  "events": [],                    // External stimulation events
  "learning_rate": 0.01,          // Hebbian learning rate (η)
  "homeostatic_threshold": 0.5    // Activity threshold (τ)
}
```

### GET /graph
Get current network state (nodes and edges)

### GET /status
Get network statistics

### POST /stimulate/{node_id}?stimulus={value}
Apply stimulus to specific node

## Network Dynamics

### Hebbian Learning Rule
```
Δw = η * x_a * x_b
```
Where:
- `η` is the learning rate
- `x_a` and `x_b` are pre- and post-synaptic activities

### Homeostatic Scaling
When mean network activity exceeds threshold τ:
- Scale all activities: `activity *= τ / mean_activity`
- Slightly reduce weights: `weight *= 0.98`

### ε-greedy Perturbation
When activity variance drops below 0.001 for 10+ steps:
- Apply random stimulus with probability ε=0.1
- Helps escape local minima and maintain dynamics

## Development

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Local Development

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Database
```bash
docker run -p 5432:5432 -e POSTGRES_DB=fracmind -e POSTGRES_USER=fracmind -e POSTGRES_PASSWORD=fracmind postgres:15
```

## Usage

1. **Initialize Network**: Set parameters (n, k, p) and click "Initialize Network"
2. **Run Simulation**: Use "Run" for continuous simulation or "Single Step" for manual control
3. **Interact with Nodes**: 
   - Click nodes to apply positive stimulus (+0.2)
   - Shift+Click for negative stimulus (-0.2)
   - Drag nodes to reposition
4. **Monitor Status**: Watch network statistics and activity levels in real-time

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (default: postgresql://fracmind:fracmind@database:5432/fracmind)

### Network Parameters
- **n**: Number of nodes (10-200)
- **k**: Initial connections per node (2-20)
- **p**: Rewiring probability (0-1)
- **η**: Learning rate (0.001-0.1)
- **τ**: Homeostatic threshold (0.1-2.0)

## License

MIT License - see LICENSE file for details.