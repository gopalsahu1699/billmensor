-- Insert sample notifications for testing
-- The notifications table has these columns: id, user_id, target_user_id, title, message, type, is_read, metadata, created_at
-- target_user_id = null means broadcast to all users

INSERT INTO notifications (title, message, type, target_user_id, is_read, created_at)
VALUES
    (
        'Welcome to BillMensor!',
        'Thank you for joining BillMensor. All features are free forever! You only pay for cloud backup. Explore invoices, products, reports and more.',
        'info',
        null,
        false,
        NOW()
    ),
    (
        'Cloud Backup Feature Available',
        'Subscribe to Cloud Backup for ₹199/month and automatically backup all your invoices, products, quotations, purchases and customer data to the cloud.',
        'promotional',
        null,
        false,
        NOW() - INTERVAL '2 hours'
    ),
    (
        'Tax Season Reminder',
        'GST filing deadline is approaching. Use our CA Audit reports and GSTR reports to easily file your taxes. All reports are free!',
        'warning',
        null,
        false,
        NOW() - INTERVAL '1 day'
    ),
    (
        'New: Day Book & Cash Flow Reports',
        'We have added Day Book and Cash Flow reports to help you track your daily transactions and cash flow. Check them out in the Reports section.',
        'info',
        null,
        false,
        NOW() - INTERVAL '3 days'
    ),
    (
        'Premium Exclusive: Priority Support',
        'As a premium user, you get priority WhatsApp support. Contact us anytime for quick assistance with your billing needs.',
        'promotional',
        null,
        false,
        NOW() - INTERVAL '5 days'
    ),
    (
        'Data Retention Notice',
        'Free user data older than 3 months is automatically cleaned from our servers. Subscribe to Cloud Backup to keep your data safe forever.',
        'warning',
        null,
        false,
        NOW() - INTERVAL '7 days'
    ),
    (
        'Welcome Offer: 50% Off First Year',
        'Use code BILLMENSOR50 to get 50% off your first year of Cloud Backup. Limited time offer for new users!',
        'promotional',
        null,
        false,
        NOW() - INTERVAL '10 days'
    ),
    (
        'System Maintenance Scheduled',
        'BillMensor will undergo scheduled maintenance on Sunday from 2 AM to 4 AM IST. Cloud backup service may be temporarily unavailable.',
        'urgent',
        null,
        false,
        NOW() - INTERVAL '14 days'
    );
