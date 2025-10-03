from pydantic import BaseModel
from typing import List, Optional

class NodeBase(BaseModel):
    label: Optional[str] = None
    act: float = 0.0

class NodeCreate(NodeBase):
    pass

class NodeUpdate(BaseModel):
    act: Optional[float] = None

class Node(NodeBase):
    id: int
    
    class Config:
        from_attributes = True

class EdgeBase(BaseModel):
    src: int
    dst: int
    weight: float = 0.0

class EdgeCreate(EdgeBase):
    pass

class EdgeUpdate(BaseModel):
    weight: Optional[float] = None

class Edge(EdgeBase):
    id: int
    
    class Config:
        from_attributes = True

class GraphData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class InitRequest(BaseModel):
    n: int = 80
    k: int = 6  
    p: float = 0.1

class StepRequest(BaseModel):
    events: Optional[List[dict]] = []
    learning_rate: float = 0.01
    homeostatic_threshold: float = 0.5

class NetworkStatus(BaseModel):
    num_nodes: int
    num_edges: int
    mean_activity: float
    total_weight: float
    step_count: int