const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const dist = path.join(root, 'dist');

function assertDistReady() {
  if (!fs.existsSync(dist)) {
    console.error('Missing dist/. Run "npm run build" first.');
    process.exit(1);
  }

  const manifest = path.join(dist, 'manifest.json');
  if (!fs.existsSync(manifest)) {
    console.error('Missing dist/manifest.json. Run "npm run build" first.');
    process.exit(1);
  }
}

function rimraf(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function copyDir(src, dest, { skipNames = [] } = {}) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipNames.includes(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to, { skipNames });
    else fs.copyFileSync(from, to);
  }
}

function zipFolder(sourceDir, zipPath) {
  rimraf(zipPath);

  if (process.platform === 'win32') {
    const ps = [
      'Compress-Archive',
      '-Path',
      `"${path.join(sourceDir, '*')}"`,
      '-DestinationPath',
      `"${zipPath}"`,
      '-Force',
    ].join(' ');
    execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], {
      stdio: 'inherit',
    });
    return;
  }

  execFileSync('zip', ['-r', zipPath, '.'], {
    cwd: sourceDir,
    stdio: 'inherit',
  });
}

module.exports = {
  root,
  dist,
  assertDistReady,
  rimraf,
  copyDir,
  zipFolder,
};
