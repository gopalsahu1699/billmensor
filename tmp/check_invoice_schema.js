const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://qeehajkpwifnvjpwennd.supabase.co';
const envContent = fs.readFileSync('D:\\web software developement\\BillMensor\\billmensor\\.env.local', 'utf8');
const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const serviceKey = match ? match[1].trim() : '';
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  // Try to get a row from invoice_items
  const { data, error } = await supabase.from('invoice_items').select('*').limit(1);
  if (error) {
    console.log('Error fetching invoice_items:', error.message);
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      console.log('Table invoice_items does not exist!');
    }
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]).join(', '));
  } else {
    console.log('Table exists but is empty. Cannot determine columns from data.');
  }
}
main().catch(console.error);
