const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://qeehajkpwifnvjpwennd.supabase.co';
const envContent = fs.readFileSync('D:\\web software developement\\BillMensor\\billmensor\\.env.local', 'utf8');
const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const serviceKey = match ? match[1].trim() : '';
const supabase = createClient(supabaseUrl, serviceKey);

const sql = `
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS per_unit_discount numeric DEFAULT 0;

ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'amount';
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS discount_rate numeric DEFAULT 0;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS per_unit_discount numeric DEFAULT 0;
`;

async function main() {
  // Try to run via exec_sql RPC
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.log('exec_sql RPC failed:', error.message);
    console.log('Trying exec_sql with "sql" param...');
    const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { sql });
    if (e2) {
      console.log('exec_sql(sql) also failed:', e2.message);
      console.log('Trying pg_execute...');
      const { data: d3, error: e3 } = await supabase.rpc('pg_execute', { query: sql });
      if (e3) {
        console.log('pg_execute also failed:', e3.message);
        console.log('\n=== UNABLE TO RUN SQL REMOTELY ===');
        console.log('Please run the SQL manually in Supabase Dashboard SQL Editor.');
        console.log('SQL file location: supabase/migrations/006_add_missing_discount_columns.sql');
        console.log('\nSQL to run:');
        console.log(sql);
        return;
      }
      console.log('pg_execute success:', d3);
    } else {
      console.log('exec_sql success:', d2);
    }
  } else {
    console.log('exec_sql success:', data);
  }
}
main().catch(console.error);
