from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlmodel import SQLModel, create_engine, Session, select
from typing import List
import os
import scanner
import resolver
from models import Game, ScanPath, GameStatus

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL")
# Wait for DB to be ready in production, but handled by docker depends_on mostly.
# Using a retry loop here is better practice but keeping simple for now.
engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan, title="Video Game Codex API")

@app.get("/")
def read_root():
    return {"message": "Video Game Codex API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- GAMES ---

@app.get("/games", response_model=List[Game])
def get_games(session: Session = Depends(get_session)):
    games = session.exec(select(Game)).all()
    return games

@app.get("/games/{game_id}", response_model=Game)
def get_game(game_id: str, session: Session = Depends(get_session)):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

# --- SCANNER ---

@app.post("/scan-paths", response_model=ScanPath)
def add_scan_path(path: str, session: Session = Depends(get_session)):
    # Check if exists
    existing = session.exec(select(ScanPath).where(ScanPath.path == path)).first()
    if existing:
        return existing
    
    scan_path = ScanPath(path=path)
    session.add(scan_path)
    session.commit()
    session.refresh(scan_path)
    return scan_path

@app.get("/scan-paths", response_model=List[ScanPath])
def get_scan_paths(session: Session = Depends(get_session)):
    return session.exec(select(ScanPath)).all()

def run_scan_task(session_factory):
    with Session(session_factory) as session:
        paths = session.exec(select(ScanPath)).all()
        for sp in paths:
            print(f"Scanning {sp.path}...")
            results = scanner.scan_directory(sp.path)
            for res in results:
                # Check absolute path duplication
                existing = session.exec(select(Game).where(Game.path == res["path"])).first()
                if not existing:
                    new_game = Game(
                        name_on_disk=res["name_on_disk"],
                        extracted_name=res["extracted_name"],
                        path=res["path"],
                        status=GameStatus.PENDING
                    )
                    session.add(new_game)
        session.commit()
        print("Scan complete.")

@app.post("/scan/start")
def start_scan(background_tasks: BackgroundTasks):
    # Pass engine to background task to create own session
    background_tasks.add_task(run_scan_task, engine)
    return {"message": "Scan started in background"}

# --- RESOLVER ---

@app.post("/games/{game_id}/resolve")
def resolve_game(game_id: str, session: Session = Depends(get_session)):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
        
    # Use extracted name for search
    metadata = resolver.resolver.search_game(game.extracted_name)
    
    if metadata:
        game.status = GameStatus.RESOLVED
        game.title = metadata.get("name")
        game.summary = metadata.get("summary")
        game.rating = metadata.get("rating")
        
        # Process Cover URL (default is usually thumb, we might want to replace t_thumb with t_cover_big)
        if "cover" in metadata and "url" in metadata["cover"]:
            game.cover_url = "https:" + metadata["cover"]["url"].replace("t_thumb", "t_cover_big")
            
        session.add(game)
        session.commit()
        session.refresh(game)
        return game
    else:
        return {"message": "No metadata found", "game": game}

@app.delete("/games/{game_id}")
def delete_game(game_id: str, session: Session = Depends(get_session)):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    session.delete(game)
    session.commit()
    return {"message": "Game deleted"}
