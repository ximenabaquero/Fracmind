from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, TIMESTAMP, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fracmind:fracmind@localhost:5432/fracmind")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(100))
    act = Column(Float, default=0.0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    outgoing_edges = relationship("Edge", foreign_keys="Edge.src", back_populates="source_node")
    incoming_edges = relationship("Edge", foreign_keys="Edge.dst", back_populates="target_node")

class Edge(Base):
    __tablename__ = "edges"
    
    id = Column(Integer, primary_key=True, index=True)
    src = Column(Integer, ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    dst = Column(Integer, ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    weight = Column(Float, default=0.0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    source_node = relationship("Node", foreign_keys=[src], back_populates="outgoing_edges")
    target_node = relationship("Node", foreign_keys=[dst], back_populates="incoming_edges")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
Base.metadata.create_all(bind=engine)