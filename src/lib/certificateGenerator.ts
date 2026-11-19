// ============================================================================
// FOSS CEPRN — CERTIFICATE GENERATOR
// A4 LANDSCAPE | PROFESSIONAL DESIGN | PDF + PNG
//
// DESIGN:
// - Reference-inspired modern certificate
// - College crest + FOSS CEPRN logo
// - Large certificate title and participant name
// - QR verification card on the right
// - Four signatures in an evenly spaced bottom row
// - Decorative corner designs
// - Matching PDF and PNG layout
// - Selectable PDF text
// - Google Drive sync
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

// ============================================================================
// TYPES
// ============================================================================

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
// PAGE SIZE
// ============================================================================

const PAGE_W = 297;
const PAGE_H = 210;

const SCALE = 10;

const GREEN = "#00965e";
const DARK_GREEN = "#006747";
const BRIGHT_GREEN = "#16b364";
const BLACK = "#101010";
const DARK = "#1f2937";
const GRAY = "#64748b";
const LIGHT_GRAY = "#d1d5db";
const WHITE = "#ffffff";

// ============================================================================
// SIGNATURES
// ============================================================================

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
// DATE FORMAT
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
    img.onerror = () => reject(new Error("Unable to load image"));

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

async function addPdfImage(
  doc: jsPDF,
  src: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  try {
    const img = await loadImage(src);

    const size = containSize(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      width,
      height
    );

    const finalX = x + (width - size.width) / 2;
    const finalY = y + (height - size.height) / 2;

    doc.addImage(
      src,
      "PNG",
      finalX,
      finalY,
      size.width,
      size.height
    );
  } catch (error) {
    console.warn("Certificate image failed:", error);
  }
}

function drawCanvasImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const size = containSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    width,
    height
  );

  ctx.drawImage(
    img,
    x + (width - size.width) / 2,
    y + (height - size.height) / 2,
    size.width,
    size.height
  );
}

// ============================================================================
// SIGNATURE CLEANUP
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

    const data = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;

        if (data[i + 3] === 0) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const brightness =
          0.299 * r +
          0.587 * g +
          0.114 * b;

        // Remove white scanned paper.
        if (brightness > 245) {
          data[i + 3] = 0;
          continue;
        }

        // Preserve anti-aliased ink edges.
        const opacity = Math.max(
          0,
          Math.min(1, (245 - brightness) / 180)
        );

        data[i + 3] = Math.round(
          data[i + 3] * opacity
        );

        // Improve signature contrast.
        data[i] = 22;
        data[i + 1] = 35;
        data[i + 2] = 48;

        if (data[i + 3] > 10) {
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

    const padding = Math.max(
      4,
      Math.round(Math.min(canvas.width, canvas.height) * 0.04)
    );

    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);

    const cropW = Math.min(
      canvas.width - cropX,
      maxX - minX + padding * 2
    );

    const cropH = Math.min(
      canvas.height - cropY,
      maxY - minY + padding * 2
    );

    const output = document.createElement("canvas");

    output.width = cropW;
    output.height = cropH;

    const outputCtx = output.getContext("2d");

    if (!outputCtx) return src;

    outputCtx.drawImage(
      canvas,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );

    return output.toDataURL("image/png");
  } catch (error) {
    console.warn("Signature processing failed:", error);
    return src;
  }
}

// ============================================================================
// PDF TEXT HELPERS
// ============================================================================

function fitText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number
) {
  let size = startSize;

  doc.setFontSize(size);

  while (
    doc.getTextWidth(text) > maxWidth &&
    size > minSize
  ) {
    size -= 0.5;
    doc.setFontSize(size);
  }

  return size;
}

function drawWrappedPdfText(
  doc: jsPDF,
  text: string,
  centerX: number,
  y: number,
  width: number,
  fontSize: number,
  lineHeight: number
) {
  doc.setFontSize(fontSize);

  const lines = doc.splitTextToSize(text, width);

  doc.text(lines, centerX, y, {
    align: "center",
  });

  return y + lines.length * lineHeight;
}

