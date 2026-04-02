# Python Backend — Padrões de Referência

## FastAPI (Recomendado — moderno, rápido, auto-docs)

### Estrutura de projeto
```
app/
├── api/
│   ├── deps.py          # Dependências (DB session, auth)
│   └── v1/
│       ├── router.py
│       └── endpoints/
│           └── users.py
├── core/
│   ├── config.py        # Pydantic Settings
│   └── security.py      # JWT, hashing
├── db/
│   ├── base.py
│   └── session.py
├── models/              # SQLAlchemy models
├── schemas/             # Pydantic schemas (DTOs)
├── services/            # Business logic
└── main.py
```

### main.py padrão
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/api/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

### Endpoint padrão (FastAPI)
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return UserService(db).get_many(skip=skip, limit=limit)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    return UserService(db).create(payload)
```

### config.py (Pydantic Settings)
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "My API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
```

## .env padrão (Python)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

## requirements.txt essenciais
```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
sqlalchemy>=2.0.0
alembic>=1.13.0
pydantic-settings>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
psycopg2-binary>=2.9.0
redis>=5.0.0
python-multipart>=0.0.9
httpx>=0.27.0   # for testing
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

## Como executar (FastAPI)
```bash
# Instalar dependências
pip install -r requirements.txt

# Rodar migrações
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Testar
open http://localhost:8000/api/docs
```
