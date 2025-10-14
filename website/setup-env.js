const fs = require('fs');
const path = require('path');

// Create .env file with Supabase configuration
const envContent = `# Supabase Configuration
# Replace these with your actual Supabase project values
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Instructions:
# 1. Go to https://supabase.com
# 2. Open your project
# 3. Go to Settings → API
# 4. Copy the Project URL and anon public key
# 5. Replace the values above
# 6. Restart the development server: npm start
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Please edit .env file with your Supabase credentials');
  console.log('🔄 Restart the development server after updating .env');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
