#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up XMTP for Rovify...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExample = `# XMTP Configuration
# Set to 'production' for mainnet, 'dev' for development/testing
NEXT_PUBLIC_XMTP_ENV=dev

# Other environment variables (if needed)
# NEXT_PUBLIC_MAPS_API_KEY=your_maps_api_key_here
`;

if (fs.existsSync(envPath)) {
    console.log('✅ .env.local already exists');
    
    // Check if XMTP_ENV is already set
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('NEXT_PUBLIC_XMTP_ENV')) {
        console.log('✅ XMTP environment variable already configured');
    } else {
        console.log('📝 Adding XMTP configuration to .env.local...');
        fs.appendFileSync(envPath, '\n' + envExample);
        console.log('✅ XMTP configuration added to .env.local');
    }
} else {
    console.log('📝 Creating .env.local with XMTP configuration...');
    fs.writeFileSync(envPath, envExample);
    console.log('✅ .env.local created with XMTP configuration');
}

console.log('\n🎉 XMTP setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Connect your wallet to the app');
console.log('2. Visit /messages to start using XMTP chat');
console.log('3. Create a new conversation with a wallet address');
console.log('\n💡 Tips:');
console.log('- Use NEXT_PUBLIC_XMTP_ENV=dev for testing');
console.log('- Use NEXT_PUBLIC_XMTP_ENV=production for mainnet');
console.log('- Make sure the recipient has also enabled XMTP');
