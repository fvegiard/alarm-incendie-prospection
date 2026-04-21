#!/bin/bash

# Divide the Greater Montreal Area into logical prospecting regions
REGIONS=(
    "Montreal - Ville-Marie (Downtown)"
    "Montreal - Westmount and NDG"
    "Montreal - Plateau and Rosemont"
    "Montreal - East End (Anjou/Montreal-Est)"
    "Laval - West (Chomedey/Sainte-Dorothée)"
    "Laval - East (Duvernay/Vimont)"
    "South Shore - Brossard and La Prairie"
    "South Shore - Longueuil and Boucherville"
    "North Shore - Terrebonne and Repentigny"
)

echo "Starting Regional Prospecting Workflow with Claude Code CLI..."
echo "This will loop through 9 distinct regions and populate the Supabase project."
echo "---------------------------------------------------"

for region in "${REGIONS[@]}"; do
    echo ">> Prospecting Region: $region"
    
    npx -y @anthropic-ai/claude-code --dangerously-skip-permissions -p "You are an automated real-estate data prospector. 
1. Search the web to find 3 large buildings (commercial, institutional, hospitals, or large condo syndicates) specifically in the region: '$region' that are NOT already in the Supabase 'buildings' table.
2. Find their approximate height in meters, number of floors, year built, latitude, and longitude.
3. Calculate their scores based on age, height, and usage according to the project SOP.
4. Write a temporary Node.js script using the '@supabase/supabase-js' library to insert these 3 new building records into the Supabase database. 
5. The Supabase URL and SERVICE_ROLE_KEY are located in the local .env file.
6. Execute the Node.js script synchronously, then delete the temporary script.
7. Print a success message listing the 3 buildings you added for '$region'. Do not ask for user confirmation, just complete the entire task autonomously."

    echo ">> Finished Prospecting Region: $region"
    echo "---------------------------------------------------"
    sleep 2 # Small pause between Claude CLI invocations
done

echo "All regions have been successfully prospected!"
