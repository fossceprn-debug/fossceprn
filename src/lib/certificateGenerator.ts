// ============================================================================
// Official FOSS CEPrn Certificate Generator
// High-Resolution Selectable Vector PDF + Ultra-Crisp Canvas PNG
//
// Key Specifications:
// 1. Text is 100% SELECTABLE & COPYABLE in the generated PDF (native jsPDF vector text).
// 2. Status Verification QR Code is positioned cleanly on the RIGHT SIDE of the certificate.
// 3. Mathematically centered and aligned typography with elegant double borders.
// 4. Preserves ALL 4 authentic leadership signatures and designations:
//    * Ms. ABIYA DANIEL — COMMUNITY LEAD
//    * Ms. ANJU VENUGOPAL — FACULTY COORDINATOR
//    * Ms. SHAFEENA M B — FACULTY COORDINATOR
//    * Dr BEJOY ABRAHAM — PRINCIPAL
// 5. Preserves College of Engineering Perumon Crest & FOSS CEPRN Logo.
// 6. Dynamic fields: Participant Full Name (prominent bold uppercase), Event Title (bold emerald),
//    and Event Date ONLY (e.g. "24 November 2026") — STRICTLY NO TIME on the certificate.
// 7. Live verification URL embedded in QR Code (/verify-certificate).
// 8. Automatic Google Drive sync for attended participants.
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

/**
 * Format date for certificate presentation (e.g. "24 November 2026") — strictly NO TIME.
 */
