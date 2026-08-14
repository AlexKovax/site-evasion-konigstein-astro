import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function getImageSize(filepath: string): { width: number; height: number } | null {
  let buf: Buffer;
  try {
    buf = readFileSync(filepath);
  } catch {
    return null;
  }

  if (buf.length < 24) return null;

  // PNG : signature 89 50 4E 47, dimensions aux octets 16-23 (big-endian)
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG : scan des marqueurs SOF
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length - 9) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) break;
      const len = buf.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
      }
      offset += 2 + len;
    }
  }

  // GIF : signature 47 49 46, dimensions aux octets 6-9 (little-endian)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }

  // WebP : RIFF....WEBP
  if (
    buf.length >= 30 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    const chunkType = buf.toString('ascii', 12, 16);
    if (chunkType === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (chunkType === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    if (chunkType === 'VP8X') {
      return { width: (buf.readUInt24LE(24) | (buf[27] << 24)) + 1, height: (buf.readUInt24LE(27, true) | (0 << 24)) + 1 };
    }
  }

  return null;
}

function walkTree(node: any, callback: (node: any) => void): void {
  callback(node);
  if (node.children) {
    for (const child of node.children) {
      walkTree(child, callback);
    }
  }
}

export function rehypeImages() {
  return (tree: any) => {
    walkTree(tree, (node) => {
      if (node.type === 'element' && node.tagName === 'img' && node.properties?.src) {
        const src = node.properties.src as string;
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
        if (src.startsWith('/content/images/')) {
          const filepath = join(process.cwd(), 'public', src);
          const size = getImageSize(filepath);
          if (size) {
            node.properties.width = size.width;
            node.properties.height = size.height;
          }
        }
      }
    });
  };
}
