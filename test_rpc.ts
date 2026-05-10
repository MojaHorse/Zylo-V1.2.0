import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase.rpc('get_menu_with_status', { target_business_id: 'any' }).limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

main();