// ============================================================================
// PDF BORDER
// ============================================================================

function drawPdfFrame(doc: jsPDF) {
  // White background.
  doc.setFillColor(255, 255, 255);

  doc.rect(
    0,
    0,
    PAGE_W,
    PAGE_H,
    "F"
  );

  // Outer frame.
  doc.setDrawColor(35, 35, 35);
  doc.setLineWidth(0.55);

  doc.rect(
    7.5,
    7.5,
    PAGE_W - 15,
    PAGE_H - 15
  );

  // Inner frame.
  doc.setDrawColor(203, 203, 203);
  doc.setLineWidth(0.3);

  doc.rect(
    14,
    14,
    PAGE_W - 28,
    PAGE_H - 28
  );

  // Corner accents.
  drawPdfCorners(doc);
}

function drawPdfCorners(doc: jsPDF) {
  const length = 21;
  const margin = 14;

  doc.setLineWidth(1.4);

  doc.setDrawColor(0, 150, 94);

  // Top left.
  doc.line(
    margin,
    margin,
    margin + length,
    margin
  );

  doc.line(
    margin,
    margin,
    margin,
    margin + length
  );

  // Top right.
  doc.line(
    PAGE_W - margin,
    margin,
    PAGE_W - margin - length,
    margin
  );

  doc.line(
    PAGE_W - margin,
    margin,
    PAGE_W - margin,
    margin + length
  );

  // Bottom left.
  doc.line(
    margin,
    PAGE_H - margin,
    margin + length,
    PAGE_H - margin
  );

  doc.line(
    margin,
    PAGE_H - margin,
    margin,
    PAGE_H - margin - length
  );

  // Bottom right.
  doc.line(
    PAGE_W - margin,
    PAGE_H - margin,
    PAGE_W - margin - length,
    PAGE_H - margin
  );

  doc.line(
    PAGE_W - margin,
    PAGE_H - margin,
    PAGE_W - margin,
    PAGE_H - margin - length
  );

  // Center ornaments.
  doc.setFillColor(0, 150, 94);

  doc.circle(
    PAGE_W / 2,
    14,
    1.1,
    "F"
  );

  doc.circle(
    PAGE_W / 2,
    PAGE_H - 14,
    1.1,
    "F"
  );
}

// ============================================================================
// PDF HEADER
// ============================================================================

async function drawPdfHeader(doc: jsPDF) {
  const centerX = 130;

  // Logos side by side.
  await addPdfImage(
    doc,
    crestLogoBase64,
    91,
    15,
    25,
    20
  );

  await addPdfImage(
    doc,
    fossClubLogoBase64,
    126,
    15,
    38,
    20
  );

  // Club name.
  doc.setFont("helvetica", "bold");

  doc.setFontSize(11.5);
  doc.setTextColor(0, 80, 54);

  doc.text(
    "FREE AND OPEN SOURCE SOFTWARE CLUB",
    centerX,
    38,
    { align: "center" }
  );

  // Organization.
  doc.setFont("helvetica", "normal");

  doc.setFontSize(7.7);
  doc.setTextColor(45, 45, 45);

  doc.text(
    "FOSS CEPRN   |   COLLEGE OF ENGINEERING PERUMON",
    centerX,
    43,
    { align: "center" }
  );

  // Header line.
  doc.setDrawColor(0, 150, 94);
  doc.setLineWidth(0.4);

  doc.line(
    67,
    47,
    193,
    47
  );

  doc.setFillColor(0, 150, 94);

  doc.circle(
    centerX,
    47,
    0.9,
    "F"
  );
}

// ============================================================================
// PDF CERTIFICATE CONTENT
// ============================================================================

