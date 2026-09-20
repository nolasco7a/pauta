import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderStill } from '@remotion/renderer';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const platform = process.env.PLATFORM ?? 'android';

const entry = path.join(dirname, '..', 'src', 'index.ts');
const outDir = path.join(dirname, '..', 'out', platform);

const bundleLocation = await bundle({ entryPoint: entry });
const compositions = await getCompositions(bundleLocation, {
  envVariables: { PLATFORM: platform },
});

for (const composition of compositions) {
  const outputPath = path.join(outDir, `${composition.id}.png`);
  await renderStill({
    composition,
    serveUrl: bundleLocation,
    output: outputPath,
    envVariables: { PLATFORM: platform },
  });
  console.log(`✓ ${outputPath}`);
}
