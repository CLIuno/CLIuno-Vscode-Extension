// Generates assets/icon.png (128x128) — an indigo rounded square with a white
// ">_" terminal glyph. Pure Node (zlib), no image libraries. Run: node assets/make-icon.mjs
import { deflateSync } from "node:zlib"
import { writeFileSync } from "node:fs"

const S = 128
const px = new Uint8Array(S * S * 4) // RGBA

const set = (x, y, r, g, b, a) => {
  if (x < 0 || y < 0 || x >= S || y >= S) return
  const i = (y * S + x) * 4
  // alpha-over the existing pixel
  const sa = a / 255
  const da = px[i + 3] / 255
  const oa = sa + da * (1 - sa)
  if (oa === 0) return
  px[i] = (r * sa + px[i] * da * (1 - sa)) / oa
  px[i + 1] = (g * sa + px[i + 1] * da * (1 - sa)) / oa
  px[i + 2] = (b * sa + px[i + 2] * da * (1 - sa)) / oa
  px[i + 3] = oa * 255
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

// rounded-rect signed coverage (1 inside, 0 outside, AA at the edge)
const roundedCoverage = (x, y, w, h, r) => {
  const dx = Math.max(Math.abs(x - w / 2) - (w / 2 - r), 0)
  const dy = Math.max(Math.abs(y - h / 2) - (h / 2 - r), 0)
  const d = Math.hypot(dx, dy) - r
  return clamp01(0.5 - d)
}

// distance from point to segment
const segDist = (px_, py_, x0, y0, x1, y1) => {
  const vx = x1 - x0
  const vy = y1 - y0
  const wx = px_ - x0
  const wy = py_ - y0
  const t = clamp01((wx * vx + wy * vy) / (vx * vx + vy * vy))
  return Math.hypot(px_ - (x0 + t * vx), py_ - (y0 + t * vy))
}

// background: indigo rounded square
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const c = roundedCoverage(x + 0.5, y + 0.5, S, S, 26)
    if (c > 0) set(x, y, 79, 70, 229, c * 255) // #4f46e5
  }
}

// foreground: white ">_" glyph
const stroke = 11
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const cx = x + 0.5
    const cy = y + 0.5
    // chevron ">"
    const d = Math.min(
      segDist(cx, cy, 42, 40, 72, 64),
      segDist(cx, cy, 72, 64, 42, 88),
    )
    const cov = clamp01(stroke / 2 - d + 0.5)
    // underscore "_"
    const uCov =
      cx >= 66 && cx <= 96 ? clamp01(5 - Math.abs(cy - 92) + 0.5) : 0
    const a = Math.max(cov, uCov)
    if (a > 0) set(x, y, 255, 255, 255, a * 255)
  }
}

// ---- encode PNG ----
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, "ascii"), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(S, 0)
ihdr.writeUInt32BE(S, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // RGBA
// raw scanlines with filter byte 0
const raw = Buffer.alloc(S * (S * 4 + 1))
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0
  for (let x = 0; x < S * 4; x++) raw[y * (S * 4 + 1) + 1 + x] = px[y * S * 4 + x]
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
])

const out = new URL("./icon.png", import.meta.url)
writeFileSync(out, png)
console.log("wrote", out.pathname, png.length, "bytes")
