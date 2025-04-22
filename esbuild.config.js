// esbuild.config.js
require('esbuild')
  .build({
    entryPoints: ['./src/index.js'],
    bundle: true,
    outfile: 'dist/app.js',
    platform: 'node',
    target: 'node22',
  })
  .catch(() => process.exit(1));
