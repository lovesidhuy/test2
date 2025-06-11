if (process.env.DATABASE_URL) {
  await import('./index');
} else {
  console.log('DATABASE_URL not set, starting simple server');
  await import('./simple-server.js');
}