function drawPdfMainContent(
  doc: jsPDF,
  attendeeName: string,
  eventTitle: string,
  formattedDate: string
) {
  const centerX = 130;

  // Certificate title.
  doc.setFont("helvetica", "bold");

  doc.setFontSize(21);
  doc.setTextColor(0, 115, 75);

  doc.text(
    "CERTIFICATE OF PARTICIPATION",
    centerX,
    57,
    { align: "center" }
  );

  // Subtitle.
  doc.setFont("times", "italic");

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);

  doc.text(
    "This certificate is proudly awarded to",
    centerX,
    66,
    { align: "center" }
  );

  // Participant name.
  doc.setFont("helvetica", "bold");

  fitText(
    doc,
    attendeeName,
    190,
    25,
    14
  );

  doc.setTextColor(20, 20, 20);

  doc.text(
    attendeeName,
    centerX,
    78,
    { align: "center" }
  );

  // Name underline.
  const nameWidth = doc.getTextWidth(attendeeName);

  const lineWidth = Math.min(
    180,
    Math.max(90, nameWidth + 20)
  );

  doc.setDrawColor(0, 150, 94);
  doc.setLineWidth(0.65);

  doc.line(
    centerX - lineWidth / 2,
    82,
    centerX + lineWidth / 2,
    82
  );

  doc.setFillColor(0, 150, 94);

  doc.circle(
    centerX,
    82,
    0.85,
    "F"
  );

  // Participation text.
  doc.setFont("helvetica", "normal");

  doc.setFontSize(9.2);
  doc.setTextColor(50, 50, 50);

  doc.text(
    "in recognition of their active participation in",
    centerX,
    90,
    { align: "center" }
  );

  // Event title.
  doc.setFont("helvetica", "bold");

  doc.setFontSize(12.5);
  doc.setTextColor(0, 130, 80);

  const eventLines = doc.splitTextToSize(
    eventTitle,
    185
  );

  if (eventLines.length > 2) {
    doc.setFontSize(10.5);
  } else if (eventTitle.length > 40) {
    doc.setFontSize(11.5);
  }

  doc.text(
    eventLines,
    centerX,
    98,
    { align: "center" }
  );

  const eventBottom =
    98 + eventLines.length * 4.8;

  // Date.
  doc.setFont("helvetica", "normal");

  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);

  const dateText =
    `Organized by FOSS CEPRN, College of Engineering Perumon, conducted on ${formattedDate}.`;

  const dateLines = doc.splitTextToSize(
    dateText,
    185
  );

  const dateY = eventBottom + 4;

  doc.text(
    dateLines,
    centerX,
    dateY,
    { align: "center" }
  );

  // Appreciation text.
  doc.setFont("times", "italic");

  doc.setFontSize(7.8);
  doc.setTextColor(120, 120, 120);

  const appreciation =
    "With appreciation for their enthusiasm, learning, and contribution to the open-source community.";

  const appreciationLines = doc.splitTextToSize(
    appreciation,
    185
  );

  doc.text(
    appreciationLines,
    centerX,
    dateY + dateLines.length * 4 + 2,
    { align: "center" }
  );
}

// ============================================================================
// PDF QR CARD
// ============================================================================

function drawPdfQr(
  doc: jsPDF,
  qrDataUrl: string,
  certId: string
) {
  if (!qrDataUrl) return;

  const x = 244;
  const y = 75;
  const w = 42;
  const h = 59;

  // Card.
  doc.setFillColor(250, 253, 251);
  doc.setDrawColor(0, 150, 94);
  doc.setLineWidth(0.55);

  doc.roundedRect(
    x,
    y,
    w,
    h,
    2,
    2,
    "FD"
  );

  // Card heading.
  doc.setFillColor(0, 115, 75);

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

  doc.setFontSize(5.6);
  doc.setTextColor(255, 255, 255);

  doc.text(
    "CERTIFICATE VERIFICATION",
    x + w / 2,
    y + 6.7,
    { align: "center" }
  );

  // QR image.
  try {
    doc.addImage(
      qrDataUrl,
      "PNG",
      x + 5,
      y + 11,
      32,
      32
    );
  } catch (error) {
    console.warn("QR embedding failed:", error);
  }

  // Certificate ID.
  doc.setFont("courier", "bold");

  fitText(
    doc,
    certId,
    w - 5,
    5,
    3.5
  );

  doc.setTextColor(35, 35, 35);

  doc.text(
    certId,
    x + w / 2,
    y + 46,
    { align: "center" }
  );

  // Verification label.
  doc.setFont("helvetica", "bold");

  doc.setFontSize(5.4);
  doc.setTextColor(0, 115, 75);

  doc.text(
    "SCAN • VERIFY • AUTHENTIC",
    x + w / 2,
    y + 52,
    { align: "center" }
  );
}

