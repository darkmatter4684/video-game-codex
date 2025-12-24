# Video Game Codex

A full-stack application to index, catalog, and enrich your local video game library.

## Features
- **Scanner**: Recursively finds game directories on any mounted drive.
- **Resolver**: Automatically cleans messy directory names and fetches metadata from IGDB.
- **Library**: Browse your collection with cover art, ratings, and filters.

## Prerequisites
- Docker & Docker Compose
- [IGDB API Credentials](https://dev.twitch.tv/console) (Client ID & Secret)

## Setup

1. **Configure Environment**
   Copy `.env.example` to `.env` and fill in your IGDB credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your keys
   ```

2. **Start the App**
   ```bash
   docker compose up -d --build
   ```

3. **Access**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## How to Use

1. Go to the **Scanner** tab.
2. Enter the path to your games (e.g., `/mnt/d/Games`).
   - *Note: On WSL2, your drives are usually at `/mnt/c`, `/mnt/d`, etc.*
3. Click **Add Path**, then **Start Full Scan**.
4. Go to **Library** to see found games.
5. Click **Auto-Resolve Metadata** on any game to fetch details.

