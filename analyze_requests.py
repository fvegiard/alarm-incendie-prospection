import os
import glob
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from google import genai
from google.genai import types

def get_user_requests():
    brain_dir = "/home/fvegi/.gemini/antigravity/brain"
    log_files = glob.glob(f"{brain_dir}/*/.system_generated/logs/overview.txt")
    
    # Sort files by modification time to get the last 8 logs
    log_files.sort(key=os.path.getmtime, reverse=True)
    last_8_logs = log_files[:8]
    
    all_requests = []
    
    for log_file in last_8_logs:
        with open(log_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if data.get("source") == "USER_EXPLICIT" and "content" in data:
                        content = data["content"]
                        if "<USER_REQUEST>" in content and "</USER_REQUEST>" in content:
                            req = content.split("<USER_REQUEST>")[1].split("</USER_REQUEST>")[0].strip()
                            all_requests.append(req)
                except Exception:
                    pass
    return all_requests

def analyze_requests_with_agent(agent_id, requests_text):
    # Load API key
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    os.environ["GEMINI_API_KEY"] = line.strip().split("=", 1)[1]

    client = genai.Client()
    
    perspectives = [
        "Data & Sources: Focus on what geographic zones, types of buildings, or enrichment data (emails, phones) might be missing.",
        "Infrastructure & Code: Focus on workflow stability, deployment, automation triggers, and database integration.",
        "Business Logic & Next Steps: Focus on what the user ultimately wants to achieve (dashboard value, alerting) and what conceptual steps are missing."
    ]
    
    perspective = perspectives[agent_id - 1]
    
    prompt = f"""
    You are Agent {agent_id}. Your focus is: {perspective}.
    
    Here are the user's requests from the last 8 conversation logs across their 'Prospection Alarmes Incendie' project:
    
    {requests_text}
    
    Based on these requests and your specific focus, identify EXACTLY what is missing in the current workflow. 
    Provide a concise analysis (3-4 bullet points).
    """

    print(f"🤖 [Agent {agent_id}] Analyzing user requests...")
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.4)
        )
        return f"--- Agent {agent_id} Analysis ({perspective.split(':')[0]}) ---\n{response.text}\n"
    except Exception as e:
        return f"Agent {agent_id} failed: {e}"

def main():
    print("Gathering user requests from the last 8 logs...")
    requests = get_user_requests()
    print(f"Found {len(requests)} user requests.")
    
    requests_text = "\\n- ".join(requests)
    
    print("\\n🚀 Launching 3 Analysis Agents...")
    
    print("\\n🚀 Launching 3 Analysis Agents Sequentially...")
    import time
    
    with open("analysis_results.txt", "w", encoding="utf-8") as f:
        for i in range(1, 4):
            for attempt in range(3):
                result = analyze_requests_with_agent(i, requests_text)
                if "failed: 503" in result or "failed: 429" in result:
                    print(f"Attempt {attempt+1} failed for Agent {i}. Retrying in 15 seconds...")
                    time.sleep(15)
                else:
                    print("\\n" + result)
                    f.write(result + "\\n\\n")
                    break
            time.sleep(15)

if __name__ == "__main__":
    main()
