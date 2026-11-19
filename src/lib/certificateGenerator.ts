// ============================================================================
// FOSS CEPRN — PROFESSIONAL CERTIFICATE GENERATOR
// A4 Landscape | Selectable Vector PDF | High-Resolution PNG
//
// FEATURES
// 1. Selectable and copyable PDF text.
// 2. Professional three-layer border and corner ornaments.
// 3. Correct logo aspect ratios.
// 4. Balanced certificate content with safe text wrapping.
// 5. Large participant name.
// 6. Event title wraps automatically.
// 7. Date only — no event time.
// 8. Right-side QR verification card.
// 9. Four authentic signatures with improved clarity and alignment.
// 10. Matching PDF and PNG.
// 11. Existing Google Drive sync integration.
// ============================================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { EventItem, EventRegistration } from "@/types";
import { syncCertificateToDrive } from "./driveSync";

import {
  crestLogoBase64,
  sigCommunityLeadBase64,
  sigFaculty1Base64,
  sigFaculty2Base64,
  sigPrincipalBase64,
  fossClubLogoBase64,
} from "./certificateAssets";

export interface CertificateOptions {
  event: EventItem;
  attendee: EventRegistration;
}

export interface GeneratedCertificate {
  certificateId: string;
  pngDataUrl: string;
  pdfBlob: Blob;
  filename: string;
  pdfBase64: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAGE_W = 297;
const PAGE_H = 210;

const GREEN = "#047857";
const DARK_GREEN = "#064e3b";
const EMERALD = "#10b981";
const DARK = "#0f172a";
const SLATE = "#475569";
const MUTED = "#64748b";
const LIGHT = "#f8fafc";
const BORDER = "#cbd5e1";

const SIGNATURES = [
  {
    src: sigCommunityLeadBase64,
    name: "Ms. ABIYA DANIEL",
    role: "COMMUNITY LEAD",
  },
  {
    src: sigFaculty1Base64,
    name: "Ms. ANJU VENUGOPAL",
    role: "FACULTY COORDINATOR",
  },
  {
    src: sigFaculty2Base64,
    name: "Ms. SHAFEENA M B",
    role: "FACULTY COORDINATOR",
  },
  {
    src: sigPrincipalBase64,
    name: "Dr BEJOY ABRAHAM",
    role: "PRINCIPAL",
  },
];

// ============================================================================
// DATE FORMATTER — DATE ONLY
// ============================================================================

export function formatCertificateDate(
  dateString: string | null | undefined
): string {
  if (!dateString) return "Date TBA";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

// ============================================================================
// IMAGE HELPERS
// ============================================================================

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image loading failed"));

    img.src = src;
  });
}

function containSize(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  if (!sourceWidth || !sourceHeight) {
    return {
      width: targetWidth,
      height: targetHeight,
    };
  }

  const scale = Math.min(
    targetWidth / sourceWidth,
    targetHeight / sourceHeight
  );

  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
}

async function addPdfImageContained(
  doc: jsPDF,
  src: string,
  x: number,
  y: number,
  targetW: number,
  targetH: number
) {
  try {
    const img = await loadImage(src);

    const size = containSize(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      targetW,
      targetH
    );

    const finalX = x + (targetW - size.width) / 2;
    const finalY = y + (targetH - size.height) / 2;

    doc.addImage(
      src,
      "PNG",
      finalX,
      finalY,
      size.width,
      size.height
    );
  } catch (error) {
    console.warn("Certificate image could not be rendered:", error);
  }
}

function drawCanvasImageContained(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  targetW: number,
  targetH: number
) {
  const size = containSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    targetW,
    targetH
  );

  const finalX = x + (targetW - size.width) / 2;
  const finalY = y + (targetH - size.height) / 2;

  ctx.drawImage(
    img,
    finalX,
    finalY,
    size.width,
    size.height
  );
}

