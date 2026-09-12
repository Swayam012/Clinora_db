from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field


class GraphNode(BaseModel):
    """Represents an entity node in the Clinical Knowledge Graph."""
    id: str = Field(..., description="Unique node identifier")
    label: str = Field(..., description="Display label")
    type: str = Field(..., description="Entity type: patient, condition, medication, lab, document, physician")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Metadata properties")
    size: int = Field(default=24, description="Node visual radius/size")
    color: Optional[str] = Field(default=None, description="Visual badge color")


class GraphEdge(BaseModel):
    """Represents a directed relationship between two clinical entities."""
    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    type: str = Field(..., description="Relationship type")
    label: str = Field(..., description="Human-readable edge label")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Relationship metadata")


class GraphStats(BaseModel):
    """Summary telemetry for the clinical knowledge graph."""
    total_nodes: int
    total_edges: int
    node_types: Dict[str, int]
    edge_types: Dict[str, int]
    top_diagnoses: List[Dict[str, Any]] = []
    top_medications: List[Dict[str, Any]] = []


class GraphData(BaseModel):
    """Complete graph payload returned to the frontend visualization."""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: GraphStats
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
