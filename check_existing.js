const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: maxIdData } = await supabase
    .from('buildings')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
  console.log('MAX_ID:', maxIdData);

  const { data: existing, error } = await supabase
    .from('buildings')
    .select('id, immeuble, zone')
    .or('zone.ilike.%Ville-Marie%,zone.ilike.%Downtown%,zone.ilike.%Centre-ville%,immeuble.ilike.%Montreal%,immeuble.ilike.%Montréal%');
  if (error) console.error(error);
  console.log('EXISTING_VILLE_MARIE:', JSON.stringify(existing, null, 2));
}

check();