// ============================================================================
// SIGNATURE IMAGE CLEANUP
// Removes white paper backgrounds while preserving signature strokes.
// Improves visibility of transparent/white scanned signatures.
// ============================================================================

async function prepareSignature(src: string): Promise<string> {
  try {
    const img = await loadImage(src);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext("2d");

    if (!ctx) return src;

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const pixels = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;

        const originalAlpha = pixels[i + 3];

        if (originalAlpha === 0) continue;

        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        const brightness =
          0.299 * r +
          0.587 * g +
          0.114 * b;

        // Remove white / nearly white scan paper.
        if (brightness > 246) {
          pixels[i + 3] = 0;
          continue;
        }

        // Preserve antialiased strokes.
        const darkness = Math.max(
          0,
          Math.min(1, (246 - brightness) / 190)
        );

        pixels[i + 3] = Math.round(
          originalAlpha * darkness
        );

        // Dark navy ink for improved contrast.
        pixels[i] = 18;
        pixels[i + 1] = 35;
        pixels[i + 2] = 52;

        if (pixels[i + 3] > 12) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    if (maxX < minX || maxY < minY) {
      return src;
    }

    // Crop unnecessary empty margins.
    const padding = Math.max(
      5,
      Math.round(Math.min(canvas.width, canvas.height) * 0.04)
    );

    const x0 = Math.max(0, minX - padding);
    const y0 = Math.max(0, minY - padding);
    const x1 = Math.min(canvas.width, maxX + padding + 1);
    const y1 = Math.min(canvas.height, maxY + padding + 1);

    const cropped = document.createElement("canvas");

    cropped.width = x1 - x0;
    cropped.height = y1 - y0;

    const croppedCtx = cropped.getContext("2d");

    if (!croppedCtx) return src;

    croppedCtx.drawImage(
      canvas,
      x0,
      y0,
      cropped.width,
      cropped.height,
      0,
      0,
      cropped.width,
      cropped.height
    );

    return cropped.toDataURL("image/png");
  } catch (error) {
    console.warn("Signature cleanup failed:", error);
    return src;
  }
}

// ============================================================================
// PDF TEXT HELPERS
// ============================================================================

function fitPdfText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  initialSize: number,
  minimumSize: number
) {
  let size = initialSize;

  doc.setFontSize(size);

  while (
    doc.getTextWidth(text) > maxWidth &&
    size > minimumSize
  ) {
    size -= 0.5;
    doc.setFontSize(size);
  }

  return size;
}

function drawCenteredPdfWrappedText(
  doc: jsPDF,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number
) {
  doc.setFontSize(fontSize);

  const lines = doc.splitTextToSize(text, maxWidth);

  doc.text(lines, centerX, startY, {
    align: "center",
  });

  return startY + lines.length * lineHeight;
}

// ============================================================================
// PDF DECORATIVE FRAME
// ============================================================================

function drawPdfBorders(doc: jsPDF) {
  // Outer dark-green frame.
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(1.25);

  doc.rect(
    7,
    7,
    PAGE_W - 14,
    PAGE_H - 14
  );

  // Second emerald frame.
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);

  doc.rect(
    10,
    10,
    PAGE_W - 20,
    PAGE_H - 20
  );

  // Fine inner frame.
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);

  doc.rect(
    13,
    13,
    PAGE_W - 26,
    PAGE_H - 26
  );

  drawPdfCornerAccents(doc);

  // Decorative center marks.
  doc.setFillColor(4, 120, 87);

  doc.circle(PAGE_W / 2, 10, 1, "F");
  doc.circle(PAGE_W / 2, PAGE_H - 10, 1, "F");
}

