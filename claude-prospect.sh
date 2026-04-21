#!/bin/bash

echo "Starting Claude Code CLI Auto-Prospector..."
echo "Claude will now research new buildings and inject them into Supabase."

# Run Claude Code CLI with a highly specific programmatic prompt
npx -y @anthropic-ai/claude-code -p "You are an automated real-estate data prospector. 
1. Search the web to find 5 large buildings (commercial, institutional, or large condo syndicates) in the Greater Montreal Area (Montreal, Laval, or South Shore) that are NOT already in the Supabase 'buildings' table.
2. Find their approximate height in meters, number of floors, year built, latitude, and longitude.
3. Calculate their scores based on age (older = higher score), height, and usage.
4. Write a temporary Node.js script using the '@supabase/supabase-js' library to insert these 5 new building records into the Supabase database. 
5. The Supabase URL and SERVICE_ROLE_KEY are located in the local .env file.
6. Execute the Node.js script to push the data, then delete the temporary script.
7. Print a success message listing the 5 buildings you added. Do not ask for user confirmation, just complete the entire task autonomously."
