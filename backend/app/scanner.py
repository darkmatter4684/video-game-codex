import os
import re
from pathlib import Path
from typing import List

# Common irrelevant words/tokens to remove
BLOCKLIST = {
    "codex", "plaza", "skidrow", "reloaded", "fitgirl", "dodi", "repack", 
    "wot", "goty", "dlc", "multi", "multi5", "update", "v1.0", "v1", "v2", 
    "installer", "setup", "bin", "data", "usa", "eur", "jap", "gog", "mechanics", "r.g."
}

def clean_name(folder_name: str) -> str:
    name = folder_name
    
    # 0. Remove [Content] blocks completely as they often contain group names
    name = re.sub(r"\[.*?\]", " ", name)
    
    # 0.5 Remove version patterns like v1.0, v1.6 BEFORE replacing dots
    name = re.sub(r"v\d+(\.\d+)+", " ", name, flags=re.IGNORECASE)

    # 1. Replace separators with spaces
    name = re.sub(r"[._\-]", " ", name)
    
    # 2. Extract Year if present (e.g. 1999, 2023) ONLY if in parenthesis
    name = re.sub(r"\((19|20)\d{2}\)", " ", name)
    
    # 3. Tokenize
    tokens = name.split()
    
    # 4. Filter tokens
    filtered_tokens = []
    for token in tokens:
        # Check against blocklist (case insensitive)
        if token.lower() in BLOCKLIST:
            continue
            
        # Version Check (v1.6 etc)
        if re.match(r"^v\d+(\.\d+)*$", token.lower()):
            continue
            
        filtered_tokens.append(token)
        
    if not filtered_tokens:
        return folder_name # Fallback
        
    return " ".join(filtered_tokens).title()

def scan_directory(root_path: str) -> List[dict]:
    """
    Scans a directory for probable game folders.
    Returns a list of dicts with keys: path, name_on_disk, extracted_name
    """
    found_games = []
    
    # Validate path exists
    path_obj = Path(root_path)
    if not path_obj.exists():
        print(f"Warning: Path {root_path} does not exist.")
        return found_games
        
    # Simple scan: Look at immediate subdirectories
    # Can be recursive if needed, but "Game Library" folders usually are 1 level deep
    try:
        for entry in os.scandir(root_path):
            if entry.is_dir():
                cleaned = clean_name(entry.name)
                found_games.append({
                    "path": entry.path,
                    "name_on_disk": entry.name,
                    "extracted_name": cleaned
                })
    except PermissionError:
        print(f"Permission denied accessing {root_path}")
        
    return found_games