// ============================================================================
// PDF SIGNATURES
// ============================================================================

async function drawPdfSignatures(
  doc: jsPDF,
  preparedSignatures: string[]
) {
  const centers = [39, 112, 185, 258];

  const imageY = 140;
  const imageH = 18;

  const lineY = 162;

  for (let i = 0; i < SIGNATURES.length; i++) {
    const signature = SIGNATURES[i];
    const center = centers[i];

    // Signature.
    await addPdfImage(
      doc,
      preparedSignatures[i] || signature.src,
      center - 22,
      imageY,
      44,
      imageH
    );

    // Signature baseline.
    doc.setDrawColor(110, 120, 130);
    doc.setLineWidth(0.35);

    doc.line(
      center - 23,
      lineY,
      center + 23,
      lineY
    );

    // Name.
    doc.setFont("helvetica", "bold");

    doc.setFontSize(7.1);
    doc.setTextColor(20, 20, 20);

    fitText(
      doc,
      signature.name,
      48,
      7.1,
      5.7
    );

    doc.text(
      signature.name,
      center,
      167,
      { align: "center" }
    );

    // Designation.
    doc.setFont("helvetica", "normal");

    doc.setFontSize(6.2);
    doc.setTextColor(70, 70, 70);

    doc.text(
      signature.role,
      center,
      172,
      { align: "center" }
    );
  }

  // Footer divider.
  doc.setDrawColor(0, 150, 94);
  doc.setLineWidth(0.3);

  doc.line(
    18,
    179,
    279,
    179
  );

  // Footer text.
  doc.setFont("times", "italic");

  doc.setFontSize(6.3);
  doc.setTextColor(120, 120, 120);

  doc.text(
    "FOSS CEPRN  •  College of Engineering Perumon",
    PAGE_W / 2,
    184,
    { align: "center" }
  );
}

// ============================================================================
// CANVAS DECORATION
// ============================================================================

function drawCanvasFrame(
  ctx: CanvasRenderingContext2D
) {
  // Background.
  ctx.fillStyle = WHITE;

  ctx.fillRect(
    0,
    0,
    PAGE_W,
    PAGE_H
  );

  // Outer border.
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 0.55;

  ctx.strokeRect(
    7.5,
    7.5,
    PAGE_W - 15,
    PAGE_H - 15
  );

  // Inner border.
  ctx.strokeStyle = "#d0d0d0";
  ctx.lineWidth = 0.3;

  ctx.strokeRect(
    14,
    14,
    PAGE_W - 28,
    PAGE_H - 28
  );

  // Corner designs.
  drawCanvasCorners(ctx);
}

