from typing import Optional
from sqlmodel import Field, SQLModel
from uuid import UUID, uuid4
from datetime import datetime
import enum

class GameStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    RESOLVED = "resolved"
    IGNORED = "ignored"

class Game(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name_on_disk: str
    extracted_name: str
    path: str = Field(index=True, unique=True)
    status: GameStatus = Field(default=GameStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Metadata fields (can be moved to separate table if complex)
    igdb_id: Optional[str] = None
    title: Optional[str] = None
    release_date: Optional[str] = None
    platforms: Optional[str] = None
    cover_url: Optional[str] = None
    summary: Optional[str] = None
    rating: Optional[float] = None
    genres: Optional[str] = None

class ScanPath(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    path: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