function drawPdfCornerAccents(doc: jsPDF) {
  const p = 12;
  const len = 14;

  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(1.2);

  // Top left.
  doc.line(p, p, p + len, p);
  doc.line(p, p, p, p + len);

  // Top right.
  doc.line(PAGE_W - p, p, PAGE_W - p - len, p);
  doc.line(PAGE_W - p, p, PAGE_W - p, p + len);

  // Bottom left.
  doc.line(p, PAGE_H - p, p + len, PAGE_H - p);
  doc.line(p, PAGE_H - p, p, PAGE_H - p - len);

  // Bottom right.
  doc.line(
    PAGE_W - p,
    PAGE_H - p,
    PAGE_W - p - len,
    PAGE_H - p
  );

  doc.line(
    PAGE_W - p,
    PAGE_H - p,
    PAGE_W - p,
    PAGE_H - p - len
  );
}

// ============================================================================
// PDF HEADER
// ============================================================================

async function drawPdfHeader(doc: jsPDF) {
  const centerX = 130;

  // Crest and club logo, preserving aspect ratios.
  await addPdfImageContained(
    doc,
    crestLogoBase64,
    centerX - 35,
    14,
    22,
    20
  );

  await addPdfImageContained(
    doc,
    fossClubLogoBase64,
    centerX - 10,
    14,
    50,
    20
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(6, 78, 59);

  doc.text(
    "FREE AND OPEN SOURCE SOFTWARE CLUB",
    centerX,
    36,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);

  doc.text(
    "COLLEGE OF ENGINEERING PERUMON  •  FOSS CEPRN",
    centerX,
    41.5,
    { align: "center" }
  );

  // Divider with decorative center.
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);

  doc.line(centerX - 48, 45, centerX + 48, 45);

  doc.setFillColor(4, 120, 87);
  doc.circle(centerX, 45, 1, "F");
}

// ============================================================================
// PDF MAIN CONTENT
// ============================================================================

function drawPdfMainContent(
  doc: jsPDF,
  attendeeName: string,
  eventTitle: string,
  formattedDate: string
) {
  // Center content in the area to the left of the QR panel.
  const centerX = 130;
  const contentWidth = 210;

  // Certificate title.
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(4, 120, 87);

  doc.text(
    "CERTIFICATE OF PARTICIPATION",
    centerX,
    54,
    { align: "center" }
  );

  // Small title ornaments.
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);

  doc.line(centerX - 53, 57, centerX - 35, 57);
  doc.line(centerX + 35, 57, centerX + 53, 57);

  // Subtitle.
  doc.setFont("times", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139);

  doc.text(
    "This certificate is proudly awarded to",
    centerX,
    64,
    { align: "center" }
  );

  // Participant name.
  doc.setFont("helvetica", "bold");

  fitPdfText(
    doc,
    attendeeName,
    contentWidth,
    25,
    14
  );

  doc.setTextColor(15, 23, 42);

  doc.text(
    attendeeName,
    centerX,
    77,
    { align: "center" }
  );

  // Dynamic underline.
  const nameWidth = doc.getTextWidth(attendeeName);

  const underlineWidth = Math.min(
    175,
    Math.max(75, nameWidth + 15)
  );

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.55);

  doc.line(
    centerX - underlineWidth / 2,
    81,
    centerX + underlineWidth / 2,
    81
  );

  doc.setFillColor(4, 120, 87);
  doc.circle(centerX, 81, 0.9, "F");

  // Description.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  doc.text(
    "in recognition of their active participation in",
    centerX,
    90,
    { align: "center" }
  );

  // Event title — automatically wraps.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(4, 120, 87);

  const eventLines = doc.splitTextToSize(
    eventTitle,
    contentWidth
  );

  if (eventLines.length > 2) {
    doc.setFontSize(10.5);
  } else if (eventTitle.length > 45) {
    doc.setFontSize(11.5);
  }

  doc.text(
    eventLines,
    centerX,
    98,
    { align: "center" }
  );

  const eventBottom = 98 + eventLines.length * 5;

  // Event date — never includes time.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.3);
  doc.setTextColor(71, 85, 105);

  const description =
    `Organized by FOSS CEPRN, College of Engineering Perumon, conducted on ${formattedDate}.`;

  const descriptionLines = doc.splitTextToSize(
    description,
    contentWidth
  );

  const descriptionY = eventBottom + 5;

  doc.text(
    descriptionLines,
    centerX,
    descriptionY,
    { align: "center" }
  );

  // Closing appreciation statement.
  doc.setFont("times", "italic");
  doc.setFontSize(8.3);
  doc.setTextColor(100, 116, 139);

  const appreciation =
    "With appreciation for their enthusiasm, learning, and contribution to the open-source community.";

  const appreciationLines = doc.splitTextToSize(
    appreciation,
    contentWidth
  );

  const appreciationY =
    descriptionY + descriptionLines.length * 4.2 + 2;

  doc.text(
    appreciationLines,
    centerX,
    appreciationY,
    { align: "center" }
  );
}

