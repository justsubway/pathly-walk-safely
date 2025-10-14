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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_subscriptions_updated_at 
    BEFORE UPDATE ON email_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create a view for newsletter statistics (admin only)
CREATE VIEW newsletter_stats AS
SELECT 
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE is_active = true) as active_subscribers,
    COUNT(*) FILTER (WHERE language = 'greek') as greek_subscribers,
    COUNT(*) FILTER (WHERE language = 'english') as english_subscribers,
    COUNT(*) FILTER (WHERE source = 'website') as website_subscribers,
    COUNT(*) FILTER (WHERE source = 'app') as app_subscribers,
    DATE_TRUNC('day', subscribed_at) as subscription_date,
    COUNT(*) as daily_subscriptions
FROM email_subscriptions
GROUP BY DATE_TRUNC('day', subscribed_at)
ORDER BY subscription_date DESC;

-- Grant permissions for the view
GRANT SELECT ON newsletter_stats TO authenticated;
