# Supabase Setup Guide for Email Subscriptions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `pathly-newsletter`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users (e.g., Europe for Greece)
6. Click "Create new project"

## 2. Set Up Database Schema

1. Go to your project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase-schema.sql`
5. Click **Run** to execute the SQL

This will create:
- `email_subscriptions` table
- Proper indexes for performance
- Row Level Security policies
- Newsletter statistics view

## 3. Get API Keys

1. Go to **Settings** → **API** in your project dashboard
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 4. Configure Environment Variables

1. Create a `.env` file in the website root directory
2. Add your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Restart your development server:
```bash
npm start
```

## 5. Test Email Subscription

1. Open your website
2. Enter an email address
3. Click "Subscribe Now"
4. Check your Supabase dashboard → **Table Editor** → `email_subscriptions`
5. You should see the new subscription record

## 6. Newsletter Management

### View Subscribers
- Go to **Table Editor** → `email_subscriptions`
- Filter by `is_active = true` to see active subscribers

### Newsletter Statistics
- Go to **SQL Editor**
- Run: `SELECT * FROM newsletter_stats;`
- This shows subscriber counts by language, source, and date

### Export Subscribers
- Go to **Table Editor** → `email_subscriptions`
- Click **Export** → **CSV**
- Filter by `is_active = true` before exporting

## 7. Sending Newsletters

### Option 1: Supabase Edge Functions
Create an edge function to send emails using services like:
- SendGrid
- Mailgun
- Resend
- AWS SES

### Option 2: External Service
Use the exported CSV with services like:
- Mailchimp
- ConvertKit
- Substack

### Option 3: Custom Script
Create a Node.js script that:
1. Connects to Supabase
2. Fetches active subscribers
3. Sends emails via your preferred service

## 8. Database Schema Details

### email_subscriptions Table
- `id`: Primary key
- `email`: Unique email address
- `subscribed_at`: When they subscribed
- `is_active`: Whether subscription is active
- `language`: 'greek' or 'english'
- `source`: 'website', 'app', or 'other'
- `user_agent`: Browser info
- `ip_address`: User's IP
- `created_at`: Record creation time
- `updated_at`: Last update time

### Security Features
- Row Level Security enabled
- Public can insert/update/select (for subscriptions)
- Unique constraint on email addresses
- Automatic timestamp updates

## 9. Monitoring & Analytics

### Track Subscription Growth
```sql
SELECT 
  DATE_TRUNC('month', subscribed_at) as month,
  COUNT(*) as new_subscribers
FROM email_subscriptions 
WHERE is_active = true
GROUP BY month
ORDER BY month DESC;
```

### Language Distribution
```sql
SELECT 
  language,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM email_subscriptions 
WHERE is_active = true
GROUP BY language;
```

## 10. Troubleshooting

### Common Issues
1. **CORS Error**: Make sure your domain is added to Supabase allowed origins
2. **RLS Error**: Check that policies are properly set up
3. **API Key Error**: Verify environment variables are correct
4. **Email Already Exists**: The system handles duplicates gracefully

### Debug Mode
Add this to your `.env` file for debugging:
```env
REACT_APP_DEBUG=true
```

This will log additional information to the console.