export function formatCertificateDate(dateString: string | null | undefined): string {
  if (!dateString) return "Date TBA";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Generates an official event participation certificate for an attended participant.
 * Produces a PDF with true selectable/copyable vector text and right-side verification QR code.
 */
export async function generateAttendeeCertificate(
  options: CertificateOptions
): Promise<GeneratedCertificate> {
  const { event, attendee } = options;

  if (!attendee.checked_in) {
    throw new Error(
      `Cannot generate certificate: ${attendee.full_name} is not marked as checked-in/present.`
    );
  }

  const certId =
    attendee.certificate_id ||
    `CEPRN-CERT-${(attendee.ticket_code || attendee.id.substring(0, 8)).toUpperCase()}`;

  const attendeeName = attendee.full_name.trim().toUpperCase();
  const formattedDate = formatCertificateDate(event.start_date || new Date().toISOString());

  // Live verification URL
  const baseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://fossceprn.org";

  const verifyUrl = `${baseUrl}/verify-certificate?id=${encodeURIComponent(
    certId
  )}&name=${encodeURIComponent(attendee.full_name)}&email=${encodeURIComponent(
    attendee.email
  )}&event=${encodeURIComponent(event.title)}&date=${encodeURIComponent(
    formattedDate
  )}&status=VALID`;

  // Generate crisp QR code data URL
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 480,
      margin: 1,
      color: {
        dark: "#064e3b", // Deep emerald
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.warn("Failed to generate verification QR code:", err);
  }

  // --------------------------------------------------------------------------
  // 1. GENERATE VECTOR PDF (A4 Landscape: 297mm x 210mm)
  // All text is 100% selectable, copyable, and searchable!
  // --------------------------------------------------------------------------
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4", // 297 x 210 mm
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const cx = pageWidth / 2; // 148.5 mm

  // A. Elegant Double Border
  doc.setDrawColor(6, 78, 59); // Deep Emerald
  doc.setLineWidth(1.2);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setDrawColor(16, 185, 129); // Accent Emerald
  doc.setLineWidth(0.4);
  doc.rect(10.5, 10.5, pageWidth - 21, pageHeight - 21);

  // Geometric Corner Ornaments (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
  drawPdfCornerAccents(doc, pageWidth, pageHeight);

  // B. Top Crest & Logo (Centered)
  try {
    doc.addImage(crestLogoBase64, "JPEG", cx - 18, 13, 36, 16);
  } catch (e) {
    console.warn("Failed to embed crest logo into PDF:", e);
  }

  // C. Header Text (True Selectable Vector Text)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(6, 78, 59);
  doc.text("FREE AND OPEN SOURCE SOFTWARE CLUB", cx, 35, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("FOSSCEPRN  |  COLLEGE OF ENGINEERING PERUMON", cx, 40.5, { align: "center" });

  // D. Main Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(4, 120, 87);
  doc.text("CERTIFICATE OF PARTICIPATION", cx, 53, { align: "center" });

  // E. Award Subtitle
  doc.setFont("helvetica", "oblique");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text("This certificate is proudly awarded to", cx, 62, { align: "center" });

  // F. PARTICIPANT NAME (Centerpiece - Bold, Prominent, Selectable)
  doc.setFont("helvetica", "bold");
  let nameSize = 26;
  if (attendeeName.length > 28) nameSize = 20;
  else if (attendeeName.length > 22) nameSize = 23;
  doc.setFontSize(nameSize);
  doc.setTextColor(15, 23, 42); // Deep Charcoal Slate
  doc.text(attendeeName, cx, 78, { align: "center" });

  // Underline under Name
  const underlineW = Math.min(180, Math.max(90, attendeeName.length * 4.2));
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(cx - underlineW / 2, 81.5, cx + underlineW / 2, 81.5);

  // G. Description Paragraph (STRICTLY NO TIME)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85);
  doc.text("in recognition of their active participation in the", cx, 91, { align: "center" });

  doc.setFont("helvetica", "bold");
  let eventSize = 13;
  if (event.title.length > 36) eventSize = 11;
  doc.setFontSize(eventSize);
  doc.setTextColor(4, 120, 87); // Emerald Green
  doc.text(event.title, cx, 97.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `organized by Free and open source software club CEPRN, conducted on ${formattedDate},`,
    cx,
    104.5,
    { align: "center" }
  );

  doc.text(
    "in appreciation of their creativity and contribution towards shaping the visual identity of the community.",
    cx,
    110.5,
    { align: "center" }
  );

  // H. STATUS VERIFICATION QR CODE (Positioned cleanly on the RIGHT SIDE)
  if (qrDataUrl) {
    const qrBoxX = 242;
    const qrBoxY = 85;
    const qrBoxW = 42;
    const qrBoxH = 50;

    // Background card for QR code
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.4);
    doc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 2, 2, "FD");

    // QR Label Top
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(4, 120, 87);
    doc.text("SCAN TO VERIFY", qrBoxX + qrBoxW / 2, qrBoxY + 5.5, { align: "center" });

    // QR Image
    try {
      doc.addImage(qrDataUrl, "PNG", qrBoxX + 6, qrBoxY + 8, 30, 30);
    } catch (e) {
      console.warn("Failed to embed QR into PDF:", e);
    }

    // QR Label Bottom
    doc.setFont("courier", "bold");
    doc.setFontSize(5);
    doc.setTextColor(71, 85, 105);
    doc.text(certId, qrBoxX + qrBoxW / 2, qrBoxY + 41.5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(4, 120, 87);
    doc.text("OFFICIAL & VALID", qrBoxX + qrBoxW / 2, qrBoxY + 46, { align: "center" });
  }

  // I. THE 4 AUTHENTIC LEADERSHIP SIGNATURES (Evenly Spaced Row at Bottom)
  const sigY = 152;
  const colCenters = [45, 105, 165, 225]; // Centers for the 4 signatories

  // Signatory 1: Ms. ABIYA DANIEL (COMMUNITY LEAD)
  try {
    doc.addImage(sigCommunityLeadBase64, "JPEG", colCenters[0] - 15, sigY, 30, 16);
  } catch (e) {}
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.line(colCenters[0] - 22, sigY + 18, colCenters[0] + 22, sigY + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Ms. ABIYA DANIEL", colCenters[0], sigY + 23, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("COMMUNITY LEAD", colCenters[0], sigY + 27.5, { align: "center" });

  // Signatory 2: Ms. ANJU VENUGOPAL (FACULTY COORDINATOR)
  try {
    doc.addImage(sigFaculty1Base64, "JPEG", colCenters[1] - 13, sigY, 26, 16);
  } catch (e) {}
  doc.line(colCenters[1] - 22, sigY + 18, colCenters[1] + 22, sigY + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Ms. ANJU VENUGOPAL", colCenters[1], sigY + 23, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("FACULTY COORDINATOR", colCenters[1], sigY + 27.5, { align: "center" });

  // Signatory 3: Ms. SHAFEENA M B (FACULTY COORDINATOR)
  try {
    doc.addImage(sigFaculty2Base64, "JPEG", colCenters[2] - 15, sigY + 1, 30, 15);
  } catch (e) {}
  doc.line(colCenters[2] - 22, sigY + 18, colCenters[2] + 22, sigY + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Ms. SHAFEENA M B", colCenters[2], sigY + 23, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("FACULTY COORDINATOR", colCenters[2], sigY + 27.5, { align: "center" });

  // Signatory 4: Dr BEJOY ABRAHAM (PRINCIPAL)
  try {
    doc.addImage(sigPrincipalBase64, "JPEG", colCenters[3] - 14, sigY, 28, 16);
  } catch (e) {}
  doc.line(colCenters[3] - 22, sigY + 18, colCenters[3] + 22, sigY + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Dr BEJOY ABRAHAM", colCenters[3], sigY + 23, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("PRINCIPAL", colCenters[3], sigY + 27.5, { align: "center" });

  // Clean Name and Outputs
  const cleanName = attendee.full_name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Certificate-${certId}-${cleanName}.pdf`;
  const pdfBlob = doc.output("blob");
  const pdfBase64 = doc.output("datauristring").split(",")[1];

  // --------------------------------------------------------------------------
  // 2. GENERATE HIGH-RESOLUTION CANVAS PNG (2970 x 2100 px, 300 DPI retina)
  // Matching the exact vector layout for web preview & PNG download
  // --------------------------------------------------------------------------
  const pngDataUrl = await generateCertificatePng({
    event,
    attendee,
    certId,
    attendeeName,
    formattedDate,
    qrDataUrl,
  });

  // 3. Auto-sync to Google Drive if configured
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
    } catch (driveErr) {
      console.warn("Auto-sync to Google Drive noticed:", driveErr);
    }
  }

  return {
    certificateId: certId,
    pngDataUrl,
    pdfBlob,
    filename,
    pdfBase64,
  };
}

/**
 * Draws crisp geometric corner ornaments onto the jsPDF document.
 */
function drawPdfCornerAccents(doc: jsPDF, w: number, h: number) {
  const pad = 12;
  const len = 14;

  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(1.5);

  // Top Left
  doc.line(pad, pad, pad + len, pad);
  doc.line(pad, pad, pad, pad + len);

  // Top Right
  doc.line(w - pad, pad, w - pad - len, pad);
  doc.line(w - pad, pad, w - pad, pad + len);

  // Bottom Left
  doc.line(pad, h - pad, pad + len, h - pad);
  doc.line(pad, h - pad, pad, h - pad - len);

  // Bottom Right
  doc.line(w - pad, h - pad, w - pad - len, h - pad);
  doc.line(w - pad, h - pad, w - pad, h - pad - len);
}

/**
 * Renders an ultra-high-resolution (2970 x 2100 px, 300 DPI) certificate PNG.
 * Exactly matches the PDF vector layout with right-side QR code.
 */
async function generateCertificatePng(params: {
  event: EventItem;
  attendee: EventRegistration;
  certId: string;
  attendeeName: string;
  formattedDate: string;
  qrDataUrl: string;
}): Promise<string> {
  const { event, certId, attendeeName, formattedDate, qrDataUrl } = params;

  const width = 2970;
  const height = 2100;
  const cx = width / 2; // 1485

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire canvas context");

  // Pure white base
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Double Borders
  ctx.strokeStyle = "#064e3b";
  ctx.lineWidth = 12;
  ctx.strokeRect(80, 80, width - 160, height - 160);

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 4;
  ctx.strokeRect(105, 105, width - 210, height - 210);

  // Corner Accent Brackets
  const cornerPad = 120;
  const cornerLen = 140;
  ctx.strokeStyle = "#047857";
  ctx.lineWidth = 14;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(cornerPad, cornerPad);
  ctx.lineTo(cornerPad + cornerLen, cornerPad);
  ctx.moveTo(cornerPad, cornerPad);
  ctx.lineTo(cornerPad, cornerPad + cornerLen);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(width - cornerPad, cornerPad);
  ctx.lineTo(width - cornerPad - cornerLen, cornerPad);
  ctx.moveTo(width - cornerPad, cornerPad);
  ctx.lineTo(width - cornerPad, cornerPad + cornerLen);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(cornerPad, height - cornerPad);
  ctx.lineTo(cornerPad + cornerLen, height - cornerPad);
  ctx.moveTo(cornerPad, height - cornerPad);
  ctx.lineTo(cornerPad, height - cornerPad - cornerLen);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(width - cornerPad, height - cornerPad);
  ctx.lineTo(width - cornerPad - cornerLen, height - cornerPad);
  ctx.moveTo(width - cornerPad, height - cornerPad);
  ctx.lineTo(width - cornerPad, height - cornerPad - cornerLen);
  ctx.stroke();

  // Load and draw Crest & Logo
  const crestImg = new Image();
  crestImg.src = crestLogoBase64;
  await new Promise((r) => {
    crestImg.onload = () => r(true);
    crestImg.onerror = () => r(false);
  });
  ctx.drawImage(crestImg, cx - 180, 130, 360, 160);

  // Typography
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Organization Header
  ctx.fillStyle = "#064e3b";
  ctx.font = "bold 38px 'Montserrat', Arial, sans-serif";
  ctx.fillText("FREE AND OPEN SOURCE SOFTWARE CLUB", cx, 355);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 22px 'Montserrat', Arial, sans-serif";
  ctx.fillText("FOSSCEPRN  |  COLLEGE OF ENGINEERING PERUMON", cx, 405);

  // Main Title
  ctx.fillStyle = "#047857";
  ctx.font = "bold 64px 'Times New Roman', Georgia, serif";
  ctx.fillText("CERTIFICATE OF PARTICIPATION", cx, 530);

  // Subtitle
  ctx.fillStyle = "#64748b";
  ctx.font = "italic 28px 'Times New Roman', Georgia, serif";
  ctx.fillText("This certificate is proudly awarded to", cx, 620);

  // Participant Name (Prominent Centered Spotlight)
  ctx.fillStyle = "#0f172a";
  let nameFontSize = 74;
  if (attendeeName.length > 28) nameFontSize = 58;
  else if (attendeeName.length > 22) nameFontSize = 66;
  ctx.font = `bold ${nameFontSize}px 'Montserrat', 'Helvetica Neue', Arial, sans-serif`;
  ctx.fillText(attendeeName, cx, 780);

  // Underline under Name
  const lineW = Math.min(1800, Math.max(900, attendeeName.length * 42));
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - lineW / 2, 815);
  ctx.lineTo(cx + lineW / 2, 815);
  ctx.stroke();

  // Description
  ctx.fillStyle = "#334155";
  ctx.font = "500 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("in recognition of their active participation in the", cx, 910);

  ctx.fillStyle = "#047857";
  ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
  ctx.fillText(event.title, cx, 975);

  ctx.fillStyle = "#475569";
  ctx.font = "500 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    `organized by Free and open source software club CEPRN, conducted on ${formattedDate},`,
    cx,
    1045
  );
  ctx.fillText(
    "in appreciation of their creativity and contribution towards shaping the visual identity of the community.",
    cx,
    1105
  );

  // RIGHT SIDE: STATUS VERIFICATION QR CODE
  if (qrDataUrl) {
    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    await new Promise((r) => {
      qrImg.onload = () => r(true);
      qrImg.onerror = () => r(false);
    });

    const qrBoxX = 2420;
    const qrBoxY = 850;
    const qrBoxW = 420;
    const qrBoxH = 500;

    // Card background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH);

    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 4;
    ctx.strokeRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH);

    // Label Top
    ctx.fillStyle = "#047857";
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.fillText("SCAN TO VERIFY", qrBoxX + qrBoxW / 2, qrBoxY + 55);

    // QR Image
    ctx.drawImage(qrImg, qrBoxX + 60, qrBoxY + 80, 300, 300);

    // Label Bottom
    ctx.fillStyle = "#475569";
    ctx.font = "bold 15px monospace";
    ctx.fillText(certId, qrBoxX + qrBoxW / 2, qrBoxY + 415);

    ctx.fillStyle = "#047857";
    ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
    ctx.fillText("OFFICIAL & VALID", qrBoxX + qrBoxW / 2, qrBoxY + 460);
  }

  // BOTTOM ROW: 4 AUTHENTIC LEADERSHIP SIGNATURES
  const sigY = 1520;
  const colCenters = [450, 1050, 1650, 2250];

  const sigImages = [
    { src: sigCommunityLeadBase64, name: "Ms. ABIYA DANIEL", role: "COMMUNITY LEAD", w: 300, h: 160 },
    { src: sigFaculty1Base64, name: "Ms. ANJU VENUGOPAL", role: "FACULTY COORDINATOR", w: 260, h: 160 },
    { src: sigFaculty2Base64, name: "Ms. SHAFEENA M B", role: "FACULTY COORDINATOR", w: 300, h: 150 },
    { src: sigPrincipalBase64, name: "Dr BEJOY ABRAHAM", role: "PRINCIPAL", w: 280, h: 160 },
  ];

  for (let i = 0; i < sigImages.length; i++) {
    const sig = sigImages[i];
    const x = colCenters[i];

    const img = new Image();
    img.src = sig.src;
    await new Promise((r) => {
      img.onload = () => r(true);
      img.onerror = () => r(false);
    });

    ctx.drawImage(img, x - sig.w / 2, sigY, sig.w, sig.h);

    // Line
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x - 220, sigY + 180);
    ctx.lineTo(x + 220, sigY + 180);
    ctx.stroke();

    // Signatory Name
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.fillText(sig.name, x, sigY + 230);

    // Title
    ctx.fillStyle = "#64748b";
    ctx.font = "700 19px system-ui, -apple-system, sans-serif";
    ctx.fillText(sig.role, x, sigY + 275);
  }

  return canvas.toDataURL("image/png");
}
