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

  function buildTableGraphicFrameXml(id, name, box, tableSpec) {
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
      const bc = (borderColor || "CBD5E1").replace(/^#/, "").toUpperCase();
      const ln = `<a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="${bc}"/></a:solidFill></a:ln>`;
      return `<a:lnL w="9525"><a:solidFill><a:srgbClr val="${bc}"/></a:solidFill></a:lnL>` +
        `<a:lnR w="9525"><a:solidFill><a:srgbClr val="${bc}"/></a:solidFill></a:lnR>` +
        `<a:lnT w="9525"><a:solidFill><a:srgbClr val="${bc}"/></a:solidFill></a:lnT>` +
        `<a:lnB w="9525"><a:solidFill><a:srgbClr val="${bc}"/></a:solidFill></a:lnB>`;
    };

    const ptBody = tableSpec.fontPt || (rows.length >= 5 ? 8.8 : rows.length >= 4 ? 9.4 : 10.2);
    const headRowH = 340000;
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
            `<a:txBody><a:bodyPr lIns="68580" rIns="68580" tIns="45720" bIns="45720"/><a:lstStyle/>` +
            `<a:p><a:pPr algn="l"/>${buildRunXml(hTxt, { pt: ptBody, bold: true, color: "FFFFFF" })}</a:p>` +
            `</a:txBody>` +
            `<a:tcPr marL="68580" marR="68580" marT="45720" marB="45720" anchor="ctr">` +
            cellBorders("1E3A8A") +
            `<a:solidFill><a:srgbClr val="002D72"/></a:solidFill>` +
            `</a:tcPr>` +
            `</a:tc>`
        )
        .join("");
      trsXml += `<a:tr h="${headRowH}">${thCells}</a:tr>`;
    }

    rows.forEach((rowObj, rIdx) => {
      const bgHex = rowObj.bgHex || (rIdx % 2 === 1 ? "F8FAFC" : "FFFFFF");
      const borderHex = rowObj.borderHex || "CBD5E1";
      const cells = rowObj.cells || [];
      const tdsXml = [];
      for (let c = 0; c < colCount; c += 1) {
        const cell = cells[c] || { text: "" };
        const rawLines = String(cell.text || "").split(/\n+/);
        let paras = rawLines
          .map((ln, lIdx) =>
            `<a:p><a:pPr algn="l"><a:lnSpc><a:spcPct val="114000"/></a:lnSpc>${lIdx > 0 ? '<a:spcBef><a:spcPts val="100"/></a:spcBef>' : ""}</a:pPr>` +
            buildRunXml(ln || " ", {
              pt: ptBody,
              bold: Boolean(cell.bold || (c === 0 && lIdx === 0)),
              color: cell.color || "0F172A"
            }) +
            `</a:p>`
          )
          .join("");

        if (cell.evidenceQuotes && cell.evidenceQuotes.length) {
          const cIdx = ((rowObj.colorIdx || rIdx + 1) - 1) % 6;
          paras +=
            `<a:p><a:pPr algn="l"><a:spcBef><a:spcPts val="140"/></a:spcBef></a:pPr>` +
            buildRunXml(`💬 Supporting Evidence: `, {
              pt: Math.max(8, ptBody - 1),
              bold: true,
              color: THEME_HL_FG[cIdx],
              highlightHex: THEME_HL_BG[cIdx]
            }) +
            buildRunXml(cell.evidenceQuotes.map((q) => `“${q}”`).join(" · "), {
              pt: Math.max(8, ptBody - 1),
              italic: true,
              color: "1E293B",
              highlightHex: THEME_HL_BG[cIdx]
            }) +
            `</a:p>`;
        }

        if (cell.docCitation) {
          paras +=
            `<a:p><a:pPr algn="l"><a:spcBef><a:spcPts val="110"/></a:spcBef></a:pPr>` +
            buildRunXml(`📚 อ้างอิงคำสอน: ${cell.docCitation}`, {
              pt: Math.max(7.8, ptBody - 1.2),
              bold: true,
              color: "0F766E"
            }) +
            `</a:p>`;
        }

        tdsXml.push(
          `<a:tc>` +
            `<a:txBody><a:bodyPr lIns="68580" rIns="68580" tIns="45720" bIns="45720"/><a:lstStyle/>${paras}</a:txBody>` +
            `<a:tcPr marL="68580" marR="68580" marT="45720" marB="45720" anchor="t">` +
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
  function buildSlideXml(slideSpec, slideIdx, totalSlides) {
    const W = 12192000;
    const H = 6858000;
    let shapeId = 2;
    const shapes = [];

    if (slideSpec.kind === "concept-summary" && slideSpec.conceptSummary) {
      const cs = slideSpec.conceptSummary;
      const csShapes = [];
      let csId = 2;
      const padX = 460000;
      const workW = W - padX * 2;
      const kickerText = cs.kicker || (cs.takeawayNumber ? `Key Takeaway #${cs.takeawayNumber}` : "Key Takeaway #1");

      // Apple Keynote off-white canvas
      csShapes.push(
        buildShapeXml(csId++, "SlideBg", { x: 0, y: 0, w: W, h: H }, "F5F5F7", null, "")
      );

      // Minimalist white top header + hairline divider
      const csHeadParas =
        `<a:p><a:pPr algn="l"/>` +
        buildRunXml(`${slideSpec.moduleCode || "HS"}`, { pt: 11, bold: true, color: "0066CC" }) +
        buildRunXml(`   ${slideSpec.caseTitle || cs.title || ""}`, { pt: 13.5, bold: true, color: "1D1D1F" }) +
        buildRunXml(`   ·   ${kickerText}`, { pt: 11, bold: false, color: "86868B" }) +
        `</a:p>`;
      csShapes.push(
        buildShapeXml(
          csId++,
          "KeynoteHeader",
          { x: 0, y: 0, w: W, h: 480000, anchor: "ctr" },
          "FFFFFF",
          null,
          csHeadParas,
          0,
          { l: padX, r: padX, t: 30000, b: 30000 }
        )
      );
      csShapes.push(
        buildShapeXml(csId++, "HeaderHairline", { x: 0, y: 480000, w: W, h: 12000 }, "E5E5EA", null, "")
      );

      // 1. Editorial Hero Statement (Open Canvas · Two-Tone Typography)
      const heroY = 640000;
      const heroH = 1480000;
      const heroParas =
        `<a:p><a:pPr algn="l"><a:spcAft><a:spcPts val="160"/></a:spcAft></a:pPr>` +
        buildRunXml(kickerText, { pt: 13, bold: true, color: "0066CC" }) +
        (cs.sourceNote
          ? buildRunXml(`     ${cs.sourceNote}`, { pt: 11, bold: false, color: "86868B" })
          : "") +
        `</a:p>` +
        `<a:p><a:pPr algn="l"/>` +
        buildRunXml(`${cs.coreTerm || "“สุขภาพ” (health)"} `, { pt: 21, bold: true, color: "1D1D1F" }) +
        (cs.coreDefinitionLead || cs.coreDefinitionQualifier
          ? buildRunXml(`${cs.coreDefinitionLead || ""} `, { pt: 20, bold: true, color: "1D1D1F" }) +
            buildRunXml(cs.coreDefinitionQualifier || "", { pt: 20, bold: false, color: "6E6E73" })
          : buildRunXml(cs.coreDefinition || "", { pt: 20, bold: false, color: "1D1D1F" })) +
        `</a:p>`;
      csShapes.push(
        buildShapeXml(
          csId++,
          "KeyTakeawayHero",
          { x: padX, y: heroY, w: workW, h: heroH },
          "F5F5F7",
          null,
          heroParas,
          0,
          { l: 0, r: 0, t: 20000, b: 20000 }
        )
      );

      // 2. Clean 2x2 Apple Bento Dimension Cards
      const dims = Array.isArray(cs.dimensions) ? cs.dimensions : [];
      const gridY = heroY + heroH + 140000;
      const bridgeH = cs.caseBridge ? 420000 : 0;
      const gridH = H - 340000 - 110000 - bridgeH - (bridgeH ? 120000 : 0) - gridY;
      const gapX = 200000;
      const gapY = 180000;
      const cardW = Math.floor((workW - gapX) / 2);
      const cardH = Math.floor((gridH - gapY) / 2);

      dims.slice(0, 4).forEach((d, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = padX + col * (cardW + gapX);
        const cy = gridY + row * (cardH + gapY);
        const idxLabel = d.num ? String(d.num).padStart(2, "0") : String(idx + 1).padStart(2, "0");

        const cardParas =
          `<a:p><a:pPr algn="l"><a:spcAft><a:spcPts val="140"/></a:spcAft></a:pPr>` +
          buildRunXml(idxLabel, { pt: 12, bold: true, color: "0066CC" }) +
          (d.enTitle ? buildRunXml(`   ·   ${d.enTitle}`, { pt: 11.5, bold: false, color: "86868B" }) : "") +
          `</a:p>` +
          `<a:p><a:pPr algn="l"><a:spcAft><a:spcPts val="160"/></a:spcAft></a:pPr>` +
          buildRunXml(d.thTitle || "", { pt: 19, bold: true, color: "1D1D1F" }) +
          `</a:p>` +
          `<a:p><a:pPr algn="l"/>` +
          buildRunXml(d.definition || "", { pt: 14.5, bold: false, color: "424245" }) +
          `</a:p>`;
        csShapes.push(
          buildShapeXml(
            csId++,
            `BentoDimCard_${idx + 1}`,
            { x: cx, y: cy, w: cardW, h: cardH, anchor: "ctr" },
            "FFFFFF",
            "E5E5EA",
            cardParas,
            6000,
            { l: 220000, r: 220000, t: 140000, b: 140000 }
          )
        );
      });

      // 3. Minimalist Hairline Footer Case Link
      if (cs.caseBridge) {
        const bY = gridY + gridH + 120000;
        const bLabel = cs.caseBridgeLabel || `เชื่อมโยงโจทย์ ${slideSpec.moduleCode || "HS"}`;
        csShapes.push(
          buildShapeXml(csId++, "BridgeHairline", { x: padX, y: bY, w: workW, h: 12000 }, "D2D2D7", null, "")
        );
        const bParas =
          `<a:p><a:pPr algn="l"/>` +
          buildRunXml(`${bLabel}   |   `, { pt: 11.5, bold: true, color: "1D1D1F" }) +
          buildRunXml(cs.caseBridge, { pt: 11.5, bold: false, color: "6E6E73" }) +
          `</a:p>`;
        csShapes.push(
          buildShapeXml(
            csId++,
            "KeyTakeawayBridge",
            { x: padX, y: bY + 30000, w: workW, h: bridgeH - 30000, anchor: "ctr" },
            "F5F5F7",
            null,
            bParas,
            0,
            { l: 0, r: 0, t: 20000, b: 20000 }
          )
        );
      }

      // Slide Master Footer Bar
      const footParasCs =
        `<a:p><a:pPr algn="l"/>` +
        buildRunXml(
          `RACM 303 เวชศาสตร์ชุมชนและวิทยาศาสตร์ระบบสุขภาพ · คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี     |     ${kickerText}  ·  Slide ${slideIdx + 1} / ${totalSlides}`,
          { pt: 8.8, color: "86868B" }
        ) +
        `</a:p>`;
      csShapes.push(
        buildShapeXml(
          csId++,
          "MasterFooter",
          { x: 0, y: H - 340000, w: W, h: 340000, anchor: "ctr" },
          "F5F5F7",
          "E5E5EA",
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

    // Soft slide canvas background card
    shapes.push(
      buildShapeXml(shapeId++, "SlideBg", { x: 0, y: 0, w: W, h: H }, "F8FAFC", null, "")
    );

    // Ramathibodi Navy Slide Master Header Bar + Gold Strip
    const headParas =
      `<a:p><a:pPr algn="l"/>` +
      buildRunXml(` [${slideSpec.moduleCode || "HS"}] `, {
        pt: 11.5,
        bold: true,
        color: "001D4A",
        highlightHex: "FFB81C"
      }) +
      buildRunXml(`  ${slideSpec.caseTitle || ""}`, { pt: 13.5, bold: true, color: "FFFFFF" }) +
      (slideSpec.stageBadge
        ? buildRunXml(`   |   ${slideSpec.stageBadge}`, { pt: 11, bold: true, color: "FDE68A" })
        : "") +
      `</a:p>`;
    shapes.push(
      buildShapeXml(
        shapeId++,
        "MasterHeader",
        { x: 0, y: 0, w: W, h: 520000, anchor: "ctr" },
        "002663",
        null,
        headParas,
        0,
        { l: 160000, r: 160000, t: 36000, b: 36000 }
      )
    );
    shapes.push(
      buildShapeXml(shapeId++, "GoldAccent", { x: 0, y: 520000, w: W, h: 36000 }, "FFB81C", null, "")
    );

    // Content Workspace (y = 630000 .. 6460000 -> height 5830000)
    const padX = 180000;
    const workY = 635000;
    const workH = 5800000;
    const workW = W - padX * 2;
    const isHoriz = slideSpec.splitOrient === "horizontal";

    let scenBox;
    let rightBox;
    if (isHoriz) {
      const topH = Math.round(workH * 0.41);
      const gapY = 110000;
      scenBox = { x: padX, y: workY, w: workW, h: topH };
      rightBox = { x: padX, y: workY + topH + gapY, w: workW, h: workH - topH - gapY };
    } else {
      const leftW = Math.round(workW * 0.43);
      const gapX = 150000;
      scenBox = { x: padX, y: workY, w: leftW, h: workH };
      rightBox = { x: padX + leftW + gapX, y: workY, w: workW - leftW - gapX, h: workH };
    }

    // Left / Top Scenario Card with Thematic Analysis Verbatim Highlights
    const scenLines = Array.isArray(slideSpec.scenarioParagraphs) ? slideSpec.scenarioParagraphs : [];
    const scenPt = scenLines.join(" ").length > 950 ? 9.2 : scenLines.join(" ").length > 650 ? 10 : 10.8;
    const scenHeadPara =
      `<a:p><a:pPr algn="l"><a:spcAft><a:spcPts val="180"/></a:spcAft></a:pPr>` +
      buildRunXml(`📖 สถานการณ์กรณีศึกษา (${slideSpec.caseShort || ""})`, {
        pt: 11,
        bold: true,
        color: "0B46A6"
      }) +
      (slideSpec.clues && slideSpec.clues.length
        ? buildRunXml(`  ·  ไฮไลต์ Supporting Evidence (${slideSpec.clues.length} จุด)`, {
            pt: 9.5,
            bold: true,
            color: "0F766E"
          })
        : "") +
      `</a:p>`;
    const scenBodyParas = scenLines
      .map((ln) => buildHighlightedParagraphXml(ln, slideSpec.clues, scenPt, "1E293B", "l"))
      .join("");
    shapes.push(
      buildShapeXml(
        shapeId++,
        "ScenarioCard",
        scenBox,
        "FFFFFF",
        "CBD5E1",
        scenHeadPara + scenBodyParas,
        2500,
        { l: 115000, r: 115000, t: 95000, b: 85000 }
      )
    );

    // Right / Bottom Question Prompt Header (with Question Framework Highlights) + Editable Answer / Key Table
    const qHeadH = 920000;
    const qClues = Array.isArray(slideSpec.questionClues) ? slideSpec.questionClues : [];
    const qTitleLine = `${slideSpec.questionHeading || ""} — ${slideSpec.questionTitle || ""}`;
    const qHeadParas =
      buildHighlightedParagraphXml(qTitleLine, qClues, 11.2, "002D72", "l") +
      buildHighlightedParagraphXml(slideSpec.questionPrompt || "", qClues, 9.5, "334155", "l");
    const qBox = { x: rightBox.x, y: rightBox.y, w: rightBox.w, h: qHeadH };
    shapes.push(
      buildShapeXml(
        shapeId++,
        "QuestionBanner",
        qBox,
        "EFF6FF",
        "BFDBFE",
        qHeadParas,
        2500,
        { l: 105000, r: 105000, t: 58000, b: 58000 }
      )
    );

    if (slideSpec.table) {
      const tblBox = {
        x: rightBox.x,
        y: rightBox.y + qHeadH + 85000,
        w: rightBox.w,
        h: rightBox.h - qHeadH - 85000
      };
      shapes.push(buildTableGraphicFrameXml(shapeId++, "AnswerKeyTable", tblBox, slideSpec.table));

      // Draw Real 3-Way Triangulated Curved Connectors on Stage 4 ("split-concept") Slides!
      if (slideSpec.drawConnectors && slideSpec.table.rows && slideSpec.table.rows.length) {
        const rowCnt = slideSpec.table.rows.length;
        const headRowH = 340000;
        const eachRowH = Math.floor((tblBox.h - headRowH) / Math.max(1, rowCnt));
        for (let r = 0; r < rowCnt; r += 1) {
          const hex = THEME_HL_FG[r % 6];
          if (!isHoriz) {
            const x1 = scenBox.x + scenBox.w - 15000;
            const y1 = scenBox.y + 380000 + Math.round(((r + 0.5) / rowCnt) * (scenBox.h - 520000));
            const x2 = tblBox.x + 10000;
            const y2 = tblBox.y + headRowH + Math.round((r + 0.5) * eachRowH);
            const qx = qBox.x + 12000;
            const qy = qBox.y + 180000 + Math.round(((r + 0.5) / rowCnt) * (qBox.h - 300000));
            // 1) Scenario -> Answer Table
            shapes.push(buildConnectorXml(shapeId++, `ScenToAns_${r + 1}`, x1, y1, x2, y2, hex));
            // 2) Scenario -> Question Prompt
            shapes.push(buildConnectorXml(shapeId++, `ScenToQuestion_${r + 1}`, x1, y1, qx, qy, hex, "dash"));
            // 3) Question Prompt -> Answer Table
            shapes.push(
              buildConnectorXml(shapeId++, `QuestionToAns_${r + 1}`, qBox.x + 25000 + r * 35000, qBox.y + qBox.h, x2 + 25000, y2, hex, "sysDot")
            );
          } else {
            const x1 = scenBox.x + Math.round(((r + 0.5) / rowCnt) * scenBox.w);
            const y1 = scenBox.y + scenBox.h - 10000;
            const x2 = tblBox.x + Math.round(((r + 0.5) / rowCnt) * Math.min(tblBox.w, 3600000));
            const y2 = tblBox.y + headRowH;
            const qx = qBox.x + Math.round(((r + 0.5) / rowCnt) * Math.min(qBox.w, 4200000));
            shapes.push(buildConnectorXml(shapeId++, `ScenToAns_${r + 1}`, x1, y1, x2, y2, hex));
            shapes.push(buildConnectorXml(shapeId++, `ScenToQuestion_${r + 1}`, x1, y1, qx, qBox.y + 10000, hex, "dash"));
            shapes.push(buildConnectorXml(shapeId++, `QuestionToAns_${r + 1}`, qx, qBox.y + qBox.h - 8000, x2, y2, hex, "sysDot"));
          }
        }
      }
    }

    // Slide Master Footer Bar
    const footParas =
      `<a:p><a:pPr algn="l"/>` +
      buildRunXml(
        `RACM 303 เวชศาสตร์ชุมชนและวิทยาศาสตร์ระบบสุขภาพ · คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี     |     Slide ${slideIdx + 1} / ${totalSlides}`,
        { pt: 8.8, color: "64748B" }
      ) +
      `</a:p>`;
    shapes.push(
      buildShapeXml(
        shapeId++,
        "MasterFooter",
        { x: 0, y: H - 340000, w: W, h: 340000, anchor: "ctr" },
        "F1F5F9",
        "E2E8F0",
        footParas,
        0,
        { l: 160000, r: 160000, t: 25000, b: 25000 }
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

  // 3b. Build Multi-Slide 16:9 Handout Page XML inside PowerPoint (Supports Vertical/Horizontal + 1x1..4x4 & 3+Notes!)
  function buildHandoutGridSlideXml(chunkSlides, pageIdx, totalPages, deckSpec) {
    const isPortrait = deckSpec.pageOrient === "portrait";
    const W = isPortrait ? 7560000 : 10692000;
    const H = isPortrait ? 10692000 : 7560000;
    let shapeId = 2;
    const shapes = [];

    shapes.push(buildShapeXml(shapeId++, "PageBg", { x: 0, y: 0, w: W, h: H }, "FFFFFF", null, ""));

    const pageHeadParas =
      `<a:p><a:pPr algn="l"/>` +
      buildRunXml(deckSpec.title || "RACM 303 Slide Handout", { pt: 10.5, bold: true, color: "002663" }) +
      buildRunXml(`   |   Handout ${deckSpec.gridLabel || ""}   |   หน้า ${pageIdx + 1} / ${totalPages}`, {
        pt: 9,
        color: "64748B"
      }) +
      `</a:p>`;
    shapes.push(
      buildShapeXml(
        shapeId++,
        "HandoutHeader",
        { x: 240000, y: 160000, w: W - 480000, h: 320000 },
        "F8FAFC",
        "E2E8F0",
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

      // 16:9 Slide Frame
      shapes.push(
        buildShapeXml(shapeId++, `SlideFrame_${idx + 1}`, { x: cx, y: cy, w: cardW, h: cardH }, "FFFFFF", "94A3B8", "")
      );

      // Mini Navy Banner
      const banH = Math.max(150000, Math.round(cardH * 0.12));
      const banP =
        `<a:p><a:pPr algn="l"/>` +
        buildRunXml(`${sSpec.moduleCode || "HS"} · ${sSpec.questionHeading || ""}${sSpec.stageShort ? ` [${sSpec.stageShort}]` : ""}`, {
          pt: Math.max(5, scalePt),
          bold: true,
          color: "FFFFFF"
        }) +
        `</a:p>`;
      shapes.push(
        buildShapeXml(
          shapeId++,
          `MiniHead_${idx + 1}`,
          { x: cx, y: cy, w: cardW, h: banH, anchor: "ctr" },
          "002663",
          null,
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
        (cs.dimensions || []).slice(0, 4).forEach((d) => {
          lines.push(`• ${d.thTitle} (${d.enTitle || ""}): ${d.definition || ""}`);
        });
        const csP = lines
          .map((ln, lIdx) =>
            `<a:p><a:pPr algn="l"/>` +
            buildRunXml(ln.slice(0, cols >= 4 ? 75 : 170), {
              pt: Math.max(4.5, scalePt - (lIdx === 0 ? 0.4 : 1.0)),
              bold: lIdx === 0,
              color: lIdx === 0 ? "002D72" : "1E293B"
            }) +
            `</a:p>`
          )
          .join("");
        shapes.push(
          buildShapeXml(
            shapeId++,
            `MiniConceptSummary_${idx + 1}`,
            { x: cx + 25000, y: bodyY, w: cardW - 50000, h: bodyH },
            "F8FAFC",
            "CBD5E1",
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
          "334155",
          "l"
        );
        shapes.push(
          buildShapeXml(
            shapeId++,
            `MiniScen_${idx + 1}`,
            { x: cx + 25000, y: bodyY, w: leftW - 35000, h: bodyH },
            "F8FAFC",
            "E2E8F0",
            leftP,
            0,
            { l: 45000, r: 45000, t: 35000, b: 35000 }
          )
        );

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
              color: lIdx === 0 ? "002D72" : "0F172A"
            }) +
            `</a:p>`
          )
          .join("");
        shapes.push(
          buildShapeXml(
            shapeId++,
            `MiniRight_${idx + 1}`,
            { x: cx + leftW + 10000, y: bodyY, w: cardW - leftW - 35000, h: bodyH },
            "FFFFFF",
            "CBD5E1",
            rightP,
            0,
            { l: 45000, r: 45000, t: 35000, b: 35000 }
          )
        );
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
      slideXmlList = rawSlides.map((sSpec, idx) => buildSlideXml(sSpec, idx, rawSlides.length));
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
