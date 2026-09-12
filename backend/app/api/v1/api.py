from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, patients, documents, rag, graph, agents

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(documents.router)
api_router.include_router(rag.router)
api_router.include_router(graph.router)
api_router.include_router(agents.router)
