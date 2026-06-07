const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qeehajkpwifnvjpwennd.supabase.co';
const envContent = fs.readFileSync('C:\\auto_billmensor\\.env.local', 'utf8');
const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const serviceKey = match ? match[1].trim() : '';
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    const { data } = await supabase.from('notifications').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Table columns:', Object.keys(data[0]).join(', '));
        console.log('\nSample row:');
        console.log(JSON.stringify(data[0], null, 2));
    }
}

main();
