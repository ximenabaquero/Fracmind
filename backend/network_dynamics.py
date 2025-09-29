import networkx as nx
import numpy as np
from typing import List, Tuple, Dict, Any
import random
from sqlalchemy.orm import Session
from database import Node, Edge

class NetworkDynamics:
    def __init__(self):
        self.step_count = 0
        self.plateau_threshold = 10  # Steps without significant change
        self.last_activities = []
        self.epsilon = 0.1  # For ε-greedy perturbation
        
    def create_watts_strogatz(self, db: Session, n: int = 80, k: int = 6, p: float = 0.1) -> Dict[str, Any]:
        """Create a Watts-Strogatz small-world network"""
        # Clear existing network
        db.query(Edge).delete()
        db.query(Node).delete()
        db.commit()
        
        # Create NetworkX graph
        G = nx.watts_strogatz_graph(n, k, p)
        
        # Create nodes
        nodes = []
        for i in range(n):
            node = Node(
                label=f"node_{i}",
                act=np.random.random() * 0.1  # Small initial random activity
            )
            db.add(node)
            nodes.append(node)
        
        db.commit()
        
        # Refresh nodes to get IDs
        for node in nodes:
            db.refresh(node)
        
        # Create edges with random initial weights
        edges = []
        for src, dst in G.edges():
            edge = Edge(
                src=nodes[src].id,
                dst=nodes[dst].id,
                weight=np.random.normal(0.5, 0.1)  # Initial weights around 0.5
            )
            db.add(edge)
            edges.append(edge)
            
            # Create reverse edge for undirected behavior if desired
            reverse_edge = Edge(
                src=nodes[dst].id,
                dst=nodes[src].id,
                weight=np.random.normal(0.5, 0.1)
            )
            db.add(reverse_edge)
            edges.append(reverse_edge)
        
        db.commit()
        self.step_count = 0
        
        return {
            "message": f"Created Watts-Strogatz network with {n} nodes, k={k}, p={p}",
            "nodes": len(nodes),
            "edges": len(edges)
        }
    
    def apply_dynamics_step(self, db: Session, learning_rate: float = 0.01, 
                          homeostatic_threshold: float = 0.5, events: List[Dict] = None) -> Dict[str, Any]:
        """Apply one step of network dynamics with Hebbian learning and homeostatic scaling"""
        
        # Get all nodes and edges
        nodes = db.query(Node).all()
        edges = db.query(Edge).all()
        
        if not nodes:
            return {"error": "No network initialized"}
        
        # Apply external events if any
        if events:
            for event in events:
                node_id = event.get('node_id')
                stimulus = event.get('stimulus', 0.0)
                if node_id:
                    node = db.query(Node).filter(Node.id == node_id).first()
                    if node:
                        node.act += stimulus
        
        # Store old activities
        old_activities = {node.id: node.act for node in nodes}
        
        # Update node activities based on weighted inputs
        new_activities = {}
        for node in nodes:
            # Get incoming edges
            incoming = db.query(Edge).filter(Edge.dst == node.id).all()
            
            # Calculate new activity as weighted sum of inputs + decay
            input_sum = sum(old_activities[edge.src] * edge.weight for edge in incoming)
            
            # Simple activation function with decay
            decay = 0.9
            new_act = decay * node.act + 0.1 * np.tanh(input_sum)
            new_activities[node.id] = max(0, new_act)  # ReLU-like
        
        # Update node activities
        for node in nodes:
            node.act = new_activities[node.id]
        
        # Apply Hebbian learning: Δw = η * x_a * x_b
        for edge in edges:
            src_activity = new_activities[edge.src]
            dst_activity = new_activities[edge.dst]
            
            # Hebbian update
            delta_w = learning_rate * src_activity * dst_activity
            edge.weight += delta_w
            
            # Keep weights in reasonable bounds
            edge.weight = np.clip(edge.weight, -2.0, 2.0)
        
        # Check for homeostatic scaling
        mean_activity = np.mean(list(new_activities.values()))
        if mean_activity > homeostatic_threshold:
            # Scale down all activities
            scaling_factor = homeostatic_threshold / mean_activity
            for node in nodes:
                node.act *= scaling_factor
            
            # Also scale weights slightly
            for edge in edges:
                edge.weight *= 0.98
        
        # ε-greedy perturbation if in plateau
        self.last_activities.append(mean_activity)
        if len(self.last_activities) > self.plateau_threshold:
            self.last_activities.pop(0)
            
            # Check if we're in a plateau (low variance in recent activities)
            if len(self.last_activities) == self.plateau_threshold:
                variance = np.var(self.last_activities)
                if variance < 0.001:  # Plateau detected
                    # Apply random perturbation
                    if random.random() < self.epsilon:
                        random_node = random.choice(nodes)
                        random_node.act += np.random.normal(0, 0.1)
        
        db.commit()
        self.step_count += 1
        
        # Calculate statistics
        total_weight = sum(abs(edge.weight) for edge in edges)
        
        return {
            "step": self.step_count,
            "mean_activity": mean_activity,
            "total_weight": total_weight,
            "homeostatic_scaling": mean_activity > homeostatic_threshold,
            "nodes_updated": len(nodes),
            "edges_updated": len(edges)
        }
    
    def get_network_status(self, db: Session) -> Dict[str, Any]:
        """Get current network status"""
        nodes = db.query(Node).all()
        edges = db.query(Edge).all()
        
        if not nodes:
            return {
                "num_nodes": 0,
                "num_edges": 0,
                "mean_activity": 0.0,
                "total_weight": 0.0,
                "step_count": self.step_count
            }
        
        mean_activity = np.mean([node.act for node in nodes])
        total_weight = sum(edge.weight for edge in edges)
        
        return {
            "num_nodes": len(nodes),
            "num_edges": len(edges),
            "mean_activity": mean_activity,
            "total_weight": total_weight,
            "step_count": self.step_count
        }