import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const assetsDir = path.resolve('src/assets');

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function optimizePng(filePath) {
  const before = await fs.stat(filePath);
  const tempPath = `${filePath}.tmp`;

  await sharp(filePath)
    .png({
      compressionLevel: 9,
      effort: 10,
      palette: true,
      quality: 82,
      colours: 256,
      dither: 0.9,
    })
    .toFile(tempPath);

  const after = await fs.stat(tempPath);

  if (after.size < before.size) {
    await fs.rename(tempPath, filePath);
    return { before: before.size, after: after.size, changed: true };
  }

  await fs.unlink(tempPath);
  return { before: before.size, after: before.size, changed: false };
}

async function main() {
  const files = (await fs.readdir(assetsDir))
    .filter((name) => /\.png$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    console.log('No PNG files found in src/assets.');
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let changedCount = 0;

  console.log(`Optimizing ${files.length} PNG assets...`);

  for (const file of files) {
    const fullPath = path.join(assetsDir, file);
    const result = await optimizePng(fullPath);
    totalBefore += result.before;
    totalAfter += result.after;
    if (result.changed) changedCount += 1;

    const delta = result.before - result.after;
    const percent = result.before > 0 ? ((delta / result.before) * 100).toFixed(2) : '0.00';
    const marker = result.changed ? 'optimized' : 'kept';

    console.log(
      `${file}: ${formatKb(result.before)} -> ${formatKb(result.after)} (${percent}% ${marker})`
    );
  }

  const saved = totalBefore - totalAfter;
  const totalPercent = totalBefore > 0 ? ((saved / totalBefore) * 100).toFixed(2) : '0.00';

  console.log('');
  console.log(`Changed files: ${changedCount}/${files.length}`);
  console.log(`Total: ${formatKb(totalBefore)} -> ${formatKb(totalAfter)} (saved ${formatKb(saved)}, ${totalPercent}%)`);
}

main().catch((error) => {
  console.error('Asset optimization failed:', error);
  process.exitCode = 1;
});
