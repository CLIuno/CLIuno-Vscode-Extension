// Generates assets/icon.png from the CLIuno brand logo (assets/logo.png):
// composites the transparent "1N∞" mark as white on a black square and
// downscales it. Pure Node (zlib) — no image libraries.
// Run: node assets/make-icon.mjs
import { deflateSync, inflateSync } from "node:zlib"
import { readFileSync, writeFileSync } from "node:fs"

// ---- decode an 8-bit RGBA PNG ----
function decodePNG(buf) {
  let p = 8
  let W = 0
  let H = 0
  const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p)
    p += 4
    const type = buf.toString("ascii", p, p + 4)
    p += 4
    const data = buf.subarray(p, p + len)
    p += len + 4
    if (type === "IHDR") {
      W = data.readUInt32BE(0)
      H = data.readUInt32BE(4)
    } else if (type === "IDAT") {
      idat.push(data)
    } else if (type === "IEND") {
      break
    }
  }
  const raw = inflateSync(Buffer.concat(idat))
  const bpp = 4
  const stride = W * bpp
  const out = Buffer.alloc(H * stride)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
    const cur = Buffer.alloc(stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0
      const b = prev[x]
      const c = x >= bpp ? prev[x - bpp] : 0
      let v = line[x]
      if (f === 1) v = (v + a) & 255
      else if (f === 2) v = (v + b) & 255
      else if (f === 3) v = (v + ((a + b) >> 1)) & 255
      else if (f === 4) {
        const pa = Math.abs(b - c)
        const pb = Math.abs(a - c)
        const pc = Math.abs(a + b - 2 * c)
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255
      }
      cur[x] = v
    }
    cur.copy(out, y * stride)
    prev = cur
  }
  return { W, H, px: out }
}

// ---- encode an 8-bit RGBA PNG ----
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (b) => {
  let c = 0xffffffff
  for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8)
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
function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

// ---- build the icon ----
const src = decodePNG(readFileSync(new URL("./logo.png", import.meta.url)))
const { W, H, px } = src

// mark (white) over a black square, using the logo's alpha as coverage,
// with a little padding so the mark isn't flush to the edges.
const pad = Math.round(Math.max(W, H) * 0.08)
const side = Math.max(W, H) + pad * 2
const ox = Math.round((side - W) / 2)
const oy = Math.round((side - H) / 2)
const big = Buffer.alloc(side * side * 4)
for (let i = 0; i < side * side; i++) big[i * 4 + 3] = 255 // opaque black
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const a = px[(y * W + x) * 4 + 3]
    if (!a) continue
    const j = ((y + oy) * side + (x + ox)) * 4
    const v = Math.round((a / 255) * 255) // white * coverage
    big[j] = v
    big[j + 1] = v
    big[j + 2] = v
  }
}

// downscale to 256x256 with box averaging
const OUT = 256
const small = Buffer.alloc(OUT * OUT * 4)
const scale = side / OUT
for (let y = 0; y < OUT; y++) {
  for (let x = 0; x < OUT; x++) {
    let r = 0
    let n = 0
    const x0 = Math.floor(x * scale)
    const x1 = Math.floor((x + 1) * scale)
    const y0 = Math.floor(y * scale)
    const y1 = Math.floor((y + 1) * scale)
    for (let sy = y0; sy < y1; sy++) {
      for (let sx = x0; sx < x1; sx++) {
        r += big[(sy * side + sx) * 4] // grayscale, r=g=b
        n++
      }
    }
    const v = n ? Math.round(r / n) : 0
    const j = (y * OUT + x) * 4
    small[j] = v
    small[j + 1] = v
    small[j + 2] = v
    small[j + 3] = 255
  }
}

const out = new URL("./icon.png", import.meta.url)
writeFileSync(out, encodePNG(OUT, small))
console.log("wrote", out.pathname)
