#!/usr/bin/env node
/**
 * Builds the .deb package from release/linux-unpacked without using
 * fpm (the Ruby binary that electron-builder downloads): on some recent
 * distributions, such as Fedora 44, libcrypt.so.1 is missing and fpm won't start.
 *
 * A .deb is an `ar` archive with three members:
 *   debian-binary   format version ("2.0\n")
 *   control.tar.gz  metadata and install scripts
 *   data.tar.xz     the files to install
 *
 * Usage: node scripts/build-deb.mjs   (after `electron-builder --linux dir`)
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, chmodSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

/** Debian does not allow "-" in the version: it becomes "~" (which sorts before the stable release). */
const debVersion = String(pkg.version).replace(/-/g, '~')
const appName = pkg.build?.executableName ?? pkg.name
const productName = 'Backlog Wars'
const installDir = `/opt/${productName}`
const unpacked = join(root, 'release', 'linux-unpacked')
const staging = join(root, 'release', '.deb-build')
const output = join(root, 'release', `${pkg.name}-${pkg.version}-amd64.deb`)

if (!existsSync(join(unpacked, appName))) {
  console.error(`✗ Manca ${relative(root, unpacked)}/${appName}: esegui prima "npx electron-builder --linux dir".`)
  process.exit(1)
}

console.log(`• Pacchetto .deb per ${productName} ${pkg.version} (versione Debian ${debVersion})`)
rmSync(staging, { recursive: true, force: true })
mkdirSync(join(staging, 'control'), { recursive: true })
const dataDir = join(staging, 'data')
const appDir = join(dataDir, ...installDir.split('/').filter(Boolean))

// 1. Application
cpSync(unpacked, appDir, { recursive: true, dereference: false, preserveTimestamps: true })

// 2. Menu entry and icon
const desktopDir = join(dataDir, 'usr', 'share', 'applications')
const iconDir = join(dataDir, 'usr', 'share', 'icons', 'hicolor', '512x512', 'apps')
mkdirSync(desktopDir, { recursive: true })
mkdirSync(iconDir, { recursive: true })
writeFileSync(
  join(desktopDir, 'backlog-wars.desktop'),
  `[Desktop Entry]
Type=Application
Name=${productName}
Comment=Pick what to play from your backlog
Comment[it]=Scegli cosa giocare dal tuo backlog
Exec="${installDir}/${appName}" %U
Terminal=false
Icon=backlog-wars
Categories=Game;Utility;
StartupWMClass=${appName}
`,
  'utf8'
)
cpSync(join(root, 'build', 'icon.png'), join(iconDir, 'backlog-wars.png'))

// 3. Install/remove scripts (as electron-builder does)
writeFileSync(
  join(staging, 'control', 'postinst'),
  `#!/bin/bash
# Rende utilizzabile il sandbox di Chromium e aggiunge il comando al PATH.
if [ -f "${installDir}/chrome-sandbox" ]; then
  chmod 4755 "${installDir}/chrome-sandbox" || true
fi
ln -sf "${installDir}/${appName}" /usr/bin/${appName} || true
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications || true
fi
`,
  { mode: 0o755 }
)
writeFileSync(
  join(staging, 'control', 'prerm'),
  `#!/bin/bash
rm -f /usr/bin/${appName} || true
`,
  { mode: 0o755 }
)

// 4. md5sums of all installed files
function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.isFile()) files.push(full)
  }
  return files
}
const files = walk(dataDir)
const md5sums = files
  .map((file) => `${createHash('md5').update(readFileSync(file)).digest('hex')}  ${relative(dataDir, file)}`)
  .join('\n')
writeFileSync(join(staging, 'control', 'md5sums'), `${md5sums}\n`, 'utf8')

const installedSize = Math.ceil(
  files.reduce((sum, file) => sum + statSync(file).size, 0) / 1024
)
const description = String(pkg.description ?? productName)
const maintainer = typeof pkg.author === 'string' ? pkg.author : `${pkg.author.name} <${pkg.author.email}>`

writeFileSync(
  join(staging, 'control', 'control'),
  `Package: ${pkg.name}
Version: ${debVersion}
Section: games
Priority: optional
Architecture: amd64
Maintainer: ${maintainer}
Homepage: ${pkg.homepage ?? ''}
Installed-Size: ${installedSize}
Depends: libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6, xdg-utils, libatspi2.0-0, libuuid1, libsecret-1-0
Recommends: libappindicator3-1
License: ${pkg.license ?? 'MIT'}
Description: ${description.slice(0, 100)}
 ${productName} tracks the games in your backlog, looks up metadata online,
 draws what to play based on effort and pleasure, and logs time, effort and
 satisfaction for every session. Everything stays local, no account needed.
`,
  'utf8'
)

// 5. Internal archives and final package
try {
  execFileSync('tar', ['-C', join(staging, 'control'), '-czf', join(staging, 'control.tar.gz'), '.'])
  execFileSync('tar', ['-C', dataDir, '-cJf', join(staging, 'data.tar.xz'), '.'])
  writeFileSync(join(staging, 'debian-binary'), '2.0\n', 'utf8')
  rmSync(output, { force: true })
  execFileSync('ar', ['rc', output, join(staging, 'debian-binary'), join(staging, 'control.tar.gz'), join(staging, 'data.tar.xz')], {
    cwd: staging
  })
} catch (error) {
  console.error('✗ Serve "ar" (binutils) e "tar" nel PATH:', error.message)
  process.exit(1)
}

chmodSync(output, 0o644)
const size = statSync(output).size
const sha256 = createHash('sha256').update(readFileSync(output)).digest('hex')
rmSync(staging, { recursive: true, force: true })

console.log(`✓ ${relative(root, output)}`)
console.log(`  dimensione: ${(size / 1024 / 1024).toFixed(1)} MB · installato: ${(installedSize / 1024).toFixed(0)} MB`)
console.log(`  sha256: ${sha256}`)
console.log('  verifica: dpkg-deb -I <pacchetto>  ·  dpkg-deb -c <pacchetto>')
