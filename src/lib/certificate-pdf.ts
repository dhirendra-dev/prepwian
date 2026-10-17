import "regenerator-runtime/runtime.js";
import QRCode from "qrcode";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, degrees, type Color } from "pdf-lib";

export type CertificatePdfDetail = { key?: string; label: string; value: string };
export type CertificatePdfInput = {
  recipientName: string;
  title: string;
  description: string;
  awardedAt: string; // ISO
  verificationCode: string;
  verifyUrl: string;
  subtitle?: string | null;
  category?: string | null;
  templateKey?: string | null;
  details?: CertificatePdfDetail[];
  certificateKind?: string;
  examCategory?: string | null;
  testName?: string | null;
  rankText?: string | null;
  score?: number | null;
  maximumMarks?: number | null;
  issuerName?: string | null;
  revoked?: boolean;
};

/*
 * JEE Prep — Official Certificate Generator
 *
 * A4 landscape
 * Premium institutional certificate
 * Uses type-specific navy/metallic accents and text-only PREPWIAN branding.
 */

export async function generateCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  let stage = "PDF initialization";
  try {
    const doc = await PDFDocument.create();
    doc.setTitle(`${input.title} — ${input.recipientName}`);
    doc.setAuthor("JEE Prep");
    doc.setSubject("JEE Prep Certificate");
    doc.setProducer("JEE Prep");
    doc.setCreator("JEE Prep");
    const page = doc.addPage([842, 595]);
    const { width: W, height: H } = page.getSize();
    const navy = rgb(0.012, 0.055, 0.13);
    const navy2 = rgb(0.025, 0.105, 0.22);
    const theme = input.templateKey ?? "ornate";
    const accent =
      theme === "streak"
        ? { main: rgb(0.16, 0.54, 0.48), light: rgb(0.56, 0.82, 0.72) }
        : theme === "test-series"
          ? { main: rgb(0.3, 0.47, 0.73), light: rgb(0.61, 0.75, 0.91) }
          : theme === "course"
            ? { main: rgb(0.31, 0.56, 0.4), light: rgb(0.62, 0.81, 0.63) }
            : theme === "community"
              ? { main: rgb(0.5, 0.39, 0.69), light: rgb(0.73, 0.67, 0.87) }
              : theme === "membership"
                ? { main: rgb(0.67, 0.49, 0.19), light: rgb(0.88, 0.75, 0.45) }
                : { main: rgb(0.76, 0.57, 0.2), light: rgb(0.94, 0.81, 0.48) };
    const gold = accent.main;
    const paleGold = accent.light;
    const cream = rgb(0.993, 0.986, 0.96);
    const ink = rgb(0.035, 0.06, 0.13);
    const muted = rgb(0.28, 0.3, 0.34);
    const gray = rgb(0.66, 0.67, 0.66);

    stage = "signature image loading";
    let signature = null;
    try {
      const signatureResponse = await fetch("/certificate-signature.png");
      if (signatureResponse.ok)
        signature = await doc.embedPng(new Uint8Array(await signatureResponse.arrayBuffer()));
      else
        console.warn("[certificate-pdf] signature asset unavailable", {
          status: signatureResponse.status,
        });
    } catch (error) {
      console.warn(
        "[certificate-pdf] signature asset could not be loaded; continuing without it",
        error,
      );
    }

    stage = "QR generation and embedding";
    const qrUrl = input.verifyUrl || `Certificate ID: ${input.verificationCode}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    const qrBytes = Uint8Array.from(atob(qrDataUrl.slice(qrDataUrl.indexOf(",") + 1)), (char) =>
      char.charCodeAt(0),
    );
    const qr = await doc.embedPng(qrBytes);

    const unicodeFields = [
      input.recipientName,
      input.title,
      input.description,
      input.examCategory ?? "",
      input.testName ?? "",
      input.rankText ?? "",
      input.issuerName ?? "",
      input.subtitle ?? "",
      input.category ?? "",
      ...(input.details ?? []).flatMap((detail) => [detail.label, detail.value]),
    ];
    const hasUnicodeGlyph = (value: string) =>
      Array.from(value).some((char) => char.codePointAt(0)! > 0xff);
    const needsUnicodeFont = unicodeFields.some(hasUnicodeGlyph);
    let unicodeFont: PDFFont | null = null;
    if (needsUnicodeFont) {
      stage = "Unicode font loading";
      const response = await fetch("/certificate-fonts/lohit-devanagari.ttf");
      if (!response.ok) throw new Error(`Unicode font request failed with HTTP ${response.status}`);
      doc.registerFontkit(fontkit);
      unicodeFont = await doc.embedFont(new Uint8Array(await response.arrayBuffer()), {
        subset: true,
      });
    }
    const textFont = (text: string, preferred: PDFFont) =>
      hasUnicodeGlyph(text) ? (unicodeFont ?? preferred) : preferred;
    stage = "certificate text and layout rendering";
    const serif = await doc.embedFont(StandardFonts.TimesRoman);
    const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
    const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
    const serifBoldItalic = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);
    const sans = await doc.embedFont(StandardFonts.Helvetica);
    const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

    // Ornate navy canvas, cream certificate field, and double metallic frame.
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: navy });
    page.drawRectangle({ x: 15, y: 15, width: W - 30, height: H - 30, color: cream });
    drawFrame(page, 9, 9, W - 18, H - 18, gold, 1.6);
    drawFrame(page, 17, 17, W - 34, H - 34, paleGold, 0.55);
    drawFrame(page, 24, 24, W - 48, H - 48, gold, 0.85);
    drawCorner(page, 25, 25, 1, 1, paleGold);
    drawCorner(page, W - 25, 25, -1, 1, paleGold);
    drawCorner(page, 25, H - 25, 1, -1, paleGold);
    drawCorner(page, W - 25, H - 25, -1, -1, paleGold);

    // Deep-blue masthead with a sweeping layered gold edge and corner ribbons.
    page.drawRectangle({ x: 25, y: H - 103, width: W - 50, height: 78, color: navy });
    page.drawRectangle({ x: 25, y: H - 104, width: W - 50, height: 2.2, color: gold });
    for (let i = 0; i < 26; i++) {
      const x1 = 25 + (i * (W - 50)) / 26;
      const x2 = 25 + ((i + 1) * (W - 50)) / 26;
      const y1 = H - 111 + 17 * Math.sin((Math.PI * i) / 26);
      const y2 = H - 111 + 17 * Math.sin((Math.PI * (i + 1)) / 26);
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: 2.6,
        color: gold,
      });
      page.drawLine({
        start: { x: x1, y: y1 - 3 },
        end: { x: x2, y: y2 - 3 },
        thickness: 0.7,
        color: paleGold,
      });
    }
    page.drawLine({
      start: { x: 40, y: H - 104 },
      end: { x: 180, y: H - 127 },
      thickness: 8,
      color: gold,
    });
    page.drawLine({
      start: { x: 48, y: H - 108 },
      end: { x: 179, y: H - 129 },
      thickness: 1.2,
      color: paleGold,
    });
    page.drawText("PREPWIAN", { x: 50, y: H - 68, size: 21, font: serifBold, color: cream });
    page.drawText("L E A R N    •    G R O W    •    S U C C E E D", {
      x: 51,
      y: H - 87,
      size: 6.6,
      font: sansBold,
      color: paleGold,
    });
    rightText(page, "DISCIPLINE TODAY", W - 50, H - 49, 7.4, sans, cream, 1.7);
    rightText(page, "BRIGHTER TOMORROW", W - 50, H - 63, 7.4, sans, cream, 1.7);
    page.drawLine({
      start: { x: W - 175, y: H - 71 },
      end: { x: W - 50, y: H - 71 },
      thickness: 1,
      color: gold,
    });

    // Medal and ribbon on the right, echoing the award seal in the reference.
    page.drawRectangle({
      x: W - 93,
      y: 290,
      width: 54,
      height: 206,
      color: navy,
      borderColor: gold,
      borderWidth: 1.5,
    });
    page.drawLine({
      start: { x: W - 93, y: 290 },
      end: { x: W - 66, y: 314 },
      thickness: 2,
      color: gold,
    });
    page.drawLine({
      start: { x: W - 39, y: 290 },
      end: { x: W - 66, y: 314 },
      thickness: 2,
      color: gold,
    });
    page.drawCircle({
      x: W - 66,
      y: 390,
      size: 45,
      color: navy2,
      borderColor: gold,
      borderWidth: 2.2,
    });
    page.drawCircle({ x: W - 66, y: 390, size: 37, borderColor: paleGold, borderWidth: 0.8 });
    page.drawCircle({ x: W - 66, y: 390, size: 27, borderColor: gold, borderWidth: 0.7 });
    page.drawText("*", { x: W - 73, y: 425, size: 14, font: serifBold, color: paleGold });
    drawOfficialSeal(
      page,
      W - 66,
      389,
      23,
      gold,
      paleGold,
      navy,
      sansBold,
      getIssuedYear(input.awardedAt),
      input.certificateKind || "achievement",
    );
    for (const dx of [-17, 0, 17])
      page.drawCircle({ x: W - 66 + dx, y: 343, size: 2.1, color: paleGold });

    // Faint academic watermark and mountain-like engraved base ornament.
    page.drawText("Better", {
      x: 48,
      y: 351,
      size: 18,
      font: serifItalic,
      color: gray,
      opacity: 0.55,
      rotate: degrees(-14),
    });
    page.drawText("Students", {
      x: 48,
      y: 331,
      size: 18,
      font: serifItalic,
      color: gray,
      opacity: 0.55,
      rotate: degrees(-14),
    });
    page.drawText("Brighter India", {
      x: 48,
      y: 311,
      size: 14,
      font: serifItalic,
      color: gray,
      opacity: 0.45,
      rotate: degrees(-14),
    });
    const mountain = [
      { x: 27, y: 145 },
      { x: 93, y: 195 },
      { x: 126, y: 164 },
      { x: 172, y: 214 },
      { x: 238, y: 152 },
      { x: 287, y: 183 },
      { x: 346, y: 146 },
      { x: 408, y: 166 },
    ];
    for (let i = 0; i < mountain.length - 1; i++)
      page.drawLine({
        start: mountain[i],
        end: mountain[i + 1],
        thickness: 1,
        color: gray,
        opacity: 0.3,
      });
    page.drawCircle({ x: 59, y: 220, size: 6, color: gray, opacity: 0.55 });
    page.drawLine({
      start: { x: 59, y: 214 },
      end: { x: 59, y: 179 },
      thickness: 4,
      color: gray,
      opacity: 0.55,
    });
    page.drawLine({
      start: { x: 59, y: 202 },
      end: { x: 48, y: 190 },
      thickness: 2.3,
      color: gray,
      opacity: 0.55,
    });
    page.drawLine({
      start: { x: 59, y: 202 },
      end: { x: 69, y: 190 },
      thickness: 2.3,
      color: gray,
      opacity: 0.55,
    });
    page.drawLine({
      start: { x: 59, y: 179 },
      end: { x: 50, y: 157 },
      thickness: 2.6,
      color: gray,
      opacity: 0.55,
    });
    page.drawLine({
      start: { x: 59, y: 179 },
      end: { x: 68, y: 157 },
      thickness: 2.6,
      color: gray,
      opacity: 0.55,
    });

    centerText(page, "CERTIFICATE", W / 2 - 12, 438, 43, serifBold, ink, 1, 1.2);
    const categoryTitle = (input.category || input.certificateKind || "achievement")
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .toUpperCase();
    centerText(page, `OF ${categoryTitle}`, W / 2 - 12, 409, 15, serifBold, gold, 1, 3.2);
    drawTitleDivider(page, W / 2 - 12, 397, gold);
    centerText(
      page,
      "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
      W / 2 - 12,
      378,
      8,
      sansBold,
      ink,
      1,
      2.2,
    );

    const recipientName = (input.recipientName || "JEE Aspirant").replace(/\s+/g, " ").trim();
    const recipientFont = textFont(recipientName, serifItalic);
    let recipientSize = 39;
    while (
      recipientFont.widthOfTextAtSize(recipientName, recipientSize) > 550 &&
      recipientSize > 24
    )
      recipientSize -= 1;
    centerText(page, recipientName, W / 2 - 12, 326, recipientSize, recipientFont, gold);
    page.drawLine({
      start: { x: 220, y: 316 },
      end: { x: 624, y: 316 },
      thickness: 0.8,
      color: gold,
    });
    const subtitle = (input.subtitle || "for outstanding performance in the")
      .replace(/\s+/g, " ")
      .trim();
    const subtitleFont = textFont(subtitle, serif);
    let subtitleSize = 10.5;
    while (subtitleFont.widthOfTextAtSize(subtitle, subtitleSize) > 515 && subtitleSize > 7)
      subtitleSize -= 0.25;
    centerText(page, subtitle, W / 2 - 12, 295, subtitleSize, subtitleFont, ink);

    const title = (input.title || "JEE Prep Achievement").replace(/\s+/g, " ").trim();
    const titleFont = textFont(title, serifBold);
    let titleSize = 16;
    while (titleFont.widthOfTextAtSize(title, titleSize) > 525 && titleSize > 10) titleSize -= 0.5;
    centerText(page, title, W / 2 - 12, 274, titleSize, titleFont, ink);
    const description = (
      input.description ||
      "Your dedication, consistency and hard work have resulted in an excellent performance. Keep learning, keep improving!"
    )
      .replace(/\s+/g, " ")
      .trim();
    const descriptionFont = textFont(description, serif);
    const descriptionLines = wrapText(description, descriptionFont, 9.2, 535).slice(0, 2);
    descriptionLines.forEach((line, index) =>
      centerText(page, line, W / 2 - 12, 255 - index * 13, 9.2, descriptionFont, muted),
    );

    // Optional per-type details. Empty/irrelevant values are omitted rather than
    // replaced with generic rank, score or test-series placeholders.
    const legacyDetails: CertificatePdfDetail[] = [];
    if (input.rankText?.trim())
      legacyDetails.push({ key: "rank", label: "RANK", value: input.rankText.trim() });
    if (input.score != null)
      legacyDetails.push({
        key: "score",
        label: "SCORE",
        value: `${input.score}${input.maximumMarks == null ? "" : ` / ${input.maximumMarks}`}`,
      });
    if (input.testName?.trim())
      legacyDetails.push({ key: "test_name", label: "TEST", value: input.testName.trim() });
    if (input.examCategory?.trim())
      legacyDetails.push({
        key: "exam_category",
        label: input.testName ? "EXAM" : "CATEGORY",
        value: input.examCategory.trim(),
      });
    const detailList = (input.details?.length ? input.details : legacyDetails)
      .filter(
        (detail) =>
          typeof detail.label === "string" &&
          detail.label.trim() &&
          typeof detail.value === "string" &&
          detail.value.trim(),
      )
      .slice(0, 12);
    if (detailList.length) {
      const bx = 104,
        by = 106,
        bw = 638;
      const columns = detailList.length <= 4 ? detailList.length : 6;
      const rows = Math.ceil(detailList.length / columns);
      const bh = rows === 1 ? 70 : 80;
      page.drawRectangle({
        x: bx,
        y: by,
        width: bw,
        height: bh,
        color: cream,
        borderColor: gold,
        borderWidth: 1.2,
      });
      const cellW = bw / columns;
      for (let i = 1; i < columns; i++) {
        const x = bx + cellW * i;
        page.drawLine({
          start: { x, y: by + 8 },
          end: { x, y: by + bh - 8 },
          thickness: 0.55,
          color: gold,
        });
      }
      detailList.forEach((detail, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const x = bx + col * cellW;
        const rowY = by + bh - 15 - row * 34;
        drawDetailIcon(page, x + 15, rowY - 9, detail.key ?? detail.label, gold, navy2);
        const label = detail.label.trim().toUpperCase();
        let labelSize = columns >= 6 ? 5.3 : 6.3;
        const labelFont = textFont(label, sansBold);
        while (labelFont.widthOfTextAtSize(label, labelSize) > cellW - 29 && labelSize > 4)
          labelSize -= 0.2;
        page.drawText(label, {
          x: x + 28,
          y: rowY - 4,
          size: labelSize,
          font: labelFont,
          color: ink,
        });
        let valueSize = columns >= 6 ? 7.2 : 11.5;
        const valueFont = textFont(detail.value, serifBold);
        while (valueFont.widthOfTextAtSize(detail.value, valueSize) > cellW - 31 && valueSize > 5.2)
          valueSize -= 0.25;
        page.drawText(detail.value, {
          x: x + 28,
          y: rowY - 17,
          size: valueSize,
          font: valueFont,
          color: ink,
          maxWidth: cellW - 31,
        });
      });
    }

    // Issue date, signed issuer, certificate ID, and online verification QR.
    page.drawText("DATE OF ISSUE", { x: 142, y: 77, size: 7.3, font: sansBold, color: muted });
    page.drawText(formatDate(input.awardedAt), {
      x: 142,
      y: 59,
      size: 10.2,
      font: serifBold,
      color: ink,
    });
    if (signature) page.drawImage(signature, { x: 345, y: 59, width: 110, height: 39 });
    page.drawLine({
      start: { x: 325, y: 57 },
      end: { x: 480, y: 57 },
      thickness: 0.75,
      color: navy,
    });
    const issuer = input.issuerName || "PREPWIAN TEAM";
    centerText(page, issuer.toUpperCase(), 402, 44, 7, textFont(issuer, sansBold), ink, 1, 1.2);
    page.drawLine({
      start: { x: 608, y: 47 },
      end: { x: 608, y: 94 },
      thickness: 0.7,
      color: muted,
    });
    page.drawText("CERTIFICATE ID", { x: 518, y: 76, size: 7, font: sansBold, color: ink });
    page.drawText(input.verificationCode, { x: 518, y: 61, size: 8.2, font: sans, color: ink });
    page.drawImage(qr, { x: 623, y: 49, width: 48, height: 48 });
    page.drawText("VERIFY ONLINE", { x: 680, y: 79, size: 6.6, font: sansBold, color: ink });
    page.drawText("Scan to verify this certificate", {
      x: 680,
      y: 66,
      size: 5.6,
      font: sans,
      color: muted,
    });
    const displayUrl = input.verifyUrl.replace(/^https?:\/\//, "");
    let urlSize = 5.5;
    while (sans.widthOfTextAtSize(displayUrl, urlSize) > 132 && urlSize > 4) urlSize -= 0.25;
    page.drawText(displayUrl, { x: 680, y: 55, size: urlSize, font: sans, color: muted });

    if (input.revoked) {
      page.drawRectangle({
        x: 206,
        y: 205,
        width: 430,
        height: 42,
        color: rgb(0.68, 0.05, 0.05),
        opacity: 0.92,
      });
      centerText(
        page,
        "REVOKED — THIS CERTIFICATE IS NOT VALID",
        W / 2,
        220,
        12,
        sansBold,
        cream,
        1,
        1.2,
      );
    }
    page.drawRectangle({ x: 25, y: 24, width: W - 50, height: 17, color: navy });
    centerText(page, "A STRONGER YOU FOR A BRIGHTER TOMORROW", W / 2, 29, 6.7, sans, cream, 1, 2.1);
    page.drawLine({
      start: { x: 214, y: 31.5 },
      end: { x: 263, y: 31.5 },
      thickness: 0.7,
      color: gold,
    });
    page.drawLine({
      start: { x: 579, y: 31.5 },
      end: { x: 628, y: 31.5 },
      thickness: 0.7,
      color: gold,
    });

    stage = "PDF serialization";
    return await doc.save();
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error("[certificate-pdf] generation failed", { stage, detail });
    throw new Error(`Certificate PDF failed during ${stage}: ${detail}`, { cause: error });
  }
}

// ─────────────────────────────────────────────
// FRAME
// ─────────────────────────────────────────────

function drawFrame(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Color,
  thickness: number,
) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: color,
    borderWidth: thickness,
  });
}

// ─────────────────────────────────────────────
// CORNER ORNAMENT
// ─────────────────────────────────────────────

function drawCorner(page: PDFPage, x: number, y: number, sx: number, sy: number, color: Color) {
  page.drawLine({
    start: { x, y },
    end: {
      x: x + sx * 28,
      y,
    },
    thickness: 0.8,
    color,
  });

  page.drawLine({
    start: { x, y },
    end: {
      x,
      y: y + sy * 28,
    },
    thickness: 0.8,
    color,
  });

  page.drawLine({
    start: {
      x: x + sx * 7,
      y: y + sy * 7,
    },
    end: {
      x: x + sx * 20,
      y: y + sy * 7,
    },
    thickness: 0.5,
    color,
  });

  page.drawLine({
    start: {
      x: x + sx * 7,
      y: y + sy * 7,
    },
    end: {
      x: x + sx * 7,
      y: y + sy * 20,
    },
    thickness: 0.5,
    color,
  });

  page.drawCircle({
    x,
    y,
    size: 1.7,
    color,
  });
}

// ─────────────────────────────────────────────
// CENTERED TEXT
// ─────────────────────────────────────────────

function centerText(
  page: PDFPage,
  text: string,
  cx: number,
  y: number,
  size: number,
  font: PDFFont,
  color: Color,
  opacity = 1,
  letterSpacing = 0,
) {
  if (!text) return;

  if (letterSpacing > 0) {
    const chars = [...text];

    const widths = chars.map((char) => font.widthOfTextAtSize(char, size));

    const total =
      widths.reduce((sum, width) => sum + width, 0) + letterSpacing * Math.max(0, chars.length - 1);

    let x = cx - total / 2;

    chars.forEach((char, index) => {
      page.drawText(char, {
        x,
        y,
        size,
        font,
        color,
        opacity,
      });

      x += widths[index] + letterSpacing;
    });

    return;
  }

  const width = font.widthOfTextAtSize(text, size) + Math.max(0, text.length - 1) * letterSpacing;

  page.drawText(text, {
    x: cx - width / 2,
    y,
    size,
    font,
    color,
    opacity,
  });
}

// ─────────────────────────────────────────────
// RIGHT ALIGNED TEXT
// ─────────────────────────────────────────────

function rightText(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: PDFFont,
  color: Color,
  letterSpacing = 0,
) {
  const width = font.widthOfTextAtSize(text, size);

  page.drawText(text, {
    x: rightX - width,
    y,
    size,
    font,
    color,
  });
}

// ─────────────────────────────────────────────
// TITLE DIVIDER
// ─────────────────────────────────────────────

function drawTitleDivider(page: PDFPage, cx: number, y: number, color: Color) {
  page.drawLine({
    start: {
      x: cx - 100,
      y,
    },
    end: {
      x: cx - 15,
      y,
    },
    thickness: 0.8,
    color,
  });

  page.drawLine({
    start: {
      x: cx + 15,
      y,
    },
    end: {
      x: cx + 100,
      y,
    },
    thickness: 0.8,
    color,
  });

  page.drawCircle({
    x: cx,
    y,
    size: 3,
    color,
  });

  page.drawCircle({
    x: cx,
    y,
    size: 1.15,
    color: rgb(1, 1, 1),
  });
}

// ─────────────────────────────────────────────
// FOOTER INFO
// ─────────────────────────────────────────────

function drawInfoBlock(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  labelFont: PDFFont,
  valueFont: PDFFont,
  labelColor: Color,
  valueColor: Color,
  accent: Color,
  alignRight = false,
) {
  const labelSize = 7.2;
  const valueSize = 10.5;

  const safeValue = value || "—";

  if (alignRight) {
    const labelWidth = labelFont.widthOfTextAtSize(label.toUpperCase(), labelSize);

    const valueWidth = valueFont.widthOfTextAtSize(safeValue, valueSize);

    page.drawText(label.toUpperCase(), {
      x: x + w - labelWidth,
      y: y + 31,
      size: labelSize,
      font: labelFont,
      color: labelColor,
    });

    page.drawText(safeValue, {
      x: x + w - valueWidth,
      y: y + 13,
      size: valueSize,
      font: valueFont,
      color: valueColor,
    });
  } else {
    page.drawText(label.toUpperCase(), {
      x,
      y: y + 31,
      size: labelSize,
      font: labelFont,
      color: labelColor,
    });

    page.drawText(safeValue, {
      x,
      y: y + 13,
      size: valueSize,
      font: valueFont,
      color: valueColor,
    });
  }

  page.drawLine({
    start: {
      x,
      y: y + 4,
    },
    end: {
      x: x + w,
      y: y + 4,
    },
    thickness: 0.7,
    color: accent,
  });

  page.drawCircle({
    x,
    y: y + 4,
    size: 1.15,
    color: accent,
  });

  page.drawCircle({
    x: x + w,
    y: y + 4,
    size: 1.15,
    color: accent,
  });
}

function drawDetailIcon(
  page: PDFPage,
  cx: number,
  cy: number,
  rawKey: string,
  accent: Color,
  ink: Color,
) {
  const key = rawKey.toLowerCase();
  const line = (x1: number, y1: number, x2: number, y2: number, thickness = 0.8) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: accent });
  if (/date|since|period/.test(key)) {
    page.drawRectangle({
      x: cx - 5,
      y: cy - 4,
      width: 10,
      height: 9,
      borderColor: accent,
      borderWidth: 0.8,
    });
    line(cx - 5, cy + 1.5, cx + 5, cy + 1.5);
    line(cx - 2.5, cy + 5, cx - 2.5, cy + 2.8, 1.2);
    line(cx + 2.5, cy + 5, cx + 2.5, cy + 2.8, 1.2);
    page.drawCircle({ x: cx - 2, y: cy - 1, size: 0.45, color: ink });
    page.drawCircle({ x: cx + 2, y: cy - 1, size: 0.45, color: ink });
    return;
  }
  if (/score|rank|percentage|participants|accuracy|pyq|count/.test(key)) {
    page.drawRectangle({ x: cx - 5, y: cy - 4.5, width: 2.2, height: 4, color: accent });
    page.drawRectangle({ x: cx - 1.1, y: cy - 4.5, width: 2.2, height: 7, color: accent });
    page.drawRectangle({ x: cx + 2.8, y: cy - 4.5, width: 2.2, height: 9, color: accent });
    return;
  }
  if (/streak|days|duration|hours|sessions|membership/.test(key)) {
    page.drawCircle({ x: cx, y: cy, size: 5, borderColor: accent, borderWidth: 0.8 });
    line(cx, cy, cx, cy + 3);
    line(cx, cy, cx + 2.5, cy - 1.5);
    return;
  }
  if (/subject|topic|syllabus|chapter|module|course|test|exam/.test(key)) {
    page.drawRectangle({
      x: cx - 5,
      y: cy - 4.5,
      width: 10,
      height: 9,
      borderColor: accent,
      borderWidth: 0.8,
    });
    line(cx, cy - 4.2, cx, cy + 4.2);
    line(cx - 3.5, cy + 1.5, cx - 1, cy + 1.5, 0.55);
    line(cx + 1, cy + 1.5, cx + 3.5, cy + 1.5, 0.55);
    line(cx - 3.5, cy - 1.5, cx - 1, cy - 1.5, 0.55);
    line(cx + 1, cy - 1.5, cx + 3.5, cy - 1.5, 0.55);
    return;
  }
  if (/community|contribut|volunteer|mentor|resource/.test(key)) {
    page.drawCircle({ x: cx, y: cy + 2.8, size: 1.7, color: accent });
    page.drawCircle({ x: cx - 3.5, y: cy - 2.7, size: 1.5, color: accent });
    page.drawCircle({ x: cx + 3.5, y: cy - 2.7, size: 1.5, color: accent });
    line(cx, cy + 1, cx - 2.8, cy - 1.3);
    line(cx, cy + 1, cx + 2.8, cy - 1.3);
    return;
  }
  if (/completion|achievement|award|recognition|appreciation|mastery/.test(key)) {
    page.drawRectangle({ x: cx - 3.3, y: cy + 0.5, width: 6.6, height: 4, color: accent });
    line(cx - 4.5, cy + 3.5, cx - 5, cy + 0.8, 0.9);
    line(cx + 4.5, cy + 3.5, cx + 5, cy + 0.8, 0.9);
    line(cx - 2.3, cy - 1.2, cx - 2.3, cy - 3.4, 1.2);
    line(cx + 2.3, cy - 1.2, cx + 2.3, cy - 3.4, 1.2);
    line(cx - 3.5, cy - 3.5, cx + 3.5, cy - 3.5, 1.2);
    return;
  }
  page.drawCircle({ x: cx, y: cy, size: 4.4, borderColor: accent, borderWidth: 0.9 });
  page.drawCircle({ x: cx, y: cy, size: 1.1, color: accent });
}

// ─────────────────────────────────────────────
// OFFICIAL SEAL
// ─────────────────────────────────────────────

function drawOfficialSeal(
  page: PDFPage,
  cx: number,
  cy: number,
  r: number,
  gold: Color,
  goldLight: Color,
  navy: Color,
  font: PDFFont,
  year: string,
  certificateKind: string = "achievement",
) {
  const dots = 28;

  for (let i = 0; i < dots; i++) {
    const angle = (i / dots) * Math.PI * 2;

    page.drawCircle({
      x: cx + Math.cos(angle) * (r + 4),
      y: cy + Math.sin(angle) * (r + 4),
      size: 1.5,
      color: gold,
    });
  }

  page.drawCircle({
    x: cx,
    y: cy,
    size: r,
    color: navy,
  });

  page.drawCircle({
    x: cx,
    y: cy,
    size: r - 3,
    borderColor: gold,
    borderWidth: 1,
  });

  page.drawCircle({
    x: cx,
    y: cy,
    size: r - 8,
    borderColor: goldLight,
    borderWidth: 0.6,
  });

  centerText(page, "JEE", cx, cy + 7, 9, font, goldLight, 1, 1.5);

  centerText(page, "PREP", cx, cy - 4, 8, font, whiteColor(), 1, 1.2);

  centerText(
    page,
    certificateKind === "participation"
      ? "ATTENDED"
      : certificateKind === "completion"
        ? "COMPLETE"
        : certificateKind === "appreciation"
          ? "THANK YOU"
          : "AWARD",
    cx,
    cy - 16,
    4.4,
    font,
    goldLight,
    1,
    1,
  );

  centerText(page, "CERTIFIED", cx, cy + r + 10, 5, font, gold, 1, 1.1);

  centerText(page, year, cx, cy - r - 13, 5, font, gold, 1, 1.2);
}

function whiteColor(): Color {
  return rgb(1, 1, 1);
}

// ─────────────────────────────────────────────
// TEXT WRAPPING
// ─────────────────────────────────────────────

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);

  const lines: string[] = [];

  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

// ─────────────────────────────────────────────
// DATE
// ─────────────────────────────────────────────

function formatDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────
// YEAR
// ─────────────────────────────────────────────

function getIssuedYear(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return new Date().getFullYear().toString();
  }

  return date.getFullYear().toString();
}

// ─────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────

export function downloadCertificate(bytes: Uint8Array, filename: string) {
  try {
    if (!bytes?.byteLength) throw new Error("PDF output is empty");
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    // iOS Safari ignores `download`; opening the PDF lets the native viewer save/share it.
    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    if (isIOS || !("download" in a)) {
      a.removeAttribute("download");
      a.target = "_blank";
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    console.error("[certificate-pdf] download handoff failed", error);
    throw new Error(
      "The PDF was created, but this browser could not open or save it. Try your browser's Share or Open in… option.",
      { cause: error },
    );
  }
}