function drawCanvasCorners(
  ctx: CanvasRenderingContext2D
) {
  // Top-left black/gray abstract blocks.
  ctx.fillStyle = "#111111";

  ctx.beginPath();

  ctx.moveTo(0, 0);
  ctx.lineTo(31, 0);
  ctx.lineTo(26, 22);
  ctx.lineTo(0, 18);

  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#666666";

  ctx.beginPath();

  ctx.moveTo(0, 18);
  ctx.lineTo(22, 23);
  ctx.lineTo(16, 43);
  ctx.lineTo(0, 40);

  ctx.closePath();
  ctx.fill();

  // Top-right green shapes.
  ctx.fillStyle = "#10b364";

  ctx.beginPath();

  ctx.moveTo(270, 0);
  ctx.lineTo(297, 0);
  ctx.lineTo(297, 18);
  ctx.lineTo(279, 26);

  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#16b364";
  ctx.lineWidth = 1.1;

  ctx.beginPath();

  ctx.moveTo(268, 8);
  ctx.lineTo(281, 35);
  ctx.lineTo(297, 29);

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(265, 14);
  ctx.lineTo(278, 37);
  ctx.lineTo(297, 32);

  ctx.stroke();

  // Bottom-left green accent.
  ctx.strokeStyle = "#10b364";
  ctx.lineWidth = 1.1;

  for (let i = 0; i < 3; i++) {
    const offset = i * 4;

    ctx.beginPath();

    ctx.moveTo(0, 197 - offset);
    ctx.lineTo(26 - offset, 197 - offset);
    ctx.lineTo(22 - offset, 210 - offset);

    ctx.stroke();
  }

  // Bottom-right dotted pattern.
  ctx.fillStyle = "#dddddd";

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const x = 277 + col * 3;
      const y = 184 + row * 3;

      if (x > PAGE_W || y > PAGE_H) continue;

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        1.35,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }

  // Dark green dots in the pattern.
  ctx.fillStyle = "#333333";

  ctx.beginPath();
  ctx.arc(285, 193, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(291, 187, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================================
// CANVAS TEXT HELPERS
// ============================================================================

function canvasFitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
  minimumSize: number,
  family = "Arial",
  weight = "bold"
) {
  let size = initialSize;

  while (size > minimumSize) {
    ctx.font = `${weight} ${size}px ${family}`;

    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }

    size -= 0.2;
  }

  ctx.font = `${weight} ${size}px ${family}`;

  return size;
}

function canvasWrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current
      ? `${current} ${word}`
      : word;

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

// ============================================================================
// CANVAS HEADER
// ============================================================================

