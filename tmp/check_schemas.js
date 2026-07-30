const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://qeehajkpwifnvjpwennd.supabase.co';
const envContent = fs.readFileSync('D:\\web software developement\\BillMensor\\billmensor\\.env.local', 'utf8');
const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const serviceKey = match ? match[1].trim() : '';
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  for (const table of ['invoice_items', 'quotation_items']) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`${table} error:`, error.message);
      continue;
    }
    if (data && data.length > 0) {
      console.log(`${table} columns:`, Object.keys(data[0]).join(', '));
    } else {
      console.log(`${table}: empty table, no columns info`);
    }
  }
}
main().catch(console.error);
