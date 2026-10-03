import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw pixel data: each scanline has 1 filter byte (0) + width * 4 bytes
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rentch brand colors
      // Background: Dark Slate Teal #1C3746 (28, 55, 70) or Rose #FF5C52 (255, 92, 82)
      let r = 28;
      let g = 55;
      let b = 70;
      let a = 255;

      // Draw heart / roof icon in center
      // Simple normalized coords: nx, ny in [-1, 1]
      const nx = (x - cx) / (width * 0.35);
      const ny = (cy - y) / (height * 0.35); // flip Y so up is positive

      // Heart equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
      // Adjusted slightly:
      const hx = nx * 1.1;
      const hy = ny * 1.1 + 0.15;
      const heartVal = Math.pow(hx * hx + hy * hy - 0.7, 3) - (hx * hx) * (hy * hy * hy);

      if (heartVal <= 0.05) {
        // Inside heart! Vibrant Coral Rose #FF5C52 (255, 92, 82)
        r = 255;
        g = 92;
        b = 82;
      } else if (ny > 0.25 && Math.abs(nx) < 0.7 && (Math.abs(nx) * 0.9 + (ny - 0.25) * 0.8 < 0.65)) {
        // Roof gable
        r = 244;
        g = 63;
        b = 94;
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync('public/pwa-192x192.png', generatePng(192, 192, false));
fs.writeFileSync('public/pwa-512x512.png', generatePng(512, 512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', generatePng(512, 512, true));
fs.writeFileSync('public/apple-touch-icon.png', generatePng(180, 180, false));
fs.writeFileSync('public/favicon.ico', generatePng(32, 32, false));
console.log('PNG Icons successfully generated in public/');
