/* ==========================================================================
   RACM 303 (2569) — Per-Room PPT, QR Code & 3-Digit Student ID Check-in Engine
   - Pure-JS ISO/IEC 18004 QR Code Generator (Vector SVG + Lossless PNG Bytes)
   - Dedicated 6-Room HS1 HTML & PPT Registry (hs1-room1.html .. hs1-room6.html)
   - Full-Screen Giant QR Lightbox with Real-Time Check-in Counter
   - Mobile-First 3-Digit Student ID Check-in Gate (Numpad + Keyboard + Roster)
   - Strict Confidentiality: Zero answer keys or faculty-only data
   ========================================================================== */
(function (root) {
  "use strict";

  const PROD_STUDENT_BASE = "https://smartwoo.github.io/racm303-2569-student/";
  const PROD_FACULTY_BASE = "https://smartwoo.github.io/racm303-2569-faculty-member/";
  const CHECKIN_FRESH_MS = 10 * 60 * 60 * 1000; // 10 hours (same class day)

  const DEFAULT_HS1_ROOMS = [
    { id: 1, roomCode: "1C1-02", instructor: "ผศ. นพ.สัมฤทธิ์ / นพ.พีรสิชฌ์", count: 29 },
    { id: 2, roomCode: "1C1-03", instructor: "อ. นพ.ภูษิต", count: 28 },
    { id: 3, roomCode: "1C1-04", instructor: "นพ.ภรัณยู", count: 28 },
    { id: 4, roomCode: "1C1-05", instructor: "อ. นพ.ฉัตรชัย", count: 28 },
    { id: 5, roomCode: "1C1-06", instructor: "อ. พญ.วริษา", count: 28 },
    { id: 6, roomCode: "1C1-07", instructor: "อ. นพ.ณัฐวุฒิ", count: 28 }
  ];

  function escHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clampRoomId(n) {
    const num = Number(n);
    return num >= 1 && num <= 6 ? Math.floor(num) : 1;
  }

  /* ---------- 1. Pure-JS ISO/IEC 18004 QR Code Generator (ECC-M, Versions 1..10) ---------- */
  const QR_ECC_M = [
    null,
    [10, 1, 16, 0, 0],
    [16, 1, 28, 0, 0],
    [26, 1, 44, 0, 0],
    [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0],
    [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37],
    [26, 4, 43, 1, 44]
  ];
  const QR_ALIGN = [
    [],
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50]
  ];

  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  (function initGf() {
    let x = 1;
    for (let i = 0; i < 255; i += 1) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i += 1) GF_EXP[i] = GF_EXP[i - 255];
  })();

  function gfMul(a, b) {
    return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsRemainder(data, degree) {
    let poly = [1];
    for (let i = 0; i < degree; i += 1) {
      const nxt = new Array(poly.length + 1).fill(0);
      const r = GF_EXP[i];
      for (let j = 0; j < poly.length; j += 1) {
        nxt[j] ^= poly[j];
        nxt[j + 1] ^= gfMul(poly[j], r);
      }
      poly = nxt;
    }
    const rem = new Array(degree).fill(0);
    for (let i = 0; i < data.length; i += 1) {
      const factor = data[i] ^ rem[0];
      rem.shift();
      rem.push(0);
      for (let j = 0; j < degree; j += 1) {
        rem[j] ^= gfMul(poly[j + 1], factor);
      }
    }
    return rem;
  }

  function qrMaskBit(maskId, r, c) {
    if (maskId === 0) return (r + c) % 2 === 0;
    if (maskId === 1) return r % 2 === 0;
    if (maskId === 2) return c % 3 === 0;
    if (maskId === 3) return (r + c) % 3 === 0;
    if (maskId === 4) return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    if (maskId === 5) return ((r * c) % 2) + ((r * c) % 3) === 0;
    if (maskId === 6) return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }

  const qrMatrixCache = new Map();

  function buildQrMatrix(text) {
    const key = String(text || "");
    if (qrMatrixCache.has(key)) return qrMatrixCache.get(key);

    const raw = new TextEncoder().encode(key);
    const n = raw.length;
    let ver = 0;
    for (let v = 1; v <= 10; v += 1) {
      const [, b1, d1, b2, d2] = QR_ECC_M[v];
      const totalData = b1 * d1 + b2 * d2;
      const lenBits = v <= 9 ? 8 : 16;
      if (4 + lenBits + n * 8 <= totalData * 8) {
        ver = v;
        break;
      }
    }
    if (!ver) ver = 10;
    const [ecCw, b1, d1, b2, d2] = QR_ECC_M[ver];
    const totalData = b1 * d1 + b2 * d2;

    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i -= 1) bits.push((val >> i) & 1);
    };
    pushBits(0b0100, 4);
    pushBits(n, ver <= 9 ? 8 : 16);
    for (let i = 0; i < n; i += 1) pushBits(raw[i], 8);
    pushBits(0, Math.min(4, totalData * 8 - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const dataBytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      let v = 0;
      for (let k = 0; k < 8; k += 1) v = (v << 1) | bits[i + k];
      dataBytes.push(v);
    }
    let padIdx = 0;
    while (dataBytes.length < totalData) {
      dataBytes.push(padIdx % 2 === 0 ? 0xec : 0x11);
      padIdx += 1;
    }

    const blocksData = [];
    const blocksEc = [];
    let pos = 0;
    for (let i = 0; i < b1; i += 1) {
      const blk = dataBytes.slice(pos, pos + d1);
      pos += d1;
      blocksData.push(blk);
      blocksEc.push(rsRemainder(blk, ecCw));
    }
    for (let i = 0; i < b2; i += 1) {
      const blk = dataBytes.slice(pos, pos + d2);
      pos += d2;
      blocksData.push(blk);
      blocksEc.push(rsRemainder(blk, ecCw));
    }

    const interleaved = [];
    const maxD = Math.max(d1, d2);
    for (let i = 0; i < maxD; i += 1) {
      for (let bi = 0; bi < blocksData.length; bi += 1) {
        if (i < blocksData[bi].length) interleaved.push(blocksData[bi][i]);
      }
    }
    for (let i = 0; i < ecCw; i += 1) {
      for (let bi = 0; bi < blocksEc.length; bi += 1) {
        interleaved.push(blocksEc[bi][i]);
      }
    }

    const size = ver * 4 + 17;
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const isFunc = Array.from({ length: size }, () => new Array(size).fill(false));
    const setFunc = (r, c, dark) => {
      modules[r][c] = dark;
      isFunc[r][c] = true;
    };

    const drawFinder = (top, left) => {
      for (let dy = -1; dy <= 7; dy += 1) {
        for (let dx = -1; dx <= 7; dx += 1) {
          const r = top + dy;
          const c = left + dx;
          if (r >= 0 && r < size && c >= 0 && c < size) {
            const inOuter = dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6;
            const inWhite = dy >= 1 && dy <= 5 && dx >= 1 && dx <= 5;
            const inCore = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
            setFunc(r, c, inOuter && (!inWhite || inCore));
          }
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    for (let i = 8; i < size - 8; i += 1) {
      setFunc(6, i, i % 2 === 0);
      setFunc(i, 6, i % 2 === 0);
    }

    const apos = QR_ALIGN[ver];
    for (let ai = 0; ai < apos.length; ai += 1) {
      for (let aj = 0; aj < apos.length; aj += 1) {
        const cy = apos[ai];
        const cx = apos[aj];
        if ((cy === 6 && cx === 6) || (cy === 6 && cx === size - 7) || (cy === size - 7 && cx === 6)) continue;
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            setFunc(cy + dy, cx + dx, Math.max(Math.abs(dy), Math.abs(dx)) !== 1);
          }
        }
      }
    }

    for (let i = 0; i < 9; i += 1) {
      if (i !== 6) {
        setFunc(8, i, false);
        setFunc(i, 8, false);
      }
    }
    for (let i = 0; i < 8; i += 1) {
      setFunc(8, size - 1 - i, false);
      setFunc(size - 1 - i, 8, false);
    }
    setFunc(size - 8, 8, true);

    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >> 11) & 1 ? 0x1f25 : 0);
      const vbits = (ver << 12) | rem;
      for (let i = 0; i < 18; i += 1) {
        const bit = ((vbits >> i) & 1) === 1;
        const a = size - 11 + (i % 3);
        const b = Math.floor(i / 3);
        setFunc(a, b, bit);
        setFunc(b, a, bit);
      }
    }

    const allBits = [];
    for (let i = 0; i < interleaved.length; i += 1) {
      for (let b = 7; b >= 0; b -= 1) allBits.push((interleaved[i] >> b) & 1);
    }

    let bitIdx = 0;
    let upward = true;
    for (let col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col -= 1;
      for (let step = 0; step < size; step += 1) {
        const r = upward ? size - 1 - step : step;
        for (let dc = 0; dc >= -1; dc -= 1) {
          const c = col + dc;
          if (!isFunc[r][c]) {
            modules[r][c] = bitIdx < allBits.length ? allBits[bitIdx] === 1 : false;
            bitIdx += 1;
          }
        }
      }
      upward = !upward;
    }

    const writeFormat = (mat, msk) => {
      const data = (0b00 << 3) | msk;
      let rem = data;
      for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >> 9) & 1 ? 0x537 : 0);
      const bits15 = ((data << 10) | rem) ^ 0x5412;
      for (let i = 0; i < 6; i += 1) mat[i][8] = ((bits15 >> i) & 1) === 1;
      mat[7][8] = ((bits15 >> 6) & 1) === 1;
      mat[8][8] = ((bits15 >> 7) & 1) === 1;
      mat[8][7] = ((bits15 >> 8) & 1) === 1;
      for (let i = 9; i < 15; i += 1) mat[8][14 - i] = ((bits15 >> i) & 1) === 1;
      for (let i = 0; i < 8; i += 1) mat[8][size - 1 - i] = ((bits15 >> i) & 1) === 1;
      for (let i = 8; i < 15; i += 1) mat[size - 15 + i][8] = ((bits15 >> i) & 1) === 1;
      mat[size - 8][8] = true;
    };

    const calcPenalty = (mat) => {
      let score = 0;
      for (let r = 0; r < size; r += 1) {
        let run = 1;
        for (let c = 1; c < size; c += 1) {
          if (mat[r][c] === mat[r][c - 1]) {
            run += 1;
            if (run === 5) score += 3;
            else if (run > 5) score += 1;
          } else run = 1;
        }
      }
      for (let c = 0; c < size; c += 1) {
        let run = 1;
        for (let r = 1; r < size; r += 1) {
          if (mat[r][c] === mat[r - 1][c]) {
            run += 1;
            if (run === 5) score += 3;
            else if (run > 5) score += 1;
          } else run = 1;
        }
      }
      let darkCnt = 0;
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          if (mat[r][c]) darkCnt += 1;
          if (r < size - 1 && c < size - 1) {
            const v = mat[r][c];
            if (v === mat[r][c + 1] && v === mat[r + 1][c] && v === mat[r + 1][c + 1]) score += 3;
          }
        }
      }
      const total = size * size;
      score += Math.floor(Math.abs(darkCnt * 20 - total * 10) / total) * 10;
      return score;
    };

    let bestMat = modules;
    let bestScore = 1e9;
    for (let msk = 0; msk < 8; msk += 1) {
      const cand = modules.map((row) => row.slice());
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          if (!isFunc[r][c] && qrMaskBit(msk, r, c)) cand[r][c] = !cand[r][c];
        }
      }
      writeFormat(cand, msk);
      const sc = calcPenalty(cand);
      if (sc < bestScore) {
        bestScore = sc;
        bestMat = cand;
      }
    }

    const res = { size, matrix: bestMat };
    qrMatrixCache.set(key, res);
    return res;
  }

  function buildQrSvg(text, extraCls, ariaLabel) {
    const { size, matrix } = buildQrMatrix(text);
    const qz = 3;
    const vb = size + qz * 2;
    let pathD = "";
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (matrix[r][c]) {
          pathD += `M${c + qz},${r + qz}h1v1h-1z`;
        }
      }
    }
    const cls = extraCls ? ` ${extraCls}` : "";
    const lbl = escHtml(ariaLabel || `QR Code ${text}`);
    return `<svg class="ppt-ok-qr-svg${cls}" viewBox="0 0 ${vb} ${vb}" shape-rendering="crispEdges" role="img" aria-label="${lbl}"><rect width="${vb}" height="${vb}" fill="#ffffff" rx="2"/><path d="${pathD}" fill="#0f172a"/></svg>`;
  }

  /* ---------- 1b. Pure-JS Lossless PNG Encoder for Native .pptx Slide 1 QR ---------- */
  const PNG_CRC_TBL = (function () {
    const tbl = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tbl[n] = c >>> 0;
    }
    return tbl;
  })();

  function pngCrc32(bytes, start, len) {
    let c = 0xffffffff;
    const end = start + len;
    for (let i = start; i < end; i += 1) {
      c = PNG_CRC_TBL[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function adler32(bytes) {
    let a = 1;
    let b = 0;
    for (let i = 0; i < bytes.length; i += 1) {
      a = (a + bytes[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  }

  function makePngChunk(type4, dataBytes) {
    const out = new Uint8Array(12 + dataBytes.length);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, dataBytes.length, false);
    for (let i = 0; i < 4; i += 1) out[4 + i] = type4.charCodeAt(i);
    out.set(dataBytes, 8);
    const crc = pngCrc32(out, 4, 4 + dataBytes.length);
    dv.setUint32(8 + dataBytes.length, crc, false);
    return out;
  }

  function buildQrPngBytes(text, scalePx, quietModules) {
    const scale = Math.max(4, Math.min(20, Number(scalePx) || 9));
    const qz = Math.max(2, Number(quietModules) || 4);
    const { size, matrix } = buildQrMatrix(text);
    const totalMods = size + qz * 2;
    const imgSize = totalMods * scale;

    // Grayscale 8-bit scanlines: [filterByte=0, ...imgSize pixels]
    const rowLen = 1 + imgSize;
    const rawScanlines = new Uint8Array(imgSize * rowLen);
    for (let py = 0; py < imgSize; py += 1) {
      const mr = Math.floor(py / scale) - qz;
      const rowOffset = py * rowLen;
      rawScanlines[rowOffset] = 0; // Filter 0 (None)
      for (let px = 0; px < imgSize; px += 1) {
        const mc = Math.floor(px / scale) - qz;
        const isDark = mr >= 0 && mr < size && mc >= 0 && mc < size && matrix[mr][mc];
        rawScanlines[rowOffset + 1 + px] = isDark ? 15 : 255;
      }
    }

    // Wrap rawScanlines in valid uncompressed zlib stream (0x78 0x01 + stored blocks + adler32)
    const maxBlk = 65535;
    const numBlocks = Math.ceil(rawScanlines.length / maxBlk) || 1;
    const zOut = new Uint8Array(2 + numBlocks * 5 + rawScanlines.length + 4);
    const zdv = new DataView(zOut.buffer);
    zOut[0] = 0x78;
    zOut[1] = 0x01;
    let zPos = 2;
    for (let b = 0; b < numBlocks; b += 1) {
      const start = b * maxBlk;
      const slice = rawScanlines.subarray(start, Math.min(rawScanlines.length, start + maxBlk));
      const len = slice.length;
      const isLast = b === numBlocks - 1 ? 1 : 0;
      zOut[zPos] = isLast;
      zdv.setUint16(zPos + 1, len, true);
      zdv.setUint16(zPos + 3, (~len) & 0xffff, true);
      zOut.set(slice, zPos + 5);
      zPos += 5 + len;
    }
    zdv.setUint32(zPos, adler32(rawScanlines), false);

    // IHDR (width, height, bitDepth=8, colorType=0 grayscale, comp=0, filter=0, interlace=0)
    const ihdr = new Uint8Array(13);
    const idv = new DataView(ihdr.buffer);
    idv.setUint32(0, imgSize, false);
    idv.setUint32(4, imgSize, false);
    ihdr[8] = 8;
    ihdr[9] = 0;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const cIhdr = makePngChunk("IHDR", ihdr);
    const cIdat = makePngChunk("IDAT", zOut);
    const cIend = makePngChunk("IEND", new Uint8Array(0));

    const png = new Uint8Array(sig.length + cIhdr.length + cIdat.length + cIend.length);
    let p = 0;
    png.set(sig, p);
    p += sig.length;
    png.set(cIhdr, p);
    p += cIhdr.length;
    png.set(cIdat, p);
    p += cIdat.length;
    png.set(cIend, p);
    return png;
  }

  /* ---------- 2. Room Metadata & Dedicated HTML / PPT URL Resolver ---------- */
  function getRoomMeta(modCodeOpt, roomIdOpt) {
    const modCode = /^HS[1-6]$/i.test(String(modCodeOpt || ""))
      ? String(modCodeOpt).toUpperCase()
      : "HS1";
    const roomId = clampRoomId(roomIdOpt || 1);
    const sched = (root && root.RACM_SCHEDULE_DATA) || {};
    const roster = (root && root.RACM_ROSTER_DATA) || {};
    const fallback = DEFAULT_HS1_ROOMS[roomId - 1] || DEFAULT_HS1_ROOMS[0];
    const rot = (sched.hsRotation || []).find((r) => Number(r.group) === roomId) || {};
    const modCell = rot[modCode] || {};

    const roomCode = modCell.room || rot.room || fallback.roomCode;
    const cleanRoomSlug = (String(roomCode).match(/1C1-0[2-7]|2C2-0[1-3]/) || [fallback.roomCode])[0];
    const instructor = modCell.instructor || fallback.instructor;
    const pinCode = `${modCode}-R${roomId}`;

    const assignedStudents = Array.isArray(roster.students)
      ? roster.students.filter((s) => Number(s.disc) === roomId)
      : [];
    const expectedCount = assignedStudents.length || rot.count || fallback.count || 28;

    const isHs1 = modCode === "HS1";
    const htmlFile = isHs1 ? `hs1-room${roomId}.html` : "";
    const studentQrUrl = isHs1
      ? `${PROD_STUDENT_BASE}hs1-room${roomId}.html`
      : `${PROD_STUDENT_BASE}?page=hs-discussion&module=${modCode}&room=${roomId}&checkin=1#hs-discussion-${modCode}-R${roomId}`;
    const displayShortUrl = isHs1
      ? `racm303-2569-student/hs1-room${roomId}.html`
      : `racm303-2569-student/#hs-discussion-${modCode}-R${roomId}`;
    const facultyRoomHref = isHs1
      ? `hs1-room${roomId}.html`
      : `?page=hs-discussion&module=${modCode}&room=${roomId}#hs-discussion-${modCode}-R${roomId}`;
    const studentRoomHref = isHs1
      ? `hs1-room${roomId}.html`
      : `?page=hs-discussion&module=${modCode}&room=${roomId}&checkin=1#hs-discussion-${modCode}-R${roomId}`;
    const pptxFileName = `RACM303_2569_${modCode}_Room${roomId}_${cleanRoomSlug}.pptx`;
    const staticPptxHref = isHs1 ? `exports/pptx/${pptxFileName}` : "";

    return {
      modCode,
      roomId,
      roomCode,
      cleanRoomSlug,
      instructor,
      pinCode,
      expectedCount,
      assignedStudents,
      isHs1,
      htmlFile,
      studentQrUrl,
      displayShortUrl,
      facultyRoomHref,
      studentRoomHref,
      pptxFileName,
      staticPptxHref
    };
  }

  function getAllHs1RoomMetas() {
    return [1, 2, 3, 4, 5, 6].map((r) => getRoomMeta("HS1", r));
  }

  /* ---------- 3. Student Check-in Persistence (Scoped per Module & Room) ---------- */
  function checkinStorageKey(modCode, roomId) {
    return `racm303_hsd_qr_checkin_v1_${String(modCode || "HS1").toUpperCase()}_R${clampRoomId(roomId)}`;
  }

  function getStudentCheckinRecord(modCode, roomId) {
    const key = checkinStorageKey(modCode, roomId);
    try {
      const sRaw = sessionStorage.getItem(key);
      if (sRaw) {
        const parsed = JSON.parse(sRaw);
        if (parsed && parsed.studentId) return parsed;
      }
    } catch (_) {}
    try {
      const lRaw = localStorage.getItem(key);
      if (lRaw) {
        const parsed = JSON.parse(lRaw);
        if (parsed && parsed.studentId && Date.now() - (Number(parsed.checkedInMs) || 0) < CHECKIN_FRESH_MS) {
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  }

  function isStudentCheckedIn(modCode, roomId) {
    return Boolean(getStudentCheckinRecord(modCode, roomId));
  }

  function markStudentCheckedIn(modCode, roomId, studentObj, teamId) {
    if (!studentObj || !studentObj.id) return null;
    const now = Date.now();
    const rec = {
      modCode: String(modCode || "HS1").toUpperCase(),
      roomId: clampRoomId(roomId),
      studentId: String(studentObj.id),
      shortNo: String(studentObj.id).slice(-3),
      fullName: String(studentObj.fullName || studentObj.name || ""),
      nickname: String(studentObj.nickname || ""),
      assignedDisc: Number(studentObj.disc) || clampRoomId(roomId),
      teamId: Number(teamId) >= 1 && Number(teamId) <= 3 ? Number(teamId) : 1,
      checkedInMs: now,
      checkedInISO: new Date(now).toISOString()
    };
    const key = checkinStorageKey(modCode, roomId);
    const raw = JSON.stringify(rec);
    try {
      sessionStorage.setItem(key, raw);
      sessionStorage.setItem("racm303_hsd_room_confirmed", "1");
      sessionStorage.setItem("racm303_hsd_session_joined_v1", "1");
    } catch (_) {}
    try {
      localStorage.setItem(key, raw);
    } catch (_) {}
    return rec;
  }

  function clearStudentCheckin(modCode, roomId) {
    if (modCode && roomId) {
      const key = checkinStorageKey(modCode, roomId);
      try {
        sessionStorage.removeItem(key);
      } catch (_) {}
      try {
        localStorage.removeItem(key);
      } catch (_) {}
      return;
    }
    // Clear all rooms if not specified
    ["HS1", "HS2", "HS3", "HS4", "HS5", "HS6"].forEach((m) => {
      [1, 2, 3, 4, 5, 6].forEach((r) => {
        const k = checkinStorageKey(m, r);
        try {
          sessionStorage.removeItem(k);
        } catch (_) {}
        try {
          localStorage.removeItem(k);
        } catch (_) {}
      });
    });
  }

  /* ---------- 4. Student Roster Lookup by 3-Digit Code ---------- */
  function matchStudentsBy3DigitPin(pinStr, roomIdOpt) {
    const roster = ((root && root.RACM_ROSTER_DATA && root.RACM_ROSTER_DATA.students) || []);
    const roomNum = clampRoomId(roomIdOpt || 1);
    const raw = String(pinStr || "").trim();
    if (!raw) {
      return { paddedPin: "", inRoom: [], otherRooms: [], all: [] };
    }
    const digitsOnly = raw.replace(/\D/g, "");
    if (digitsOnly.length >= 7) {
      const exact7 = roster.filter((s) => String(s.id) === digitsOnly.slice(0, 7));
      return {
        paddedPin: exact7[0] ? String(exact7[0].id).slice(-3) : digitsOnly.slice(-3),
        inRoom: exact7.filter((s) => Number(s.disc) === roomNum),
        otherRooms: exact7.filter((s) => Number(s.disc) !== roomNum),
        all: exact7
      };
    }
    if (/^\d{1,3}$/.test(raw)) {
      const padded = raw.padStart(3, "0");
      const matches = roster.filter((s) => String(s.id).slice(-3) === padded);
      return {
        paddedPin: padded,
        inRoom: matches.filter((s) => Number(s.disc) === roomNum),
        otherRooms: matches.filter((s) => Number(s.disc) !== roomNum),
        all: matches
      };
    }
    const q = raw.toLocaleLowerCase("th");
    const textMatches = roster.filter((s) =>
      `${s.id} ${s.nickname || ""} ${s.fullName || ""} ${s.name || ""}`.toLocaleLowerCase("th").includes(q)
    );
    return {
      paddedPin: "",
      inRoom: textMatches.filter((s) => Number(s.disc) === roomNum),
      otherRooms: textMatches.filter((s) => Number(s.disc) !== roomNum),
      all: textMatches
    };
  }

  /* ---------- 5. Live Room Presence Summary Helper ---------- */
  function getLiveRoomJoinedStats(roomId) {
    const rMeta = getRoomMeta("HS1", roomId);
    const live = root && root.RACM_LIVE_CLASSROOM;
    const pres =
      live && typeof live.getPresenceSummary === "function" && live.getRoomId() === rMeta.roomId
        ? live.getPresenceSummary()
        : { joinedStudents: [], teamCounts: { 1: 0, 2: 0, 3: 0 } };
    const joinedList = Array.isArray(pres.joinedStudents) ? pres.joinedStudents : [];
    const bySid = new Map();
    joinedList.forEach((p) => {
      const sid = String(
        p.studentId || (p.participantId && p.participantId.startsWith("sid_") ? p.participantId.slice(4) : "") || ""
      ).trim();
      if (sid) bySid.set(sid, p);
    });
    return {
      roomMeta: rMeta,
      joinedList,
      bySid,
      joinedCount: joinedList.length,
      expectedCount: rMeta.expectedCount,
      teamCounts: pres.teamCounts || { 1: 0, 2: 0, 3: 0 }
    };
  }

  /* ---------- 6. Faculty CSV Attendance Export for Active Room ---------- */
  function exportRoomCheckinCsv(modCodeOpt, roomIdOpt) {
    if (typeof document === "undefined") return;
    const meta = getRoomMeta(modCodeOpt, roomIdOpt);
    const stats = getLiveRoomJoinedStats(meta.roomId);
    const rows = [
      [
        "ลำดับ",
        "รหัสนักศึกษา",
        "เลขท้าย 3 ตัว",
        "ชื่อ-นามสกุล",
        "ชื่อเล่น",
        "ห้องอภิปราย",
        "สถานะ Check-in",
        "กลุ่มย่อยในห้อง",
        "เวลา Check-in"
      ]
    ];

    meta.assignedStudents.forEach((stu, idx) => {
      const sid = String(stu.id || "");
      const pres = stats.bySid.get(sid);
      const timeStr =
        pres && pres.joinedWallMs
          ? new Date(pres.joinedWallMs).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          : "";
      rows.push([
        String(idx + 1),
        sid,
        sid.slice(-3),
        stu.fullName || stu.name || "",
        stu.nickname || "",
        `${meta.pinCode} (${meta.roomCode})`,
        pres ? "Check-in แล้ว" : "ยังไม่ Check-in",
        pres && pres.teamId ? `กลุ่ม ${pres.teamId}` : "-",
        timeStr
      ]);
    });

    // Also include any guest students from other rooms who checked into this room
    stats.joinedList.forEach((p) => {
      const sid = String(p.studentId || "");
      if (sid && meta.assignedStudents.some((s) => String(s.id) === sid)) return;
      const timeStr = p.joinedWallMs
        ? new Date(p.joinedWallMs).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "";
      rows.push([
        "เพิ่มเติม",
        sid || p.participantId || "",
        p.shortNo || (sid ? sid.slice(-3) : ""),
        p.fullName || p.name || "",
        p.nickname || "",
        `${meta.pinCode} (${meta.roomCode})`,
        "Check-in แล้ว (ต่างห้อง)",
        p.teamId ? `กลุ่ม ${p.teamId}` : "-",
        timeStr
      ]);
    });

    const csvText =
      "\uFEFF" +
      rows
        .map((r) =>
          r
            .map((cell) => {
              const s = String(cell == null ? "" : cell).replace(/"/g, '""');
              return `"${s}"`;
            })
            .join(",")
        )
        .join("\r\n");

    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Checkin_${meta.modCode}_Room${meta.roomId}_${meta.cleanRoomSlug}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1200);
  }

  /* ---------- 7. Full-Screen Giant QR Check-in Lightbox ---------- */
  let qrModalUnsub = null;

  function closeRoomQrZoomModal() {
    if (typeof document === "undefined") return;
    const bd = document.getElementById("hsdRoomQrZoomModal");
    if (bd) bd.hidden = true;
    if (qrModalUnsub) {
      qrModalUnsub();
      qrModalUnsub = null;
    }
  }

  function openRoomQrZoomModal(modCodeOpt, roomIdOpt) {
    if (typeof document === "undefined") return;
    const live = root && root.RACM_LIVE_CLASSROOM;
    const effRoom = clampRoomId(roomIdOpt || (live ? live.getRoomId() : 1));
    const meta = getRoomMeta(modCodeOpt || "HS1", effRoom);
    const isFaculty = root.PORTAL_ROLE === "faculty";

    if (live && live.getRoomId() !== effRoom) {
      live.setRoom(effRoom, false);
    }

    let bd = document.getElementById("hsdRoomQrZoomModal");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "hsdRoomQrZoomModal";
      bd.className = "hsd-qr-zoom-backdrop hsd-no-print";
      bd.setAttribute("role", "dialog");
      bd.setAttribute("aria-modal", "true");
      bd.addEventListener("click", (ev) => {
        if (ev.target === bd) closeRoomQrZoomModal();
      });
      document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && bd && !bd.hidden) {
          closeRoomQrZoomModal();
        }
      });
      document.body.appendChild(bd);
    }

    function renderDialog() {
      const stats = getLiveRoomJoinedStats(meta.roomId);
      const qrSvg = buildQrSvg(
        meta.studentQrUrl,
        "is-giant-modal-qr",
        `QR Code Check-in ${meta.pinCode} ห้อง ${meta.roomCode}`
      );
      const pillsHtml = stats.joinedList.length
        ? stats.joinedList
            .map((p) => {
              const sNo = p.shortNo || (p.studentId ? String(p.studentId).slice(-3) : "");
              const tTag = p.teamId ? `ก.${p.teamId} ` : "";
              return `<span class="hsd-qr-zoom-stu-pill">✓ ${escHtml(tTag)}${escHtml(sNo)} ${escHtml(p.nickname || p.fullName || "")}</span>`;
            })
            .join("")
        : `<span style="font-size:13px;opacity:0.8">รอนักศึกษาสแกน QR Code และกรอกรหัส 3 ตัวท้าย…</span>`;

      bd.innerHTML = `
        <div class="hsd-qr-zoom-dialog">
          <div class="hsd-qr-zoom-box">${qrSvg}</div>
          <div class="hsd-qr-zoom-meta">
            <span class="hsd-qr-zoom-pin">📍 ${escHtml(meta.pinCode)} · ห้องอภิปรายที่ ${meta.roomId}</span>
            <h3 class="hsd-qr-zoom-title">Case Discussion: ${escHtml(meta.modCode)}</h3>
            <div class="hsd-qr-zoom-room">ห้อง ${escHtml(meta.roomCode)} · อ.ประจำห้อง: ${escHtml(meta.instructor)}</div>
            <div class="ppt-ok-qr-steps" style="text-align:left">
              <div class="ppt-ok-qr-step"><span class="ppt-ok-qr-step-num">1</span><span>ใช้กล้องมือถือหรือ LINE สแกน <strong>QR Code ประจำห้อง ${escHtml(meta.roomCode)}</strong> ด้านซ้าย</span></div>
              <div class="ppt-ok-qr-step"><span class="ppt-ok-qr-step-num">2</span><span>กรอก <strong>รหัสนักศึกษา 3 ตัวท้าย</strong> (เช่น 056) เพื่อ <strong>Check-in เข้าห้องเรียน</strong> และแบ่งกลุ่มย่อย 1 / 2 / 3</span></div>
            </div>
            <div class="hsd-qr-zoom-url" title="${escHtml(meta.studentQrUrl)}">🔗 ${escHtml(meta.studentQrUrl)}</div>
            <div class="hsd-qr-zoom-live-box" id="hsdQrZoomLiveBox">
              <div class="hsd-qr-zoom-live-count">🟢 Check-in เข้าห้อง ${escHtml(meta.roomCode)} แล้ว ${stats.joinedCount} / ${stats.expectedCount} คน (ก.1: ${stats.teamCounts[1] || 0} · ก.2: ${stats.teamCounts[2] || 0} · ก.3: ${stats.teamCounts[3] || 0})</div>
              <div class="hsd-qr-zoom-live-pills">${pillsHtml}</div>
            </div>
            <div class="hsd-qr-zoom-actions">
              <button type="button" class="btn sm primary" id="hsdQrZoomCopyBtn">📋 คัดลอกลิงก์ห้อง ${escHtml(meta.roomCode)}</button>
              <a class="btn sm teal" href="${escHtml(meta.studentQrUrl)}" target="_blank" rel="noopener">↗ เปิดหน้า Check-in นศพ. (${escHtml(meta.htmlFile || meta.pinCode)})</a>
              ${isFaculty ? `<button type="button" class="btn sm" id="hsdQrZoomCsvBtn">📥 ส่งออกเช็คชื่อ (.csv)</button>` : ""}
              <button type="button" class="btn sm" id="hsdQrZoomCloseBtn">✕ ปิดหน้าต่าง (Esc)</button>
            </div>
          </div>
        </div>
      `;

      const copyBtn = bd.querySelector("#hsdQrZoomCopyBtn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(meta.studentQrUrl).then(() => {
              copyBtn.textContent = "✓ คัดลอกลิงก์แล้ว!";
              setTimeout(() => {
                if (copyBtn.isConnected) copyBtn.textContent = `📋 คัดลอกลิงก์ห้อง ${meta.roomCode}`;
              }, 1500);
            }).catch(() => {});
          }
        });
      }
      const csvBtn = bd.querySelector("#hsdQrZoomCsvBtn");
      if (csvBtn) {
        csvBtn.addEventListener("click", () => exportRoomCheckinCsv(meta.modCode, meta.roomId));
      }
      const closeBtn = bd.querySelector("#hsdQrZoomCloseBtn");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => closeRoomQrZoomModal());
      }
    }

    renderDialog();
    bd.hidden = false;

    if (qrModalUnsub) qrModalUnsub();
    if (live && typeof live.on === "function") {
      qrModalUnsub = live.on("presence", () => {
        if (!bd.hidden) renderDialog();
      });
    }
  }

  /* ---------- 8. Dedicated 6-Room PPT & HTML Selector Section (HS1) ---------- */
  function buildSixRoomPptsSectionDOM(modCodeOpt, opts) {
    const cfg = opts || {};
    const modCode = String(modCodeOpt || "HS1").toUpperCase();
    const isFaculty = root.PORTAL_ROLE === "faculty";
    const myDiscRoom = Number(cfg.myStudentDisc) || 0;
    const activeRoom = Number(cfg.activeRoomId) || 0;

    const sec = document.createElement("section");
    sec.className = "hsd-six-room-ppts-section hsd-no-print";
    sec.setAttribute("aria-label", `PPT และ QR Code แยกตามห้องเรียน ${modCode} (6 ห้อง)`);

    const head = document.createElement("div");
    head.className = "hsd-srp-head";
    head.innerHTML = `
      <div>
        <h4 class="hsd-srp-title">📊 เลือกเปิดไฟล์ PPT &amp; QR Code ประจำห้องเรียน — Case Discussion: ${escHtml(modCode)} (แยก 6 ห้อง · 6 HTML)</h4>
        <p class="hsd-srp-sub">${
          isFaculty
            ? "แต่ละห้องมีไฟล์ HTML และสไลด์ PPT (.pptx) ของห้องตัวเองพร้อม QR Code เช็คชื่อด้วยรหัสนักศึกษา 3 ตัวท้ายแยกแต่ละห้อง"
            : "เลือกห้องอภิปรายของคุณ (ห้อง 1–6) หรือสแกน QR Code หน้าห้องเรียนเพื่อกรอกรหัสนักศึกษา 3 ตัวท้าย Check-in เข้าห้อง"
        }</p>
      </div>
    `;
    sec.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "hsd-srp-grid";

    [1, 2, 3, 4, 5, 6].forEach((rId) => {
      const meta = getRoomMeta(modCode, rId);
      const isMine = myDiscRoom === rId;
      const isCur = activeRoom === rId;

      const card = document.createElement("div");
      card.className = `hsd-srp-card${isMine ? " is-my-assigned-room" : ""}${isCur ? " is-active-room" : ""}`;

      const top = document.createElement("div");
      top.className = "hsd-srp-top";

      const qrBtn = document.createElement("button");
      qrBtn.type = "button";
      qrBtn.className = "hsd-srp-qr-btn";
      qrBtn.title = `คลิกเพื่อขยาย QR Code ประจำห้อง ${meta.roomCode} (${meta.displayShortUrl})`;
      qrBtn.innerHTML = buildQrSvg(meta.studentQrUrl, "", `QR ห้อง ${meta.roomCode}`);
      qrBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openRoomQrZoomModal(modCode, rId);
      });

      const metaDiv = document.createElement("div");
      metaDiv.className = "hsd-srp-meta";
      metaDiv.innerHTML = `
        <div class="hsd-srp-badges">
          <span class="hsd-srp-pin">${escHtml(meta.pinCode)}</span>
          ${meta.htmlFile ? `<span class="hsd-srp-html-pill">${escHtml(meta.htmlFile)}</span>` : ""}
          ${isMine ? `<span class="hsd-srp-html-pill" style="background:rgba(16,185,129,0.15);color:#047857">★ ห้องของคุณ</span>` : ""}
        </div>
        <div class="hsd-srp-room-name">ห้อง ${rId} · ${escHtml(meta.roomCode)} (${meta.expectedCount} คน)</div>
        <div class="hsd-srp-inst" title="${escHtml(meta.instructor)}">อ.ประจำห้อง: ${escHtml(meta.instructor)}</div>
      `;

      top.append(qrBtn, metaDiv);
      card.appendChild(top);

      const acts = document.createElement("div");
      acts.className = "hsd-srp-actions";

      const openHtmlLink = document.createElement("a");
      openHtmlLink.className = "hsd-srp-act-btn is-primary";
      openHtmlLink.href = isFaculty ? meta.facultyRoomHref : meta.studentRoomHref;
      openHtmlLink.textContent = isFaculty
        ? `▶ เปิด PPT ห้อง ${rId} (${meta.roomCode})`
        : `📲 เข้าห้อง ${rId} & Check-in`;

      const qrZoomBtn = document.createElement("button");
      qrZoomBtn.type = "button";
      qrZoomBtn.className = "hsd-srp-act-btn";
      qrZoomBtn.textContent = "📱 QR";
      qrZoomBtn.title = `แสดง QR Code สำหรับห้อง ${meta.roomCode}`;
      qrZoomBtn.addEventListener("click", () => openRoomQrZoomModal(modCode, rId));

      acts.append(openHtmlLink, qrZoomBtn);

      if (meta.staticPptxHref) {
        const dlA = document.createElement("a");
        dlA.className = "hsd-srp-act-btn";
        dlA.href = meta.staticPptxHref;
        dlA.download = meta.pptxFileName;
        dlA.textContent = "⬇ .pptx";
        dlA.title = `ดาวน์โหลดไฟล์ ${meta.pptxFileName} ประจำห้อง ${meta.roomCode}`;
        acts.appendChild(dlA);
      } else if (typeof cfg.onDownloadRoomPptx === "function") {
        const dlB = document.createElement("button");
        dlB.type = "button";
        dlB.className = "hsd-srp-act-btn";
        dlB.textContent = "⬇ .pptx";
        dlB.addEventListener("click", () => cfg.onDownloadRoomPptx(modCode, rId));
        acts.appendChild(dlB);
      }

      card.appendChild(acts);
      grid.appendChild(card);
    });

    sec.appendChild(grid);
    return sec;
  }

  /* ---------- 9. Post-Scan Mobile-First 3-Digit Student ID Check-in Gate ---------- */
  let activeCheckinKeyHandler = null;
  let activeCheckinPresUnsub = null;

  function teardownCheckinGateListeners() {
    if (activeCheckinKeyHandler && typeof window !== "undefined") {
      window.removeEventListener("keydown", activeCheckinKeyHandler);
      activeCheckinKeyHandler = null;
    }
    if (activeCheckinPresUnsub) {
      activeCheckinPresUnsub();
      activeCheckinPresUnsub = null;
    }
  }

  function renderStudentQrCheckinGateDOM(container, opts) {
    if (!container || typeof document === "undefined") return;
    teardownCheckinGateListeners();

    const cfg = opts || {};
    const live = root && root.RACM_LIVE_CLASSROOM;
    const modCode = String(cfg.modCode || "HS1").toUpperCase();
    const roomId = clampRoomId(cfg.roomId || (live ? live.getRoomId() : 1));
    const meta = getRoomMeta(modCode, roomId);

    if (live && live.getRoomId() !== roomId) {
      live.setRoom(roomId, false);
    }

    let pinDigits = "";
    let searchFallbackText = "";
    let pickedStudent = null;
    let selectedTeam = 0;

    const wrap = document.createElement("div");
    wrap.className = "hsd-qr-checkin-gate-wrap";

    const card = document.createElement("div");
    card.className = "hsd-qr-checkin-card";
    wrap.appendChild(card);

    // 1. Room Banner
    const hero = document.createElement("div");
    hero.className = "hsd-qcg-hero";
    const heroTop = document.createElement("div");
    heroTop.className = "hsd-qcg-hero-top";
    const pinPill = document.createElement("span");
    pinPill.className = "hsd-qcg-pin-pill";
    pinPill.textContent = `📍 ${meta.pinCode} · ห้อง ${meta.roomCode}`;
    const livePill = document.createElement("span");
    livePill.className = "hsd-qcg-live-pill";
    heroTop.append(pinPill, livePill);

    const hTitle = document.createElement("h3");
    hTitle.className = "hsd-qcg-title";
    hTitle.textContent = `Case Discussion: ${meta.modCode} — Check-in เข้าห้องเรียน`;

    const hSub = document.createElement("p");
    hSub.className = "hsd-qcg-sub";
    hSub.textContent = `ห้องอภิปรายที่ ${meta.roomId} (ห้อง ${meta.roomCode}) · อ.ประจำห้อง: ${meta.instructor}`;
    hero.append(heroTop, hTitle, hSub);
    card.appendChild(hero);

    // 2. Step Title + 3-Digit Slots
    const stepLbl = document.createElement("div");
    stepLbl.className = "hsd-qcg-step-title";
    stepLbl.textContent = "กรอกรหัสนักศึกษา 3 ตัวท้าย (เช่น 056) เพื่อ Check-in";
    card.appendChild(stepLbl);

    const slotsRow = document.createElement("div");
    slotsRow.className = "hsd-qcg-pin-slots";
    const slotEls = [0, 1, 2].map(() => {
      const s = document.createElement("div");
      s.className = "hsd-qcg-slot";
      slotsRow.appendChild(s);
      return s;
    });
    card.appendChild(slotsRow);

    // Verification status + disambiguation / wrong-room box
    const verifyBox = document.createElement("div");
    verifyBox.className = "hsd-qcg-verify-box is-idle";
    card.appendChild(verifyBox);

    // Tactile Mobile Numeric Keypad (0-9, Clear, Backspace)
    const numpad = document.createElement("div");
    numpad.className = "hsd-qcg-numpad";
    numpad.setAttribute("role", "group");
    numpad.setAttribute("aria-label", "แป้นกดรหัสนักศึกษา 3 ตัวท้าย");

    ["1", "2", "3", "4", "5", "6", "7", "8", "9"].forEach((d) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hsd-qcg-key";
      b.textContent = d;
      b.addEventListener("click", () => pushDigit(d));
      numpad.appendChild(b);
    });

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "hsd-qcg-key is-fn";
    clearBtn.textContent = "ล้าง";
    clearBtn.addEventListener("click", () => {
      pinDigits = "";
      searchFallbackText = "";
      directInput.value = "";
      pickedStudent = null;
      syncUI();
    });

    const zeroBtn = document.createElement("button");
    zeroBtn.type = "button";
    zeroBtn.className = "hsd-qcg-key";
    zeroBtn.textContent = "0";
    zeroBtn.addEventListener("click", () => pushDigit("0"));

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "hsd-qcg-key is-fn";
    backBtn.setAttribute("aria-label", "ลบตัวท้าย");
    backBtn.textContent = "⌫";
    backBtn.addEventListener("click", () => popDigit());

    numpad.append(clearBtn, zeroBtn, backBtn);
    card.appendChild(numpad);

    // Optional Keyboard / Name Search Fallback Input
    const directWrap = document.createElement("div");
    directWrap.className = "hsd-qcg-direct-input-wrap";
    const directInput = document.createElement("input");
    directInput.type = "search";
    directInput.inputMode = "search";
    directInput.autocomplete = "off";
    directInput.className = "hsd-qcg-direct-input";
    directInput.placeholder = "หรือพิมพ์รหัส 3 ตัว / รหัส 7 หลัก / ชื่อเล่นที่นี่…";
    directInput.addEventListener("input", () => {
      const val = directInput.value.trim();
      const onlyNums = val.replace(/\D/g, "");
      if (/^\d{1,3}$/.test(val)) {
        pinDigits = val;
        searchFallbackText = "";
        autoResolveCandidate();
      } else {
        searchFallbackText = val;
        if (onlyNums.length === 7) {
          pinDigits = onlyNums.slice(-3);
        }
        autoResolveCandidate();
      }
      syncUI();
    });
    directInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        submitCheckin();
      }
    });
    directWrap.appendChild(directInput);
    card.appendChild(directWrap);

    // Sub-Group 1 / 2 / 3 Balanced Selector
    const teamsWrap = document.createElement("div");
    teamsWrap.className = "hsd-qcg-teams-wrap";
    const teamsLbl = document.createElement("div");
    teamsLbl.className = "hsd-qcg-teams-lbl";
    teamsLbl.textContent = "กลุ่มย่อยในห้องเรียน (ระบบเกลี่ยคนเข้ากลุ่ม 1 / 2 / 3 ให้อัตโนมัติ หรือแตะเลือกกลุ่มได้)";
    const teamsRow = document.createElement("div");
    teamsRow.className = "hsd-qcg-teams-row";
    teamsWrap.append(teamsLbl, teamsRow);
    card.appendChild(teamsWrap);

    // Big Check-in Submit Button
    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "hsd-qcg-submit-btn";
    submitBtn.addEventListener("click", () => submitCheckin());
    card.appendChild(submitBtn);

    function computeBalance() {
      const bal =
        live && typeof live.getSmartTeamBalance === "function"
          ? live.getSmartTeamBalance(pickedStudent && pickedStudent.id, meta.expectedCount)
          : {
              recommendedTeam: 1,
              teams: {
                1: { id: 1, otherCount: 0, maxQuota: Math.ceil(meta.expectedCount / 3), locked: false, isRecommended: true },
                2: { id: 2, otherCount: 0, maxQuota: Math.ceil(meta.expectedCount / 3), locked: false, isRecommended: false },
                3: { id: 3, otherCount: 0, maxQuota: Math.ceil(meta.expectedCount / 3), locked: false, isRecommended: false }
              }
            };
      if (!selectedTeam || (bal.teams[selectedTeam] && bal.teams[selectedTeam].locked)) {
        selectedTeam = bal.recommendedTeam || 1;
      }
      return bal;
    }

    function autoResolveCandidate() {
      const query = searchFallbackText || (pinDigits.length === 3 ? pinDigits : "");
      if (!query) {
        pickedStudent = null;
        return;
      }
      const res = matchStudentsBy3DigitPin(query, roomId);
      if (res.inRoom.length === 1) {
        pickedStudent = res.inRoom[0];
      } else if (res.inRoom.length === 0 && res.otherRooms.length === 1) {
        pickedStudent = res.otherRooms[0];
      } else if (res.all.length === 1) {
        pickedStudent = res.all[0];
      } else if (pickedStudent && !res.all.some((s) => s.id === pickedStudent.id)) {
        pickedStudent = null;
      }
    }

    function pushDigit(d) {
      searchFallbackText = "";
      if (pinDigits.length >= 3) {
        pinDigits = d;
        pickedStudent = null;
      } else {
        pinDigits += d;
      }
      directInput.value = pinDigits;
      autoResolveCandidate();
      syncUI();
    }

    function popDigit() {
      if (searchFallbackText) {
        searchFallbackText = "";
        directInput.value = "";
      }
      pinDigits = pinDigits.slice(0, -1);
      directInput.value = pinDigits;
      pickedStudent = null;
      autoResolveCandidate();
      syncUI();
    }

    function syncUI() {
      const stats = getLiveRoomJoinedStats(roomId);
      livePill.textContent = `🟢 Check-in แล้ว ${stats.joinedCount}/${stats.expectedCount} คน`;

      // Slots
      slotEls.forEach((el, idx) => {
        const ch = pinDigits[idx] || "";
        el.textContent = ch || "•";
        el.classList.toggle("is-filled", Boolean(ch));
        el.classList.toggle("is-active-cursor", pinDigits.length === idx);
      });

      // Verify Box
      verifyBox.replaceChildren();
      const query = searchFallbackText || pinDigits;
      if (!query || (!searchFallbackText && pinDigits.length < 3)) {
        verifyBox.className = "hsd-qcg-verify-box is-idle";
        verifyBox.textContent =
          pinDigits.length > 0
            ? `กรอกอีก ${3 - pinDigits.length} หลัก (หรือกดปุ่ม Check-in หากเป็นเลข ${pinDigits.padStart(3, "0")})`
            : `แตะตัวเลข 3 หลักท้ายของรหัสนักศึกษาบนแป้นด้านล่างเพื่อยืนยันชื่อเข้าห้อง ${meta.roomCode}`;
      } else {
        const res = matchStudentsBy3DigitPin(query, roomId);
        if (pickedStudent) {
          const sNo = String(pickedStudent.id).slice(-3);
          const stuRoom = Number(pickedStudent.disc) || roomId;
          if (stuRoom === roomId) {
            verifyBox.className = "hsd-qcg-verify-box is-matched";
            verifyBox.innerHTML =
              `<div><strong>✅ รหัส ${escHtml(pickedStudent.id)} (เบอร์ ${escHtml(sNo)}) · ${escHtml(pickedStudent.nickname || pickedStudent.name)}</strong></div>` +
              `<div>${escHtml(pickedStudent.fullName || pickedStudent.name)} · ห้อง ${stuRoom} (${escHtml(meta.roomCode)})</div>`;
          } else {
            const otherMeta = getRoomMeta(modCode, stuRoom);
            verifyBox.className = "hsd-qcg-verify-box is-wrong-room";
            const msgDiv = document.createElement("div");
            msgDiv.innerHTML =
              `<strong>⚠️ เบอร์ ${escHtml(sNo)} · ${escHtml(pickedStudent.nickname || pickedStudent.name)} (${escHtml(pickedStudent.fullName || "")})</strong><br>` +
              `ตามตารางสอนอยู่ <strong>ห้อง ${stuRoom} · ${escHtml(otherMeta.roomCode)}</strong> (${escHtml(otherMeta.instructor)})`;
            const goMyRoomLink = document.createElement("a");
            goMyRoomLink.href = otherMeta.studentRoomHref;
            goMyRoomLink.className = "btn sm primary";
            goMyRoomLink.style.marginTop = "8px";
            goMyRoomLink.style.display = "inline-flex";
            goMyRoomLink.textContent = `👉 ไปหน้า Check-in ห้อง ${stuRoom} (${otherMeta.roomCode}) ของฉัน`;
            verifyBox.append(msgDiv, goMyRoomLink);
          }

          if (res.all.length > 1) {
            const candList = document.createElement("div");
            candList.className = "hsd-qcg-cand-list";
            res.all.slice(0, 5).forEach((cand) => {
              const cb = document.createElement("button");
              cb.type = "button";
              cb.className = `hsd-qcg-cand-btn${pickedStudent && pickedStudent.id === cand.id ? " is-selected" : ""}`;
              cb.innerHTML =
                `<span>🎓 ${escHtml(cand.id)} · <strong>${escHtml(cand.nickname || cand.name)}</strong> (${escHtml(cand.fullName || "")})</span>` +
                `<span>ห้อง ${cand.disc}</span>`;
              cb.addEventListener("click", () => {
                pickedStudent = cand;
                pinDigits = String(cand.id).slice(-3);
                directInput.value = pinDigits;
                syncUI();
              });
              candList.appendChild(cb);
            });
            verifyBox.appendChild(candList);
          }
        } else if (res.all.length > 1) {
          verifyBox.className = "hsd-qcg-verify-box is-idle";
          const lead = document.createElement("div");
          lead.innerHTML = `พบรายชื่อที่ตรงกัน <strong>${res.all.length} คน</strong> — แตะเลือกชื่อของคุณ:`;
          const candList = document.createElement("div");
          candList.className = "hsd-qcg-cand-list";
          const ordered = [...res.inRoom, ...res.otherRooms].slice(0, 6);
          ordered.forEach((cand) => {
            const cb = document.createElement("button");
            cb.type = "button";
            cb.className = "hsd-qcg-cand-btn";
            cb.innerHTML =
              `<span>🎓 ${escHtml(cand.id)} · <strong>${escHtml(cand.nickname || cand.name)}</strong> (${escHtml(cand.fullName || "")})</span>` +
              `<span>ห้อง ${cand.disc}${Number(cand.disc) === roomId ? " ★" : ""}</span>`;
            cb.addEventListener("click", () => {
              pickedStudent = cand;
              pinDigits = String(cand.id).slice(-3);
              searchFallbackText = "";
              directInput.value = pinDigits;
              syncUI();
            });
            candList.appendChild(cb);
          });
          verifyBox.append(lead, candList);
        } else {
          verifyBox.className = "hsd-qcg-verify-box is-error";
          verifyBox.textContent = `ไม่พบรหัสท้าย "${query}" ในรายชื่อนักศึกษา 169 คน — กรุณาตรวจสอบตัวเลข 3 หลักอีกครั้ง`;
        }
      }

      // Teams row
      const bal = computeBalance();
      teamsRow.replaceChildren();
      [1, 2, 3].forEach((tid) => {
        const tInfo = bal.teams[tid];
        const isSel = selectedTeam === tid && !tInfo.locked;
        const tb = document.createElement("button");
        tb.type = "button";
        tb.className = `hsd-qcg-team-btn${isSel ? " is-selected" : ""}`;
        tb.disabled = Boolean(tInfo.locked);
        const tag = tInfo.locked ? "เต็มช่วงนี้" : tInfo.isRecommended ? "แนะนำ" : "เลือกได้";
        tb.innerHTML =
          `<strong>กลุ่ม ${tid} (${tag})</strong>` +
          `<span>${tInfo.otherCount} / ${tInfo.maxQuota} คน</span>`;
        tb.addEventListener("click", () => {
          if (tInfo.locked) return;
          selectedTeam = tid;
          syncUI();
        });
        teamsRow.appendChild(tb);
      });

      // Submit button
      if (pickedStudent) {
        const sNo = String(pickedStudent.id).slice(-3);
        const nick = pickedStudent.nickname ? ` ${pickedStudent.nickname}` : "";
        submitBtn.className = "hsd-qcg-submit-btn is-ready";
        submitBtn.textContent = `✅ Check-in เข้าห้อง ${meta.roomCode} · เบอร์ ${sNo}${nick} (กลุ่ม ${selectedTeam}) →`;
      } else {
        submitBtn.className = "hsd-qcg-submit-btn";
        submitBtn.textContent = `กรอกรหัสนักศึกษา 3 ตัวท้ายเพื่อ Check-in เข้าห้อง ${meta.roomCode}`;
      }
    }

    function submitCheckin() {
      if (!pickedStudent && pinDigits.length >= 1 && pinDigits.length <= 3) {
        const padded = pinDigits.padStart(3, "0");
        const res = matchStudentsBy3DigitPin(padded, roomId);
        if (res.inRoom.length === 1) {
          pinDigits = padded;
          pickedStudent = res.inRoom[0];
        } else if (res.all.length === 1) {
          pinDigits = padded;
          pickedStudent = res.all[0];
        } else if (res.all.length > 1) {
          pinDigits = padded;
          syncUI();
          return;
        }
      }
      if (!pickedStudent) {
        verifyBox.className = "hsd-qcg-verify-box is-error";
        verifyBox.textContent = "กรุณากรอกรหัสนักศึกษา 3 ตัวท้าย (เช่น 056) และเลือกชื่อของคุณก่อนกด Check-in";
        return;
      }

      const bal = computeBalance();
      const finalTeam =
        selectedTeam && bal.teams[selectedTeam] && !bal.teams[selectedTeam].locked
          ? selectedTeam
          : bal.recommendedTeam || 1;

      const rec = markStudentCheckedIn(modCode, roomId, pickedStudent, finalTeam);
      teardownCheckinGateListeners();

      if (typeof cfg.onCompletedCheckin === "function") {
        cfg.onCompletedCheckin(pickedStudent, roomId, finalTeam, rec);
      }
    }

    // Physical keyboard support for 0-9 / Backspace / Enter even when input is not focused
    activeCheckinKeyHandler = (ev) => {
      if (!wrap.isConnected) {
        teardownCheckinGateListeners();
        return;
      }
      const tag = ev.target && ev.target.tagName ? ev.target.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (/^[0-9]$/.test(ev.key)) {
        ev.preventDefault();
        pushDigit(ev.key);
      } else if (ev.key === "Backspace") {
        ev.preventDefault();
        popDigit();
      } else if (ev.key === "Enter" && pickedStudent) {
        ev.preventDefault();
        submitCheckin();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", activeCheckinKeyHandler);
    }

    if (live && typeof live.on === "function") {
      activeCheckinPresUnsub = live.on("presence", () => {
        if (wrap.isConnected) syncUI();
      });
    }

    syncUI();
    container.appendChild(wrap);
  }

  const api = {
    PROD_STUDENT_BASE,
    PROD_FACULTY_BASE,
    buildQrMatrix,
    buildQrSvg,
    buildQrPngBytes,
    getRoomMeta,
    getAllHs1RoomMetas,
    getStudentCheckinRecord,
    isStudentCheckedIn,
    markStudentCheckedIn,
    clearStudentCheckin,
    matchStudentsBy3DigitPin,
    getLiveRoomJoinedStats,
    exportRoomCheckinCsv,
    openRoomQrZoomModal,
    closeRoomQrZoomModal,
    buildSixRoomPptsSectionDOM,
    renderStudentQrCheckinGateDOM,
    teardownCheckinGateListeners
  };

  if (root) {
    root.RACM_HSD_ROOM_QR = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