async function drawCanvasHeader(
  ctx: CanvasRenderingContext2D
) {
  const centerX = 130;

  const crest = await loadImage(crestLogoBase64);
  const foss = await loadImage(fossClubLogoBase64);

  // Logos.
  drawCanvasImage(
    ctx,
    crest,
    91,
    15,
    25,
    20
  );

  drawCanvasImage(
    ctx,
    foss,
    126,
    15,
    38,
    20
  );

  // Club name.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#005036";

  ctx.font = "bold 3.8px Arial";

  ctx.fillText(
    "FREE AND OPEN SOURCE SOFTWARE CLUB",
    centerX,
    38
  );

  // Organization.
  ctx.fillStyle = "#333333";

  ctx.font = "3px Arial";

  ctx.fillText(
    "FOSS CEPRN  |  COLLEGE OF ENGINEERING PERUMON",
    centerX,
    43
  );

  // Divider.
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 0.4;

  ctx.beginPath();

  ctx.moveTo(67, 47);
  ctx.lineTo(193, 47);

  ctx.stroke();

  ctx.fillStyle = GREEN;

  ctx.beginPath();

  ctx.arc(
    centerX,
    47,
    0.9,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

// ============================================================================
// CANVAS MAIN CONTENT
// ============================================================================

function drawCanvasMainContent(
  ctx: CanvasRenderingContext2D,
  attendeeName: string,
  eventTitle: string,
  formattedDate: string
) {
  const centerX = 130;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Title.
  ctx.fillStyle = "#00734b";

  canvasFitFont(
    ctx,
    "CERTIFICATE OF PARTICIPATION",
    205,
    8,
    5.5,
    "Georgia",
    "bold"
  );

  ctx.fillText(
    "CERTIFICATE OF PARTICIPATION",
    centerX,
    57
  );

  // Subtitle.
  ctx.fillStyle = "#777777";

  ctx.font = "italic 3.4px Georgia";

  ctx.fillText(
    "This certificate is proudly awarded to",
    centerX,
    66
  );

  // Name.
  ctx.fillStyle = "#111111";

  canvasFitFont(
    ctx,
    attendeeName,
    190,
    7.5,
    4.5,
    "Arial",
    "bold"
  );

  ctx.fillText(
    attendeeName,
    centerX,
    78
  );

  // Name underline.
  const nameWidth = ctx.measureText(attendeeName).width;

  const lineWidth = Math.min(
    180,
    Math.max(90, nameWidth + 20)
  );

  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 0.65;

  ctx.beginPath();

  ctx.moveTo(
    centerX - lineWidth / 2,
    82
  );

  ctx.lineTo(
    centerX + lineWidth / 2,
    82
  );

  ctx.stroke();

  ctx.fillStyle = GREEN;

  ctx.beginPath();

  ctx.arc(
    centerX,
    82,
    0.85,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Participation sentence.
  ctx.fillStyle = "#333333";

  ctx.font = "3.3px Arial";

  ctx.fillText(
    "in recognition of their active participation in",
    centerX,
    90
  );

  // Event title.
  ctx.fillStyle = "#008250";

  canvasFitFont(
    ctx,
    eventTitle,
    185,
    4.4,
    3,
    "Arial",
    "bold"
  );

  const eventLines = canvasWrap(
    ctx,
    eventTitle,
    185
  );

  const eventY = 98;
  const eventLineHeight = 5;

  eventLines.forEach((line, index) => {
    ctx.fillText(
      line,
      centerX,
      eventY + index * eventLineHeight
    );
  });

  // Event date.
  ctx.fillStyle = "#4b5563";

  ctx.font = "2.7px Arial";

  const description =
    `Organized by FOSS CEPRN, College of Engineering Perumon, conducted on ${formattedDate}.`;

  const dateLines = canvasWrap(
    ctx,
    description,
    185
  );

  const dateY =
    eventY + eventLines.length * eventLineHeight + 4;

  dateLines.forEach((line, index) => {
    ctx.fillText(
      line,
      centerX,
      dateY + index * 3.5
    );
  });

  // Appreciation.
  ctx.fillStyle = "#888888";

  ctx.font = "italic 2.7px Georgia";

  const appreciation =
    "With appreciation for their enthusiasm, learning, and contribution to the open-source community.";

  const appreciationLines = canvasWrap(
    ctx,
    appreciation,
    185
  );

  const appreciationY =
    dateY + dateLines.length * 3.5 + 2;

  appreciationLines.forEach((line, index) => {
    ctx.fillText(
      line,
      centerX,
      appreciationY + index * 3.5
    );
  });
}

// ============================================================================
// CANVAS QR
// ============================================================================

async function drawCanvasQr(
  ctx: CanvasRenderingContext2D,
  qrDataUrl: string,
  certId: string
) {
  if (!qrDataUrl) return;

  try {
    const qr = await loadImage(qrDataUrl);

    const x = 244;
    const y = 75;
    const w = 42;
    const h = 59;

    // Card.
    ctx.fillStyle = "#fbfdfc";
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 0.55;

    ctx.beginPath();

    ctx.roundRect(
      x,
      y,
      w,
      h,
      2
    );

    ctx.fill();
    ctx.stroke();

    // Header.
    ctx.fillStyle = DARK_GREEN;

    ctx.beginPath();

    ctx.roundRect(
      x + 3,
      y + 3,
      w - 6,
      5.5,
      1
    );

    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = WHITE;
    ctx.font = "bold 1.8px Arial";

    ctx.fillText(
      "CERTIFICATE VERIFICATION",
      x + w / 2,
      y + 6.7
    );

    // QR.
    ctx.drawImage(
      qr,
      x + 5,
      y + 11,
      32,
      32
    );

    // Certificate ID.
    ctx.fillStyle = "#222222";

    canvasFitFont(
      ctx,
      certId,
      w - 5,
      1.65,
      1.1,
      "monospace",
      "bold"
    );

    ctx.fillText(
      certId,
      x + w / 2,
      y + 46
    );

    // Footer.
    ctx.fillStyle = GREEN;
    ctx.font = "bold 1.65px Arial";

    ctx.fillText(
      "SCAN • VERIFY • AUTHENTIC",
      x + w / 2,
      y + 52
    );
  } catch (error) {
    console.warn("PNG QR rendering failed:", error);
  }
}

// ============================================================================
// CANVAS SIGNATURES
// ============================================================================

async function drawCanvasSignatures(
  ctx: CanvasRenderingContext2D,
  preparedSignatures: string[]
) {
  const centers = [39, 112, 185, 258];

  const imageY = 140;
  const imageH = 18;

  const lineY = 162;

  for (let i = 0; i < SIGNATURES.length; i++) {
    const signature = SIGNATURES[i];
    const center = centers[i];

    try {
      const img = await loadImage(
        preparedSignatures[i] || signature.src
      );

      drawCanvasImage(
        ctx,
        img,
        center - 22,
        imageY,
        44,
        imageH
      );
    } catch (error) {
      console.warn(
        "Canvas signature failed:",
        signature.name,
        error
      );
    }

    // Signature line.
    ctx.strokeStyle = "#7c8794";
    ctx.lineWidth = 0.35;

    ctx.beginPath();

    ctx.moveTo(
      center - 23,
      lineY
    );

    ctx.lineTo(
      center + 23,
      lineY
    );

    ctx.stroke();

    // Name.
    ctx.fillStyle = "#111111";

    canvasFitFont(
      ctx,
      signature.name,
      48,
      2.5,
      1.8,
      "Arial",
      "bold"
    );

    ctx.fillText(
      signature.name,
      center,
      167
    );

    // Designation.
    ctx.fillStyle = "#555555";

    ctx.font = "2.1px Arial";

    ctx.fillText(
      signature.role,
      center,
      172
    );
  }

  // Footer divider.
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 0.3;

  ctx.beginPath();

  ctx.moveTo(18, 179);
  ctx.lineTo(279, 179);

  ctx.stroke();

  // Footer.
  ctx.fillStyle = "#888888";

  ctx.font = "italic 2.1px Georgia";

  ctx.textAlign = "center";

  ctx.fillText(
    "FOSS CEPRN  •  College of Engineering Perumon",
    PAGE_W / 2,
    184
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

  const canvas = document.createElement("canvas");

  canvas.width = PAGE_W * SCALE;
  canvas.height = PAGE_H * SCALE;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not available");
  }

  // Scale canvas into mm-based layout coordinates.
  ctx.scale(SCALE, SCALE);

  // Frame.
  drawCanvasFrame(ctx);

  // Header.
  await drawCanvasHeader(ctx);

  // Main certificate content.
  drawCanvasMainContent(
    ctx,
    attendeeName,
    eventTitle,
    formattedDate
  );

  // QR.
  await drawCanvasQr(
    ctx,
    qrDataUrl,
    certId
  );

  // Signatures.
  await drawCanvasSignatures(
    ctx,
    preparedSignatures
  );

  return canvas.toDataURL("image/png");
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

export async function generateAttendeeCertificate(
  options: CertificateOptions
): Promise<GeneratedCertificate> {
  const { event, attendee } = options;

  // Must be checked in.
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

  // QR generation.
  let qrDataUrl = "";

  try {
    qrDataUrl = await QRCode.toDataURL(
      verifyUrl,
      {
        width: 800,
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

  // Prepare signatures.
  const preparedSignatures = await Promise.all(
    SIGNATURES.map((signature) =>
      prepareSignature(signature.src)
    )
  );

  // ==========================================================================
  // PDF
  // ==========================================================================

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  drawPdfFrame(doc);

  await drawPdfHeader(doc);

  drawPdfMainContent(
    doc,
    attendeeName,
    event.title,
    formattedDate
  );

  drawPdfQr(
    doc,
    qrDataUrl,
    certId
  );

  await drawPdfSignatures(
    doc,
    preparedSignatures
  );

  // ==========================================================================
  // OUTPUT
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
  // PNG
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
  // GOOGLE DRIVE SYNC
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
