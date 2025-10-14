# Supabase Setup Guide

## Quick Fix for Current Error

The error you're seeing is because the Supabase environment variables aren't being loaded. Here's how to fix it:

### Step 1: Create the .env file

1. In your `website` folder, create a file named `.env` (not `.env.example`)
2. Add your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

### Step 3: Update the .env file

Replace the placeholder values with your actual credentials:

```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Restart the Development Server

1. Stop the current server (Ctrl+C)
2. Run `npm start` again

## Database Setup

### Step 1: Create the Database Table

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Create email_subscriptions table
CREATE TABLE email_subscriptions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'greek' CHECK (language IN ('greek', 'english')),
  source VARCHAR(20) DEFAULT 'website' CHECK (source IN ('website', 'app', 'other')),
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX idx_email_subscriptions_active ON email_subscriptions(is_active);
CREATE INDEX idx_email_subscriptions_language ON email_subscriptions(language);

-- Enable Row Level Security (RLS)
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for email subscriptions)
CREATE POLICY "Allow public email subscriptions" ON email_subscriptions
    FOR INSERT WITH CHECK (true);

-- Create policy to allow public updates (for reactivation)
CREATE POLICY "Allow public email updates" ON email_subscriptions
    FOR UPDATE USING (true);

-- Create policy to allow public selects (for checking existing emails)
CREATE POLICY "Allow public email reads" ON email_subscriptions
    FOR SELECT USING (true);
```

5. Click **Run** to execute the SQL

### Step 2: Test the Setup

1. Go to your website
2. Try subscribing with an email
3. Check your Supabase dashboard → **Table Editor** → `email_subscriptions`
4. You should see the new subscription

## Troubleshooting

### If you still get errors:

1. **Check file location**: Make sure `.env` is in the `website` folder (same level as `package.json`)
2. **Check variable names**: Must be exactly `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
3. **Restart server**: Always restart after changing `.env`
4. **Check credentials**: Make sure you copied the correct URL and key

### If you don't want to set up Supabase right now:

The website will work without Supabase - it will just simulate email subscriptions and show a message in the console. You can set up Supabase later when you're ready.

## Admin Dashboard

Once Supabase is set up, you can access the admin dashboard at:
`http://localhost:3000?admin=true`

This will show you all subscribers and allow you to export them as CSV.