// ============================================================================
// PDF VERIFICATION QR
// ============================================================================

function drawPdfQr(
  doc: jsPDF,
  qrDataUrl: string,
  certId: string
) {
  if (!qrDataUrl) return;

  const x = 245;
  const y = 82;
  const w = 41;
  const h = 54;

  // QR card.
  doc.setFillColor(249, 252, 250);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.45);

  doc.roundedRect(
    x,
    y,
    w,
    h,
    2.2,
    2.2,
    "FD"
  );

  // Header label.
  doc.setFillColor(4, 120, 87);

  doc.roundedRect(
    x + 3,
    y + 3,
    w - 6,
    5.5,
    1,
    1,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(255, 255, 255);

  doc.text(
    "CERTIFICATE VERIFICATION",
    x + w / 2,
    y + 6.7,
    { align: "center" }
  );

  // QR.
  try {
    doc.addImage(
      qrDataUrl,
      "PNG",
      x + 5.5,
      y + 11,
      30,
      30
    );
  } catch (error) {
    console.warn("QR could not be embedded:", error);
  }

  // Certificate ID.
  doc.setFont("courier", "bold");
  doc.setFontSize(5.1);
  doc.setTextColor(51, 65, 85);

  fitPdfText(
    doc,
    certId,
    w - 5,
    5.1,
    3.5
  );

  doc.text(
    certId,
    x + w / 2,
    y + 43.5,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(4, 120, 87);

  doc.text(
    "SCAN • VERIFY • AUTHENTIC",
    x + w / 2,
    y + 49,
    { align: "center" }
  );
}

// ============================================================================
// PDF SIGNATURE SECTION
// ============================================================================

async function drawPdfSignatures(
  doc: jsPDF,
  preparedSignatures: string[]
) {
  const centers = [39, 112, 185, 258];

  const imageY = 145;
  const imageHeight = 17;
  const signatureLineY = 165.5;

  for (let i = 0; i < SIGNATURES.length; i++) {
    const sig = SIGNATURES[i];
    const center = centers[i];

    // Signature image.
    await addPdfImageContained(
      doc,
      preparedSignatures[i] || sig.src,
      center - 22,
      imageY,
      44,
      imageHeight
    );

    // Signature line.
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.35);

    doc.line(
      center - 23,
      signatureLineY,
      center + 23,
      signatureLineY
    );

    // Name.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.setTextColor(15, 23, 42);

    doc.text(
      sig.name,
      center,
      171,
      { align: "center" }
    );

    // Designation.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);

    doc.text(
      sig.role,
      center,
      175.5,
      { align: "center" }
    );
  }

  // Footer divider.
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.25);

  doc.line(18, 181, 279, 181);

  doc.setFont("times", "italic");
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);

  doc.text(
    "FOSS CEPRN  •  College of Engineering Perumon",
    PAGE_W / 2,
    186,
    { align: "center" }
  );
}

// ============================================================================
// CANVAS HELPERS
// ============================================================================

function canvasWrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];

  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;

    if (
      ctx.measureText(test).width > maxWidth &&
      current
    ) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);

  return lines;
}

function canvasTextFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startingSize: number,
  minSize: number,
  fontPrefix = "bold"
) {
  let size = startingSize;

  while (size > minSize) {
    ctx.font = `${fontPrefix} ${size}px Arial, sans-serif`;

    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }

    size -= 1;
  }

  ctx.font = `${fontPrefix} ${size}px Arial, sans-serif`;

  return size;
}

function drawCanvasRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();

  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);

  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);

  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);

  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);

  ctx.closePath();
}

// ============================================================================
// PNG FRAME
// ============================================================================

function drawCanvasFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Outer frame.
  ctx.strokeStyle = DARK_GREEN;
  ctx.lineWidth = 12;

  ctx.strokeRect(
    70,
    70,
    width - 140,
    height - 140
  );

  // Emerald frame.
  ctx.strokeStyle = EMERALD;
  ctx.lineWidth = 4;

  ctx.strokeRect(
    100,
    100,
    width - 200,
    height - 200
  );

  // Fine inside frame.
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;

  ctx.strokeRect(
    130,
    130,
    width - 260,
    height - 260
  );

  // Corner accents.
  const p = 130;
  const len = 125;

  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 11;

  ctx.beginPath();

  // Top-left.
  ctx.moveTo(p, p);
  ctx.lineTo(p + len, p);
  ctx.moveTo(p, p);
  ctx.lineTo(p, p + len);

  // Top-right.
  ctx.moveTo(width - p, p);
  ctx.lineTo(width - p - len, p);
  ctx.moveTo(width - p, p);
  ctx.lineTo(width - p, p + len);

  // Bottom-left.
  ctx.moveTo(p, height - p);
  ctx.lineTo(p + len, height - p);
  ctx.moveTo(p, height - p);
  ctx.lineTo(p, height - p - len);

  // Bottom-right.
  ctx.moveTo(width - p, height - p);
  ctx.lineTo(width - p - len, height - p);
  ctx.moveTo(width - p, height - p);
  ctx.lineTo(width - p, height - p - len);

  ctx.stroke();

  // Center ornaments.
  ctx.fillStyle = GREEN;

  ctx.beginPath();
  ctx.arc(width / 2, 100, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(width / 2, height - 100, 10, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================================
// PNG HEADER
// ============================================================================

async function drawCanvasHeader(
  ctx: CanvasRenderingContext2D,
  centerX: number
) {
  const crest = await loadImage(crestLogoBase64);
  const foss = await loadImage(fossClubLogoBase64);

  // Logos retain original proportions.
  drawCanvasImageContained(
    ctx,
    crest,
    centerX - 360,
    135,
    210,
    190
  );

  drawCanvasImageContained(
    ctx,
    foss,
    centerX - 105,
    135,
    500,
    190
  );

  // Organization title.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = DARK_GREEN;
  ctx.font = "bold 38px Arial, sans-serif";

  ctx.fillText(
    "FREE AND OPEN SOURCE SOFTWARE CLUB",
    centerX,
    360
  );

  ctx.fillStyle = SLATE;
  ctx.font = "24px Arial, sans-serif";

  ctx.fillText(
    "COLLEGE OF ENGINEERING PERUMON  •  FOSS CEPRN",
    centerX,
    410
  );

  // Divider.
  ctx.strokeStyle = EMERALD;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(centerX - 470, 450);
  ctx.lineTo(centerX + 470, 450);
  ctx.stroke();

  ctx.fillStyle = GREEN;

  ctx.beginPath();
  ctx.arc(centerX, 450, 10, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================================
// PNG MAIN CONTENT
// ============================================================================

function drawCanvasMainContent(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  attendeeName: string,
  eventTitle: string,
  formattedDate: string
) {
  const contentWidth = 2100;

  // Certificate title.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = GREEN;
  ctx.font = "bold 64px Georgia, 'Times New Roman', serif";

  ctx.fillText(
    "CERTIFICATE OF PARTICIPATION",
    centerX,
    545
  );

  // Title ornaments.
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(centerX - 530, 575);
  ctx.lineTo(centerX - 350, 575);

  ctx.moveTo(centerX + 350, 575);
  ctx.lineTo(centerX + 530, 575);

  ctx.stroke();

  // Subtitle.
  ctx.fillStyle = MUTED;
  ctx.font = "italic 30px Georgia, 'Times New Roman', serif";

  ctx.fillText(
    "This certificate is proudly awarded to",
    centerX,
    635
  );

  // Participant name.
  ctx.fillStyle = DARK;

  canvasTextFit(
    ctx,
    attendeeName,
    contentWidth,
    76,
    40
  );

  ctx.fillText(
    attendeeName,
    centerX,
    785
  );

  // Name underline.
  const nameWidth = ctx.measureText(attendeeName).width;

  const lineWidth = Math.min(
    1800,
    Math.max(850, nameWidth + 150)
  );

  ctx.strokeStyle = EMERALD;
  ctx.lineWidth = 5;

  ctx.beginPath();
  ctx.moveTo(centerX - lineWidth / 2, 820);
  ctx.lineTo(centerX + lineWidth / 2, 820);
  ctx.stroke();

  ctx.fillStyle = GREEN;

  ctx.beginPath();
  ctx.arc(centerX, 820, 9, 0, Math.PI * 2);
  ctx.fill();

  // Description.
  ctx.fillStyle = "#334155";
  ctx.font = "29px Arial, sans-serif";

  ctx.fillText(
    "in recognition of their active participation in",
    centerX,
    910
  );

  // Event title.
  ctx.fillStyle = GREEN;

  canvasTextFit(
    ctx,
    eventTitle,
    contentWidth,
    40,
    24
  );

  const eventLines = canvasWrapText(
    ctx,
    eventTitle,
    contentWidth
  );

  const eventY = 980;
  const eventLineHeight = 48;

  eventLines.forEach((line, index) => {
    ctx.fillText(
      line,
      centerX,
      eventY + index * eventLineHeight
    );
  });

  // Date description.
  ctx.fillStyle = SLATE;
  ctx.font = "25px Arial, sans-serif";

  const description =
    `Organized by FOSS CEPRN, College of Engineering Perumon, conducted on ${formattedDate}.`;

  const descriptionLines = canvasWrapText(
    ctx,
    description,
    contentWidth
  );

  const descriptionY =
    eventY + eventLines.length * eventLineHeight + 35;

  descriptionLines.forEach((line, index) => {
    ctx.fillText(
      line,
      centerX,
      descriptionY + index * 38
    );
  });

  // Appreciation.
  ctx.fillStyle = MUTED;
  ctx.font = "italic 25px Georgia, 'Times New Roman', serif";

  const appreciation =
    "With appreciation for their enthusiasm, learning, and contribution to the open-source community.";

  const appreciationLines = canvasWrapText(
    ctx,
    appreciation,
    contentWidth
  );

  const appreciationY =
    descriptionY + descriptionLines.length * 38 + 32;

  appreciationLines.forEach((line, index) => {
    ctx.fillText(
      line,
      centerX,
      appreciationY + index * 36
    );
  });
}

// ============================================================================
// PNG QR PANEL
// ============================================================================

async function drawCanvasQr(
  ctx: CanvasRenderingContext2D,
  qrDataUrl: string,
  certId: string
) {
  if (!qrDataUrl) return;

  try {
    const qr = await loadImage(qrDataUrl);

    const x = 2450;
    const y = 820;
    const w = 410;
    const h = 540;

    // Card background.
    ctx.fillStyle = "#f9fcfa";
    ctx.strokeStyle = EMERALD;
    ctx.lineWidth = 4;

    drawCanvasRoundedRect(
      ctx,
      x,
      y,
      w,
      h,
      24
    );

    ctx.fill();
    ctx.stroke();

    // Label strip.
    ctx.fillStyle = GREEN;

    drawCanvasRoundedRect(
      ctx,
      x + 30,
      y + 30,
      w - 60,
      58,
      14
    );

    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 19px Arial, sans-serif";

    ctx.textAlign = "center";

    ctx.fillText(
      "CERTIFICATE VERIFICATION",
      x + w / 2,
      y + 67
    );

    // QR image.
    ctx.drawImage(
      qr,
      x + 55,
      y + 110,
      300,
      300
    );

    // Certificate ID.
    ctx.fillStyle = "#334155";
    ctx.font = "bold 15px monospace";

    canvasTextFit(
      ctx,
      certId,
      w - 40,
      15,
      10,
      "bold"
    );

    ctx.fillText(
      certId,
      x + w / 2,
      y + 440
    );

    // Verification caption.
    ctx.fillStyle = GREEN;
    ctx.font = "bold 16px Arial, sans-serif";

    ctx.fillText(
      "SCAN • VERIFY • AUTHENTIC",
      x + w / 2,
      y + 490
    );
  } catch (error) {
    console.warn("PNG QR rendering failed:", error);
  }
}

// ============================================================================
// PNG SIGNATURE SECTION
// ============================================================================

async function drawCanvasSignatures(
  ctx: CanvasRenderingContext2D,
  preparedSignatures: string[]
) {
  const centers = [390, 1120, 1850, 2580];

  const signatureTop = 1450;
  const signatureLineY = 1655;

  for (let i = 0; i < SIGNATURES.length; i++) {
    const sig = SIGNATURES[i];
    const center = centers[i];

    try {
      const img = await loadImage(
        preparedSignatures[i] || sig.src
      );

      drawCanvasImageContained(
        ctx,
        img,
        center - 230,
        signatureTop,
        460,
        175
      );
    } catch (error) {
      console.warn(
        `Signature image failed: ${sig.name}`,
        error
      );
    }

    // Signature baseline.
    ctx.strokeStyle = SLATE;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(center - 225, signatureLineY);
    ctx.lineTo(center + 225, signatureLineY);
    ctx.stroke();

    // Name.
    ctx.fillStyle = DARK;
    ctx.font = "bold 24px Arial, sans-serif";

    ctx.textAlign = "center";

    ctx.fillText(
      sig.name,
      center,
      1710
    );

    // Role.
    ctx.fillStyle = SLATE;
    ctx.font = "21px Arial, sans-serif";

    ctx.fillText(
      sig.role,
      center,
      1750
    );
  }

  // Footer divider.
  ctx.strokeStyle = EMERALD;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(180, 1810);
  ctx.lineTo(2790, 1810);
  ctx.stroke();

  // Footer.
  ctx.fillStyle = MUTED;
  ctx.font = "italic 21px Georgia, 'Times New Roman', serif";

  ctx.textAlign = "center";

  ctx.fillText(
    "FOSS CEPRN  •  College of Engineering Perumon",
    1485,
    1850
  );
}

// ============================================================================
// PNG GENERATOR
// ============================================================================

async function generateCertificatePng(params: {
  attendeeName: string;
  eventTitle: string;
  formattedDate: string;
  certId: string;
  qrDataUrl: string;
  preparedSignatures: string[];
}): Promise<string> {
  const {
    attendeeName,
    eventTitle,
    formattedDate,
    certId,
    qrDataUrl,
    preparedSignatures,
  } = params;

  const width = 2970;
  const height = 2100;
  const centerX = 1300;

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create certificate canvas");
  }

  // Background.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Decorative border.
  drawCanvasFrame(ctx, width, height);

  // Header logos and typography.
  await drawCanvasHeader(ctx, centerX);

  // Certificate main text.
  drawCanvasMainContent(
    ctx,
    centerX,
    attendeeName,
    eventTitle,
    formattedDate
  );

  // QR verification panel.
  await drawCanvasQr(
    ctx,
    qrDataUrl,
    certId
  );

  // Signatures and footer.
  await drawCanvasSignatures(
    ctx,
    preparedSignatures
  );

  return canvas.toDataURL("image/png");
}

// ============================================================================
// MAIN CERTIFICATE GENERATOR
// ============================================================================

export async function generateAttendeeCertificate(
  options: CertificateOptions
): Promise<GeneratedCertificate> {
  const { event, attendee } = options;

  // Only attended participants can receive certificates.
  if (!attendee.checked_in) {
    throw new Error(
      `Cannot generate certificate: ${attendee.full_name} is not marked as checked-in/present.`
    );
  }

  // Certificate ID.
  const certId =
    attendee.certificate_id ||
    `CEPRN-CERT-${(
      attendee.ticket_code ||
      attendee.id.substring(0, 8)
    ).toUpperCase()}`;

  const attendeeName = attendee.full_name
    .trim()
    .toUpperCase();

  const formattedDate = formatCertificateDate(
    event.start_date || new Date().toISOString()
  );

  // Verification URL.
  const baseUrl =
    typeof window !== "undefined" &&
    window.location.origin
      ? window.location.origin
      : "https://fossceprn.org";

  const verifyUrl =
    `${baseUrl}/verify-certificate?id=${encodeURIComponent(certId)}` +
    `&name=${encodeURIComponent(attendee.full_name)}` +
    `&email=${encodeURIComponent(attendee.email)}` +
    `&event=${encodeURIComponent(event.title)}` +
    `&date=${encodeURIComponent(formattedDate)}` +
    `&status=VALID`;

  // QR code.
  let qrDataUrl = "";

  try {
    qrDataUrl = await QRCode.toDataURL(
      verifyUrl,
      {
        width: 600,
        margin: 2,
        color: {
          dark: "#064e3b",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      }
    );
  } catch (error) {
    console.warn("QR generation failed:", error);
  }

  // Clean signature assets for better visibility.
  const preparedSignatures = await Promise.all(
    SIGNATURES.map((signature) =>
      prepareSignature(signature.src)
    )
  );

  // ==========================================================================
  // 1. PDF GENERATION
  // ==========================================================================

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Frame.
  drawPdfBorders(doc);

  // Logos and header.
  await drawPdfHeader(doc);

  // Main certificate text.
  drawPdfMainContent(
    doc,
    attendeeName,
    event.title,
    formattedDate
  );

  // QR.
  drawPdfQr(
    doc,
    qrDataUrl,
    certId
  );

  // Four signatures.
  await drawPdfSignatures(
    doc,
    preparedSignatures
  );

  // ==========================================================================
  // PDF OUTPUT
  // ==========================================================================

  const cleanName = attendee.full_name
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  const filename =
    `Certificate-${certId}-${cleanName}.pdf`;

  const pdfBlob = doc.output("blob");

  const pdfBase64 = doc
    .output("datauristring")
    .split(",")[1];

  // ==========================================================================
  // 2. HIGH-RESOLUTION PNG
  // ==========================================================================

  const pngDataUrl = await generateCertificatePng({
    attendeeName,
    eventTitle: event.title,
    formattedDate,
    certId,
    qrDataUrl,
    preparedSignatures,
  });

  // ==========================================================================
  // 3. GOOGLE DRIVE SYNC
  // ==========================================================================

  if (event.certificate_drive_link) {
    try {
      await syncCertificateToDrive({
        eventId: event.id,
        eventTitle: event.title,
        driveLink: event.certificate_drive_link,
        certificateId: certId,
        attendeeName: attendee.full_name,
        attendeeEmail: attendee.email,
        filename,
        pdfBlob,
        pdfBase64,
      });
    } catch (driveError) {
      console.warn(
        "Certificate Google Drive sync failed:",
        driveError
      );
    }
  }

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    certificateId: certId,
    pngDataUrl,
    pdfBlob,
    filename,
    pdfBase64,
  };
}
