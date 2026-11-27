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

  function alignGateInputAboveMobileKeyboard(fieldEl) {
    if (!fieldEl || typeof window === "undefined" || typeof document === "undefined") return;
    const isMobileOrCoarse =
      (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse), (max-width: 960px)").matches) ||
      (window.innerWidth || 1280) <= 960;
    if (!isMobileOrCoarse) return;

    const runAlign = () => {
      if (!fieldEl.isConnected || document.activeElement !== fieldEl) return;
      if (root && root.RACM_MOBILE_KBD_FIT && typeof root.RACM_MOBILE_KBD_FIT.scrollIntoView === "function") {
        root.RACM_MOBILE_KBD_FIT.scrollIntoView(fieldEl, true);
        return;
      }
      document.body.classList.add("is-mobile-kbd-open");
      const vv = window.visualViewport;
      const vvScale = vv && vv.scale ? vv.scale : 1;
      const vvTop = vv && vvScale <= 1.06 ? Math.max(0, vv.offsetTop || 0) : 0;
      const vvH = vv && vvScale <= 1.06 ? vv.height : window.innerHeight || 600;
      const anchor =
        fieldEl.closest(".hsd-srp-pin-lock-bar, .hsd-compact-step-lock, .hsd-qr-checkin-card") || fieldEl;
      const modalBody = anchor.closest(".hsd-km-body, .hsd-km-dialog");
      if (modalBody) {
        const mRect = modalBody.getBoundingClientRect();
        const aRect = anchor.getBoundingClientRect();
        const dy = aRect.top - (mRect.top + 8);
        if (Math.abs(dy) > 6) modalBody.scrollTop += dy;
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const desiredTop = vvTop + 8;
      let deltaY = rect.top - desiredTop;
      if (rect.bottom - deltaY > vvTop + vvH - 8) {
        deltaY = Math.max(deltaY, rect.bottom - (vvTop + vvH - 8));
      }
      if (Math.abs(deltaY) > 6) {
        window.scrollTo({
          top: Math.max(0, (window.scrollY || window.pageYOffset || 0) + deltaY),
          behavior: "auto"
        });
      }
    };

    requestAnimationFrame(runAlign);
    setTimeout(runAlign, 110);
    setTimeout(runAlign, 260);
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
    const roomPdfFileName = `RACM303_2569_${modCode}_Room${roomId}_${cleanRoomSlug}_Blank_Worksheet_16x9.pdf`;
    const staticRoomPdfHref = `exports/pdf/${roomPdfFileName}`;
    const centralModulePdfFileName = `RACM303_2569_${modCode}_Blank_Worksheet_16x9.pdf`;
    const centralModulePdfHref = `exports/pdf/${centralModulePdfFileName}`;
    const hs1AnswerKeyPdfFileName = `RACM303_2569_HS1_Answer_Key_16x9.pdf`;
    const hs1AnswerKeyPdfHref = `exports/pdf/${hs1AnswerKeyPdfFileName}`;
    const moduleAnswerKeyPdfFileName = `RACM303_2569_${modCode}_Answer_Key_16x9.pdf`;
    const moduleAnswerKeyPdfHref = `exports/pdf/${moduleAnswerKeyPdfFileName}`;
    const isFacultyPortal = Boolean(root && root.PORTAL_ROLE === "faculty");
    const hsdMods =
      root && root.RACM_HS_DISCUSSION_DATA && Array.isArray(root.RACM_HS_DISCUSSION_DATA.modules)
        ? root.RACM_HS_DISCUSSION_DATA.modules
        : [];
    const modMetaObj = hsdMods.find((x) => x && x.id === modCode) || null;
    const relMods =
      root && root.RACM_HS_DISCUSSION_KEY && Array.isArray(root.RACM_HS_DISCUSSION_KEY.releasedModules)
        ? root.RACM_HS_DISCUSSION_KEY.releasedModules
        : [];
    const answerKeyUnlocked = isFacultyPortal || relMods.includes(modCode);
    const unlockAfterLabel = (modMetaObj && modMetaObj.unlockAfterLabel) || "หลังจบคาบเรียน";
    const unlockShortLabel = (modMetaObj && modMetaObj.unlockShortLabel) || "หลังจบคาบ";
    const centralCombinedPdfFileName = answerKeyUnlocked ? moduleAnswerKeyPdfFileName : hs1AnswerKeyPdfFileName;
    const centralCombinedPdfHref = answerKeyUnlocked ? moduleAnswerKeyPdfHref : hs1AnswerKeyPdfHref;

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
      staticPptxHref,
      roomPdfFileName,
      staticRoomPdfHref,
      centralModulePdfFileName,
      centralModulePdfHref,
      hs1AnswerKeyPdfFileName,
      hs1AnswerKeyPdfHref,
      moduleAnswerKeyPdfFileName,
      moduleAnswerKeyPdfHref,
      answerKeyUnlocked,
      unlockAfterLabel,
      unlockShortLabel,
      centralCombinedPdfFileName,
      centralCombinedPdfHref
    };
  }

  function getCentralPdfMeta(modCodeOpt) {
    const m = getRoomMeta(modCodeOpt || "HS1", 1);
    return {
      modCode: m.modCode,
      modulePdfFileName: m.centralModulePdfFileName,
      modulePdfHref: m.centralModulePdfHref,
      hs1AnswerKeyPdfFileName: m.hs1AnswerKeyPdfFileName,
      hs1AnswerKeyPdfHref: m.hs1AnswerKeyPdfHref,
      answerKeyPdfFileName: m.moduleAnswerKeyPdfFileName,
      answerKeyPdfHref: m.moduleAnswerKeyPdfHref,
      answerKeyUnlocked: m.answerKeyUnlocked,
      unlockAfterLabel: m.unlockAfterLabel,
      unlockShortLabel: m.unlockShortLabel,
      combinedPdfFileName: m.centralCombinedPdfFileName,
      combinedPdfHref: m.centralCombinedPdfHref
    };
  }

  function getAllModuleRoomMetas(modCodeOpt) {
    const mc = /^HS[1-6]$/i.test(String(modCodeOpt || "")) ? String(modCodeOpt).toUpperCase() : "HS1";
    return [1, 2, 3, 4, 5, 6].map((r) => getRoomMeta(mc, r));
  }

  function getAllHs1RoomMetas() {
    return getAllModuleRoomMetas("HS1");
  }

  function saveStepPinPrefillStudent(stu) {
    if (!stu || !stu.id) return;
    const sid = String(stu.id);
    try {
      sessionStorage.setItem("racm303_hsd_prefill_sid", sid);
      sessionStorage.setItem("racm303_hsd_step5_pin_sid", sid);
    } catch (_) {}
    if (!root || root.PORTAL_ROLE !== "faculty") {
      try {
        localStorage.setItem("racm303_hsd_prefill_sid", sid);
        localStorage.setItem("racm303_my_sid", sid);
        localStorage.setItem("racm303_login_uid", sid);
      } catch (_) {}
    }
  }

  function clearStepPinPrefillStudent() {
    try {
      sessionStorage.removeItem("racm303_hsd_prefill_sid");
      sessionStorage.removeItem("racm303_hsd_step5_pin_sid");
      sessionStorage.removeItem("racm303_hsd_room_confirmed");
      sessionStorage.removeItem("racm303_hsd_session_joined_v1");
    } catch (_) {}
    try {
      localStorage.removeItem("racm303_hsd_prefill_sid");
      localStorage.removeItem("racm303_personal_student");
    } catch (_) {}
  }

  function clearAllStudentIdentityFromQr() {
    clearStepPinPrefillStudent();
    clearStudentCheckin();
    try {
      localStorage.removeItem("racm303_my_sid");
      localStorage.removeItem("racm303_login_uid");
    } catch (_) {}
    if (typeof document !== "undefined") {
      document.querySelectorAll("[data-hsd-pin-resettable='1']").forEach((el) => {
        if (typeof el._resetPinState === "function") {
          try {
            el._resetPinState();
          } catch (_) {}
        }
      });
    }
  }

  function getInitialStepPinStudent() {
    const roster = ((root && root.RACM_ROSTER_DATA && root.RACM_ROSTER_DATA.students) || []);
    if (!roster.length) return null;
    if (root && root.PORTAL_ROLE === "faculty") return null;
    try {
      if (typeof window !== "undefined" && window.location && window.location.search) {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get("autocheckin") === "1") {
          const qSid = (sp.get("sid") || "").trim();
          if (qSid) {
            const hit = roster.find((s) => String(s.id) === qSid);
            if (hit) return hit;
          }
          const qPin = (sp.get("pin") || "").trim();
          if (/^\d{1,3}$/.test(qPin)) {
            const padded = qPin.padStart(3, "0");
            const hits = roster.filter((s) => String(s.id).slice(-3) === padded);
            if (hits.length === 1) return hits[0];
          }
        }
      }
    } catch (_) {}
    return null;
  }

  function buildStudentCheckinHrefWithSid(modCodeOpt, roomIdOpt, stuObj, teamIdOpt) {
    const meta = getRoomMeta(modCodeOpt, roomIdOpt);
    const hasStu = Boolean(stuObj && stuObj.id);
    const sidParam = hasStu ? `sid=${encodeURIComponent(String(stuObj.id))}&autocheckin=1` : "checkin=1";
    const teamParam =
      Number(teamIdOpt) >= 1 && Number(teamIdOpt) <= 3 ? `&team=${Number(teamIdOpt)}` : "";
    if (meta.isHs1) {
      return `hs1-room${meta.roomId}.html?${sidParam}${teamParam}`;
    }
    return `?page=hs-discussion&module=${meta.modCode}&room=${meta.roomId}&${sidParam}${teamParam}#hs-discussion-${meta.modCode}-R${meta.roomId}`;
  }

  /* ---------- 3. Student Check-in Persistence (Scoped per Module & Room) ---------- */
  function checkinStorageKey(modCode, roomId) {
    return `racm303_hsd_qr_checkin_v1_${String(modCode || "HS1").toUpperCase()}_R${clampRoomId(roomId)}`;
  }

  function getStudentCheckinRecord(modCode, roomId) {
    const key = checkinStorageKey(modCode, roomId);
    const live = root && root.RACM_LIVE_CLASSROOM;
    const reqResetId =
      live && typeof live.getRoomCheckinResetId === "function"
        ? String(live.getRoomCheckinResetId(roomId) || "")
        : "";
    try {
      const sRaw = sessionStorage.getItem(key);
      if (sRaw) {
        const parsed = JSON.parse(sRaw);
        if (parsed && parsed.studentId) {
          if (reqResetId && String(parsed.ackResetId || "") !== reqResetId) {
            try {
              sessionStorage.removeItem(key);
            } catch (_) {}
          } else {
            return parsed;
          }
        }
      }
    } catch (_) {}
    try {
      const lRaw = localStorage.getItem(key);
      if (lRaw) {
        const parsed = JSON.parse(lRaw);
        if (parsed && parsed.studentId && Date.now() - (Number(parsed.checkedInMs) || 0) < CHECKIN_FRESH_MS) {
          if (reqResetId && String(parsed.ackResetId || "") !== reqResetId) {
            try {
              localStorage.removeItem(key);
            } catch (_) {}
          } else {
            return parsed;
          }
        }
      }
    } catch (_) {}
    return null;
  }

  function isStudentCheckedIn(modCode, roomId) {
    return Boolean(getStudentCheckinRecord(modCode, roomId));
  }

  function markStudentCheckedIn(modCode, roomId, studentObj, teamId, opts) {
    if (!studentObj || !studentObj.id) return null;
    const now = Date.now();
    const effMod = String(modCode || "HS1").toUpperCase();
    const effRoom = clampRoomId(roomId);
    const effTeam = Number(teamId) >= 1 && Number(teamId) <= 3 ? Number(teamId) : 0;
    const live = root && root.RACM_LIVE_CLASSROOM;
    const ackResetId =
      live && typeof live.getRoomCheckinResetId === "function"
        ? String(live.getRoomCheckinResetId(effRoom) || "")
        : "";
    const rec = {
      modCode: effMod,
      roomId: effRoom,
      studentId: String(studentObj.id),
      shortNo: String(studentObj.id).slice(-3),
      fullName: String(studentObj.fullName || studentObj.name || ""),
      nickname: String(studentObj.nickname || ""),
      assignedDisc: Number(studentObj.disc) || effRoom,
      teamId: effTeam,
      ackResetId,
      checkedInMs: now,
      checkedInISO: new Date(now).toISOString()
    };
    const key = checkinStorageKey(effMod, effRoom);
    const raw = JSON.stringify(rec);
    const isKiosk = Boolean((opts && opts.kioskMode) || (root && root.PORTAL_ROLE === "faculty"));
    if (!isKiosk) {
      try {
        sessionStorage.setItem(key, raw);
        sessionStorage.setItem("racm303_hsd_room_confirmed", "1");
        sessionStorage.setItem("racm303_hsd_session_joined_v1", "1");
      } catch (_) {}
      try {
        localStorage.setItem(key, raw);
        localStorage.setItem("racm303_my_sid", String(studentObj.id));
        localStorage.setItem("racm303_login_uid", String(studentObj.id));
      } catch (_) {}
    }
    if (live && !(opts && opts.skipLiveBroadcast)) {
      if (typeof live.checkinStudentToRoom === "function") {
        live.checkinStudentToRoom(studentObj, effRoom, effMod, effTeam, { kioskMode: isKiosk, ackResetId });
      } else if (!isKiosk && typeof live.joinSessionWithStudent === "function") {
        live.joinSessionWithStudent(studentObj, effRoom, effMod, effTeam, { ackResetId });
      }
    }
    return rec;
  }

  function syncStudentAutoCheckinToLive(modCodeOpt, roomIdOpt, stuObj) {
    if (!stuObj || !stuObj.id || (root && root.PORTAL_ROLE === "faculty")) return null;
    const effMod = /^HS[1-6]$/i.test(String(modCodeOpt || "")) ? String(modCodeOpt).toUpperCase() : "HS1";
    const effRoom = clampRoomId(roomIdOpt || stuObj.disc || 1);
    const live = root && root.RACM_LIVE_CLASSROOM;
    if (live && typeof live.startEngine === "function") {
      live.startEngine();
    }
    saveStepPinPrefillStudent(stuObj);
    return markStudentCheckedIn(effMod, effRoom, stuObj, 0, { kioskMode: false });
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

  /* ---------- 5. Live Room Presence Summary Helper (Works Across All 6 Rooms Simultaneously) ---------- */
  function getLiveRoomJoinedStats(roomId, modCodeOpt) {
    const rMeta = getRoomMeta(modCodeOpt || "HS1", roomId);
    const live = root && root.RACM_LIVE_CLASSROOM;
    if (live && typeof live.startEngine === "function") {
      live.startEngine();
    }
    const pres =
      live && typeof live.getPresenceSummary === "function"
        ? live.getPresenceSummary(rMeta.roomId)
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

  /* ---------- 6. Faculty CSV Attendance Export & Room Check-in Cache Reset ---------- */
  function showFacultyResetToast(msgText) {
    if (typeof document === "undefined") return;
    let toast = document.getElementById("hsdFacultyResetToast");
    const host = document.fullscreenElement || document.body;
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hsdFacultyResetToast";
      toast.className = "hsd-reset-checkin-toast hsd-no-print";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
    }
    if (toast.parentNode !== host) {
      host.appendChild(toast);
    }
    toast.textContent = msgText;
    toast.hidden = false;
    toast.classList.add("is-visible");
    if (toast._hideTimer) clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.hidden = true;
    }, 4200);
  }

  function closeResetCheckinConfirmModal() {
    if (typeof document === "undefined") return;
    const bd = document.getElementById("hsdResetCheckinConfirmModal");
    if (bd) bd.hidden = true;
  }

  function openResetCheckinConfirmModal(modCodeOpt, roomIdOpt, onResetDone) {
    if (typeof document === "undefined" || !root || root.PORTAL_ROLE !== "faculty") return;
    const live = root && root.RACM_LIVE_CLASSROOM;
    const effRoom = clampRoomId(roomIdOpt || (live ? live.getRoomId() : 1));
    const meta = getRoomMeta(modCodeOpt || "HS1", effRoom);
    const stats = getLiveRoomJoinedStats(meta.roomId, meta.modCode);
    const host = document.fullscreenElement || document.body;

    let bd = document.getElementById("hsdResetCheckinConfirmModal");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "hsdResetCheckinConfirmModal";
      bd.className = "hsd-reset-checkin-backdrop hsd-no-print";
      bd.setAttribute("role", "dialog");
      bd.setAttribute("aria-modal", "true");
      bd.addEventListener("click", (ev) => {
        if (ev.target === bd) closeResetCheckinConfirmModal();
      });
      document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && bd && !bd.hidden) {
          closeResetCheckinConfirmModal();
        }
      });
    }
    if (bd.parentNode !== host) {
      host.appendChild(bd);
    }

    bd.innerHTML = `
      <div class="hsd-reset-checkin-dialog">
        <div class="hsd-reset-checkin-badge-row">
          <span class="hsd-reset-checkin-room-pill">📍 ห้อง ${meta.roomId} (${escHtml(meta.roomCode)}) · คาบ ${escHtml(meta.modCode)}</span>
          <button type="button" class="hsd-reset-checkin-x" id="hsdResetCheckinCloseX" aria-label="ปิดหน้าต่าง">✕</button>
        </div>
        <h3 class="hsd-reset-checkin-title">🔄 ล้าง Cache การ Check-in ห้อง ${escHtml(meta.roomCode)}?</h3>
        <p class="hsd-reset-checkin-lead">
          เมื่อกดยืนยัน ระบบจะรีเซ็ตสถานะเช็คชื่อของ <strong>ห้อง ${meta.roomId} (${escHtml(meta.roomCode)})</strong> ทันที เพื่อให้นักศึกษาในห้องนี้สแกน QR / กรอกรหัส 3 ตัวท้ายเข้ามาใหม่ทั้งหมด
        </p>
        <ul class="hsd-reset-checkin-points">
          <li><strong>เฉพาะห้องของคุณเท่านั้น:</strong> ล้างเฉพาะ <strong>ห้อง ${meta.roomId} (${escHtml(meta.roomCode)})</strong> (ขณะนี้ Check-in อยู่ <strong>${stats.joinedCount}/${stats.expectedCount} คน</strong> → กลับเป็น <code>0/${stats.expectedCount}</code>) <em>ไม่กระทบห้องอภิปรายกลุ่มอื่น</em></li>
          <li><strong>ล้าง Cache ฝั่ง นศพ. อัตโนมัติ:</strong> มือถือ/แท็บเล็ตของ นศพ. ในห้องนี้จะถูกล้าง Cache การ Check-in เดิม และเด้งหน้าต่างให้สแกน Check-in ใหม่ทันที</li>
          <li><strong>ไม่ลบคำตอบใบงาน:</strong> ข้อความที่ นศพ. พิมพ์ไว้ใน Worksheet จะยังคงปลอดภัยเหมือนเดิม</li>
        </ul>
        <div class="hsd-reset-checkin-actions">
          <button type="button" class="btn sm" id="hsdResetCheckinCancelBtn">ยกเลิก</button>
          <button type="button" class="btn sm is-reset-checkin-confirm" id="hsdResetCheckinConfirmBtn">
            🔄 ยืนยันล้าง Check-in ห้อง ${escHtml(meta.roomCode)} ให้สแกนใหม่ทั้งหมด
          </button>
        </div>
      </div>
    `;

    bd.hidden = false;

    const cancelBtn = bd.querySelector("#hsdResetCheckinCancelBtn");
    const closeX = bd.querySelector("#hsdResetCheckinCloseX");
    const confirmBtn = bd.querySelector("#hsdResetCheckinConfirmBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", () => closeResetCheckinConfirmModal());
    if (closeX) closeX.addEventListener("click", () => closeResetCheckinConfirmModal());
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        let res = null;
        if (live && typeof live.resetRoomCheckin === "function") {
          res = live.resetRoomCheckin(meta.roomId, meta.modCode);
        }
        clearStudentCheckin(meta.modCode, meta.roomId);
        closeResetCheckinConfirmModal();
        showFacultyResetToast(
          `✓ ล้าง Cache การ Check-in ห้อง ${meta.roomId} (${meta.roomCode}) เรียบร้อย — นศพ. ในห้องนี้ต้องสแกน Check-in ใหม่ทั้งหมด`
        );
        if (typeof onResetDone === "function") {
          try {
            onResetDone(res);
          } catch (_) {}
        }
      });
      setTimeout(() => {
        try {
          confirmBtn.focus();
        } catch (_) {}
      }, 30);
    }
  }

  function exportRoomCheckinCsv(modCodeOpt, roomIdOpt) {
    if (typeof document === "undefined") return;
    const meta = getRoomMeta(modCodeOpt, roomIdOpt);
    const stats = getLiveRoomJoinedStats(meta.roomId, meta.modCode);
    const rows = [
      [
        "ลำดับ",
        "รหัสนักศึกษา",
        "เลขท้าย 3 ตัว",
        "ชื่อ-นามสกุล",
        "ชื่อเล่น",
        "ห้องอภิปราย",
        "สถานะ Check-in",
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
      const stats = getLiveRoomJoinedStats(meta.roomId, meta.modCode);
      const qrSvg = buildQrSvg(
        meta.studentQrUrl,
        "is-giant-modal-qr",
        `QR Code Check-in ${meta.pinCode} ห้อง ${meta.roomCode}`
      );
      const pillsHtml = stats.joinedList.length
        ? stats.joinedList
            .map((p) => {
              const sNo = p.shortNo || (p.studentId ? String(p.studentId).slice(-3) : "");
              return `<span class="hsd-qr-zoom-stu-pill">✓ ${escHtml(sNo)} ${escHtml(p.nickname || p.fullName || "")}</span>`;
            })
            .join("")
        : `<span style="font-size:13px;opacity:0.8">รอนักศึกษาสแกน QR Code และกรอกรหัส 3 ตัวท้าย…</span>`;

      bd.innerHTML = `
        <div class="hsd-qr-zoom-dialog">
          <div class="hsd-qr-zoom-top-bar">
            <button type="button" class="btn sm is-modal-top-close" id="hsdQrZoomTopCloseBtn" data-modal-close="1">✕ ปิดหน้าต่าง</button>
          </div>
          <div class="hsd-qr-zoom-box">${qrSvg}</div>
          <div class="hsd-qr-zoom-meta">
            <div class="hsd-qr-zoom-meta-head" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span class="hsd-qr-zoom-pin">📍 ${escHtml(meta.pinCode)} · ห้องอภิปรายที่ ${meta.roomId}</span>
              <div class="racm-unav-pair is-compact" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่">
                <button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button>
                <button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button>
              </div>
            </div>
            <h3 class="hsd-qr-zoom-title">Case Discussion: ${escHtml(meta.modCode)}</h3>
            <div class="hsd-qr-zoom-room">ห้อง ${escHtml(meta.roomCode)} · อ.ประจำห้อง: ${escHtml(meta.instructor)}</div>
            <div class="ppt-ok-qr-steps" style="text-align:left">
              <div class="ppt-ok-qr-step"><span class="ppt-ok-qr-step-num">1</span><span>ใช้กล้องมือถือหรือ LINE สแกน <strong>QR Code ประจำห้อง ${escHtml(meta.roomCode)}</strong> ด้านซ้าย</span></div>
              <div class="ppt-ok-qr-step"><span class="ppt-ok-qr-step-num">2</span><span>กรอก <strong>รหัสนักศึกษา 3 ตัวท้าย</strong> (เช่น 056) เพื่อ <strong>Check-in เข้าห้องเรียน</strong></span></div>
            </div>
            <div class="hsd-qr-zoom-url" title="${escHtml(meta.studentQrUrl)}">🔗 ${escHtml(meta.studentQrUrl)}</div>
            <div class="hsd-qr-zoom-live-box" id="hsdQrZoomLiveBox">
              <div class="hsd-qr-zoom-live-count">🟢 Check-in เข้าห้อง ${escHtml(meta.roomCode)} แล้ว ${stats.joinedCount} / ${stats.expectedCount} คน</div>
              <div class="hsd-qr-zoom-live-pills">${pillsHtml}</div>
            </div>
            <div class="hsd-qr-zoom-actions">
              <button type="button" class="btn sm primary" id="hsdQrZoomCopyBtn">📋 คัดลอกลิงก์ห้อง ${escHtml(meta.roomCode)}</button>
              <a class="btn sm teal" href="${escHtml(meta.studentQrUrl)}" target="_blank" rel="noopener">↗ เปิดหน้า Check-in นศพ. (${escHtml(meta.htmlFile || meta.pinCode)})</a>
              ${isFaculty ? `<button type="button" class="btn sm" id="hsdQrZoomCsvBtn">📥 ส่งออกเช็คชื่อ (.csv)</button>` : ""}
              ${isFaculty ? `<button type="button" class="btn sm is-reset-checkin-danger" id="hsdQrZoomResetCheckinBtn">🔄 ล้าง Check-in ห้อง ${escHtml(meta.roomCode)} (สแกนใหม่)</button>` : ""}
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
      const resetChkBtn = bd.querySelector("#hsdQrZoomResetCheckinBtn");
      if (resetChkBtn) {
        resetChkBtn.addEventListener("click", () => {
          openResetCheckinConfirmModal(meta.modCode, meta.roomId, () => renderDialog());
        });
      }
      bd.querySelectorAll("#hsdQrZoomCloseBtn, #hsdQrZoomTopCloseBtn").forEach((btn) => {
        btn.addEventListener("click", () => closeRoomQrZoomModal());
      });
    }

    renderDialog();
    bd.hidden = false;

    if (qrModalUnsub) qrModalUnsub();
    if (live && typeof live.on === "function") {
      const u1 = live.on("presence", () => {
        if (!bd.hidden) renderDialog();
      });
      const u2 = live.on("checkin_reset", () => {
        if (!bd.hidden) renderDialog();
      });
      qrModalUnsub = () => {
        u1();
        u2();
      };
    }
  }

  let idlePinFieldSeq = 0;
  let lastGlobalTabKeyMs = 0;
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener(
      "keydown",
      (ev) => {
        if (ev && ev.key === "Tab") lastGlobalTabKeyMs = Date.now();
      },
      true
    );
  }

  function applyIdlePinInputGuards(el, namePrefix) {
    if (!el) return;
    idlePinFieldSeq += 1;
    el.name = `${namePrefix || "racm_pin"}_${Date.now().toString(36)}_${idlePinFieldSeq}`;
    el.autocomplete = "off";
    el.spellcheck = false;
    el.autocapitalize = "off";
    el.defaultValue = "";
    el.setAttribute("autocomplete", "off");
    el.setAttribute("autocorrect", "off");
    el.setAttribute("aria-autocomplete", "none");
    el.setAttribute("data-form-type", "other");
    el.setAttribute("data-lpignore", "true");
    el.setAttribute("data-1p-ignore", "true");
  }

  /* ---------- 8. Dedicated 6-Room PPT, 16:9 Blank Worksheet PDF & 3-Digit Room-Lock Section (HS1–HS6) ---------- */
  function buildSixRoomPptsSectionDOM(modCodeOpt, opts) {
    const cfg = opts || {};
    let modCode = /^HS[1-6]$/i.test(String(modCodeOpt || "")) ? String(modCodeOpt).toUpperCase() : "HS1";
    const isFaculty = root.PORTAL_ROLE === "faculty";
    const activeRoom = Number(cfg.activeRoomId) || 0;

    // Always start fresh, empty, and unfocused on Case Discussion entry until user explicitly taps to type
    let pinQuery = "";
    let lockedStudent = null;
    let manualUnlockedAll = false;
    let needIdPromptMsg = "";
    let userEngagedPin = false;

    const sec = document.createElement("section");
    sec.className = "hsd-six-room-ppts-section hsd-no-print";
    sec.setAttribute("data-hsd-pin-resettable", "1");
    sec.setAttribute("aria-label", `เข้าห้องย่อย Breakout Room และดาวน์โหลดใบงาน 16:9 PDF ประจำคาบ ${modCode}`);

    const head = document.createElement("div");
    head.className = "hsd-srp-head";
    const headLeft = document.createElement("div");
    headLeft.className = "hsd-srp-head-copy";
    const headRight = document.createElement("div");
    headRight.className = "hsd-srp-central-pdf-bar";
    head.append(headLeft, headRight);
    sec.appendChild(head);

    if (cfg.allowModuleSwitch) {
      const modStrip = document.createElement("div");
      modStrip.className = "hsd-srp-mod-strip";
      ["HS1", "HS2", "HS3", "HS4", "HS5", "HS6"].forEach((mc) => {
        const mb = document.createElement("button");
        mb.type = "button";
        mb.className = `hsd-srp-mod-pill${mc === modCode ? " is-active" : ""}`;
        mb.dataset.srpMod = mc;
        mb.textContent = `คาบ ${mc}`;
        mb.addEventListener("click", () => {
          if (modCode === mc) return;
          modCode = mc;
          modStrip.querySelectorAll(".hsd-srp-mod-pill").forEach((el) => {
            el.classList.toggle("is-active", el.dataset.srpMod === modCode);
          });
          syncSectionUI();
          if (typeof cfg.onModuleChange === "function") {
            cfg.onModuleChange(modCode);
          }
        });
        modStrip.appendChild(mb);
      });
      sec.appendChild(modStrip);
    }

    // 3-Digit Student ID Fresh Entry & Breakout Room Confirm Bar
    const lockBar = document.createElement("div");
    lockBar.className = "hsd-srp-pin-lock-bar";

    const lockFormCol = document.createElement("div");
    lockFormCol.className = "hsd-srp-pin-form-col";
    const lockLabel = document.createElement("label");
    lockLabel.className = "hsd-srp-pin-label";
    const inputRow = document.createElement("div");
    inputRow.className = "hsd-srp-pin-input-row";

    const pinInput = document.createElement("input");
    pinInput.type = "text";
    pinInput.inputMode = "numeric";
    applyIdlePinInputGuards(pinInput, "racm_srp_pin");
    pinInput.maxLength = 24;
    pinInput.className = "hsd-srp-pin-input";
    pinInput.placeholder = "กรอกรหัส 3 ตัวท้ายใหม่ (เช่น 018)…";
    pinInput.value = "";

    const markUserEngaged = () => {
      userEngagedPin = true;
    };
    pinInput.addEventListener("pointerdown", markUserEngaged, { passive: true });
    pinInput.addEventListener("mousedown", markUserEngaged, { passive: true });
    pinInput.addEventListener("touchstart", markUserEngaged, { passive: true });
    pinInput.addEventListener("click", markUserEngaged, { passive: true });

    const clearPinBtn = document.createElement("button");
    clearPinBtn.type = "button";
    clearPinBtn.className = "hsd-srp-pin-clear-btn";
    clearPinBtn.textContent = "✕ ล้างรหัส / โปรไฟล์";
    clearPinBtn.hidden = true;

    inputRow.append(pinInput, clearPinBtn);
    lockFormCol.append(lockLabel, inputRow);

    const lockResultCol = document.createElement("div");
    lockResultCol.className = "hsd-srp-lock-result";

    lockBar.append(lockFormCol, lockResultCol);
    sec.appendChild(lockBar);

    const grid = document.createElement("div");
    grid.className = "hsd-srp-grid";
    sec.appendChild(grid);

    function commitStudentProfileAndNavigate(rId, stuObj) {
      const targetRoom = stuObj && stuObj.disc ? clampRoomId(stuObj.disc) : clampRoomId(rId);
      const meta = getRoomMeta(modCode, targetRoom);
      if (stuObj && stuObj.id) {
        saveStepPinPrefillStudent(stuObj);
        if (!isFaculty) {
          markStudentCheckedIn(modCode, targetRoom, stuObj, 0, { skipLiveBroadcast: true });
          if (root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.applyMyStudent === "function") {
            try {
              root.RACM_PORTAL_API.applyMyStudent(stuObj, true);
            } catch (_) {}
          }
        }
      }
      if (isFaculty) {
        if (!meta.isHs1 && typeof cfg.onOpenRoomPpt === "function") {
          cfg.onOpenRoomPpt(targetRoom, modCode, stuObj || null);
          return;
        }
        window.location.href = meta.facultyRoomHref;
        return;
      }
      if (typeof cfg.onGoCheckinRoom === "function" && !meta.isHs1) {
        cfg.onGoCheckinRoom(modCode, targetRoom, stuObj || null);
        return;
      }
      if (meta.isHs1) {
        window.location.href = buildStudentCheckinHrefWithSid(modCode, targetRoom, stuObj);
        return;
      }
      if (typeof cfg.onOpenRoomPpt === "function") {
        cfg.onOpenRoomPpt(targetRoom, modCode, stuObj || null);
        return;
      }
      window.location.href = buildStudentCheckinHrefWithSid(modCode, targetRoom, stuObj);
    }

    // Typing only previews matched student & Breakout Room; never saves to localStorage until Confirm!
    function resolveFromPinQuery(rawVal) {
      const q = String(rawVal || "").trim();
      manualUnlockedAll = false;
      needIdPromptMsg = "";
      if (!q) {
        lockedStudent = null;
        return;
      }
      const digits = q.replace(/\D/g, "");
      if (/^\d{1,2}$/.test(q)) {
        lockedStudent = null;
        return;
      }
      const res = matchStudentsBy3DigitPin(q, 1);
      if (res.all.length === 1) {
        lockedStudent = res.all[0];
      } else if (lockedStudent && !res.all.some((s) => s.id === lockedStudent.id)) {
        lockedStudent = null;
      } else if (!digits && res.all.length !== 1) {
        lockedStudent = null;
      }
    }

    pinInput.addEventListener("focus", () => {
      if (!userEngagedPin && Date.now() - lastGlobalTabKeyMs > 400) {
        if (typeof pinInput.blur === "function") pinInput.blur();
        return;
      }
      userEngagedPin = true;
      alignGateInputAboveMobileKeyboard(pinInput);
    });

    pinInput.addEventListener("input", () => {
      if (!userEngagedPin && document.activeElement !== pinInput) {
        pinInput.value = "";
        pinQuery = "";
        lockedStudent = null;
        return;
      }
      userEngagedPin = true;
      pinQuery = pinInput.value;
      resolveFromPinQuery(pinQuery);
      syncSectionUI();
      alignGateInputAboveMobileKeyboard(pinInput);
    });

    pinInput.addEventListener("keydown", (ev) => {
      userEngagedPin = true;
      if (ev.key === "Enter") {
        ev.preventDefault();
        const trimmed = pinInput.value.trim();
        if (/^\d{1,3}$/.test(trimmed)) {
          pinQuery = trimmed.padStart(3, "0");
          pinInput.value = pinQuery;
          const res = matchStudentsBy3DigitPin(pinQuery, 1);
          if (res.all.length === 1) {
            lockedStudent = res.all[0];
            syncSectionUI();
            const targetRoom = clampRoomId(lockedStudent.disc || 1);
            commitStudentProfileAndNavigate(targetRoom, lockedStudent);
            return;
          }
          syncSectionUI();
        } else if (lockedStudent) {
          const targetRoom = clampRoomId(lockedStudent.disc || 1);
          commitStudentProfileAndNavigate(targetRoom, lockedStudent);
        }
      }
    });

    sec._resetPinState = () => {
      userEngagedPin = false;
      pinQuery = "";
      pinInput.value = "";
      lockedStudent = null;
      manualUnlockedAll = false;
      needIdPromptMsg = "";
      if (document.activeElement === pinInput && typeof pinInput.blur === "function") {
        pinInput.blur();
      }
      syncSectionUI();
    };

    sec._focusPinInputWithPrompt = (msgText) => {
      userEngagedPin = true;
      needIdPromptMsg = msgText || "🔑 กรุณากรอกรหัสนักศึกษา 3 ตัวท้ายด้านซ้าย แล้วกดยืนยันเพื่อเข้าสู่ Breakout Room ที่ถูกต้องของคุณ";
      syncSectionUI();
      if (typeof pinInput.focus === "function") pinInput.focus({ preventScroll: true });
      alignGateInputAboveMobileKeyboard(pinInput);
      if (typeof pinInput.scrollIntoView === "function" && !document.body.classList.contains("is-mobile-kbd-open")) {
        pinInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    clearPinBtn.addEventListener("click", () => {
      userEngagedPin = false;
      pinQuery = "";
      pinInput.value = "";
      lockedStudent = null;
      manualUnlockedAll = false;
      needIdPromptMsg = "";
      clearStepPinPrefillStudent();
      if (!isFaculty && root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.clearAllPersonalization === "function") {
        root.RACM_PORTAL_API.clearAllPersonalization({ keepCurrentTab: true, skipRenderHsd: true });
      }
      syncSectionUI();
      if (document.activeElement === pinInput && typeof pinInput.blur === "function") {
        pinInput.blur();
      }
    });

    requestAnimationFrame(() => {
      if (!userEngagedPin) {
        if (pinInput.value) {
          pinInput.value = "";
          pinQuery = "";
          lockedStudent = null;
          syncSectionUI();
        }
        if (document.activeElement === pinInput && typeof pinInput.blur === "function") {
          pinInput.blur();
        }
      }
    });

    function syncSectionUI() {
      const cPdf = getCentralPdfMeta(modCode);
      const isRoomLocked = Boolean(lockedStudent && !manualUnlockedAll);
      const lockedRoomId = isRoomLocked ? clampRoomId(lockedStudent.disc || 1) : 0;
      const myDiscRoom = lockedRoomId || (isFaculty ? Number(cfg.myStudentDisc) || 0 : 0);

      headLeft.innerHTML = `
        <h4 class="hsd-srp-title">${
          isFaculty
            ? `📊 เลือกห้องเรียน PPT, ใบงานเปล่า 16:9 (.PDF) &amp; Live Lobby — Case Discussion: ${escHtml(modCode)} (ครบ 6 ห้อง)`
            : `🚪 ยืนยันรหัสเข้าห้องย่อย Breakout Room — Case Discussion: ${escHtml(modCode)} (Room 1–6)`
        }</h4>
        <p class="hsd-srp-sub">${
          isFaculty
            ? `แต่ละห้องมีสไลด์ 16:9 แยกห้อง (Room 1–6), สถานะ Live Lobby เรียลไทม์, QR Code ประจำห้อง และไฟล์ .PDF ใบงานเปล่า 16:9`
            : `ระบบล้างโปรไฟล์เดิมให้อัตโนมัติทุกครั้งที่เข้า Case Discussion — กรอกรหัสนักศึกษาใหม่ (3 ตัวท้าย หรือ 7 หลัก) แล้วกดปุ่มยืนยันเพื่อไปยังลิงก์ Breakout Room ของคุณทันที`
        }</p>
      `;

      const akBtnUnlocked = Boolean(isFaculty || cPdf.answerKeyUnlocked);
      headRight.innerHTML =
        `<a class="hsd-srp-central-pdf-btn is-mod" href="${escHtml(cPdf.modulePdfHref)}" download="${escHtml(cPdf.modulePdfFileName)}" title="ดาวน์โหลดไฟล์ PDF ใบงานเปล่ากลางรวมประจำคาบ ${escHtml(modCode)} (16:9 Optimal Font)">⬇ PDF กลางรวม ${escHtml(modCode)} (16:9 ใบงานเปล่า)</a>` +
        (akBtnUnlocked
          ? `<a class="hsd-srp-central-pdf-btn is-all" href="${escHtml(cPdf.answerKeyPdfHref)}" download="${escHtml(cPdf.answerKeyPdfFileName)}" title="ดาวน์โหลด ${escHtml(cPdf.answerKeyPdfFileName)} — เฉลยแนวคำตอบมาตรฐาน &amp; Key Takeaways ประจำคาบ ${escHtml(modCode)} (16:9)">⬇ PDF พร้อม Answer Key คาบ ${escHtml(modCode)} (16:9)</a>`
          : `<button type="button" class="hsd-srp-central-pdf-btn is-all is-locked-ak" data-locked-ak-btn="1" title="ไฟล์ ${escHtml(cPdf.answerKeyPdfFileName)} จะเปิดให้ดาวน์โหลดหลังจบคาบเรียน (${escHtml(cPdf.unlockAfterLabel)})" style="opacity:0.78;cursor:not-allowed;background:#f8fafc;border:1.5px dashed #94a3b8;color:#475569;font-family:inherit;">🔒 PDF พร้อม Answer Key คาบ ${escHtml(modCode)} (เปิด ${escHtml(cPdf.unlockShortLabel)})</button>`);
      const lockedAkBtn = headRight.querySelector("[data-locked-ak-btn]");
      if (lockedAkBtn) {
        lockedAkBtn.addEventListener("click", () => {
          if (root && typeof root.alert === "function") {
            root.alert(`🔒 เฉลย Answer Key คาบ ${modCode} (${cPdf.answerKeyPdfFileName}) จะเปิดให้ดาวน์โหลดหลังจบคาบอภิปราย (${cPdf.unlockAfterLabel})`);
          }
        });
      }

      lockLabel.innerHTML = isFaculty
        ? `🔑 <span>ค้นหานักศึกษาด้วยรหัส <strong>3 ตัวท้าย</strong> เพื่อตรวจห้องย่อยตามตาราง <strong>${escHtml(modCode)}</strong></span>`
        : `🔑 <span>ขั้นตอนเดียว: กรอกรหัสนักศึกษา <strong>3 ตัวท้ายใหม่</strong> → <strong>กดยืนยัน</strong> เข้าสู่ Breakout Room (${escHtml(modCode)})</span>`;
      clearPinBtn.hidden = !pinQuery && !lockedStudent;

      // Render Lock Result Zone
      lockResultCol.replaceChildren();
      const trimmed = String(pinQuery || "").trim();

      if (lockedStudent) {
        const sNo = String(lockedStudent.id).slice(-3);
        const stuRoom = clampRoomId(lockedStudent.disc || 1);
        const lMeta = getRoomMeta(modCode, stuRoom);
        const stuStats = getLiveRoomJoinedStats(stuRoom, modCode);
        const myLivePres = stuStats.bySid.get(String(lockedStudent.id));
        const liveTxt = myLivePres ? " · 🟢 ออนไลน์ในห้องแล้ว" : "";
        lockBar.classList.add("is-locked-ready");

        const infoDiv = document.createElement("div");
        infoDiv.className = "hsd-srp-lock-matched-info";
        infoDiv.innerHTML =
          `<div class="hsd-srp-lock-badge-row">` +
          `<span class="hsd-srp-lock-pill">${manualUnlockedAll ? "🔓 แสดงครบ 6 ห้อง" : `Breakout Room ห้อง ${stuRoom} (${escHtml(lMeta.roomCode)})`}</span>` +
          `<strong>รหัส ${escHtml(lockedStudent.id)} (ท้าย ${escHtml(sNo)}) · ${escHtml(lockedStudent.nickname ? `${lockedStudent.nickname} (${lockedStudent.fullName || lockedStudent.name})` : (lockedStudent.fullName || lockedStudent.name))}${escHtml(liveTxt)}</strong>` +
          `</div>` +
          `<div class="hsd-srp-lock-room-detail">📍 กลุ่มอภิปรายที่ ${stuRoom} · <strong>ห้อง ${escHtml(lMeta.roomCode)}</strong> · อ.ประจำห้อง: ${escHtml(lMeta.instructor)}</div>`;

        const ctaWrap = document.createElement("div");
        ctaWrap.className = "hsd-srp-lock-cta-wrap";

        const goCheckinBtn = document.createElement("button");
        goCheckinBtn.type = "button";
        goCheckinBtn.className = "hsd-srp-go-checkin-btn";
        goCheckinBtn.textContent = isFaculty
          ? `▶ เปิด PPT ห้อง ${stuRoom} (${lMeta.roomCode}) →`
          : `✅ ยืนยันและเข้าสู่ Breakout Room ห้อง ${stuRoom} (${lMeta.roomCode}) →`;
        goCheckinBtn.addEventListener("click", () => commitStudentProfileAndNavigate(stuRoom, lockedStudent));

        const newWinHref = isFaculty
          ? lMeta.facultyRoomHref
          : buildStudentCheckinHrefWithSid(modCode, stuRoom, lockedStudent);
        const openNewWinA = document.createElement("a");
        openNewWinA.className = "hsd-srp-act-btn is-new-win-btn";
        openNewWinA.href = newWinHref;
        openNewWinA.target = "_blank";
        openNewWinA.rel = "noopener";
        openNewWinA.textContent = `↗ ยืนยันและเปิดหน้าต่างใหม่`;
        openNewWinA.title = `ยืนยันรหัสและเปิด Breakout Room ห้อง ${stuRoom} (${lMeta.roomCode}) ในแท็บ/หน้าต่างใหม่`;
        openNewWinA.addEventListener("click", () => {
          saveStepPinPrefillStudent(lockedStudent);
          if (!isFaculty) {
            markStudentCheckedIn(modCode, stuRoom, lockedStudent, 0, { skipLiveBroadcast: true });
            if (root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.applyMyStudent === "function") {
              try {
                root.RACM_PORTAL_API.applyMyStudent(lockedStudent, true);
              } catch (_) {}
            }
          }
        });

        const roomPdfA = document.createElement("a");
        roomPdfA.className = "hsd-srp-act-btn is-pdf-btn";
        roomPdfA.href = lMeta.staticRoomPdfHref;
        roomPdfA.download = lMeta.roomPdfFileName;
        roomPdfA.textContent = `⬇ .PDF ห้อง ${stuRoom}`;
        roomPdfA.title = `ดาวน์โหลดใบงานเปล่า 16:9 (.PDF) ประจำห้อง ${lMeta.roomCode}`;

        ctaWrap.append(goCheckinBtn, openNewWinA, roomPdfA);
        if (isFaculty) {
          const toggleAllBtn = document.createElement("button");
          toggleAllBtn.type = "button";
          toggleAllBtn.className = "hsd-srp-unlock-view-btn";
          toggleAllBtn.textContent = manualUnlockedAll ? `🔒 ล็อกเฉพาะห้อง ${stuRoom}` : "ดูครบ 6 ห้อง";
          toggleAllBtn.addEventListener("click", () => {
            manualUnlockedAll = !manualUnlockedAll;
            syncSectionUI();
          });
          ctaWrap.appendChild(toggleAllBtn);
        }
        lockResultCol.append(infoDiv, ctaWrap);
      } else {
        lockBar.classList.remove("is-locked-ready");
        if (needIdPromptMsg && !trimmed) {
          const err = document.createElement("div");
          err.className = "hsd-srp-lock-err";
          err.textContent = needIdPromptMsg;
          lockResultCol.appendChild(err);
        } else if (!trimmed) {
          const hint = document.createElement("div");
          hint.className = "hsd-srp-lock-idle-hint";
          hint.innerHTML =
            `กรอกเลขรหัสนักศึกษา <strong>3 ตัวท้ายใหม่</strong> (เช่น <code>018</code>) → ตรวจสอบชื่อและห้องย่อย แล้วกดปุ่ม <strong>✅ ยืนยันเข้าสู่ Breakout Room</strong> เพื่อไปยังลิงก์ห้องที่ถูกต้องทันที`;
          lockResultCol.appendChild(hint);
        } else if (/^\d{1,2}$/.test(trimmed)) {
          const padded = trimmed.padStart(3, "0");
          const hint = document.createElement("div");
          hint.className = "hsd-srp-lock-idle-hint";
          hint.innerHTML = `กรอกอีก ${3 - trimmed.length} หลัก (หรือกด <strong>Enter</strong> หากเป็นรหัสท้าย <code>${escHtml(padded)}</code>)`;
          lockResultCol.appendChild(hint);
        } else {
          const res = matchStudentsBy3DigitPin(trimmed, 1);
          if (res.all.length > 1) {
            const box = document.createElement("div");
            box.className = "hsd-srp-disambig-wrap";
            box.innerHTML = `<div class="hsd-srp-disambig-lbl">พบรหัสท้าย "${escHtml(trimmed)}" ตรงกัน ${res.all.length} คน — แตะเลือกชื่อของคุณเพื่อยืนยันเข้า Breakout Room ที่ถูกต้อง:</div>`;
            const row = document.createElement("div");
            row.className = "hsd-srp-disambig-row";
            res.all.slice(0, 6).forEach((cand) => {
              const candRoom = clampRoomId(cand.disc || 1);
              const cMeta = getRoomMeta(modCode, candRoom);
              const b = document.createElement("button");
              b.type = "button";
              b.className = "hsd-srp-disambig-btn";
              b.innerHTML = `✅ ยืนยัน: ${escHtml(cand.id)} <strong>${escHtml(cand.nickname || cand.name)}</strong> → เข้า Breakout Room ห้อง ${candRoom} (${escHtml(cMeta.roomCode)})`;
              b.addEventListener("click", () => {
                lockedStudent = cand;
                pinQuery = String(cand.id);
                pinInput.value = pinQuery;
                manualUnlockedAll = false;
                commitStudentProfileAndNavigate(candRoom, cand);
              });
              row.appendChild(b);

              const nw = document.createElement("a");
              nw.className = "hsd-srp-act-btn is-new-win-btn";
              nw.href = isFaculty ? cMeta.facultyRoomHref : buildStudentCheckinHrefWithSid(modCode, candRoom, cand);
              nw.target = "_blank";
              nw.rel = "noopener";
              nw.textContent = `↗ หน้าต่างใหม่ (ห้อง ${candRoom})`;
              nw.addEventListener("click", () => {
                saveStepPinPrefillStudent(cand);
                if (!isFaculty) {
                  markStudentCheckedIn(modCode, candRoom, cand, 0, { skipLiveBroadcast: true });
                  if (root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.applyMyStudent === "function") {
                    try {
                      root.RACM_PORTAL_API.applyMyStudent(cand, true);
                    } catch (_) {}
                  }
                }
              });
              row.appendChild(nw);
            });
            box.appendChild(row);
            lockResultCol.appendChild(box);
          } else {
            const err = document.createElement("div");
            err.className = "hsd-srp-lock-err";
            err.textContent = `ไม่พบรหัส "${trimmed}" ในรายชื่อนักศึกษา 169 คน — กรุณาตรวจสอบรหัส 3 ตัวท้ายอีกครั้ง`;
            lockResultCol.appendChild(err);
          }
        }
      }

      // Render 6 Breakout Room Cards with Real-Time Live Lobby Counters
      grid.replaceChildren();
      [1, 2, 3, 4, 5, 6].forEach((rId) => {
        const meta = getRoomMeta(modCode, rId);
        const rStats = getLiveRoomJoinedStats(rId, modCode);
        const hasCheckedIn = rStats.joinedCount > 0;
        const isMine = myDiscRoom === rId;
        const isCur = activeRoom === rId;
        const isLockedTarget = isRoomLocked && lockedRoomId === rId;
        const isLockedOut = isRoomLocked && lockedRoomId !== rId;

        const card = document.createElement("div");
        card.className =
          `hsd-srp-card` +
          `${isMine ? " is-my-assigned-room" : ""}` +
          `${isCur ? " is-active-room" : ""}` +
          `${isLockedTarget ? " is-locked-target" : ""}` +
          `${isLockedOut ? " is-locked-other" : ""}`;

        const top = document.createElement("div");
        top.className = "hsd-srp-top";

        const qrBtn = document.createElement("button");
        qrBtn.type = "button";
        qrBtn.className = "hsd-srp-qr-btn";
        qrBtn.disabled = isLockedOut;
        qrBtn.title = `คลิกเพื่อขยาย QR Code ประจำห้อง ${meta.roomCode} (${meta.displayShortUrl})`;
        qrBtn.innerHTML = buildQrSvg(meta.studentQrUrl, "", `QR ห้อง ${meta.roomCode}`);
        qrBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (isLockedOut) return;
          openRoomQrZoomModal(modCode, rId);
        });

        const liveBadgeHtml = hasCheckedIn
          ? `<span class="hsd-srp-html-pill is-live-checkin-pill">🟢 ออนไลน์ ${rStats.joinedCount}/${rStats.expectedCount} คน</span>`
          : `<span class="hsd-srp-html-pill">ออนไลน์ 0/${rStats.expectedCount}</span>`;

        const metaDiv = document.createElement("div");
        metaDiv.className = "hsd-srp-meta";
        metaDiv.innerHTML = `
          <div class="hsd-srp-badges">
            <span class="hsd-srp-pin">${escHtml(meta.pinCode)}</span>
            ${liveBadgeHtml}
            ${isLockedTarget ? `<span class="hsd-srp-html-pill is-locked-mine-pill">✓ Breakout Room ของคุณ</span>` : isMine ? `<span class="hsd-srp-html-pill is-locked-mine-pill">★ ห้องของคุณ</span>` : ""}
            ${isLockedOut ? `<span class="hsd-srp-html-pill is-locked-out-pill">🔒 ห้องของคุณคือห้อง ${lockedRoomId}</span>` : ""}
          </div>
          <div class="hsd-srp-room-name">Breakout Room ${rId} · ${escHtml(meta.roomCode)} (${meta.expectedCount} คน)</div>
          <div class="hsd-srp-inst" title="${escHtml(meta.instructor)}">อ.ประจำห้อง: ${escHtml(meta.instructor)}</div>
        `;

        top.append(qrBtn, metaDiv);
        card.appendChild(top);

        const acts = document.createElement("div");
        acts.className = "hsd-srp-actions";

        const openRoomBtn = document.createElement("button");
        openRoomBtn.type = "button";
        openRoomBtn.className = `hsd-srp-act-btn is-primary${isLockedTarget ? " is-checkin-pulse" : ""}`;
        openRoomBtn.disabled = isLockedOut;
        openRoomBtn.textContent = isFaculty
          ? `▶ เปิด PPT ห้อง ${rId} (${meta.roomCode})`
          : isLockedTarget
          ? `✅ ยืนยันเข้าห้อง ${rId} (${meta.roomCode}) →`
          : `▶ เลือกเข้าห้อง ${rId} (${meta.roomCode}) →`;
        openRoomBtn.addEventListener("click", () => {
          if (isLockedOut) return;
          commitStudentProfileAndNavigate(rId, isLockedTarget ? lockedStudent : null);
        });

        const roomTargetStu = isLockedTarget ? lockedStudent : null;
        const newTabRoomA = document.createElement("a");
        newTabRoomA.className = "hsd-srp-act-btn is-new-win-btn";
        newTabRoomA.href = isFaculty
          ? meta.facultyRoomHref
          : buildStudentCheckinHrefWithSid(modCode, rId, roomTargetStu);
        newTabRoomA.target = "_blank";
        newTabRoomA.rel = "noopener";
        newTabRoomA.textContent = "↗ หน้าต่างใหม่";
        newTabRoomA.title = `เปิดห้อง ${rId} (${meta.roomCode}) ในหน้าต่าง/แท็บใหม่`;
        if (isLockedOut) {
          newTabRoomA.setAttribute("tabindex", "-1");
          newTabRoomA.setAttribute("aria-disabled", "true");
          newTabRoomA.addEventListener("click", (ev) => ev.preventDefault());
        } else if (roomTargetStu) {
          newTabRoomA.addEventListener("click", () => {
            saveStepPinPrefillStudent(roomTargetStu);
            if (!isFaculty) {
              markStudentCheckedIn(modCode, rId, roomTargetStu, 0, { skipLiveBroadcast: true });
              if (root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.applyMyStudent === "function") {
                try {
                  root.RACM_PORTAL_API.applyMyStudent(roomTargetStu, true);
                } catch (_) {}
              }
            }
          });
        }

        const qrZoomBtn = document.createElement("button");
        qrZoomBtn.type = "button";
        qrZoomBtn.className = "hsd-srp-act-btn";
        qrZoomBtn.disabled = isLockedOut;
        qrZoomBtn.textContent = "📱 QR";
        qrZoomBtn.title = `แสดง QR Code สำหรับห้อง ${meta.roomCode}`;
        qrZoomBtn.addEventListener("click", () => {
          if (isLockedOut) return;
          openRoomQrZoomModal(modCode, rId);
        });

        const dlPdfA = document.createElement("a");
        dlPdfA.className = "hsd-srp-act-btn is-pdf-btn is-full-row-dl";
        dlPdfA.href = meta.staticRoomPdfHref;
        dlPdfA.download = meta.roomPdfFileName;
        dlPdfA.textContent = "⬇ .PDF (ใบงานเปล่า 16:9)";
        dlPdfA.title = `ดาวน์โหลดไฟล์ ${meta.roomPdfFileName} (16:9 Optimal Font Blank Worksheet) ประจำห้อง ${meta.roomCode}`;
        if (isLockedOut) {
          dlPdfA.setAttribute("tabindex", "-1");
          dlPdfA.setAttribute("aria-disabled", "true");
        }

        acts.append(openRoomBtn, newTabRoomA, qrZoomBtn);
        if (isFaculty) {
          const rstRoomBtn = document.createElement("button");
          rstRoomBtn.type = "button";
          rstRoomBtn.className = "hsd-srp-act-btn is-reset-checkin-btn";
          rstRoomBtn.disabled = isLockedOut;
          rstRoomBtn.textContent = "🔄 ล้าง Check-in";
          rstRoomBtn.title = `ล้าง Cache การ Check-in เฉพาะห้อง ${rId} (${meta.roomCode}) ให้นักศึกษาสแกนใหม่ทั้งหมด`;
          rstRoomBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            if (isLockedOut) return;
            openResetCheckinConfirmModal(modCode, rId, () => syncSectionUI());
          });
          acts.appendChild(rstRoomBtn);
        }
        acts.appendChild(dlPdfA);
        card.appendChild(acts);
        grid.appendChild(card);
      });
    }

    const liveRef = root && root.RACM_LIVE_CLASSROOM;
    if (liveRef && typeof liveRef.startEngine === "function") {
      liveRef.startEngine();
    }
    syncSectionUI();
    if (liveRef && typeof liveRef.on === "function") {
      const unsubPres = liveRef.on("presence", () => {
        if (!sec.isConnected) {
          unsubPres();
          return;
        }
        syncSectionUI();
      });
    }
    return sec;
  }

  /* ---------- 8b. Compact 3-Digit Room-Lock & PDF Strip for Episode Modal (Step 05) ---------- */
  function buildCompactStepPinLockDOM(modCodeOpt, opts) {
    const cfg = opts || {};
    const modCode = /^HS[1-6]$/i.test(String(modCodeOpt || "")) ? String(modCodeOpt).toUpperCase() : "HS1";
    const isFaculty = root.PORTAL_ROLE === "faculty";
    const cPdf = getCentralPdfMeta(modCode);
    let curStu = null;
    let curVal = "";

    const box = document.createElement("div");
    box.className = "hsd-compact-step-lock";
    box.setAttribute("data-hsd-pin-resettable", "1");

    const topRow = document.createElement("div");
    topRow.className = "hsd-csl-top";
    const akChipUnlocked = Boolean(isFaculty || cPdf.answerKeyUnlocked);
    topRow.innerHTML =
      `<span class="hsd-csl-title">${
        isFaculty
          ? `🔑 ค้นหานักศึกษาด้วยรหัส 3 ตัวท้าย (${escHtml(modCode)}):`
          : `🔑 กรอกรหัส 3 ตัวท้ายใหม่ → กดยืนยันเข้าสู่ Breakout Room (${escHtml(modCode)}):`
      }</span>` +
      `<div class="hsd-csl-pdfs">` +
      `<a class="hsd-csl-pdf-chip" href="${escHtml(cPdf.modulePdfHref)}" download="${escHtml(cPdf.modulePdfFileName)}">⬇ .PDF กลางรวม ${escHtml(modCode)} (16:9)</a>` +
      (akChipUnlocked
        ? `<a class="hsd-csl-pdf-chip" href="${escHtml(cPdf.answerKeyPdfHref)}" download="${escHtml(cPdf.answerKeyPdfFileName)}" title="ดาวน์โหลด ${escHtml(cPdf.answerKeyPdfFileName)}">⬇ .PDF พร้อม Answer Key ${escHtml(modCode)}</a>`
        : `<button type="button" class="hsd-csl-pdf-chip" data-locked-csl-ak="1" title="เปิดให้ดาวน์โหลดหลังจบคาบเรียน (${escHtml(cPdf.unlockAfterLabel)})" style="opacity:0.75;cursor:not-allowed;background:#f8fafc;border-style:dashed;color:#64748b;font-family:inherit;">🔒 Answer Key ${escHtml(modCode)} (${escHtml(cPdf.unlockShortLabel)})</button>`) +
      `</div>`;
    const lockedCslAk = topRow.querySelector("[data-locked-csl-ak]");
    if (lockedCslAk) {
      lockedCslAk.addEventListener("click", () => {
        if (root && typeof root.alert === "function") {
          root.alert(`🔒 เฉลย Answer Key คาบ ${modCode} (${cPdf.answerKeyPdfFileName}) จะเปิดให้ดาวน์โหลดหลังจบคาบอภิปราย (${cPdf.unlockAfterLabel})`);
        }
      });
    }

    const midRow = document.createElement("div");
    midRow.className = "hsd-csl-mid";
    const inp = document.createElement("input");
    inp.type = "text";
    inp.inputMode = "numeric";
    applyIdlePinInputGuards(inp, "racm_csl_pin");
    inp.maxLength = 16;
    inp.className = "hsd-csl-input";
    inp.placeholder = "กรอกรหัส 3 ตัวใหม่ (เช่น 018)";
    inp.value = "";
    let userEngagedCsl = false;
    const markEngagedCsl = () => {
      userEngagedCsl = true;
    };
    inp.addEventListener("pointerdown", markEngagedCsl, { passive: true });
    inp.addEventListener("mousedown", markEngagedCsl, { passive: true });
    inp.addEventListener("touchstart", markEngagedCsl, { passive: true });
    inp.addEventListener("click", markEngagedCsl, { passive: true });

    const statusWrap = document.createElement("div");
    statusWrap.className = "hsd-csl-status";
    midRow.append(inp, statusWrap);
    box.append(topRow, midRow);

    function goRoom(rId, stuObj) {
      const targetRoom = stuObj && stuObj.disc ? clampRoomId(stuObj.disc) : clampRoomId(rId);
      const m = getRoomMeta(modCode, targetRoom);
      if (stuObj) {
        saveStepPinPrefillStudent(stuObj);
        if (!isFaculty) {
          markStudentCheckedIn(modCode, targetRoom, stuObj, 0, { skipLiveBroadcast: true });
          if (root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.applyMyStudent === "function") {
            try {
              root.RACM_PORTAL_API.applyMyStudent(stuObj, true);
            } catch (_) {}
          }
        }
      }
      if (typeof cfg.onNavigate === "function") {
        cfg.onNavigate(modCode, targetRoom, stuObj, m);
        return;
      }
      window.location.href = isFaculty
        ? m.facultyRoomHref
        : buildStudentCheckinHrefWithSid(modCode, targetRoom, stuObj);
    }

    function sync() {
      statusWrap.replaceChildren();
      const q = String(curVal || "").trim();
      if (curStu) {
        const rId = clampRoomId(curStu.disc || 1);
        const m = getRoomMeta(modCode, rId);
        const sNo = String(curStu.id).slice(-3);
        const rStats = getLiveRoomJoinedStats(rId, modCode);
        const myPres = rStats.bySid.get(String(curStu.id));
        const liveTxt = myPres ? " · 🟢 ออนไลน์" : "";
        const badge = document.createElement("span");
        badge.className = "hsd-csl-matched";
        badge.innerHTML = `✓ <strong>${escHtml(curStu.id)} (${escHtml(sNo)}) ${escHtml(curStu.nickname || curStu.name)}${escHtml(liveTxt)}</strong> → Breakout Room ${rId} (${escHtml(m.roomCode)})`;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "hsd-csl-checkin-btn";
        btn.textContent = isFaculty ? `▶ เปิด PPT ห้อง ${rId}` : `✅ ยืนยันเข้า Breakout Room ห้อง ${rId} (${m.roomCode}) →`;
        btn.addEventListener("click", () => goRoom(rId, curStu));

        const newTabA = document.createElement("a");
        newTabA.className = "hsd-csl-cand-btn";
        newTabA.href = isFaculty ? m.facultyRoomHref : buildStudentCheckinHrefWithSid(modCode, rId, curStu);
        newTabA.target = "_blank";
        newTabA.rel = "noopener";
        newTabA.textContent = `↗ ยืนยันเปิดหน้าต่างใหม่`;
        newTabA.addEventListener("click", () => {
          saveStepPinPrefillStudent(curStu);
          if (!isFaculty) {
            markStudentCheckedIn(modCode, rId, curStu, 0, { skipLiveBroadcast: true });
            if (root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.applyMyStudent === "function") {
              try {
                root.RACM_PORTAL_API.applyMyStudent(curStu, true);
              } catch (_) {}
            }
          }
        });

        const clr = document.createElement("button");
        clr.type = "button";
        clr.className = "hsd-csl-clear";
        clr.textContent = "✕";
        clr.title = "ล้างรหัสและโปรไฟล์";
        clr.addEventListener("click", () => {
          userEngagedCsl = false;
          curStu = null;
          curVal = "";
          inp.value = "";
          clearStepPinPrefillStudent();
          if (!isFaculty && root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.clearAllPersonalization === "function") {
            root.RACM_PORTAL_API.clearAllPersonalization({ keepCurrentTab: true, skipRenderHsd: true });
          }
          sync();
          if (document.activeElement === inp && typeof inp.blur === "function") {
            inp.blur();
          }
        });
        statusWrap.append(badge, btn, newTabA, clr);
        return;
      }
      if (q.length >= 3) {
        const res = matchStudentsBy3DigitPin(q, 1);
        if (res.all.length > 1) {
          res.all.slice(0, 4).forEach((cand) => {
            const candRoom = clampRoomId(cand.disc || 1);
            const cMeta = getRoomMeta(modCode, candRoom);
            const cb = document.createElement("button");
            cb.type = "button";
            cb.className = "hsd-csl-checkin-btn";
            cb.textContent = `✅ ยืนยัน: ${cand.id} ${cand.nickname || cand.name} → เข้า Breakout Room ห้อง ${candRoom} (${cMeta.roomCode})`;
            cb.addEventListener("click", () => {
              curStu = cand;
              curVal = String(cand.id);
              inp.value = curVal;
              goRoom(candRoom, cand);
            });
            statusWrap.appendChild(cb);
          });
          return;
        }
      }
      if (isFaculty) {
        const chips = document.createElement("div");
        chips.className = "hsd-csl-room-chips";
        [1, 2, 3, 4, 5, 6].forEach((rNum) => {
          const rm = getRoomMeta(modCode, rNum);
          const rSt = getLiveRoomJoinedStats(rNum, modCode);
          const cntSuffix = rSt.joinedCount > 0 ? ` (🟢 ${rSt.joinedCount}/${rSt.expectedCount})` : "";
          const a = document.createElement("button");
          a.type = "button";
          a.className = "tv-hosp-chip";
          a.style.fontSize = "11.8px";
          a.style.padding = "3px 8px";
          a.textContent = `ห้อง ${rNum} · ${rm.cleanRoomSlug}${cntSuffix} →`;
          a.addEventListener("click", () => goRoom(rNum, null));
          chips.appendChild(a);
        });
        statusWrap.appendChild(chips);
      } else {
        const hint = document.createElement("span");
        hint.style.fontSize = "12px";
        hint.style.opacity = "0.85";
        hint.textContent = "พิมพ์รหัส 3 ตัวท้ายใหม่แล้วกดยืนยัน เพื่อไปยังลิงก์ Breakout Room ของคุณทันที";
        statusWrap.appendChild(hint);
      }
    }

    box._resetPinState = () => {
      userEngagedCsl = false;
      curStu = null;
      curVal = "";
      inp.value = "";
      if (document.activeElement === inp && typeof inp.blur === "function") {
        inp.blur();
      }
      sync();
    };

    inp.addEventListener("focus", () => {
      if (!userEngagedCsl && Date.now() - lastGlobalTabKeyMs > 400) {
        if (typeof inp.blur === "function") inp.blur();
        return;
      }
      userEngagedCsl = true;
      alignGateInputAboveMobileKeyboard(inp);
    });

    inp.addEventListener("input", () => {
      if (!userEngagedCsl && document.activeElement !== inp) {
        inp.value = "";
        curVal = "";
        curStu = null;
        return;
      }
      userEngagedCsl = true;
      curVal = inp.value;
      const q = curVal.trim();
      if (!q || /^\d{1,2}$/.test(q)) {
        curStu = null;
      } else {
        const res = matchStudentsBy3DigitPin(q, 1);
        curStu = res.all.length === 1 ? res.all[0] : null;
      }
      sync();
      alignGateInputAboveMobileKeyboard(inp);
    });

    inp.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        const q = inp.value.trim();
        if (/^\d{1,3}$/.test(q)) {
          curVal = q.padStart(3, "0");
          inp.value = curVal;
          const res = matchStudentsBy3DigitPin(curVal, 1);
          if (res.all.length === 1) {
            curStu = res.all[0];
            sync();
            goRoom(clampRoomId(curStu.disc || 1), curStu);
          } else {
            sync();
          }
        } else if (curStu) {
          goRoom(clampRoomId(curStu.disc || 1), curStu);
        }
      }
    });

    const liveRef = root && root.RACM_LIVE_CLASSROOM;
    if (liveRef && typeof liveRef.startEngine === "function") {
      liveRef.startEngine();
    }
    sync();
    if (liveRef && typeof liveRef.on === "function") {
      const unsub = liveRef.on("presence", () => {
        if (!box.isConnected) {
          unsub();
          return;
        }
        sync();
      });
    }
    return box;
  }

  /* ---------- 9. Reusable 3-Digit Student ID Check-in Card + Side-by-Side Room Check-in Status ---------- */
  let activeCheckinPresUnsub = null;
  let globalCheckinKeyRouterInstalled = false;

  function findActiveVisibleCheckinCard() {
    if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return null;
    const modalCard = document.querySelector("#hsdKahootLobbyModal:not([hidden]) [data-hsd-checkin-card='1'][data-interactive='1']");
    if (modalCard) return modalCard;
    const gateCard = document.querySelector(".hsd-qr-checkin-gate-wrap [data-hsd-checkin-card='1'][data-interactive='1']");
    if (gateCard && gateCard.offsetParent !== null) return gateCard;
    const allCards = document.querySelectorAll("[data-hsd-checkin-card='1'][data-interactive='1']");
    for (let i = 0; i < allCards.length; i += 1) {
      const el = allCards[i];
      if (el && el.isConnected && el.offsetParent !== null) return el;
    }
    return null;
  }

  function ensureGlobalCheckinKeyListener() {
    if (globalCheckinKeyRouterInstalled || typeof window === "undefined") return;
    globalCheckinKeyRouterInstalled = true;
    window.addEventListener(
      "keydown",
      (ev) => {
        if (ev.isComposing || ev.metaKey || ev.ctrlKey || ev.altKey) return;
        const t = ev.target;
        const ae = typeof document !== "undefined" ? document.activeElement : null;
        const tag = t && t.tagName ? String(t.tagName).toUpperCase() : "";
        const aeTag = ae && ae.tagName ? String(ae.tagName).toUpperCase() : "";
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          (t && t.isContentEditable) ||
          aeTag === "INPUT" ||
          aeTag === "TEXTAREA" ||
          aeTag === "SELECT" ||
          (ae && ae.isContentEditable)
        ) {
          return;
        }
        const activeCard = findActiveVisibleCheckinCard();
        if (!activeCard) return;
        if (/^[0-9]$/.test(ev.key)) {
          ev.preventDefault();
          activeCard._pushDigit(ev.key);
        } else if (ev.key === "Backspace" && activeCard._hasDigits && activeCard._hasDigits()) {
          ev.preventDefault();
          activeCard._popDigit();
        } else if ((ev.key === "Delete" || ev.key === "Escape") && activeCard._hasDigits && activeCard._hasDigits()) {
          ev.preventDefault();
          if (typeof activeCard._clearDigits === "function") activeCard._clearDigits();
        } else if (ev.key === "Enter" && activeCard._canSubmit && activeCard._canSubmit()) {
          ev.preventDefault();
          ev.stopPropagation();
          activeCard._submitCheckin();
        }
      },
      true
    );
  }

  function teardownCheckinGateListeners() {
    if (activeCheckinPresUnsub) {
      activeCheckinPresUnsub();
      activeCheckinPresUnsub = null;
    }
  }

  function buildRoomCheckinCardElement(opts) {
    const cfg = opts || {};
    const live = root && root.RACM_LIVE_CLASSROOM;
    const modCode = String(cfg.modCode || "HS1").toUpperCase();
    const roomId = clampRoomId(cfg.roomId || (live ? live.getRoomId() : 1));
    const meta = getRoomMeta(modCode, roomId);
    const isCompact = cfg.variant === "compact";
    const interactive = cfg.interactive !== false;
    const kioskMode = Boolean(cfg.kioskMode);

    if (interactive) {
      ensureGlobalCheckinKeyListener();
    }

    const prefillStu = !kioskMode && cfg.prefillStudent && cfg.prefillStudent.id ? cfg.prefillStudent : null;
    let pinDigits = prefillStu ? String(prefillStu.id).slice(-3) : "";
    let pickedStudent = prefillStu || null;
    let flashSuccessMsg = "";
    let flashTimer = null;
    const keyBtnMap = new Map();

    function flashNumpadKey(keyId) {
      const btn = keyBtnMap.get(String(keyId));
      if (!btn || !btn.classList) return;
      btn.classList.add("is-key-pressed");
      if (btn._pressTimer) clearTimeout(btn._pressTimer);
      btn._pressTimer = setTimeout(() => {
        btn.classList.remove("is-key-pressed");
      }, 150);
    }

    const card = document.createElement("div");
    card.className = `hsd-qr-checkin-card${isCompact ? " is-compact-embed" : ""}`;
    card.setAttribute("data-hsd-checkin-card", "1");
    card.setAttribute("data-hsd-pin-resettable", "1");
    card.setAttribute("data-interactive", interactive ? "1" : "0");
    card.setAttribute("data-room-id", String(roomId));

    // 1. Room Banner (📍 HS1-RX · ห้อง 1C1-0Y | 🟢 Check-in แล้ว X/28 คน)
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
    hTitle.textContent = isCompact
      ? `Check-in เข้าห้องเรียน (${meta.modCode})`
      : `Case Discussion: ${meta.modCode} — Check-in เข้าห้องเรียน`;

    const hSub = document.createElement("p");
    hSub.className = "hsd-qcg-sub";
    hSub.textContent = `ห้องอภิปรายที่ ${meta.roomId} (ห้อง ${meta.roomCode}) · อ.ประจำห้อง: ${meta.instructor}`;
    hero.append(heroTop, hTitle, hSub);
    card.appendChild(hero);

    // 2. Step Title + Direct-Typeable 3-Digit PIN Slots [•] [•] [•]
    const stepLbl = document.createElement("div");
    stepLbl.className = "hsd-qcg-step-title";
    stepLbl.textContent = "กรอกรหัสนักศึกษา 3 ตัวท้าย (เช่น 056) เพื่อ Check-in";
    card.appendChild(stepLbl);

    const slotsRow = document.createElement("div");
    slotsRow.className = "hsd-qcg-pin-slots";
    const slotEls = [0, 1, 2].map((idx) => {
      const s = document.createElement("input");
      s.type = "text";
      s.inputMode = "numeric";
      s.pattern = "[0-9]*";
      applyIdlePinInputGuards(s, `racm_qcg_s${idx}`);
      s.className = "hsd-qcg-slot";
      s.placeholder = "•";
      s.setAttribute("aria-label", `รหัสนักศึกษาหลักที่ ${idx + 1}`);
      if (idx === 0) {
        s.setAttribute("data-ppt-ok-sid-input", "1");
      }
      if (!interactive) {
        s.disabled = true;
      } else {
        s.addEventListener("focus", () => {
          if (idx > pinDigits.length && slotEls[pinDigits.length] && typeof slotEls[pinDigits.length].focus === "function") {
            slotEls[pinDigits.length].focus({ preventScroll: true });
            alignGateInputAboveMobileKeyboard(slotEls[pinDigits.length]);
            return;
          }
          if (typeof s.select === "function") s.select();
          alignGateInputAboveMobileKeyboard(s);
        });
        s.addEventListener("keydown", (ev) => {
          if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
          if (/^[0-9]$/.test(ev.key)) {
            ev.preventDefault();
            if (pinDigits.length === 3 && (idx === 0 || idx === 2)) {
              flashNumpadKey(ev.key);
              flashSuccessMsg = "";
              pickedStudent = null;
              pinDigits = ev.key;
              autoResolveCandidate();
              syncUI();
              if (slotEls[1] && typeof slotEls[1].focus === "function") slotEls[1].focus({ preventScroll: true });
              alignGateInputAboveMobileKeyboard(slotEls[1] || s);
              return;
            }
            setDigitAtSlot(idx, ev.key);
            const nextIdx = Math.min(2, pinDigits.length);
            if (slotEls[nextIdx] && nextIdx !== idx && typeof slotEls[nextIdx].focus === "function") {
              slotEls[nextIdx].focus({ preventScroll: true });
            }
            alignGateInputAboveMobileKeyboard(slotEls[nextIdx] || s);
          } else if (ev.key === "Backspace") {
            ev.preventDefault();
            flashNumpadKey("back");
            if (idx < pinDigits.length) {
              pinDigits = pinDigits.slice(0, idx) + pinDigits.slice(idx + 1);
              pickedStudent = null;
              autoResolveCandidate();
              syncUI();
              const prevIdx = Math.max(0, idx - (idx >= pinDigits.length ? 1 : 0));
              if (slotEls[prevIdx] && typeof slotEls[prevIdx].focus === "function") {
                slotEls[prevIdx].focus({ preventScroll: true });
              }
            } else {
              popDigit();
              const prevIdx = Math.max(0, pinDigits.length);
              if (slotEls[prevIdx] && typeof slotEls[prevIdx].focus === "function") {
                slotEls[prevIdx].focus({ preventScroll: true });
              }
            }
          } else if (ev.key === "ArrowLeft" && idx > 0) {
            ev.preventDefault();
            if (slotEls[idx - 1] && typeof slotEls[idx - 1].focus === "function") slotEls[idx - 1].focus({ preventScroll: true });
          } else if (ev.key === "ArrowRight" && idx < 2) {
            ev.preventDefault();
            if (slotEls[idx + 1] && typeof slotEls[idx + 1].focus === "function") slotEls[idx + 1].focus({ preventScroll: true });
          } else if (ev.key === "Delete" || ev.key === "Escape") {
            ev.preventDefault();
            clearAllDigits();
            if (slotEls[0] && typeof slotEls[0].focus === "function") slotEls[0].focus({ preventScroll: true });
          } else if (ev.key === "Enter") {
            ev.preventDefault();
            ev.stopPropagation();
            submitCheckin();
          }
        });
        s.addEventListener("input", () => {
          const digits = String(s.value || "").replace(/\D/g, "");
          if (!digits) {
            if (idx < pinDigits.length) {
              pinDigits = pinDigits.slice(0, idx) + pinDigits.slice(idx + 1);
              pickedStudent = null;
              autoResolveCandidate();
            }
            syncUI();
            alignGateInputAboveMobileKeyboard(s);
            return;
          }
          if (digits.length >= 3) {
            flashSuccessMsg = "";
            pinDigits = digits.slice(-3);
            flashNumpadKey(pinDigits.slice(-1));
            pickedStudent = null;
            autoResolveCandidate();
            syncUI();
            if (slotEls[2] && typeof slotEls[2].focus === "function") slotEls[2].focus({ preventScroll: true });
            alignGateInputAboveMobileKeyboard(slotEls[2] || s);
            return;
          }
          const ch = digits.slice(-1);
          if ((pinDigits[idx] || "") !== ch) {
            setDigitAtSlot(idx, ch);
            if (idx < 2 && slotEls[idx + 1] && typeof slotEls[idx + 1].focus === "function") {
              slotEls[idx + 1].focus({ preventScroll: true });
              alignGateInputAboveMobileKeyboard(slotEls[idx + 1]);
              return;
            }
          } else {
            syncUI();
          }
          alignGateInputAboveMobileKeyboard(s);
        });
        s.addEventListener("paste", (ev) => {
          ev.preventDefault();
          const pasted = String((ev.clipboardData && ev.clipboardData.getData("text")) || "").trim();
          const onlyNums = pasted.replace(/\D/g, "");
          if (onlyNums.length >= 1) {
            flashSuccessMsg = "";
            pinDigits = onlyNums.slice(-3);
            flashNumpadKey(pinDigits.slice(-1));
            pickedStudent = null;
            autoResolveCandidate();
            syncUI();
            const targetSlot = slotEls[Math.min(2, Math.max(0, pinDigits.length - 1))];
            if (targetSlot && typeof targetSlot.focus === "function") targetSlot.focus();
          }
        });
      }
      slotsRow.appendChild(s);
      return s;
    });
    card.appendChild(slotsRow);

    // Verification status + disambiguation / wrong-room box
    const verifyBox = document.createElement("div");
    verifyBox.className = "hsd-qcg-verify-box is-idle";
    card.appendChild(verifyBox);

    // Tactile Numeric Keypad (0-9, Clear, Backspace — syncs with physical keyboard & touch)
    const numpad = document.createElement("div");
    numpad.className = "hsd-qcg-numpad";
    numpad.setAttribute("role", "group");
    numpad.setAttribute("aria-label", "แป้นกดรหัสนักศึกษา 3 ตัวท้าย");

    ["1", "2", "3", "4", "5", "6", "7", "8", "9"].forEach((d) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hsd-qcg-key";
      b.textContent = d;
      keyBtnMap.set(d, b);
      if (interactive) b.addEventListener("click", () => pushDigit(d));
      numpad.appendChild(b);
    });

    function clearAllDigits() {
      flashNumpadKey("clear");
      flashSuccessMsg = "";
      pinDigits = "";
      pickedStudent = null;
      if (!kioskMode && root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.clearAllPersonalization === "function") {
        root.RACM_PORTAL_API.clearAllPersonalization({ keepCurrentTab: true, skipRenderHsd: true });
      }
      syncUI();
    }

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "hsd-qcg-key is-fn";
    clearBtn.textContent = "ล้าง";
    keyBtnMap.set("clear", clearBtn);
    if (interactive) {
      clearBtn.addEventListener("click", clearAllDigits);
    }

    const zeroBtn = document.createElement("button");
    zeroBtn.type = "button";
    zeroBtn.className = "hsd-qcg-key";
    zeroBtn.textContent = "0";
    keyBtnMap.set("0", zeroBtn);
    if (interactive) zeroBtn.addEventListener("click", () => pushDigit("0"));

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "hsd-qcg-key is-fn";
    backBtn.setAttribute("aria-label", "ลบตัวท้าย");
    backBtn.textContent = "⌫";
    keyBtnMap.set("back", backBtn);
    if (interactive) backBtn.addEventListener("click", () => popDigit());

    numpad.append(clearBtn, zeroBtn, backBtn);
    card.appendChild(numpad);

    // Big Check-in Submit Button
    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "hsd-qcg-submit-btn";
    if (interactive) submitBtn.addEventListener("click", () => submitCheckin());
    card.appendChild(submitBtn);

    function autoResolveCandidate() {
      const query = pinDigits.length === 3 ? pinDigits : "";
      if (!query) {
        pickedStudent = null;
        return;
      }
      const res = matchStudentsBy3DigitPin(query, roomId);
      // Only auto-select when uniquely matched across all 169 students so shared codes (e.g. 053) always ask user to pick!
      if (res.all.length === 1) {
        pickedStudent = res.all[0];
      } else if (pickedStudent && !res.all.some((s) => s.id === pickedStudent.id)) {
        pickedStudent = null;
      }
    }

    function setDigitAtSlot(slotIdx, d) {
      flashNumpadKey(d);
      flashSuccessMsg = "";
      pickedStudent = null;
      if (pinDigits.length === 3 && slotIdx === 0) {
        pinDigits = d;
      } else if (slotIdx >= pinDigits.length) {
        pinDigits = (pinDigits + d).slice(0, 3);
      } else {
        pinDigits = (pinDigits.slice(0, slotIdx) + d + pinDigits.slice(slotIdx + 1)).slice(0, 3);
      }
      autoResolveCandidate();
      syncUI();
    }

    function pushDigit(d) {
      flashNumpadKey(d);
      flashSuccessMsg = "";
      if (pinDigits.length >= 3) {
        pinDigits = d;
        pickedStudent = null;
      } else {
        pinDigits += d;
      }
      autoResolveCandidate();
      syncUI();
    }

    function popDigit() {
      flashNumpadKey("back");
      flashSuccessMsg = "";
      pinDigits = pinDigits.slice(0, -1);
      pickedStudent = null;
      autoResolveCandidate();
      syncUI();
    }

    function syncUI() {
      const stats = getLiveRoomJoinedStats(roomId, modCode);
      livePill.textContent = `🟢 ออนไลน์ ${stats.joinedCount}/${stats.expectedCount} คน`;

      slotEls.forEach((el, idx) => {
        const ch = pinDigits[idx] || "";
        if (el.value !== ch) el.value = ch;
        el.classList.toggle("is-filled", Boolean(ch));
        el.classList.toggle("is-active-cursor", pinDigits.length === idx || (pinDigits.length === 3 && idx === 2));
      });

      verifyBox.replaceChildren();
      const query = pinDigits;
      if (flashSuccessMsg && !query) {
        verifyBox.className = "hsd-qcg-verify-box is-matched";
        verifyBox.innerHTML = flashSuccessMsg;
      } else if (!query || pinDigits.length < 3) {
        verifyBox.className = "hsd-qcg-verify-box is-idle";
        verifyBox.textContent =
          pinDigits.length > 0
            ? `กรอกอีก ${3 - pinDigits.length} หลัก (หรือกด Enter / ยืนยัน หากเป็นเลข ${pinDigits.padStart(3, "0")})`
            : `กรอกรหัส 3 ตัวท้ายใหม่ในช่อง • • • แล้วกดปุ่มยืนยันเพื่อเข้าสู่ Breakout Room ที่ถูกต้อง`;
      } else {
        const res = matchStudentsBy3DigitPin(query, roomId);
        if (pickedStudent) {
          const sNo = String(pickedStudent.id).slice(-3);
          const stuRoom = Number(pickedStudent.disc) || roomId;
          if (stuRoom === roomId) {
            verifyBox.className = "hsd-qcg-verify-box is-matched";
            verifyBox.innerHTML =
              `<div><strong>✅ รหัส ${escHtml(pickedStudent.id)} (เบอร์ ${escHtml(sNo)}) · ${escHtml(pickedStudent.nickname || pickedStudent.name)}</strong></div>` +
              `<div>${escHtml(pickedStudent.fullName || pickedStudent.name)} · Breakout Room ห้อง ${stuRoom} (${escHtml(meta.roomCode)})</div>`;
          } else {
            const otherMeta = getRoomMeta(modCode, stuRoom);
            verifyBox.className = "hsd-qcg-verify-box is-wrong-room";
            const msgDiv = document.createElement("div");
            msgDiv.innerHTML =
              `<strong>📍 รหัส ${escHtml(pickedStudent.id)} · ${escHtml(pickedStudent.nickname || pickedStudent.name)}</strong> ` +
              `อยู่ <strong>Breakout Room ห้อง ${stuRoom} (${escHtml(otherMeta.roomCode)})</strong> — กดปุ่มยืนยันด้านล่างเพื่อย้ายเข้าห้องที่ถูกต้องทันที`;
            verifyBox.appendChild(msgDiv);
          }

          if (res.all.length > 1) {
            const candList = document.createElement("div");
            candList.className = "hsd-qcg-cand-list";
            res.all.slice(0, 4).forEach((cand) => {
              const cb = document.createElement("button");
              cb.type = "button";
              cb.className = `hsd-qcg-cand-btn${pickedStudent && pickedStudent.id === cand.id ? " is-selected" : ""}`;
              cb.innerHTML =
                `<span>🎓 ${escHtml(cand.id)} · <strong>${escHtml(cand.nickname || cand.name)}</strong></span>` +
                `<span>Breakout Room ${cand.disc}</span>`;
              cb.addEventListener("click", () => {
                pickedStudent = cand;
                pinDigits = String(cand.id).slice(-3);
                syncUI();
              });
              candList.appendChild(cb);
            });
            verifyBox.appendChild(candList);
          }
        } else if (res.all.length > 1) {
          verifyBox.className = "hsd-qcg-verify-box is-idle";
          const lead = document.createElement("div");
          lead.innerHTML = `พบรหัสท้าย "${escHtml(query)}" ตรงกัน <strong>${res.all.length} คน</strong> — แตะเลือกชื่อของคุณก่อนกดยืนยัน:`;
          const candList = document.createElement("div");
          candList.className = "hsd-qcg-cand-list";
          const ordered = [...res.inRoom, ...res.otherRooms].slice(0, 5);
          ordered.forEach((cand) => {
            const cb = document.createElement("button");
            cb.type = "button";
            cb.className = "hsd-qcg-cand-btn";
            cb.innerHTML =
              `<span>🎓 ${escHtml(cand.id)} · <strong>${escHtml(cand.nickname || cand.name)}</strong></span>` +
              `<span>Breakout Room ห้อง ${cand.disc}</span>`;
            cb.addEventListener("click", () => {
              pickedStudent = cand;
              pinDigits = String(cand.id).slice(-3);
              syncUI();
            });
            candList.appendChild(cb);
          });
          verifyBox.append(lead, candList);
        } else {
          verifyBox.className = "hsd-qcg-verify-box is-error";
          verifyBox.textContent = `ไม่พบรหัสท้าย "${query}" ในรายชื่อนักศึกษา 169 คน`;
        }
      }

      if (pickedStudent) {
        const sNo = String(pickedStudent.id).slice(-3);
        const nick = pickedStudent.nickname ? ` ${pickedStudent.nickname}` : "";
        const assignedRoom = clampRoomId(pickedStudent.disc || roomId);
        if (!kioskMode && assignedRoom !== roomId) {
          const trueMeta = getRoomMeta(modCode, assignedRoom);
          submitBtn.className = "hsd-qcg-submit-btn is-ready";
          submitBtn.textContent = `✅ ยืนยันและย้ายไป Breakout Room ห้อง ${assignedRoom} (${trueMeta.roomCode}) · ${sNo}${nick} →`;
        } else {
          submitBtn.className = "hsd-qcg-submit-btn is-ready";
          submitBtn.textContent = `✅ ยืนยันและเข้าสู่ Breakout Room ห้อง ${roomId} (${meta.roomCode}) · ${sNo}${nick} →`;
        }
      } else {
        submitBtn.className = "hsd-qcg-submit-btn";
        submitBtn.textContent = `กรอกรหัส 3 ตัวท้ายใหม่แล้วกดยืนยันเข้า Breakout Room`;
      }
    }

    function submitCheckin() {
      if (!interactive) return;
      if (!pickedStudent && pinDigits.length >= 1 && pinDigits.length <= 3) {
        const padded = pinDigits.padStart(3, "0");
        const res = matchStudentsBy3DigitPin(padded, roomId);
        if (res.all.length === 1) {
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
        verifyBox.textContent = "กรุณากรอกรหัสนักศึกษา 3 ตัวท้ายและเลือกชื่อของคุณก่อนกดยืนยัน";
        return;
      }

      const stuDone = pickedStudent;
      const sNo = String(stuDone.id).slice(-3);
      const nick = stuDone.nickname || stuDone.name || "";

      if (kioskMode) {
        if (live && typeof live.checkinStudentToRoom === "function") {
          live.checkinStudentToRoom(stuDone, roomId, modCode, 0, { kioskMode: true });
        } else if (live && typeof live.joinSessionWithStudent === "function") {
          live.joinSessionWithStudent(stuDone, roomId, modCode, 0);
        }
        pinDigits = "";
        pickedStudent = null;
        flashSuccessMsg =
          `<div><strong>✅ Check-in สำเร็จ! เบอร์ ${escHtml(sNo)} · ${escHtml(nick)}</strong></div>` +
          `<div>อัปเดตขึ้น Live Lobby ห้อง ${escHtml(meta.roomCode)} แล้ว</div>`;
        if (flashTimer) clearTimeout(flashTimer);
        flashTimer = setTimeout(() => {
          flashSuccessMsg = "";
          if (card.isConnected) syncUI();
        }, 4500);
        syncUI();
        if (typeof cfg.onCompletedCheckin === "function") {
          cfg.onCompletedCheckin(stuDone, roomId, 0, null);
        }
        return;
      }

      saveStepPinPrefillStudent(stuDone);
      const assignedRoom = clampRoomId(stuDone.disc || roomId);
      if (assignedRoom !== roomId) {
        const recOther = markStudentCheckedIn(modCode, assignedRoom, stuDone, 0, { skipLiveBroadcast: true });
        if (root.RACM_HSD_ROOM_PAGE && modCode === "HS1") {
          window.location.href = buildStudentCheckinHrefWithSid(modCode, assignedRoom, stuDone);
          return;
        }
        if (root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.applyMyStudent === "function") {
          try {
            root.RACM_PORTAL_API.applyMyStudent(stuDone, true);
          } catch (_) {}
        }
        if (typeof cfg.onCompletedCheckin === "function") {
          cfg.onCompletedCheckin(stuDone, assignedRoom, 0, recOther);
        }
        return;
      }
      const rec = markStudentCheckedIn(modCode, roomId, stuDone, 0);
      if (root && root.RACM_PORTAL_API && typeof root.RACM_PORTAL_API.applyMyStudent === "function") {
        try {
          root.RACM_PORTAL_API.applyMyStudent(stuDone, true);
        } catch (_) {}
      }
      if (typeof cfg.onCompletedCheckin === "function") {
        cfg.onCompletedCheckin(stuDone, roomId, 0, rec);
      }
    }

    card._prefillStudent = (stu) => {
      if (!stu || !stu.id) return;
      flashSuccessMsg = "";
      pickedStudent = stu;
      pinDigits = String(stu.id).slice(-3);
      syncUI();
    };
    card._resetPinState = () => {
      flashSuccessMsg = "";
      pinDigits = "";
      pickedStudent = null;
      syncUI();
    };
    card._syncUI = syncUI;
    card._pushDigit = pushDigit;
    card._popDigit = popDigit;
    card._clearDigits = clearAllDigits;
    card._submitCheckin = submitCheckin;
    card._hasDigits = () => Boolean(pinDigits.length > 0);
    card._canSubmit = () => Boolean(pickedStudent || (pinDigits.length >= 1 && pinDigits.length <= 3));
    card._hasPickedStudent = () => Boolean(pickedStudent);

    syncUI();
    return card;
  }

  function buildRoomCheckinStatusPanelDOM(arg1, arg2, arg3) {
    const cfg =
      arg1 && typeof arg1 === "object"
        ? arg1
        : Object.assign({}, arg3 || {}, { modCode: arg1, roomId: arg2 });
    const modCode = String(cfg.modCode || "HS1").toUpperCase();
    const roomId = clampRoomId(cfg.roomId || 1);
    const meta = getRoomMeta(modCode, roomId);

    const panel = document.createElement("div");
    panel.className = "hsd-qr-status-side-card";
    panel.setAttribute("data-hsd-checkin-status-panel", "1");

    function renderPanel() {
      const stats = getLiveRoomJoinedStats(roomId, modCode);
      const pct = Math.min(100, Math.round((stats.joinedCount / Math.max(1, stats.expectedCount)) * 100));
      panel.replaceChildren();

      // 1. Dark Status Header (mirrors Slide 1 Room PIN + Check-in Status header)
      const head = document.createElement("div");
      head.className = "hsd-qsp-head";

      const headTop = document.createElement("div");
      headTop.className = "hsd-qsp-head-top";
      const kicker = document.createElement("span");
      kicker.className = "hsd-qsp-kicker";
      kicker.textContent = `📊 CHECK-IN STATUS · ห้อง ${meta.roomCode} (${meta.pinCode})`;

      const qrBtn = document.createElement("button");
      qrBtn.type = "button";
      qrBtn.className = "hsd-qsp-qr-btn";
      qrBtn.textContent = "📱 QR ห้องนี้";
      qrBtn.addEventListener("click", () => openRoomQrZoomModal(modCode, roomId));
      headTop.append(kicker, qrBtn);

      const titleRow = document.createElement("div");
      titleRow.className = "hsd-qsp-title-row";
      const hTitle = document.createElement("h4");
      hTitle.className = "hsd-qsp-title";
      hTitle.textContent = `สมาชิกห้อง ${meta.roomCode} · Check-in แล้ว ${stats.joinedCount}/${stats.expectedCount} คน`;
      const waitSpan = document.createElement("span");
      waitSpan.className = "hsd-qsp-wait-badge";
      const remain = Math.max(0, stats.expectedCount - stats.joinedCount);
      waitSpan.textContent = remain === 0 ? "🎉 ครบทุกคนแล้ว!" : `รอเช็คชื่อ ${remain} คน`;
      titleRow.append(hTitle, waitSpan);

      const progTrack = document.createElement("div");
      progTrack.className = "hsd-qsp-prog-track";
      const progFill = document.createElement("div");
      progFill.className = "hsd-qsp-prog-fill";
      progFill.style.width = `${pct}%`;
      progTrack.appendChild(progFill);

      head.append(headTop, titleRow, progTrack);
      panel.appendChild(head);

      // 2. Live 28/29-Student Check-in Status Grid
      const grid = document.createElement("div");
      grid.className = "hsd-qsp-roster-grid";
      meta.assignedStudents.forEach((stu) => {
        const sid = String(stu.id || "");
        const sNo = sid.slice(-3);
        const pres = stats.bySid.get(sid);
        const joined = Boolean(pres);
        const dispName = stu.nickname
          ? `${stu.nickname} (${String(stu.name || stu.fullName || "").split(" ")[0]})`
          : String(stu.name || stu.fullName || "").split(" ")[0];

        const item = document.createElement(joined ? "div" : "button");
        if (!joined) item.type = "button";
        item.className = `hsd-qsp-stu-chip${joined ? " is-checked-in" : " is-waiting"}`;
        item.title = joined
          ? `${sid} · ${stu.fullName || stu.name} — Check-in แล้ว`
          : `แตะเพื่อเลือกเบอร์ ${sNo} (${stu.nickname || stu.name}) ไปยังช่อง Check-in ด้านซ้าย`;
        item.innerHTML =
          `<span class="hsd-qsp-stu-code">${escHtml(sNo)}</span>` +
          `<span class="hsd-qsp-stu-name">${escHtml(dispName)}</span>` +
          `<span class="hsd-qsp-stu-badge">${joined ? "✓ มาแล้ว" : "รอเช็คชื่อ"}</span>`;
        if (!joined && typeof cfg.onPickStudent === "function") {
          item.addEventListener("click", () => cfg.onPickStudent(stu));
        }
        grid.appendChild(item);
      });
      panel.appendChild(grid);

      // 3. Hint + Optional Slide Preview Footer
      const foot = document.createElement("div");
      foot.className = "hsd-qsp-foot";
      const hint = document.createElement("span");
      hint.className = "hsd-qsp-foot-hint";
      hint.textContent = "💡 แตะชื่อตัวเองในตารางนี้ หรือพิมพ์/กดรหัส 3 ตัวท้ายในกรอบ Check-in ข้างๆ ได้ทันที";
      foot.appendChild(hint);
      if (typeof cfg.onPreviewSlides === "function") {
        const slideBtn = document.createElement("button");
        slideBtn.type = "button";
        slideBtn.className = "btn sm";
        slideBtn.textContent = `เปิดสไลด์ ${meta.modCode} →`;
        slideBtn.addEventListener("click", () => cfg.onPreviewSlides());
        foot.appendChild(slideBtn);
      }
      panel.appendChild(foot);
    }

    panel._syncStatus = renderPanel;
    renderPanel();
    return panel;
  }

  function renderStudentQrCheckinGateDOM(container, opts) {
    if (!container || typeof document === "undefined") return;
    teardownCheckinGateListeners();

    const cfg = opts || {};
    const live = root && root.RACM_LIVE_CLASSROOM;
    const modCode = String(cfg.modCode || "HS1").toUpperCase();
    const roomId = clampRoomId(cfg.roomId || (live ? live.getRoomId() : 1));

    if (live && live.getRoomId() !== roomId) {
      live.setRoom(roomId, false);
    }

    const gateNavRow = document.createElement("div");
    gateNavRow.className = "hsd-no-print";
    gateNavRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;";
    gateNavRow.innerHTML = `
      <div class="racm-unav-pair" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่">
        <button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button>
        <button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button>
      </div>
      <span style="font-size:12.5px;color:var(--muted, #64748b);font-weight:600">📍 หน้าลงชื่อเข้าห้องกลุ่มย่อย ${escHtml(modCode)} (ห้องที่ ${roomId})</span>
    `;
    container.appendChild(gateNavRow);

    const wrap = document.createElement("div");
    wrap.className = "hsd-qr-checkin-gate-wrap is-side-by-side";

    const checkinCard = buildRoomCheckinCardElement({
      modCode,
      roomId,
      variant: "full",
      kioskMode: false,
      onCompletedCheckin: (pickedStudent, rId, finalTeam, rec) => {
        teardownCheckinGateListeners();
        if (typeof cfg.onCompletedCheckin === "function") {
          cfg.onCompletedCheckin(pickedStudent, rId, finalTeam, rec);
        }
      }
    });

    const statusPanel = buildRoomCheckinStatusPanelDOM({
      modCode,
      roomId,
      onPickStudent: (stu) => {
        if (checkinCard && typeof checkinCard._prefillStudent === "function") {
          checkinCard._prefillStudent(stu);
          checkinCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      },
      onPreviewSlides: cfg.onPreviewSlides
    });

    wrap.append(checkinCard, statusPanel);

    if (live && typeof live.on === "function") {
      activeCheckinPresUnsub = live.on("presence", () => {
        if (!wrap.isConnected) return;
        if (typeof checkinCard._syncUI === "function") checkinCard._syncUI();
        if (typeof statusPanel._syncStatus === "function") statusPanel._syncStatus();
      });
    }

    container.appendChild(wrap);
  }

  const api = {
    PROD_STUDENT_BASE,
    PROD_FACULTY_BASE,
    buildQrMatrix,
    buildQrSvg,
    buildQrPngBytes,
    getRoomMeta,
    getCentralPdfMeta,
    getAllModuleRoomMetas,
    getAllHs1RoomMetas,
    saveStepPinPrefillStudent,
    clearStepPinPrefillStudent,
    clearAllStudentIdentityFromQr,
    getInitialStepPinStudent,
    buildStudentCheckinHrefWithSid,
    getStudentCheckinRecord,
    isStudentCheckedIn,
    markStudentCheckedIn,
    syncStudentAutoCheckinToLive,
    clearStudentCheckin,
    matchStudentsBy3DigitPin,
    getLiveRoomJoinedStats,
    exportRoomCheckinCsv,
    openResetCheckinConfirmModal,
    closeResetCheckinConfirmModal,
    openRoomQrZoomModal,
    closeRoomQrZoomModal,
    buildSixRoomPptsSectionDOM,
    buildCompactStepPinLockDOM,
    buildRoomCheckinCardElement,
    buildRoomCheckinStatusPanelDOM,
    renderStudentQrCheckinGateDOM,
    teardownCheckinGateListeners
  };

  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("pageshow", (ev) => {
      if (typeof document === "undefined") return;
      document
        .querySelectorAll(".hsd-six-room-ppts-section[data-hsd-pin-resettable='1'], .hsd-compact-step-lock[data-hsd-pin-resettable='1']")
        .forEach((el) => {
          if (ev && ev.persisted && typeof el._resetPinState === "function") {
            try {
              el._resetPinState();
            } catch (_) {}
          }
        });
      const act = document.activeElement;
      if (
        act &&
        act.classList &&
        (act.classList.contains("hsd-srp-pin-input") || act.classList.contains("hsd-csl-input")) &&
        typeof act.blur === "function"
      ) {
        act.blur();
      }
    });
  }

  if (root) {
    root.RACM_HSD_ROOM_QR = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
