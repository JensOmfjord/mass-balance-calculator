#!/usr/bin/env node

// Simple Metro bundler script for iOS
const Metro = require('metro');
const path = require('path');
const fs = require('fs');

async function bundle() {
  const projectRoot = process.cwd();
  
  console.log('Building iOS bundle...');
  
  const config = await Metro.loadConfig({
    projectRoot,
    config: path.join(projectRoot, 'metro.config.js'),
  });
  
  const outputFile = path.join(projectRoot, 'ios/build/Bundle/main.jsbundle');
  const assetsDir = path.join(projectRoot, 'ios/build/Bundle');
  
  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  
  const bundle = await Metro.build(config, {
    entry: 'index.ts',
    out: outputFile,
    platform: 'ios',
    minify: true,
    dev: false,
    sourceMap: false,
  });
  
  console.log(`Bundle created: ${outputFile}`);
  console.log(`Size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)}MB`);
}

bundle().catch(err => {
  console.error('Bundling failed:', err);
  process.exit(1);
});
