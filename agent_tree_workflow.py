import os
import json
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from google import genai
from google.genai import types

# Load API key from .env manually if not using python-dotenv
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                os.environ["GEMINI_API_KEY"] = line.strip().split("=", 1)[1]

# Initialize SDK client (uses GEMINI_API_KEY environment variable)
client = genai.Client()

# List of search tasks for our Agent Tree
AGENT_TASKS = [
    {"query": "site:montreal.ca construction projets 2026", "type": "Public/Mixed", "city": "Montreal"},
    {"query": "site:laval.ca construction projets 2026", "type": "Public/Mixed", "city": "Laval"},
    {"query": "projets locatifs 2026 Rive-Nord Terrebonne", "type": "Rental", "city": "North Shore"},
    {"query": "projets immobiliers Montreal 2026 nouveaux", "type": "Residential/Commercial", "city": "Montreal"},
    {"query": "nouveaux hotels Montreal ouverture 2026", "type": "Hotel", "city": "Montreal"},
    {"query": "nouveaux parcs industriels 2026 Montreal Laval", "type": "Industrial", "city": "Montreal/Laval"},
    {"query": "Laval 2026 nouveaux immeubles bureaux", "type": "Office", "city": "Laval"},
    {"query": "projets industriels 2026 Rive-Sud Longueuil", "type": "Industrial", "city": "South Shore"},
]

def agent_search(task):
    print(f"🤖 [Agent Started] Searching for: {task['query']}")
    
    prompt = f"""
    You are an expert real estate data extraction agent. 
    Using your Google Search tool, find 3 to 5 real-world building construction projects or existing buildings related to the following query: "{task['query']}".
    
    Format your response EXACTLY as a JSON array of objects. Do not include markdown code blocks (like ```json), just the raw JSON text.
    Each object must have the following keys:
    - name: String (The name of the building or project)
    - type: String (Always use "{task['type']}")
    - city: String (Always use "{task['city']}")
    - lat: Number (Approximate latitude, e.g. 45.5)
    - lng: Number (Approximate longitude, e.g. -73.6)
    - year: Number (Usually 2026)
    """

    import time
    for attempt in range(5):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[{"google_search": {}}], # Enable Google Search Grounding
                    temperature=0.2,
                )
            )
            
            # Clean response text and parse JSON
            raw_json = response.text.strip()
            if raw_json.startswith("```json"):
                raw_json = raw_json[7:]
            if raw_json.endswith("```"):
                raw_json = raw_json[:-3]
                
            results = json.loads(raw_json)
            print(f"✅ [Agent Success] Found {len(results)} items for {task['query']}")
            return results
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "503" in error_msg:
                print(f"⏳ [Agent Retry] Rate limit hit for {task['query']}. Retrying in 15s... (Attempt {attempt+1}/5)")
                time.sleep(15)
            else:
                print(f"❌ [Agent Error] Failed for {task['query']}: {e}")
                return []
    
    print(f"❌ [Agent Error] Giving up on {task['query']} after 5 retries.")
    return []

def main():
    print("==================================================")
    print("⚡ INITIALIZING PYTHON GEMINI AGENT TREE")
    print("==================================================")
    
    all_found_buildings = []
    
    import time
    # Spawn agents sequentially to respect 5 RPM Free Tier quota
    for task in AGENT_TASKS:
        results = agent_search(task)
        all_found_buildings.extend(results)
        time.sleep(13)

    # Enrich data
    print("🚀 [Orchestrator] Enriching data...")
    for b in all_found_buildings:
        b['image_url'] = f"https://ui-avatars.com/api/?name={b['name'].replace(' ', '+')}&background=random&size=200"
        b['contact_info'] = "Contact Recherche: 514-555-0000"

    # Merge into data.json
    print("📦 [Orchestrator] Merging into data.json...")
    data_path = "data.json"
    
    if os.path.exists(data_path):
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = {"meta": {}, "inventory": []}

    next_id = max([b.get("id", 0) for b in data.get("inventory", [])], default=999) + 1
    
    added_count = 0
    for b in all_found_buildings:
        b_name = b.get('name', '').lower().strip()
        exists = any(
            b_name in existing.get('immeuble', '').lower() or 
            existing.get('immeuble', '').lower() in b_name 
            for existing in data.get("inventory", [])
        )
        
        if not exists and b_name:
            print(f"➕ [Adding] {b['name']}")
            data["inventory"].append({
                "id": next_id,
                "rang": 99,
                "immeuble": b['name'],
                "hauteur_m": 100 + random.randint(0, 50),
                "etages": 25,
                "annee": b.get('year', 2026),
                "usage": "Residential" if "Condo" in b['type'] else "Office",
                "latitude": b.get('lat', 45.5),
                "longitude": b.get('lng', -73.6),
                "zone": b['city'],
                "zone_lettre": b['city'][0].upper(),
                "age_2026": 0,
                "score_total": 5,
                "priorite": "Moyenne",
                "statut_public": "Projet 2026",
                "decideur_probable": "Promoteur immobilier",
                "angle_commercial": "Nouveau projet 2026",
                "mode_action": "Veille stratégique",
                "segment": "Commercial / institutionnel",
                "image_url": b['image_url'],
                "contact_info": b['contact_info']
            })
            next_id += 1
            added_count += 1

    data["meta"]["total_tours"] = len(data["inventory"])
    
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ WORKFLOW COMPLETE. Added {added_count} new buildings to data.json.")

if __name__ == "__main__":
    main()
