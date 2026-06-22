import { stat, glob } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, resample, draco, quantize } from '@gltf-transform/functions';
import { textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';
import * as draco3d from 'draco3d';

const [encoderModule, decoderModule] = await Promise.all([
  draco3d.createEncoderModule(),
  draco3d.createDecoderModule(),
]);

const io = new NodeIO()
  .registerExtensions(KHRONOS_EXTENSIONS)
  .registerDependencies({
    'draco3d.encoder': encoderModule,
    'draco3d.decoder': decoderModule,
  });
io.setAllowNetwork(false);

const patterns = process.argv.slice(2);
if (patterns.length === 0) {
  console.error('Uso: node scripts/comprimir.js assets/*.glb');
  process.exit(1);
}

for (const pattern of patterns) {
  for await (const filePath of glob(pattern)) {
    const absolutePath = resolve(filePath);
    if (absolutePath.includes('backup')) continue;
    const startTime = Date.now();
    const statsBefore = await stat(absolutePath);
    const sizeBefore = statsBefore.size;

    console.log(`\n[${(sizeBefore / 1024 / 1024).toFixed(1)} MB] ${filePath}`);

    const doc = await io.read(absolutePath);
    const texCount = doc.getRoot().listTextures().length;

    await doc.transform(
      prune(),
      dedup(),
      resample(),
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        slots: /^(?!normalTexture).*$/,
      }),
      quantize(),
      draco(),
    );

    await io.write(absolutePath, doc);

    const statsAfter = await stat(absolutePath);
    const sizeAfter = statsAfter.size;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const ratio = ((1 - sizeAfter / sizeBefore) * 100).toFixed(0);
    console.log(`  ✓ ${elapsed}s — ${(sizeAfter / 1024 / 1024).toFixed(1)} MB (${ratio}% menor, ${texCount} texturas)`);
  }
}
if (patterns.length > 0) {
  console.log('\n--- Compresión completada ---');
}
