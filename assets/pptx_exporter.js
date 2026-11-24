/* ==========================================================================
   RACM 303 — Pure-JS Native Widescreen 16:9 PowerPoint (.pptx) Exporter
   Generates spec-compliant OpenXML (.pptx) archives client-side with zero
   external dependencies (editable slides, tables, thematic highlights & notes).
   ========================================================================== */
(function () {
  "use strict";

  // 1. Fast Pure-JS CRC32 & Uncompressed ZIP Archive Builder (UTF-8 Clean)
  const CRC_TABLE = (function () {
    const tbl = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      tbl[n] = c >>> 0;
    }
    return tbl;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function buildZipBlob(files, mimeType) {
    const enc = new TextEncoder();
    const entries = files.map((f) => {
      const nameBytes = enc.encode(f.path);
      const dataBytes = f.bytes instanceof Uint8Array ? f.bytes : enc.encode(String(f.content || ""));
      return {
        nameBytes,
        dataBytes,
        crc: crc32(dataBytes),
        offset: 0
      };
    });

    let totalLocal = 0;
    let totalCentral = 0;
    entries.forEach((e) => {
      e.offset = totalLocal;
      totalLocal += 30 + e.nameBytes.length + e.dataBytes.length;
      totalCentral += 46 + e.nameBytes.length;
    });

    const out = new Uint8Array(totalLocal + totalCentral + 22);
    const dv = new DataView(out.buffer);
    let pos = 0;

    // DOS timestamp (2026-11-21 10:00:00)
    const dosTime = (10 << 11) | (0 << 5) | 0;
    const dosDate = ((2026 - 1980) << 9) | (11 << 5) | 21;

    entries.forEach((e) => {
      dv.setUint32(pos, 0x04034b50, true); // Local file header signature
      dv.setUint16(pos + 4, 20, true); // Version needed (2.0)
      dv.setUint16(pos + 6, 0x0800, true); // UTF-8 filename flag
      dv.setUint16(pos + 8, 0, true); // Compression 0 = STORE
      dv.setUint16(pos + 10, dosTime, true);
      dv.setUint16(pos + 12, dosDate, true);
      dv.setUint32(pos + 14, e.crc, true);
      dv.setUint32(pos + 18, e.dataBytes.length, true);
      dv.setUint32(pos + 22, e.dataBytes.length, true);
      dv.setUint16(pos + 26, e.nameBytes.length, true);
      dv.setUint16(pos + 28, 0, true);
      out.set(e.nameBytes, pos + 30);
      out.set(e.dataBytes, pos + 30 + e.nameBytes.length);
      pos += 30 + e.nameBytes.length + e.dataBytes.length;
    });

    const centralStart = pos;
    entries.forEach((e) => {
      dv.setUint32(pos, 0x02014b50, true); // Central directory file header
      dv.setUint16(pos + 4, 20, true); // Version made by
      dv.setUint16(pos + 6, 20, true); // Version needed
      dv.setUint16(pos + 8, 0x0800, true); // UTF-8 flag
      dv.setUint16(pos + 10, 0, true); // STORE
      dv.setUint16(pos + 12, dosTime, true);
      dv.setUint16(pos + 14, dosDate, true);
      dv.setUint32(pos + 16, e.crc, true);
      dv.setUint32(pos + 20, e.dataBytes.length, true);
      dv.setUint32(pos + 24, e.dataBytes.length, true);
      dv.setUint16(pos + 28, e.nameBytes.length, true);
      dv.setUint16(pos + 30, 0, true);
      dv.setUint16(pos + 32, 0, true);
      dv.setUint16(pos + 34, 0, true);
      dv.setUint16(pos + 36, 0, true);
      dv.setUint32(pos + 38, 0, true);
      dv.setUint32(pos + 42, e.offset, true);
      out.set(e.nameBytes, pos + 46);
      pos += 46 + e.nameBytes.length;
    });

    const centralSize = pos - centralStart;
    dv.setUint32(pos, 0x06054b50, true); // End of central directory signature
    dv.setUint16(pos + 4, 0, true);
    dv.setUint16(pos + 6, 0, true);
    dv.setUint16(pos + 8, entries.length, true);
    dv.setUint16(pos + 10, entries.length, true);
    dv.setUint32(pos + 12, centralSize, true);
    dv.setUint32(pos + 16, centralStart, true);
    dv.setUint16(pos + 20, 0, true);

    return new Blob([out], {
      type: mimeType || "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    });
  }

  // 2. XML Escaping & Rich Text Run Helpers
  function xmlEsc(str) {
    return String(str == null ? "" : str)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  const THEME_HL_BG = ["DBEAFE", "CCFBF1", "FEF3C7", "EDE9FE", "FFE4E6", "D1FAE5"];
  const THEME_HL_FG = ["1D4ED8", "0F766E", "B45309", "6D28D9", "BE123C", "047857"];

  function buildRunXml(text, opts) {
    const o = opts || {};
    const sz = Math.round((o.pt || 12) * 100);
    const bold = o.bold ? ' b="1"' : "";
    const italic = o.italic ? ' i="1"' : "";
    const color = (o.color || "1E293B").replace(/^#/, "").toUpperCase();
    const hlXml = o.highlightHex
      ? `<a:highlight><a:srgbClr val="${o.highlightHex.replace(/^#/, "").toUpperCase()}"/></a:highlight>`
      : "";
    const font = xmlEsc(o.font || "Sarabun");
    return (
      `<a:r>` +
      `<a:rPr lang="th-TH" altLang="en-US" sz="${sz}"${bold}${italic} dirty="0">` +
      `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>` +
      hlXml +
      `<a:latin typeface="${font}"/><a:ea typeface="${font}"/><a:cs typeface="${font}"/>` +
      `</a:rPr>` +
      `<a:t>${xmlEsc(text)}</a:t>` +
      `</a:r>`
    );
  }

  // Splits paragraph text by clue highlights so unhidden/thematic clues render highlighted inside PowerPoint!
  function buildHighlightedParagraphXml(lineText, clues, basePt, baseColor, align) {
    const algn = align || "l";
    const spcBef = `<a:spcBef><a:spcPts val="150"/></a:spcBef>`;
    const lnSpc = `<a:lnSpc><a:spcPct val="118000"/></a:lnSpc>`;
    const pPr = `<a:pPr algn="${algn}">${lnSpc}${spcBef}</a:pPr>`;
    const cleanLine = String(lineText || "");
    if (!cleanLine.trim()) {
      return `<a:p>${pPr}<a:endParaRPr lang="th-TH" sz="${Math.round((basePt || 11) * 100)}"/></a:p>`;
    }

    const activeClues = Array.isArray(clues)
      ? clues.filter((c) => c && c.phrase && cleanLine.includes(c.phrase))
      : [];
    if (!activeClues.length) {
      return `<a:p>${pPr}${buildRunXml(cleanLine, { pt: basePt || 11, color: baseColor || "1E293B" })}</a:p>`;
    }

    // Tokenize non-overlapping matches (longest first)
    const sorted = [...activeClues].sort((a, b) => b.phrase.length - a.phrase.length);
    let segments = [{ text: cleanLine, clue: null }];
    sorted.forEach((cl) => {
      const nextSegs = [];
      segments.forEach((seg) => {
        if (seg.clue || !seg.text.includes(cl.phrase)) {
          nextSegs.push(seg);
          return;
        }
        const idx = seg.text.indexOf(cl.phrase);
        if (idx > 0) nextSegs.push({ text: seg.text.slice(0, idx), clue: null });
        nextSegs.push({ text: cl.phrase, clue: cl });
        if (idx + cl.phrase.length < seg.text.length) {
          nextSegs.push({ text: seg.text.slice(idx + cl.phrase.length), clue: null });
        }
      });
      segments = nextSegs;
    });

    const runs = segments
      .map((seg) => {
        if (!seg.clue) {
          return buildRunXml(seg.text, { pt: basePt || 11, color: baseColor || "1E293B" });
        }
        const cIdx = ((seg.clue.colorIdx || 1) - 1) % 6;
        const bg = THEME_HL_BG[cIdx];
        const fg = THEME_HL_FG[cIdx];
        return (
          buildRunXml(`[#${seg.clue.step}] `, { pt: Math.max(8.5, (basePt || 11) - 1), bold: true, color: fg, highlightHex: bg }) +
          buildRunXml(seg.text, { pt: basePt || 11, bold: true, color: "0F172A", highlightHex: bg })
        );
      })
      .join("");

    return `<a:p>${pPr}${runs}</a:p>`;
  }

  function buildShapeXml(id, name, box, fillHex, borderHex, paragraphsXml, radiusAdj, padEmu) {
    const prst = radiusAdj ? "roundRect" : "rect";
    const avLst = radiusAdj ? `<a:avLst><a:gd name="adj" fmla="val ${radiusAdj}"/></a:avLst>` : "<a:avLst/>";
    const fillXml = fillHex
      ? `<a:solidFill><a:srgbClr val="${fillHex.replace(/^#/, "").toUpperCase()}"/></a:solidFill>`
      : "<a:noFill/>";
    const lnXml = borderHex
      ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${borderHex.replace(/^#/, "").toUpperCase()}"/></a:solidFill></a:ln>`
      : "<a:ln><a:noFill/></a:ln>";
    const p = padEmu || { l: 91440, r: 91440, t: 68580, b: 68580 };

    return (
      `<p:sp>` +
      `<p:nvSpPr>` +
      `<p:cNvPr id="${id}" name="${xmlEsc(name)}"/>` +
      `<p:cNvSpPr/>` +
      `<p:nvPr/>` +
      `</p:nvSpPr>` +
      `<p:spPr>` +
      `<a:xfrm><a:off x="${Math.round(box.x)}" y="${Math.round(box.y)}"/><a:ext cx="${Math.round(box.w)}" cy="${Math.round(box.h)}"/></a:xfrm>` +
      `<a:prstGeom prst="${prst}">${avLst}</a:prstGeom>` +
      fillXml +
      lnXml +
      `</p:spPr>` +
      `<p:txBody>` +
      `<a:bodyPr wrap="square" lIns="${p.l}" tIns="${p.t}" rIns="${p.r}" bIns="${p.b}" anchor="${box.anchor || "t"}"/>` +
      `<a:lstStyle/>` +
      (paragraphsXml || `<a:p><a:endParaRPr lang="th-TH" sz="1100"/></a:p>`) +
      `</p:txBody>` +
      `</p:sp>`
    );
  }

  function buildCustomGeomShapeXml(id, name, box, prstGeom, fillHex, borderHex, paragraphsXml, opts) {
    const o = opts || {};
    const avLst = o.radiusAdj ? `<a:avLst><a:gd name="adj" fmla="val ${o.radiusAdj}"/></a:avLst>` : "<a:avLst/>";
    const fillXml = fillHex
      ? `<a:solidFill><a:srgbClr val="${fillHex.replace(/^#/, "").toUpperCase()}"/></a:solidFill>`
      : "<a:noFill/>";
    const lineW = o.lineW || 15875;
    const dashXml = o.dashStyle ? `<a:prstDash val="${o.dashStyle}"/>` : "";
    const lnXml = borderHex
      ? `<a:ln w="${lineW}"><a:solidFill><a:srgbClr val="${borderHex.replace(/^#/, "").toUpperCase()}"/></a:solidFill>${dashXml}</a:ln>`
      : "<a:ln><a:noFill/></a:ln>";
    const p = o.padEmu || { l: 68580, r: 68580, t: 45720, b: 45720 };

    return (
      `<p:sp>` +
      `<p:nvSpPr>` +
      `<p:cNvPr id="${id}" name="${xmlEsc(name)}"/>` +
      `<p:cNvSpPr/>` +
      `<p:nvPr/>` +
      `</p:nvSpPr>` +
      `<p:spPr>` +
      `<a:xfrm><a:off x="${Math.round(box.x)}" y="${Math.round(box.y)}"/><a:ext cx="${Math.round(box.w)}" cy="${Math.round(box.h)}"/></a:xfrm>` +
      `<a:prstGeom prst="${prstGeom || "rect"}">${avLst}</a:prstGeom>` +
      fillXml +
      lnXml +
      `</p:spPr>` +
      `<p:txBody>` +
      `<a:bodyPr wrap="square" lIns="${p.l}" tIns="${p.t}" rIns="${p.r}" bIns="${p.b}" anchor="${box.anchor || "t"}"/>` +
      `<a:lstStyle/>` +
      (paragraphsXml || `<a:p><a:endParaRPr lang="th-TH" sz="900"/></a:p>`) +
      `</p:txBody>` +
      `</p:sp>`
    );
  }

  function buildStraightArrowXml(id, name, x1, y1, x2, y2, colorHex, dirMode, dashStyle) {
    const left = Math.round(Math.min(x1, x2));
    const top = Math.round(Math.min(y1, y2));
    const cx = Math.max(0, Math.round(Math.abs(x2 - x1)));
    const cy = Math.max(0, Math.round(Math.abs(y2 - y1)));
    const flipH = x2 < x1 ? ' flipH="1"' : "";
    const flipV = y2 < y1 ? ' flipV="1"' : "";
    const hex = (colorHex || "2E6EB5").replace(/^#/, "").toUpperCase();
    const dashXml = dashStyle ? `<a:prstDash val="${dashStyle}"/>` : "";
    const headXml = dirMode === "rev" || dirMode === "bi" ? `<a:headEnd type="triangle" w="med" len="med"/>` : "";
    const tailXml = dirMode === "fwd" || dirMode === "bi" ? `<a:tailEnd type="triangle" w="med" len="med"/>` : "";
    return (
      `<p:cxnSp>` +
      `<p:nvCxnSpPr>` +
      `<p:cNvPr id="${id}" name="${xmlEsc(name)}"/>` +
      `<p:cNvCxnSpPr/>` +
      `<p:nvPr/>` +
      `</p:nvCxnSpPr>` +
      `<p:spPr>` +
      `<a:xfrm${flipH}${flipV}><a:off x="${left}" y="${top}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
      `<a:prstGeom prst="line"><a:avLst/></a:prstGeom>` +
      `<a:ln w="20320"><a:solidFill><a:srgbClr val="${hex}"/></a:solidFill>${dashXml}${headXml}${tailXml}</a:ln>` +
      `</p:spPr>` +
      `</p:cxnSp>`
    );
  }

  function buildDohDiagramShapesXml(startId, box, diagSpec, isDark) {
    let nextId = startId;
    const outShapes = [];
    const outerOn = Boolean(diagSpec && diagSpec.outerRing);
    const innerOn = Boolean(diagSpec && diagSpec.innerRing);
    const nodes = (diagSpec && diagSpec.nodes) || {};
    const edges = (diagSpec && diagSpec.edges) || {};
    const isBlank = diagSpec && diagSpec.mode === "blank-sheet";

    const ox = box.x + 12000;
    const oy = box.y + 8000;
    const ow = box.w - 24000;
    const oh = box.h - 16000;

    // 1. Outer Peach/Apricot Oval (Structural Ring)
    outShapes.push(
      buildCustomGeomShapeXml(
        nextId++,
        "DohOuterOval",
        { x: ox, y: oy, w: ow, h: oh },
        "ellipse",
        outerOn ? (isDark ? "2A1912" : "FDECE0") : isDark ? "16181E" : "FCFAF7",
        outerOn ? (isDark ? "FB923C" : "C55A11") : isDark ? "475569" : "E2C6B0",
        "",
        { lineW: outerOn ? 22225 : 14000, dashStyle: outerOn ? "" : "dash" }
      )
    );

    // 2. Top Structural Determinants Card inside Outer Oval
    const sw = Math.round(ow * 0.68);
    const sx = ox + Math.round((ow - sw) / 2);
    const sy = oy + Math.round(oh * 0.032);
    const sh = Math.round(oh * 0.22);

    const buildNodeParas = (nSpec, headColor, alignCenter, bulletPt) => {
      const titleTxt = (nSpec && nSpec.title) || "";
      const headP =
        `<a:p><a:pPr algn="${alignCenter ? "ctr" : "l"}"><a:spcAft><a:spcPts val="60"/></a:spcAft></a:pPr>` +
        buildRunXml(titleTxt, { pt: bulletPt + 1.1, bold: true, color: headColor }) +
        `</a:p>`;
      const bullets = Array.isArray(nSpec && nSpec.bullets) ? nSpec.bullets : [];
      if (bullets.length) {
        if (alignCenter && bullets.length >= 4) {
          // Compact 2-per-line layout for wide top Structural box so all 5 items fit cleanly!
          const paired = [];
          for (let i = 0; i < bullets.length; i += 2) {
            paired.push(
              bullets[i + 1] ? `• ${bullets[i]}     • ${bullets[i + 1]}` : `• ${bullets[i]}`
            );
          }
          return (
            headP +
            paired
              .map(
                (ln) =>
                  `<a:p><a:pPr algn="l"><a:lnSpc><a:spcPct val="112000"/></a:lnSpc></a:pPr>` +
                  buildRunXml(ln, { pt: bulletPt, color: isDark ? "F1F5F9" : "0F172A" }) +
                  `</a:p>`
              )
              .join("")
          );
        }
        return (
          headP +
          bullets
            .map(
              (b) =>
                `<a:p><a:pPr algn="l"><a:lnSpc><a:spcPct val="112000"/></a:lnSpc></a:pPr>` +
                buildRunXml(`• ${b}`, { pt: bulletPt, color: isDark ? "F1F5F9" : "0F172A" }) +
                `</a:p>`
            )
            .join("")
        );
      }
      const rawTxt = String((nSpec && nSpec.text) || "").trim();
      if (rawTxt) {
        return (
          headP +
          rawTxt
            .split(/\n+/)
            .map(
              (ln) =>
                `<a:p><a:pPr algn="l"><a:lnSpc><a:spcPct val="112000"/></a:lnSpc></a:pPr>` +
                buildRunXml(ln, { pt: bulletPt, color: isDark ? "F1F5F9" : "0F172A" }) +
                `</a:p>`
            )
            .join("")
        );
      }
      const ph = (nSpec && nSpec.placeholder) || "(เขียนวิเคราะห์ประเด็นในหมวดนี้)";
      return (
        headP +
        `<a:p><a:pPr algn="${alignCenter ? "ctr" : "l"}"/>` +
        buildRunXml(ph, { pt: bulletPt - 0.4, italic: true, color: isDark ? "94A3B8" : "64748B" }) +
        `</a:p>`
      );
    };

    outShapes.push(
      buildCustomGeomShapeXml(
        nextId++,
        "DohNode_Structural",
        { x: sx, y: sy, w: sw, h: sh },
        "roundRect",
        isDark ? "1E222D" : "FFFDFB",
        isDark ? "FB923C" : "E2B08A",
        buildNodeParas(nodes.structural, isDark ? "FB923C" : "C55A11", true, 8.6),
        { radiusAdj: 6500, lineW: 11000, padEmu: { l: 72000, r: 72000, t: 36000, b: 36000 } }
      )
    );

    // 3. Inner Sage-Green Oval (Intermediary & Health System Ring)
    const ix = ox + Math.round(ow * 0.045);
    const iy = sy + sh + Math.round(oh * 0.018);
    const iw = Math.round(ow * 0.91);
    const ih = oy + oh - iy - Math.round(oh * 0.028);

    outShapes.push(
      buildCustomGeomShapeXml(
        nextId++,
        "DohInnerOval",
        { x: ix, y: iy, w: iw, h: ih },
        "ellipse",
        innerOn ? (isDark ? "13261E" : "E6EEDB") : isDark ? "181C26" : "FFFFFF",
        innerOn ? (isDark ? "38BDF8" : "2B547E") : isDark ? "475569" : "CBD5E1",
        "",
        { lineW: innerOn ? 22225 : 14000, dashStyle: innerOn ? "" : "dash" }
      )
    );

    // 4. Four Non-Overlapping Inner Nodes
    const indBox = {
      x: ix + Math.round(iw * 0.055),
      y: iy + Math.round(ih * 0.08),
      w: Math.round(iw * 0.31),
      h: Math.round(ih * 0.50)
    };
    const socBox = {
      x: ix + iw - Math.round(iw * 0.335) - Math.round(iw * 0.055),
      y: iy + Math.round(ih * 0.07),
      w: Math.round(iw * 0.335),
      h: Math.round(ih * 0.54)
    };
    const outBox = {
      x: ix + Math.round(iw * 0.39),
      y: iy + Math.round(ih * 0.35),
      w: Math.round(iw * 0.21),
      h: Math.round(ih * 0.22),
      anchor: "ctr"
    };
    const hsBox = {
      x: ix + Math.round((iw - Math.round(iw * 0.44)) / 2),
      y: iy + ih - Math.round(ih * 0.25) - Math.round(ih * 0.045),
      w: Math.round(iw * 0.44),
      h: Math.round(ih * 0.25)
    };

    const tealHead = isDark ? "5EEAD4" : "217083";
    outShapes.push(
      buildCustomGeomShapeXml(
        nextId++,
        "DohNode_Individual",
        indBox,
        "roundRect",
        isDark ? "1A2230" : "F9FBF7",
        isDark ? "334155" : "BFD0B8",
        buildNodeParas(nodes.individual, tealHead, false, 8.6),
        { radiusAdj: 6500, lineW: 10500, padEmu: { l: 64000, r: 64000, t: 36000, b: 36000 } }
      )
    );
    outShapes.push(
      buildCustomGeomShapeXml(
        nextId++,
        "DohNode_SocEnv",
        socBox,
        "roundRect",
        isDark ? "1A2230" : "F9FBF7",
        isDark ? "334155" : "BFD0B8",
        buildNodeParas(nodes.soc_env, tealHead, false, 8.3),
        { radiusAdj: 6500, lineW: 10500, padEmu: { l: 64000, r: 64000, t: 34000, b: 34000 } }
      )
    );
    outShapes.push(
      buildCustomGeomShapeXml(
        nextId++,
        "DohNode_HealthSys",
        hsBox,
        "roundRect",
        isDark ? "1A2230" : "F9FBF7",
        isDark ? "334155" : "BFD0B8",
        buildNodeParas(nodes.health_sys, tealHead, false, 8.5),
        { radiusAdj: 6500, lineW: 10500, padEmu: { l: 64000, r: 64000, t: 34000, b: 34000 } }
      )
    );

    const outTitle = (diagSpec && diagSpec.outcome && diagSpec.outcome.title) || "ภาวะอ้วนในเด็ก";
    const outSub = (diagSpec && diagSpec.outcome && diagSpec.outcome.sub) || "";
    const outParas =
      `<a:p><a:pPr algn="ctr"/>` +
      buildRunXml(outTitle, {
        pt: 11.4,
        bold: true,
        color: isDark ? "FDA4AF" : "9A3B2E"
      }) +
      `</a:p>` +
      (outSub
        ? `<a:p><a:pPr algn="ctr"><a:spcBef><a:spcPts val="40"/></a:spcBef></a:pPr>` +
          buildRunXml(outSub, { pt: 7.4, italic: isBlank, color: isDark ? "FED7AA" : "7C2D12" }) +
          `</a:p>`
        : "");
    outShapes.push(
      buildCustomGeomShapeXml(
        nextId++,
        "DohNode_Outcome",
        outBox,
        "roundRect",
        isDark ? "3B1812" : "FFF9F2",
        isDark ? "F59E0B" : "B45309",
        outParas,
        { radiusAdj: 8500, lineW: 18000, padEmu: { l: 45000, r: 45000, t: 30000, b: 30000 } }
      )
    );

    // 5. Six Directional Straight Arrow Connectors
    const arrowHex = isDark ? "60A5FA" : "2E6EB5";
    const ghostHex = isDark ? "475569" : "CBD5E1";
    const topBridgeY = iy + Math.round(ih * 0.155);
    const edgeCoords = {
      ind_bi_soc: [indBox.x + indBox.w + 14000, topBridgeY, socBox.x - 14000, topBridgeY],
      ind_to_out: [
        indBox.x + indBox.w + 12000,
        iy + Math.round(ih * 0.30),
        outBox.x - 14000,
        outBox.y + Math.round(outBox.h * 0.44)
      ],
      soc_to_out: [
        socBox.x - 12000,
        iy + Math.round(ih * 0.30),
        outBox.x + outBox.w + 14000,
        outBox.y + Math.round(outBox.h * 0.44)
      ],
      hsys_to_out: [
        outBox.x + Math.round(outBox.w / 2),
        hsBox.y - 12000,
        outBox.x + Math.round(outBox.w / 2),
        outBox.y + outBox.h + 14000
      ],
      ind_bi_hsys: [
        indBox.x + Math.round(indBox.w * 0.62),
        indBox.y + indBox.h + 12000,
        hsBox.x - 14000,
        hsBox.y + Math.round(hsBox.h * 0.52)
      ],
      soc_bi_hsys: [
        socBox.x + Math.round(socBox.w * 0.38),
        socBox.y + socBox.h + 12000,
        hsBox.x + hsBox.w + 14000,
        hsBox.y + Math.round(hsBox.h * 0.52)
      ]
    };

    Object.keys(edgeCoords).forEach((edgeId) => {
      const dir = edges[edgeId] || "off";
      if (dir === "off" && !isBlank) return;
      const [x1, y1, x2, y2] = edgeCoords[edgeId];
      outShapes.push(
        buildStraightArrowXml(
          nextId++,
          `DohArrow_${edgeId}`,
          x1,
          y1,
          x2,
          y2,
          dir === "off" ? ghostHex : arrowHex,
          dir === "off" ? "none" : dir,
          dir === "off" ? "dash" : ""
        )
      );
    });

    const stepTargetsY = [
      indBox.y + Math.round(indBox.h * 0.45),
      socBox.y + Math.round(socBox.h * 0.45),
      hsBox.y + Math.round(hsBox.h * 0.5),
      sy + Math.round(sh * 0.5)
    ];

    return { xml: outShapes.join(""), nextId, stepTargetsY };
  }

  function buildConnectorXml(id, name, x1, y1, x2, y2, colorHex, dashStyle) {
    const left = Math.round(Math.min(x1, x2));
    const top = Math.round(Math.min(y1, y2));
    const cx = Math.max(12700, Math.round(Math.abs(x2 - x1)));
    const cy = Math.max(12700, Math.round(Math.abs(y2 - y1)));
    const flipH = x2 < x1 ? ' flipH="1"' : "";
    const flipV = y2 < y1 ? ' flipV="1"' : "";
    const hex = (colorHex || "2563EB").replace(/^#/, "").toUpperCase();
    const dashXml = dashStyle ? `<a:prstDash val="${dashStyle}"/>` : "";
    return (
      `<p:cxnSp>` +
      `<p:nvCxnSpPr>` +
      `<p:cNvPr id="${id}" name="${xmlEsc(name)}"/>` +
      `<p:cNvCxnSpPr/>` +
      `<p:nvPr/>` +
      `</p:nvCxnSpPr>` +
      `<p:spPr>` +
      `<a:xfrm${flipH}${flipV}><a:off x="${left}" y="${top}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
      `<a:prstGeom prst="curvedConnector3"><a:avLst/></a:prstGeom>` +
      `<a:ln w="20320"><a:solidFill><a:srgbClr val="${hex}"/></a:solidFill>${dashXml}<a:tailEnd type="triangle" w="med" len="med"/></a:ln>` +
      `</p:spPr>` +
      `</p:cxnSp>`
    );
  }

  function getSlideThemePalette(isDark) {
    if (isDark) {
      return {
        canvasBg: "0B0C10",
        headerBg: "12141B",
        cardBg: "16181E",
        cardAltBg: "1B1E26",
        tblHeadBg: "1E212B",
        tblHeadBorder: "2C303D",
        border: "282B36",
        hairline: "2C303D",
        accent: "2997FF",
        ink: "F5F5F7",
        body: "D1D1D6",
        sub: "98989F",
        muted: "8E8E93",
        pageBg: "0B0C10",
        notesLine: "2C303D"
      };
    }
    return {
      canvasBg: "F5F5F7",
      headerBg: "FFFFFF",
      cardBg: "FFFFFF",
      cardAltBg: "FAFAFC",
      tblHeadBg: "F5F5F7",
      tblHeadBorder: "D2D2D7",
      border: "E5E5EA",
      hairline: "D2D2D7",
      accent: "0066CC",
      ink: "1D1D1F",
      body: "424245",
      sub: "6E6E73",
      muted: "86868B",
      pageBg: "FFFFFF",
      notesLine: "CBD5E1"
    };
  }

  function buildTableGraphicFrameXml(id, name, box, tableSpec, isDark) {
    const pal = getSlideThemePalette(Boolean(isDark));
    const headers = (tableSpec && tableSpec.headers) || [];
    const rows = (tableSpec && tableSpec.rows) || [];
    const colCount = Math.max(1, headers.length || (rows[0] ? rows[0].cells.length : 1));
    const weights = Array.isArray(tableSpec.colFractions) && tableSpec.colFractions.length === colCount
      ? tableSpec.colFractions
      : Array(colCount).fill(1 / colCount);
    const totalW = weights.reduce((a, b) => a + b, 0) || 1;
    const colWidths = weights.map((w) => Math.round((w / totalW) * box.w));

    const gridColsXml = colWidths.map((cw) => `<a:gridCol w="${cw}"/>`).join("");
    const cellBorders = (borderColor) => {
      const bc = (borderColor || pal.border).replace(/^#/, "").toUpperCase();
      return `<a:lnL w="9525"><a:solidFill><a:srgbClr val="${bc}"/></a:solidFill></a:lnL>` +
        `<a:lnR w="9525"><a:solidFill><a:srgbClr val="${bc}"/></a:solidFill></a:lnR>` +
        `<a:lnT w="9525"><a:solidFill><a:srgbClr val="${bc}"/></a:solidFill></a:lnT>` +
        `<a:lnB w="9525"><a:solidFill><a:srgbClr val="${bc}"/></a:solidFill></a:lnB>`;
    };

    const ptBody = tableSpec.fontPt || (rows.length >= 5 ? 9.2 : rows.length >= 4 ? 9.8 : 10.6);
    const headRowH = 360000;
    const bodyRowH = Math.max(
      360000,
      Math.floor((box.h - headRowH) / Math.max(1, rows.length))
    );

    let trsXml = "";
    if (headers.length) {
      const thCells = headers
        .map(
          (hTxt) =>
            `<a:tc>` +
            `<a:txBody><a:bodyPr lIns="82000" rIns="82000" tIns="52000" bIns="52000"/><a:lstStyle/>` +
            `<a:p><a:pPr algn="l"/>${buildRunXml(hTxt, { pt: ptBody, bold: true, color: pal.ink })}</a:p>` +
            `</a:txBody>` +
            `<a:tcPr marL="82000" marR="82000" marT="52000" marB="52000" anchor="ctr">` +
            cellBorders(pal.tblHeadBorder) +
            `<a:solidFill><a:srgbClr val="${pal.tblHeadBg}"/></a:solidFill>` +
            `</a:tcPr>` +
            `</a:tc>`
        )
        .join("");
      trsXml += `<a:tr h="${headRowH}">${thCells}</a:tr>`;
    }

    rows.forEach((rowObj, rIdx) => {
      const bgHex = isDark
        ? (rIdx % 2 === 1 ? pal.cardAltBg : pal.cardBg)
        : (rowObj.bgHex || (rIdx % 2 === 1 ? pal.cardAltBg : pal.cardBg));
      const borderHex = isDark ? pal.border : (rowObj.borderHex || pal.border);
      const cells = rowObj.cells || [];
      const tdsXml = [];
      for (let c = 0; c < colCount; c += 1) {
        const cell = cells[c] || { text: "" };
        const rawLines = String(cell.text || "").split(/\n+/);
        let paras = rawLines
          .map((ln, lIdx) =>
            `<a:p><a:pPr algn="l"><a:lnSpc><a:spcPct val="118000"/></a:lnSpc>${lIdx > 0 ? '<a:spcBef><a:spcPts val="100"/></a:spcBef>' : ""}</a:pPr>` +
            buildRunXml(ln || " ", {
              pt: ptBody,
              bold: Boolean(cell.bold || (c === 0 && lIdx === 0)),
              color: isDark ? pal.ink : (cell.color || pal.ink)
            }) +
            `</a:p>`
          )
          .join("");

        if (cell.evidenceQuotes && cell.evidenceQuotes.length) {
          const cIdx = ((rowObj.colorIdx || rIdx + 1) - 1) % 6;
          paras +=
            `<a:p><a:pPr algn="l"><a:spcBef><a:spcPts val="120"/></a:spcBef></a:pPr>` +
            buildRunXml(`หลักฐานจากโจทย์: `, {
              pt: Math.max(8, ptBody - 1),
              bold: true,
              color: THEME_HL_FG[cIdx],
              highlightHex: THEME_HL_BG[cIdx]
            }) +
            buildRunXml(cell.evidenceQuotes.map((q) => `“${q}”`).join(" · "), {
              pt: Math.max(8, ptBody - 1),
              italic: true,
              color: "1D1D1F",
              highlightHex: THEME_HL_BG[cIdx]
            }) +
            `</a:p>`;
        }

        if (cell.docCitation) {
          paras +=
            `<a:p><a:pPr algn="l"><a:spcBef><a:spcPts val="100"/></a:spcBef></a:pPr>` +
            buildRunXml(`อ้างอิงคำสอน: ${cell.docCitation}`, {
              pt: Math.max(7.8, ptBody - 1.2),
              bold: true,
              color: pal.accent
            }) +
            `</a:p>`;
        }

        tdsXml.push(
          `<a:tc>` +
            `<a:txBody><a:bodyPr lIns="82000" rIns="82000" tIns="52000" bIns="52000"/><a:lstStyle/>${paras}</a:txBody>` +
            `<a:tcPr marL="82000" marR="82000" marT="52000" marB="52000" anchor="t">` +
            cellBorders(borderHex) +
            `<a:solidFill><a:srgbClr val="${bgHex.replace(/^#/, "").toUpperCase()}"/></a:solidFill>` +
            `</a:tcPr>` +
            `</a:tc>`
        );
      }
      trsXml += `<a:tr h="${bodyRowH}">${tdsXml.join("")}</a:tr>`;
    });

    return (
      `<p:graphicFrame>` +
      `<p:nvGraphicFramePr>` +
      `<p:cNvPr id="${id}" name="${xmlEsc(name)}"/>` +
      `<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>` +
      `<p:nvPr/>` +
      `</p:nvGraphicFramePr>` +
      `<p:xfrm><a:off x="${Math.round(box.x)}" y="${Math.round(box.y)}"/><a:ext cx="${Math.round(box.w)}" cy="${Math.round(box.h)}"/></p:xfrm>` +
      `<a:graphic>` +
      `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">` +
      `<a:tbl>` +
      `<a:tblPr firstRow="1" bandRow="1"/>` +
      `<a:tblGrid>${gridColsXml}</a:tblGrid>` +
      trsXml +
      `</a:tbl>` +
      `</a:graphicData>` +
      `</a:graphic>` +
      `</p:graphicFrame>`
    );
  }

  // 3. Build Single 16:9 Slide XML (12192000 x 6858000 EMU = 13.333" x 7.5")
  function buildSlideXml(slideSpec, slideIdx, totalSlides, deckSpec) {
    const W = 12192000;
    const H = 6858000;
    const isDark =
      (slideSpec && slideSpec.slideTheme === "dark") ||
      Boolean(deckSpec && deckSpec.slideTheme === "dark");
    const pal = getSlideThemePalette(isDark);
    let shapeId = 2;
    const shapes = [];

    if (slideSpec.kind === "concept-summary" && slideSpec.conceptSummary) {
      const cs = slideSpec.conceptSummary;
      const csShapes = [];
      let csId = 2;
      const padX = 460000;
      const workW = W - padX * 2;
      const kickerText = cs.kicker || (cs.takeawayNumber ? `Key Takeaway #${cs.takeawayNumber}` : "Key Takeaway #1");

      // Apple Keynote canvas (Light Off-White or Dark Obsidian)
      csShapes.push(
        buildShapeXml(csId++, "SlideBg", { x: 0, y: 0, w: W, h: H }, pal.canvasBg, null, "")
      );

      // Minimalist top header + hairline divider
      const csHeadParas =
        `<a:p><a:pPr algn="l"/>` +
        buildRunXml(`${slideSpec.moduleCode || "HS"}`, { pt: 11, bold: true, color: pal.accent }) +
        buildRunXml(`   ${slideSpec.caseTitle || cs.title || ""}`, { pt: 13.5, bold: true, color: pal.ink }) +
        buildRunXml(`   ·   ${kickerText}`, { pt: 11, bold: false, color: pal.muted }) +
        `</a:p>`;
      csShapes.push(
        buildShapeXml(
          csId++,
          "KeynoteHeader",
          { x: 0, y: 0, w: W, h: 480000, anchor: "ctr" },
          pal.headerBg,
          null,
          csHeadParas,
          0,
          { l: padX, r: padX, t: 30000, b: 30000 }
        )
      );
      csShapes.push(
        buildShapeXml(csId++, "HeaderHairline", { x: 0, y: 480000, w: W, h: 12000 }, pal.border, null, "")
      );

      // 1. Editorial Hero Statement (Open Canvas · Two-Tone Typography)
      const heroY = 610000;
      const heroH = 1380000;
      const heroParas =
        `<a:p><a:pPr algn="l"><a:spcAft><a:spcPts val="140"/></a:spcAft></a:pPr>` +
        buildRunXml(kickerText, { pt: 12.5, bold: true, color: pal.accent }) +
        (cs.sourceNote
          ? buildRunXml(`     ${cs.sourceNote}`, { pt: 10.8, bold: false, color: pal.muted })
          : "") +
        `</a:p>` +
        `<a:p><a:pPr algn="l"/>` +
        buildRunXml(`${cs.coreTerm || "“สุขภาพ” (health)"} `, { pt: 20, bold: true, color: pal.ink }) +
        (cs.coreDefinitionLead || cs.coreDefinitionQualifier
          ? buildRunXml(`${cs.coreDefinitionLead || ""} `, { pt: 19, bold: true, color: pal.ink }) +
            buildRunXml(cs.coreDefinitionQualifier || "", { pt: 19, bold: false, color: pal.sub })
          : buildRunXml(cs.coreDefinition || "", { pt: 19, bold: false, color: pal.ink })) +
        `</a:p>`;
      csShapes.push(
        buildShapeXml(
          csId++,
          "KeyTakeawayHero",
          { x: padX, y: heroY, w: workW, h: heroH },
          pal.canvasBg,
          null,
          heroParas,
          0,
          { l: 0, r: 0, t: 15000, b: 15000 }
        )
      );

      // 2. Adaptive Apple Bento Dimension Cards (2..6 cards)
      const dims = Array.isArray(cs.dimensions) ? cs.dimensions.slice(0, 6) : [];
      const dimCount = dims.length || 4;
      const gridY = heroY + heroH + 130000;
      const bridgeH = cs.caseBridge ? 410000 : 0;
      const gridH = H - 340000 - 100000 - bridgeH - (bridgeH ? 110000 : 0) - gridY;
      const gapX = dimCount >= 5 || dimCount === 3 ? 170000 : 200000;
      const gapY = 165000;
      const isCompactGrid = dimCount >= 5;
      const thPt = isCompactGrid ? 16 : dimCount === 3 ? 17.5 : 18.5;
      const defPt = isCompactGrid ? 12.5 : dimCount === 3 ? 13.5 : 14;
      const padLR = isCompactGrid ? 175000 : 215000;
      const padTB = isCompactGrid ? 115000 : 145000;

      dims.forEach((d, idx) => {
        let cx = padX;
        let cy = gridY;
        let cardW = workW;
        let cardH = gridH;

        if (dimCount <= 2) {
          cardW = Math.floor((workW - gapX) / 2);
          cardH = gridH;
          cx = padX + idx * (cardW + gapX);
        } else if (dimCount === 3) {
          cardW = Math.floor((workW - gapX * 2) / 3);
          cardH = gridH;
          cx = padX + idx * (cardW + gapX);
        } else if (dimCount === 4) {
          cardW = Math.floor((workW - gapX) / 2);
          cardH = Math.floor((gridH - gapY) / 2);
          cx = padX + (idx % 2) * (cardW + gapX);
          cy = gridY + Math.floor(idx / 2) * (cardH + gapY);
        } else if (dimCount === 5) {
          cardH = Math.floor((gridH - gapY) / 2);
          if (idx < 3) {
            cardW = Math.floor((workW - gapX * 2) / 3);
            cx = padX + idx * (cardW + gapX);
            cy = gridY;
          } else {
            cardW = Math.floor((workW - gapX) / 2);
            cx = padX + (idx - 3) * (cardW + gapX);
            cy = gridY + cardH + gapY;
          }
        } else {
          cardW = Math.floor((workW - gapX * 2) / 3);
          cardH = Math.floor((gridH - gapY) / 2);
          cx = padX + (idx % 3) * (cardW + gapX);
          cy = gridY + Math.floor(idx / 3) * (cardH + gapY);
        }

        const idxLabel = d.num ? String(d.num).padStart(2, "0") : String(idx + 1).padStart(2, "0");
        const anchorText =
          dimCount <= 4
            ? (typeof d.anchor === "string" ? d.anchor : Array.isArray(d.anchor) ? d.anchor[0] || "" : "")
            : "";

        const cardParas =
          `<a:p><a:pPr algn="l"><a:spcAft><a:spcPts val="${isCompactGrid ? 95 : 130}"/></a:spcAft></a:pPr>` +
          buildRunXml(idxLabel, { pt: isCompactGrid ? 11 : 12, bold: true, color: pal.accent }) +
          (d.enTitle ? buildRunXml(`   ·   ${d.enTitle}`, { pt: isCompactGrid ? 10.5 : 11.2, bold: false, color: pal.muted }) : "") +
          `</a:p>` +
          `<a:p><a:pPr algn="l"><a:spcAft><a:spcPts val="${isCompactGrid ? 105 : 145}"/></a:spcAft></a:pPr>` +
          buildRunXml(d.thTitle || "", { pt: thPt, bold: true, color: pal.ink }) +
          `</a:p>` +
          `<a:p><a:pPr algn="l"/>` +
          buildRunXml(d.definition || "", { pt: defPt, bold: false, color: pal.body }) +
          `</a:p>` +
          (anchorText
            ? `<a:p><a:pPr algn="l"><a:spcBef><a:spcPts val="140"/></a:spcBef></a:pPr>` +
              buildRunXml(anchorText, { pt: 11.2, bold: false, color: pal.muted }) +
              `</a:p>`
            : "");
        csShapes.push(
          buildShapeXml(
            csId++,
            `BentoDimCard_${idx + 1}`,
            { x: cx, y: cy, w: cardW, h: cardH, anchor: "ctr" },
            pal.cardBg,
            pal.border,
            cardParas,
            5200,
            { l: padLR, r: padLR, t: padTB, b: padTB }
          )
        );
      });

      // 3. Minimalist Hairline Footer Case Link
      if (cs.caseBridge) {
        const bY = gridY + gridH + 110000;
        const bLabel = cs.caseBridgeLabel || `เชื่อมโยงโจทย์ ${slideSpec.moduleCode || "HS"}`;
        csShapes.push(
          buildShapeXml(csId++, "BridgeHairline", { x: padX, y: bY, w: workW, h: 12000 }, pal.hairline, null, "")
        );
        const bParas =
          `<a:p><a:pPr algn="l"/>` +
          buildRunXml(`${bLabel}   |   `, { pt: 11.2, bold: true, color: pal.ink }) +
          buildRunXml(cs.caseBridge, { pt: 11.2, bold: false, color: pal.sub }) +
          `</a:p>`;
        csShapes.push(
          buildShapeXml(
            csId++,
            "KeyTakeawayBridge",
            { x: padX, y: bY + 25000, w: workW, h: bridgeH - 25000, anchor: "ctr" },
            pal.canvasBg,
            null,
            bParas,
            0,
            { l: 0, r: 0, t: 15000, b: 15000 }
          )
        );
      }

      // Slide Master Footer Bar
      const footParasCs =
        `<a:p><a:pPr algn="l"/>` +
        buildRunXml(
          `RACM 303 เวชศาสตร์ชุมชนและวิทยาศาสตร์ระบบสุขภาพ · คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี     |     ${kickerText}  ·  Slide ${slideIdx + 1} / ${totalSlides}`,
          { pt: 8.8, color: pal.muted }
        ) +
        `</a:p>`;
      csShapes.push(
        buildShapeXml(
          csId++,
          "MasterFooter",
          { x: 0, y: H - 340000, w: W, h: 340000, anchor: "ctr" },
          pal.canvasBg,
          pal.border,
          footParasCs,
          0,
          { l: padX, r: padX, t: 25000, b: 25000 }
        )
      );

      return (
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
        `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">` +
        `<p:cSld><p:spTree>` +
        `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
        `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>` +
        csShapes.join("") +
        `</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`
      );
    }

    // Apple Keynote canvas (Light or Dark) for Question / Worksheet / Answer Key / Concept-Synthesis slides
    const padX = 280000;
    const workY = 615000;
    const workH = 5790000;
    const workW = W - padX * 2;
    const cleanStageBadge = String(slideSpec.stageBadge || "")
      .replace(/^[🎯🔑💡🔗📝📊✨\s]+/u, "")
      .trim();

    shapes.push(
      buildShapeXml(shapeId++, "SlideBg", { x: 0, y: 0, w: W, h: H }, pal.canvasBg, null, "")
    );

    // Minimalist top header + hairline divider
    const headParas =
      `<a:p><a:pPr algn="l"/>` +
      buildRunXml(`${slideSpec.moduleCode || "HS"}`, { pt: 11, bold: true, color: pal.accent }) +
      buildRunXml(`   ${slideSpec.caseTitle || ""}`, { pt: 13.5, bold: true, color: pal.ink }) +
      (cleanStageBadge
        ? buildRunXml(`   ·   ${cleanStageBadge}`, { pt: 11, bold: false, color: pal.muted })
        : "") +
      `</a:p>`;
    shapes.push(
      buildShapeXml(
        shapeId++,
        "KeynoteHeader",
        { x: 0, y: 0, w: W, h: 480000, anchor: "ctr" },
        pal.headerBg,
        null,
        headParas,
        0,
        { l: padX, r: padX, t: 30000, b: 30000 }
      )
    );
    shapes.push(
      buildShapeXml(shapeId++, "HeaderHairline", { x: 0, y: 480000, w: W, h: 12000 }, pal.border, null, "")
    );

    const isHoriz = slideSpec.splitOrient === "horizontal";

    let scenBox;
    let rightBox;
    if (isHoriz) {
      const topH = Math.round(workH * 0.41);
      const gapY = 140000;
      scenBox = { x: padX, y: workY, w: workW, h: topH };
      rightBox = { x: padX, y: workY + topH + gapY, w: workW, h: workH - topH - gapY };
    } else {
      const leftW = Math.round(workW * 0.42);
      const gapX = 185000;
      scenBox = { x: padX, y: workY, w: leftW, h: workH };
      rightBox = { x: padX + leftW + gapX, y: workY, w: workW - leftW - gapX, h: workH };
    }

    // Left / Top Bento Scenario Card
    const scenLines = Array.isArray(slideSpec.scenarioParagraphs) ? slideSpec.scenarioParagraphs : [];
    const scenPt = scenLines.join(" ").length > 950 ? 9.6 : scenLines.join(" ").length > 650 ? 10.4 : 11.2;
    const scenHeadPara =
      `<a:p><a:pPr algn="l"><a:spcAft><a:spcPts val="180"/></a:spcAft></a:pPr>` +
      buildRunXml(`สถานการณ์กรณีศึกษา (${slideSpec.caseShort || ""})`, {
        pt: 11.5,
        bold: true,
        color: pal.accent
      }) +
      (slideSpec.clues && slideSpec.clues.length
        ? buildRunXml(`   ·   หลักฐานในโจทย์ ${slideSpec.clues.length} จุด`, {
            pt: 9.8,
            bold: false,
            color: pal.muted
          })
        : "") +
      `</a:p>`;
    const scenBodyParas = scenLines
      .map((ln) => buildHighlightedParagraphXml(ln, slideSpec.clues, scenPt, pal.ink, "l"))
      .join("");
    shapes.push(
      buildShapeXml(
        shapeId++,
        "ScenarioCard",
        scenBox,
        pal.cardBg,
        pal.border,
        scenHeadPara + scenBodyParas,
        4500,
        { l: 150000, r: 150000, t: 120000, b: 110000 }
      )
    );

    // Right / Bottom Bento Question Header + Editable Answer / Key Table
    const qHeadH = 920000;
    const qClues = Array.isArray(slideSpec.questionClues) ? slideSpec.questionClues : [];
    const qTitleLine = `${slideSpec.questionHeading || ""} — ${slideSpec.questionTitle || ""}`;
    const qHeadParas =
      buildHighlightedParagraphXml(qTitleLine, qClues, 11.6, pal.ink, "l") +
      buildHighlightedParagraphXml(slideSpec.questionPrompt || "", qClues, 9.8, pal.body, "l");
    const qBox = { x: rightBox.x, y: rightBox.y, w: rightBox.w, h: qHeadH };
    shapes.push(
      buildShapeXml(
        shapeId++,
        "QuestionBanner",
        qBox,
        pal.cardBg,
        pal.border,
        qHeadParas,
        4500,
        { l: 135000, r: 135000, t: 75000, b: 75000 }
      )
    );

    if (slideSpec.diagram) {
      const tblBox = {
        x: rightBox.x,
        y: rightBox.y + qHeadH + 100000,
        w: rightBox.w,
        h: rightBox.h - qHeadH - 100000
      };
      const diagRes = buildDohDiagramShapesXml(shapeId, tblBox, slideSpec.diagram, isDark);
      shapeId = diagRes.nextId;
      shapes.push(diagRes.xml);

      if (slideSpec.drawConnectors && diagRes.stepTargetsY && diagRes.stepTargetsY.length) {
        const rowCnt = diagRes.stepTargetsY.length;
        for (let r = 0; r < rowCnt; r += 1) {
          const hex = THEME_HL_FG[r % 6];
          if (!isHoriz) {
            const x1 = scenBox.x + scenBox.w - 6000;
            const y1 = scenBox.y + 420000 + Math.round(((r + 0.5) / rowCnt) * (scenBox.h - 560000));
            const x2 = tblBox.x + 12000;
            const y2 = diagRes.stepTargetsY[r];
            shapes.push(buildConnectorXml(shapeId++, `ScenToDiag_${r + 1}`, x1, y1, x2, y2, hex));
          } else {
            const x1 = scenBox.x + Math.round(((r + 0.5) / rowCnt) * scenBox.w);
            const y1 = scenBox.y + scenBox.h - 6000;
            const x2 = tblBox.x + Math.round(((r + 0.5) / rowCnt) * tblBox.w);
            const y2 = tblBox.y + 12000;
            shapes.push(buildConnectorXml(shapeId++, `ScenToDiag_${r + 1}`, x1, y1, x2, y2, hex));
          }
        }
      }
    } else if (slideSpec.table) {
      const tblBox = {
        x: rightBox.x,
        y: rightBox.y + qHeadH + 100000,
        w: rightBox.w,
        h: rightBox.h - qHeadH - 100000
      };
      shapes.push(buildTableGraphicFrameXml(shapeId++, "AnswerKeyTable", tblBox, slideSpec.table, isDark));

      // Draw 1 clean gutter S-curve per row across the blank channel on Concept-Synthesis slides
      if (slideSpec.drawConnectors && slideSpec.table.rows && slideSpec.table.rows.length) {
        const rowCnt = slideSpec.table.rows.length;
        const headRowH = 360000;
        const eachRowH = Math.floor((tblBox.h - headRowH) / Math.max(1, rowCnt));
        for (let r = 0; r < rowCnt; r += 1) {
          const hex = THEME_HL_FG[r % 6];
          if (!isHoriz) {
            const x1 = scenBox.x + scenBox.w - 6000;
            const y1 = scenBox.y + 420000 + Math.round(((r + 0.5) / rowCnt) * (scenBox.h - 560000));
            const x2 = tblBox.x + 6000;
            const y2 = tblBox.y + headRowH + Math.round((r + 0.5) * eachRowH);
            shapes.push(buildConnectorXml(shapeId++, `ScenToAns_${r + 1}`, x1, y1, x2, y2, hex));
          } else {
            const x1 = scenBox.x + Math.round(((r + 0.5) / rowCnt) * scenBox.w);
            const y1 = scenBox.y + scenBox.h - 6000;
            const x2 = tblBox.x + Math.round(((r + 0.5) / rowCnt) * Math.min(tblBox.w, 3600000));
            const y2 = tblBox.y + headRowH;
            shapes.push(buildConnectorXml(shapeId++, `ScenToAns_${r + 1}`, x1, y1, x2, y2, hex));
          }
        }
      }
    }

    // Slide Master Footer Bar
    const footParas =
      `<a:p><a:pPr algn="l"/>` +
      buildRunXml(
        `RACM 303 เวชศาสตร์ชุมชนและวิทยาศาสตร์ระบบสุขภาพ · คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี     |     Slide ${slideIdx + 1} / ${totalSlides}`,
        { pt: 8.8, color: pal.muted }
      ) +
      `</a:p>`;
    shapes.push(
      buildShapeXml(
        shapeId++,
        "MasterFooter",
        { x: 0, y: H - 340000, w: W, h: 340000, anchor: "ctr" },
        pal.canvasBg,
        pal.border,
        footParas,
        0,
        { l: padX, r: padX, t: 25000, b: 25000 }
      )
    );

    return (
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
      `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
      `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">` +
      `<p:cSld><p:spTree>` +
      `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
      `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>` +
      shapes.join("") +
      `</p:spTree></p:cSld>` +
      `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>` +
      `</p:sld>`
    );
  }

  // 3b. Build Multi-Slide 16:9 Handout Page XML inside PowerPoint (Supports Vertical/Horizontal + 1x1..4x4 & 3+Notes + Light/Dark Theme!)
  function buildHandoutGridSlideXml(chunkSlides, pageIdx, totalPages, deckSpec) {
    const isPortrait = deckSpec.pageOrient === "portrait";
    const isDark = Boolean(deckSpec && deckSpec.slideTheme === "dark");
    const pal = getSlideThemePalette(isDark);
    const W = isPortrait ? 7560000 : 10692000;
    const H = isPortrait ? 10692000 : 7560000;
    let shapeId = 2;
    const shapes = [];

    shapes.push(buildShapeXml(shapeId++, "PageBg", { x: 0, y: 0, w: W, h: H }, "FFFFFF", null, ""));

    const pageHeadParas =
      `<a:p><a:pPr algn="l"/>` +
      buildRunXml(deckSpec.title || "RACM 303 Slide Handout", { pt: 10.5, bold: true, color: "1D1D1F" }) +
      buildRunXml(`   |   Handout ${deckSpec.gridLabel || ""}   |   หน้า ${pageIdx + 1} / ${totalPages}`, {
        pt: 9,
        color: "86868B"
      }) +
      `</a:p>`;
    shapes.push(
      buildShapeXml(
        shapeId++,
        "HandoutHeader",
        { x: 240000, y: 160000, w: W - 480000, h: 320000 },
        "F5F5F7",
        "E5E5EA",
        pageHeadParas,
        0,
        { l: 90000, r: 90000, t: 30000, b: 30000 }
      )
    );

    const gridX = 240000;
    const gridY = 550000;
    const gridW = W - 480000;
    const gridH = H - 760000;
    const cols = Math.max(1, Number(deckSpec.cols) || 2);
    const rows = Math.max(1, Number(deckSpec.rows) || 2);
    const withNotes = Boolean(deckSpec.notesLines);
    const gapX = cols >= 4 ? 90000 : 140000;
    const gapY = rows >= 4 ? 90000 : 140000;

    const effCols = withNotes ? 2 : cols;
    const cellSlotW = Math.floor((gridW - gapX * (effCols - 1)) / effCols);
    const cellSlotH = Math.floor((gridH - gapY * (rows - 1)) / rows);

    // Fit true 16:9 card inside each slot
    let cardW = Math.min(cellSlotW, Math.floor(cellSlotH * (16 / 9)));
    let cardH = Math.floor(cardW * (9 / 16));
    if (cardH > cellSlotH) {
      cardH = cellSlotH;
      cardW = Math.floor(cardH * (16 / 9));
    }

    const scalePt = Math.max(4.5, Math.min(10, (cardW / 4800000) * 9.5));

    chunkSlides.forEach((sSpec, idx) => {
      const r = withNotes ? idx : Math.floor(idx / cols);
      const c = withNotes ? 0 : idx % cols;
      const slotX = gridX + c * (cellSlotW + gapX);
      const slotY = gridY + r * (cellSlotH + gapY);
      const cx = slotX + Math.floor((cellSlotW - cardW) / 2);
      const cy = slotY + Math.floor((cellSlotH - cardH) / 2);

      // 16:9 Apple Keynote Slide Frame (Light or Dark)
      shapes.push(
        buildShapeXml(shapeId++, `SlideFrame_${idx + 1}`, { x: cx, y: cy, w: cardW, h: cardH }, pal.canvasBg, pal.hairline, "")
      );

      // Minimalist Keynote Mini-Header
      const banH = Math.max(150000, Math.round(cardH * 0.12));
      const banP =
        `<a:p><a:pPr algn="l"/>` +
        buildRunXml(`${sSpec.moduleCode || "HS"}`, {
          pt: Math.max(5, scalePt),
          bold: true,
          color: pal.accent
        }) +
        buildRunXml(`  ${sSpec.questionHeading || ""}${sSpec.stageShort ? ` · ${sSpec.stageShort}` : ""}`, {
          pt: Math.max(5, scalePt),
          bold: true,
          color: pal.ink
        }) +
        `</a:p>`;
      shapes.push(
        buildShapeXml(
          shapeId++,
          `MiniHead_${idx + 1}`,
          { x: cx, y: cy, w: cardW, h: banH, anchor: "ctr" },
          pal.headerBg,
          pal.border,
          banP,
          0,
          { l: 55000, r: 55000, t: 12000, b: 12000 }
        )
      );

      // Mini Split Content (or Concept Summary card in Handout Grid)
      const bodyY = cy + banH + 20000;
      const bodyH = cardH - banH - 40000;
      if (sSpec.kind === "concept-summary" && sSpec.conceptSummary) {
        const cs = sSpec.conceptSummary;
        const lines = [
          `${cs.coreTerm || "“สุขภาพ” (health)"} ${cs.coreDefinition || ""}`
        ];
        (cs.dimensions || []).slice(0, 6).forEach((d) => {
          lines.push(`• ${d.thTitle}${d.enTitle ? ` (${d.enTitle})` : ""}: ${d.definition || ""}`);
        });
        const csP = lines
          .map((ln, lIdx) =>
            `<a:p><a:pPr algn="l"/>` +
            buildRunXml(ln.slice(0, cols >= 4 ? 75 : 165), {
              pt: Math.max(4.5, scalePt - (lIdx === 0 ? 0.4 : 1.1)),
              bold: lIdx === 0,
              color: lIdx === 0 ? pal.ink : pal.body
            }) +
            `</a:p>`
          )
          .join("");
        shapes.push(
          buildShapeXml(
            shapeId++,
            `MiniConceptSummary_${idx + 1}`,
            { x: cx + 25000, y: bodyY, w: cardW - 50000, h: bodyH },
            pal.cardBg,
            pal.border,
            csP,
            0,
            { l: 45000, r: 45000, t: 35000, b: 35000 }
          )
        );
      } else {
        const leftW = Math.floor(cardW * 0.44);
        const scenSnippet = (sSpec.scenarioParagraphs || []).join(" ").slice(0, cols >= 4 ? 160 : 320);
        const leftP = buildHighlightedParagraphXml(
          scenSnippet + ((sSpec.scenarioParagraphs || []).join(" ").length > scenSnippet.length ? "…" : ""),
          sSpec.clues,
          Math.max(4.5, scalePt - 1),
          pal.body,
          "l"
        );
        shapes.push(
          buildShapeXml(
            shapeId++,
            `MiniScen_${idx + 1}`,
            { x: cx + 25000, y: bodyY, w: leftW - 35000, h: bodyH },
            pal.cardBg,
            pal.border,
            leftP,
            0,
            { l: 45000, r: 45000, t: 35000, b: 35000 }
          )
        );

        if (sSpec.diagram && cols <= 2) {
          const miniDiagBox = {
            x: cx + leftW + 10000,
            y: bodyY,
            w: cardW - leftW - 35000,
            h: bodyH
          };
          const miniRes = buildDohDiagramShapesXml(shapeId, miniDiagBox, sSpec.diagram, isDark);
          shapeId = miniRes.nextId;
          shapes.push(miniRes.xml);
        } else {
          const rightSummaryLines = [`${sSpec.questionTitle || ""}`];
          if (sSpec.table && Array.isArray(sSpec.table.rows)) {
            sSpec.table.rows.slice(0, cols >= 4 ? 3 : 5).forEach((trObj) => {
              const c0 = (trObj.cells && trObj.cells[0] && trObj.cells[0].text) || "";
              const c1 = (trObj.cells && trObj.cells[1] && trObj.cells[1].text) || "";
              rightSummaryLines.push(`• ${c0.replace(/\n+/g, " ")}: ${c1.replace(/\n+/g, " ").slice(0, cols >= 4 ? 42 : 85)}`);
            });
          }
          const rightP = rightSummaryLines
            .map((ln, lIdx) =>
              `<a:p><a:pPr algn="l"/>` +
              buildRunXml(ln, {
                pt: Math.max(4.5, scalePt - (lIdx === 0 ? 0.4 : 1.1)),
                bold: lIdx === 0,
                color: lIdx === 0 ? pal.ink : pal.body
              }) +
              `</a:p>`
            )
            .join("");
          shapes.push(
            buildShapeXml(
              shapeId++,
              `MiniRight_${idx + 1}`,
              { x: cx + leftW + 10000, y: bodyY, w: cardW - leftW - 35000, h: bodyH },
              pal.cardBg,
              pal.border,
              rightP,
              0,
              { l: 45000, r: 45000, t: 35000, b: 35000 }
            )
          );
        }
      }

      // Optional Ruled Notes Lines on the Right for "3 + Notes" Classic PowerPoint Handout!
      if (withNotes) {
        const noteX = gridX + cellSlotW + gapX;
        const noteP = [1, 2, 3, 4, 5]
          .map(
            (n) =>
              `<a:p><a:pPr algn="l"><a:spcBef><a:spcPts val="320"/></a:spcBef></a:pPr>` +
              buildRunXml(
                n === 1 ? "บันทึกการอภิปราย / Key Takeaways:" : "____________________________________________________",
                { pt: 8.5, bold: n === 1, color: n === 1 ? "475569" : "CBD5E1" }
              ) +
              `</a:p>`
          )
          .join("");
        shapes.push(
          buildShapeXml(
            shapeId++,
            `NotesLines_${idx + 1}`,
            { x: noteX, y: cy, w: cellSlotW, h: cardH },
            "FFFFFF",
            "E2E8F0",
            noteP,
            0,
            { l: 80000, r: 80000, t: 50000, b: 50000 }
          )
        );
      }
    });

    return (
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
      `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
      `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">` +
      `<p:cSld><p:spTree>` +
      `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
      `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>` +
      shapes.join("") +
      `</p:spTree></p:cSld>` +
      `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>` +
      `</p:sld>`
    );
  }

  // 4. Assemble Full OpenXML Package
  function buildPptxBlob(deckSpec) {
    const rawSlides = (deckSpec && deckSpec.slides) || [];
    if (!rawSlides.length) {
      throw new Error("No slides provided for .pptx export");
    }

    const isHandoutPages = Boolean(deckSpec && deckSpec.asHandoutPages);
    let slideXmlList = [];
    let sldCx = 12192000;
    let sldCy = 6858000;

    if (isHandoutPages) {
      const isPortrait = deckSpec.pageOrient === "portrait";
      sldCx = isPortrait ? 7560000 : 10692000;
      sldCy = isPortrait ? 10692000 : 7560000;
      const perPage = deckSpec.notesLines
        ? 3
        : Math.max(1, (Number(deckSpec.cols) || 2) * (Number(deckSpec.rows) || 2));
      const chunks = [];
      for (let i = 0; i < rawSlides.length; i += perPage) {
        chunks.push(rawSlides.slice(i, i + perPage));
      }
      slideXmlList = chunks.map((ch, pIdx) => buildHandoutGridSlideXml(ch, pIdx, chunks.length, deckSpec));
    } else {
      slideXmlList = rawSlides.map((sSpec, idx) => buildSlideXml(sSpec, idx, rawSlides.length, deckSpec));
    }

    const files = [];

    // [Content_Types].xml
    const slideOverrides = slideXmlList
      .map(
        (_, i) =>
          `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
      )
      .join("");

    files.push({
      path: "[Content_Types].xml",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>` +
        `<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>` +
        `<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>` +
        `<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>` +
        `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
        `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>` +
        slideOverrides +
        `</Types>`
    });

    // _rels/.rels
    files.push({
      path: "_rels/.rels",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
        `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>` +
        `</Relationships>`
    });

    // docProps/core.xml & app.xml
    const docTitle = xmlEsc((deckSpec && deckSpec.title) || "RACM 303 Health Systems Discussion");
    files.push({
      path: "docProps/core.xml",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ` +
        `xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ` +
        `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
        `<dc:title>${docTitle}</dc:title>` +
        `<dc:creator>RACM 303 Community Medicine I — Faculty of Medicine Ramathibodi Hospital</dc:creator>` +
        `<dcterms:created xsi:type="dcterms:W3CDTF">2026-11-21T10:00:00Z</dcterms:created>` +
        `</cp:coreProperties>`
    });

    files.push({
      path: "docProps/app.xml",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">` +
        `<Application>RACM 303 PowerPoint Studio</Application>` +
        `<PresentationFormat>${isHandoutPages ? "A4 Handout" : "Widescreen"}</PresentationFormat>` +
        `<Slides>${slideXmlList.length}</Slides>` +
        `</Properties>`
    });

    // ppt/presentation.xml & ppt/_rels/presentation.xml.rels
    const sldIdsXml = slideXmlList
      .map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`)
      .join("");
    const sldRelsXml = slideXmlList
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
      )
      .join("");

    files.push({
      path: "ppt/presentation.xml",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
        `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">` +
        `<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` +
        `<p:sldIdLst>${sldIdsXml}</p:sldIdLst>` +
        `<p:sldSz cx="${sldCx}" cy="${sldCy}"/>` +
        `<p:notesSz cx="6858000" cy="9144000"/>` +
        `</p:presentation>`
    });

    files.push({
      path: "ppt/_rels/presentation.xml.rels",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>` +
        sldRelsXml +
        `</Relationships>`
    });

    // Minimal clean SlideMaster, SlideLayout & Theme
    files.push({
      path: "ppt/slideMasters/slideMaster1.xml",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
        `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">` +
        `<p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>` +
        `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
        `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>` +
        `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>` +
        `<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>` +
        `</p:sldMaster>`
    });

    files.push({
      path: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>` +
        `</Relationships>`
    });

    files.push({
      path: "ppt/slideLayouts/slideLayout1.xml",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
        `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">` +
        `<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
        `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>` +
        `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>` +
        `</p:sldLayout>`
    });

    files.push({
      path: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>` +
        `</Relationships>`
    });

    files.push({
      path: "ppt/theme/theme1.xml",
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="RamathibodiRACM303">` +
        `<a:themeElements>` +
        `<a:clrScheme name="Rama">` +
        `<a:dk1><a:srgbClr val="0F172A"/></a:dk1>` +
        `<a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>` +
        `<a:dk2><a:srgbClr val="002D72"/></a:dk2>` +
        `<a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>` +
        `<a:accent1><a:srgbClr val="0B46A6"/></a:accent1>` +
        `<a:accent2><a:srgbClr val="0D9488"/></a:accent2>` +
        `<a:accent3><a:srgbClr val="D97706"/></a:accent3>` +
        `<a:accent4><a:srgbClr val="7C3AED"/></a:accent4>` +
        `<a:accent5><a:srgbClr val="E11D48"/></a:accent5>` +
        `<a:accent6><a:srgbClr val="059669"/></a:accent6>` +
        `<a:hlink><a:srgbClr val="2563EB"/></a:hlink>` +
        `<a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>` +
        `</a:clrScheme>` +
        `<a:fontScheme name="SarabunScheme">` +
        `<a:majorFont><a:latin typeface="Sarabun"/><a:ea typeface="Sarabun"/><a:cs typeface="Sarabun"/></a:majorFont>` +
        `<a:minorFont><a:latin typeface="Sarabun"/><a:ea typeface="Sarabun"/><a:cs typeface="Sarabun"/></a:minorFont>` +
        `</a:fontScheme>` +
        `<a:fmtScheme name="RamaFmt">` +
        `<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>` +
        `<a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>` +
        `<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>` +
        `<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>` +
        `</a:fmtScheme>` +
        `</a:themeElements>` +
        `</a:theme>`
    });

    // Individual Slides + Slide Rels
    slideXmlList.forEach((sXml, idx) => {
      files.push({
        path: `ppt/slides/slide${idx + 1}.xml`,
        content: sXml
      });
      files.push({
        path: `ppt/slides/_rels/slide${idx + 1}.xml.rels`,
        content:
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>` +
          `</Relationships>`
      });
    });

    return buildZipBlob(files);
  }

  window.RACM_PPTX_EXPORTER = {
    buildPptxBlob
  };
})();
