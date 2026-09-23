/**
 * Generates build/icon.png (512x512) with no external dependencies.
 * Emblem: two crossed swords on a night background with a violet/cyan glow.
 * Usage: node scripts/make-icon.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SIZE = 512
const CENTER = SIZE / 2

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let crc = -1
  for (let i = 0; i < buffer.length; i += 1) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData), 0)
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

/* ---------------------------- geometry (SDF) ---------------------------- */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function roundedRectDistance(x, y, halfWidth, halfHeight, radius) {
  const qx = Math.abs(x) - (halfWidth - radius)
  const qy = Math.abs(y) - (halfHeight - radius)
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
  return outside + Math.min(Math.max(qx, qy), 0) - radius
}

function rotatedRectDistance(x, y, angle, halfWidth, halfHeight) {
  const cos = Math.cos(-angle)
  const sin = Math.sin(-angle)
  const rx = x * cos - y * sin
  const ry = x * sin + y * cos
  const qx = Math.abs(rx) - halfWidth
  const qy = Math.abs(ry) - halfHeight
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
  return outside + Math.min(Math.max(qx, qy), 0)
}

const coverage = (distance) => clamp(0.5 - distance, 0, 1)
const mix = (a, b, t) => a.map((channel, index) => channel + (b[index] - channel) * t)

function render() {
  const rgba = Buffer.alloc(SIZE * SIZE * 4)
  const glowViolet = [124, 92, 255]
  const glowCyan = [0, 229, 192]
  const gold = [255, 201, 60]
  const bladeLight = [236, 245, 255]
  const bladeDark = [124, 92, 255]

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const px = x + 0.5
      const py = y + 0.5
      const cx = px - CENTER
      const cy = py - CENTER

      // Background: vertical gradient + two glows
      const vertical = py / SIZE
      let color = mix([22, 17, 54], [7, 8, 15], vertical)
      const violetFalloff = Math.hypot(px - SIZE * 0.28, py - SIZE * 0.2) / (SIZE * 0.62)
      const cyanFalloff = Math.hypot(px - SIZE * 0.82, py - SIZE * 0.86) / (SIZE * 0.66)
      color = mix(color, glowViolet, clamp(1 - violetFalloff, 0, 1) * 0.5)
      color = mix(color, glowCyan, clamp(1 - cyanFalloff, 0, 1) * 0.32)

      // Golden frame
      const ringDistance = Math.abs(Math.hypot(cx, cy) - (CENTER - 26)) - 4
      color = mix(color, gold, coverage(ringDistance) * 0.75)

      // Crossed swords: blades on the two diagonals, golden guards and pommels
      const blades = [
        rotatedRectDistance(cx, cy, Math.PI / 4, 11, 152),
        rotatedRectDistance(cx, cy, -Math.PI / 4, 11, 152)
      ]
      const guardOffset = 104
      const guards = [
        rotatedRectDistance(cx - guardOffset, cy - guardOffset, -Math.PI / 4, 8, 33),
        rotatedRectDistance(cx + guardOffset, cy + guardOffset, -Math.PI / 4, 8, 33),
        rotatedRectDistance(cx + guardOffset, cy - guardOffset, Math.PI / 4, 8, 33),
        rotatedRectDistance(cx - guardOffset, cy + guardOffset, Math.PI / 4, 8, 33)
      ]
      const pommelOffset = 133
      const pommels = [
        Math.hypot(cx - pommelOffset, cy - pommelOffset) - 15,
        Math.hypot(cx + pommelOffset, cy + pommelOffset) - 15,
        Math.hypot(cx + pommelOffset, cy - pommelOffset) - 15,
        Math.hypot(cx - pommelOffset, cy + pommelOffset) - 15
      ]

      blades.forEach((distance, index) => {
        const alpha = coverage(distance)
        if (alpha <= 0) return
        const t = index === 0 ? clamp((cx + cy) / (SIZE * 0.8) + 0.5, 0, 1) : clamp((cx - cy) / (SIZE * 0.8) + 0.5, 0, 1)
        color = mix(color, mix(bladeDark, bladeLight, t), alpha)
      })
      guards.forEach((distance) => {
        color = mix(color, gold, coverage(distance))
      })
      pommels.forEach((distance) => {
        color = mix(color, [255, 255, 255], coverage(distance) * 0.92)
      })

      // Rounded-corner mask
      const mask = coverage(roundedRectDistance(cx, cy, CENTER - 6, CENTER - 6, 96))
      const offset = (y * SIZE + x) * 4
      rgba[offset] = Math.round(color[0])
      rgba[offset + 1] = Math.round(color[1])
      rgba[offset + 2] = Math.round(color[2])
      rgba[offset + 3] = Math.round(mask * 255)
    }
  }

  return encodePng(SIZE, SIZE, rgba)
}

const here = dirname(fileURLToPath(import.meta.url))
const target = resolve(here, '..', 'build', 'icon.png')
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, render())
console.log(`Icona generata: ${target}`)
