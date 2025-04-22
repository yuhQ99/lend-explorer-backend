require('esbuild')
  .build({
    entryPoints: ['./src/workers/scan-lending-position.js'],
    bundle: true,
    outfile: 'dist/scan-lending-position.js',
    platform: 'node',
    target: 'node22',
  })
  .catch(() => process.exit(1));
