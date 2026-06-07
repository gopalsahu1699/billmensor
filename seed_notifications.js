const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qeehajkpwifnvjpwennd.supabase.co';
const envContent = fs.readFileSync('C:\\auto_billmensor\\.env.local', 'utf8');
const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const serviceKey = match ? match[1].trim() : '';
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    // First, get a valid user_id from profiles
    const { data: users } = await supabase.from('profiles').select('id').limit(1);
    if (!users || users.length === 0) {
        console.error('No users found in profiles table');
        process.exit(1);
    }
    const userId = users[0].id;
    console.log('Using user_id:', userId);

    // Insert sample notifications with the correct schema
    console.log('Inserting sample notifications...');
    
    const notifications = [
        { title: 'Welcome to BillMensor!', message: 'Thank you for joining BillMensor. All features are free forever! Explore invoices, products, reports and more.', type: 'info', user_id: userId },
        { title: 'Cloud Backup Feature Available', message: 'Subscribe to Cloud Backup for ₹199/month and automatically backup all your data to the cloud.', type: 'promotional', user_id: userId },
        { title: 'Tax Season Reminder', message: 'GST filing deadline is approaching. Use our CA Audit reports and GSTR reports to easily file your taxes.', type: 'warning', user_id: userId },
        { title: 'New: Day Book & Cash Flow Reports', message: 'We have added Day Book and Cash Flow reports to help you track daily transactions.', type: 'info', user_id: userId },
        { title: 'Data Retention Notice', message: 'Free user data older than 3 months is automatically cleaned. Subscribe to Cloud Backup to keep data safe.', type: 'warning', user_id: userId },
        { title: 'Welcome Offer: 50% Off First Year', message: 'Use code BILLMENSOR50 to get 50% off your first year of Cloud Backup. Limited time offer!', type: 'promotional', user_id: userId },
        { title: 'System Maintenance Scheduled', message: 'Scheduled maintenance on Sunday from 2 AM to 4 AM IST. Services may be temporarily unavailable.', type: 'urgent', user_id: userId }
    ];

    const { data, error } = await supabase.from('notifications').insert(notifications).select();
    
    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
    
    console.log('Successfully inserted ' + data.length + ' sample notifications!');
    data.forEach((n, i) => {
        console.log('  ' + (i+1) + '. [' + n.type + '] ' + n.title);
    });
}

main();
