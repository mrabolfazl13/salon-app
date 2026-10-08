---
name: backend-developer
description: FastAPI backend development skill for futsal booking system. Handles API design, database migrations, service layer implementation, security hardening, and performance optimization.
metadata:
  type: project
  version: "1.0"
  phase: all
---

# Backend Developer Skill - Futsal Booking System

## Responsibilities
- Design and implement FastAPI endpoints
- Create SQLModel schemas and database migrations
- Implement business logic in service layer
- Configure Celery background jobs
- Set up Redis caching strategies
- Implement WebSocket real-time features
- Security hardening (JWT, CORS, rate limiting)
- Performance optimization (pagination, indexing, query optimization)

## Tech Stack
- **Framework**: FastAPI 0.141
- **ORM**: SQLModel 0.0.42 (SQLAlchemy + Pydantic)
- **Database**: PostgreSQL 15 with Alembic migrations
- **Cache/Queue**: Redis 7
- **Task Queue**: Celery 5.6
- **Auth**: JWT (python-jose), Argon2 password hashing
- **Storage**: MinIO (S3-compatible)
- **WebSocket**: Real-time communication

## Development Guidelines

### 1. API Design Patterns
```python
# Always use router pattern
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/resource", tags=["resource"])

@router.get("/")
async def list_resources():
    pass

@router.post("/")
async def create_resource():
    pass

@router.get("/{id}")
async def get_resource(id: int):
    pass

@router.put("/{id}")
async def update_resource(id: int):
    pass

@router.delete("/{id}")
async def delete_resource(id: int):
    pass
```

### 2. Database Migration Rules
- Always create reversible migrations (up/down)
- Test migrations on copy of production data
- Include rollback scripts
- Never modify existing migrations
- Use batch operations for large data changes

### 3. Service Layer Pattern
```python
# Separate business logic from routes
class ResourceService:
    @staticmethod
    async def create(data: CreateSchema) -> Resource:
        # Validate
        # Process business rules
        # Save to DB
        # Return result
        pass
```

### 4. Security Checklist
- [ ] JWT validation on protected endpoints
- [ ] Role-based access control (RBAC)
- [ ] Input validation with Pydantic
- [ ] SQL injection prevention (use ORM)
- [ ] Rate limiting on public endpoints
- [ ] CORS configuration
- [ ] Request size limits
- [ ] Audit logging for sensitive operations

### 5. Error Handling
```python
from fastapi import HTTPException

# Use standard error responses
raise HTTPException(
    status_code=404,
    detail="Resource not found"
)

# Custom exceptions for business logic
class BusinessRuleError(Exception):
    pass
```

## Testing Requirements
- Unit tests for all services
- Integration tests for API endpoints
- Database migration tests
- WebSocket connection tests
- Load testing for critical paths

## Code Review Checklist
- [ ] Follows repository pattern
- [ ] Proper error handling
- [ ] Type hints everywhere
- [ ] Docstrings for public methods
- [ ] No hardcoded values
- [ ] Environment variables for config
- [ ] Logging at appropriate levels
- [ ] Performance considerations documented

## Common Tasks

### Adding New Endpoint
1. Create/update router in `src/api/v1/`
2. Add service method in `src/services/`
3. Add repository method if needed
4. Write unit tests
5. Update OpenAPI docs
6. Add to integration test suite

### Database Migration
1. Generate migration: `alembic revision --autogenerate -m "description"`
2. Review generated migration
3. Add custom data migrations if needed
4. Test upgrade/downgrade locally
5. Document breaking changes
6. Run on staging first

### Background Job
1. Define task in `src/tasks/`
2. Register in Celery app
3. Add monitoring/metrics
4. Handle failures gracefully
5. Add retry logic where appropriate

## Phase-Specific Priorities

### Phase 0 (Critical Fixes)
- Fix CI/CD signing configuration
- Remove hardcoded venue_id values
- Finalize database migrations
- Security hardening (CORS, rate limiting)
- Build optimization

### Phase 1 (Core Completion)
- Split payment for teams
- Automated notifications engine
- Smart waitlist auto-fill
- Financial reconciliation automation
- Contract renewal automation

See `docs/roadmap/development-phases.md` for full roadmap.
