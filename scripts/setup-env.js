#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 Rovify Webapp Environment Setup\n');
  console.log('This script will help you set up your environment variables.\n');

  const envPath = path.join(process.cwd(), '.env.local');
  const examplePath = path.join(process.cwd(), 'env.example');

  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Check if env.example exists
  if (!fs.existsSync(examplePath)) {
    console.log('❌ env.example file not found. Please make sure you\'re in the project root directory.');
    rl.close();
    return;
  }

  console.log('📋 Setting up environment variables...\n');

  // Read the example file
  const exampleContent = fs.readFileSync(examplePath, 'utf8');
  let envContent = exampleContent;

  // Required variables
  const requiredVars = [
    {
      key: 'NEXT_PUBLIC_HUDDLE_PROJECT_ID',
      description: 'Huddle01 Project ID (get from https://huddle01.com/dashboard)',
      example: 'your_huddle_project_id_here'
    },
    {
      key: 'HUDDLE_API_KEY',
      description: 'Huddle01 API Key (get from https://huddle01.com/dashboard)',
      example: 'your_huddle_api_key_here'
    },
    {
      key: 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
      description: 'WalletConnect Project ID (get from https://cloud.walletconnect.com/)',
      example: 'your_walletconnect_project_id_here'
    }
  ];

  console.log('🔑 Required Environment Variables:\n');

  for (const variable of requiredVars) {
    const value = await question(`${variable.key}: `);
    if (value.trim()) {
      envContent = envContent.replace(variable.example, value.trim());
      console.log(`✅ ${variable.key} set\n`);
    } else {
      console.log(`⚠️  ${variable.key} left empty (you can set it later)\n`);
    }
  }

  // Optional variables
  const optionalVars = [
    {
      key: 'LIVEPEER_API_KEY',
      description: 'Livepeer API Key (optional - alternative to Huddle01)',
      example: 'your_livepeer_api_key_here'
    },
    {
      key: 'PINATA_JWT',
      description: 'Pinata JWT for IPFS storage (optional)',
      example: 'your_pinata_jwt_here'
    }
  ];

  const setupOptional = await question('🔧 Set up optional environment variables? (y/N): ');
  
  if (setupOptional.toLowerCase() === 'y' || setupOptional.toLowerCase() === 'yes') {
    console.log('\n🔧 Optional Environment Variables:\n');
    
    for (const variable of optionalVars) {
      const value = await question(`${variable.key} (optional): `);
      if (value.trim()) {
        envContent = envContent.replace(variable.example, value.trim());
        console.log(`✅ ${variable.key} set\n`);
      }
    }
  }

  // Write the .env.local file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment file created successfully!');
    console.log(`📁 Location: ${envPath}\n`);
    
    console.log('🎉 Setup complete! Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run dev');
    console.log('3. Open: http://localhost:3000\n');
    
    console.log('📚 For more detailed setup instructions, see SETUP.md');
    
  } catch (error) {
    console.error('❌ Error creating environment file:', error.message);
  }

  rl.close();
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n❌ Setup cancelled.');
  rl.close();
  process.exit(0);
});

setupEnvironment().catch(console.error);