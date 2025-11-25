import('./production.cjs').catch(e => {
  console.error('Failed to load production.cjs:', e);
  process.exit(1);
});
