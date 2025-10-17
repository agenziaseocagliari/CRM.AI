// Cross-platform script to setup Husky only in development
// Avoids breaking production builds when Husky is not available

import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Check if we're in CI or production environment
const isCI = process.env.CI === 'true' || process.env.CI === '1';
const isProduction = process.env.NODE_ENV === 'production';

// Skip Husky setup in CI or production
if (isCI || isProduction) {
  console.log('Skipping Husky setup in CI/production environment');
  process.exit(0);
}

// Check if Husky is available
try {
  require.resolve('husky');
} catch (error) {
  console.log('Husky not found, skipping git hooks setup');
  process.exit(0);
}

// Run Husky setup
console.log('Setting up Husky git hooks...');
const husky = spawn('npx', ['husky'], {
  stdio: 'inherit',
  shell: true,
});

husky.on('error', error => {
  console.log('Failed to setup Husky:', error.message);
  process.exit(0); // Don't fail the installation
});

husky.on('close', code => {
  if (code === 0) {
    console.log('Husky setup completed successfully');
  } else {
    console.log('Husky setup failed, but continuing...');
  }
  process.exit(0);
});
