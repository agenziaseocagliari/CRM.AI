/**
 * Automated Insurance Vertical Diagnostic Test
 * This script simulates user interaction and collects diagnostic data
 */

/* eslint-env browser */
/* eslint-disable no-undef */

// Test script to run in browser console
console.log('🔬 FORENSIC DIAGNOSTIC TEST STARTING...');

// Step 1: Check initial state
console.log('📊 INITIAL STATE CHECK:');
console.log('URL:', window.location.href);
console.log('Local Storage:', Object.keys(localStorage));
console.log('Session Storage:', Object.keys(sessionStorage));

// Step 2: Check diagnostic system
if (window.diagnostics) {
  console.log('✅ Diagnostic system active');
  console.log('📋 Current events:', window.diagnostics.getEvents().length);
} else {
  console.error('❌ Diagnostic system not found!');
}

// Step 3: Check DOM structure
console.log('📄 DOM STRUCTURE:');
console.log('Root element:', document.getElementById('root'));
console.log(
  'Diagnostic markers:',
  document.querySelectorAll('[data-diagnostic]').length
);
console.log('Main content:', document.querySelector('main'));

// Step 4: Check for errors
console.log('🚨 ERROR CHECK:');
const errorEvents = window.diagnostics
  ? window.diagnostics.getErrorEvents()
  : [];
console.log('Error events:', errorEvents.length);
if (errorEvents.length > 0) {
  console.error('Found errors:', errorEvents);
}

// Step 5: Check route history
console.log('🗺️ ROUTE HISTORY:');
const routeEvents = window.diagnostics
  ? window.diagnostics.getRouteEvents()
  : [];
console.log('Route changes:', routeEvents.length);
routeEvents.forEach((event, i) => {
  console.log(`${i + 1}. ${event.timestamp}: ${event.data.pathname}`);
});

// Step 6: Check component mounts
console.log('🧩 COMPONENT MOUNTS:');
const componentEvents = window.diagnostics
  ? window.diagnostics.getComponentEvents()
  : [];
console.log('Component events:', componentEvents.length);
componentEvents.forEach(event => {
  console.log(`- ${event.location}: ${JSON.stringify(event.data)}`);
});

// Step 7: Download diagnostic log
if (window.diagnostics) {
  console.log('💾 Downloading diagnostic log...');
  window.diagnostics.downloadLog();
}

console.log('🔬 FORENSIC DIAGNOSTIC TEST COMPLETE');
console.log('📊 Summary:', {
  totalEvents: window.diagnostics ? window.diagnostics.getEvents().length : 0,
  errors: errorEvents.length,
  routes: routeEvents.length,
  components: componentEvents.length,
  diagnosticMarkers: document.querySelectorAll('[data-diagnostic]').length,
});
