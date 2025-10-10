#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing Next.js cache and node_modules...\n');

const projectRoot = process.cwd();

// Directories to clean
const dirsToClean = [
  '.next',
  'node_modules/.cache',
  '.turbo',
];

// Files to clean
const filesToClean = [
  'package-lock.json',
  'yarn.lock',
];

try {
  // Clean directories
  for (const dir of dirsToClean) {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`🗑️  Removing ${dir}...`);
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  // Clean files
  for (const file of filesToClean) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      console.log(`🗑️  Removing ${file}...`);
      fs.unlinkSync(filePath);
    }
  }

  console.log('\n✅ Cache cleared successfully!');
  console.log('\n📦 Reinstalling dependencies...');
  
  // Reinstall dependencies
  execSync('npm install', { stdio: 'inherit', cwd: projectRoot });
  
  console.log('\n🎉 Setup complete! You can now run:');
  console.log('   npm run dev');
  
} catch (error) {
  console.error('❌ Error clearing cache:', error.message);
  process.exit(1);
}
