
// ============================================================================
// Official FOSS CEPRN Certificate Generator
// High-Resolution Selectable Vector PDF + Ultra-Crisp Canvas PNG
//
// FEATURES:
// 1. Selectable and copyable PDF text.
// 2. College crest + FOSS CEPRN logo side by side.
// 3. Verification QR code on the right.
// 4. Four authentic leadership signatures.
// 5. Elegant double emerald borders.
// 6. Dynamic participant name, event title and event date.
// 7. No event time on certificate.
// 8. Live verification URL.
// 9. Automatic Google Drive synchronisation.
// 10. Matching PDF and PNG layouts.
// ============================================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { EventItem, EventRegistration } from "@/types";
import { syncCertificateToDrive } from "./driveSync";

import {
  crestLogoBase64,
  fossCeprnLogoBase64,
  sigCommunityLeadBase64,
  sigFaculty1Base64,
  sigFaculty2Base64,
  sigPrincipalBase64,
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
// DATE FORMATTER
// ============================================================================

export function formatCertificateDate(
  dateString: string | null | undefined
): string {
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

// ============================================================================
// IMAGE LOADER
// ============================================================================

function loadCertificateImage(
  src: string
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);

    img.src = src;
  });
}

// ============================================================================
// MAIN CERTIFICATE GENERATOR
// ============================================================================

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
    `CEPRN-CERT-${(
      attendee.ticket_code || attendee.id.substring(0, 8)
    ).toUpperCase()}`;

  const attendeeName = attendee.full_name.trim().toUpperCase();

  const formattedDate = formatCertificateDate(
    event.start_date || new Date().toISOString()
  );

  // --------------------------------------------------------------------------
  // VERIFICATION URL
  // --------------------------------------------------------------------------

  const baseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://fossceprn.org";

  const verifyUrl =
    `${baseUrl}/verify-certificate?id=${encodeURIComponent(certId)}` +
    `&name=${encodeURIComponent(attendee.full_name)}` +
    `&email=${encodeURIComponent(attendee.email)}` +
    `&event=${encodeURIComponent(event.title)}` +
    `&date=${encodeURIComponent(formattedDate)}` +
    `&status=VALID`;

  // --------------------------------------------------------------------------
  // GENERATE VERIFICATION QR
  // --------------------------------------------------------------------------

  let qrDataUrl = "";

  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 480,
      margin: 1,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.warn("Failed to generate verification QR:", err);
  }

  // ==========================================================================
  // 1. PDF GENERATION
  // ==========================================================================

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const cx = pageWidth / 2;

  // --------------------------------------------------------------------------
  // A. DOUBLE BORDER
  // --------------------------------------------------------------------------

  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.rect(10.5, 10.5, pageWidth - 21, pageHeight - 21);

  drawPdfCornerAccents(doc, pageWidth, pageHeight);

  // --------------------------------------------------------------------------
  // B. COLLEGE CREST + FOSS CEPRN LOGO
  // --------------------------------------------------------------------------

  try {
    // College of Engineering Perumon crest - LEFT
    doc.addImage(
      crestLogoBase64,
      "JPEG",
      cx - 28,
      13,
      20,
      16
    );
  } catch (err) {
    console.warn("College crest could not be added:", err);
  }

  try {
    // FOSS CEPRN logo - RIGHT
    doc.addImage(
      fossCeprnLogoBase64,
      "PNG",
      cx + 8,
      13,
      30,
      16
    );
  } catch (err) {
    console.warn("FOSS CEPRN logo could not be added:", err);
  }

  // --------------------------------------------------------------------------
  // C. ORGANIZATION HEADER
  // --------------------------------------------------------------------------

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(6, 78, 59);

  doc.text(
    "FREE AND OPEN SOURCE SOFTWARE CLUB",
    cx,
    35,
    { align: "center" }
  );

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(
    "FOSSCEPRN  |  COLLEGE OF ENGINEERING PERUMON",
    cx,
    40.5,
    { align: "center" }
  );

  // --------------------------------------------------------------------------
  // D. CERTIFICATE TITLE
  // --------------------------------------------------------------------------

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(4, 120, 87);

  doc.text(
    "CERTIFICATE OF PARTICIPATION",
    cx,
    53,
    { align: "center" }
  );

  // --------------------------------------------------------------------------
  // E. SUBTITLE
  // --------------------------------------------------------------------------

  doc.setFont("helvetica", "oblique");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);

  doc.text(
    "This certificate is proudly awarded to",
    cx,
    62,
    { align: "center" }
  );

  // --------------------------------------------------------------------------
  // F. PARTICIPANT NAME
  // --------------------------------------------------------------------------

  doc.setFont("helvetica", "bold");

  let nameSize = 26;

  if (attendeeName.length > 28) {
    nameSize = 20;
  } else if (attendeeName.length > 22) {
    nameSize = 23;
  }

  doc.setFontSize(nameSize);
  doc.setTextColor(15, 23, 42);

  doc.text(attendeeName, cx, 78, {
    align: "center",
    maxWidth: 190,
  });

  // Underline
  const underlineW = Math.min(
    180,
    Math.max(90, attendeeName.length * 4.2)
  );

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);

  doc.line(
    cx - underlineW / 2,
    81.5,
    cx + underlineW / 2,
    81.5
  );

  // --------------------------------------------------------------------------
  // G. EVENT DESCRIPTION
  // --------------------------------------------------------------------------

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85);

  doc.text(
    "in recognition of their active participation in the",
    cx,
    91,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");

  let eventSize = 13;

  if (event.title.length > 36) {
    eventSize = 11;
  }

  doc.setFontSize(eventSize);
  doc.setTextColor(4, 120, 87);

  doc.text(
    event.title,
    cx,
    97.5,
    {
      align: "center",
      maxWidth: 175,
    }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  doc.text(
    `organized by Free and open source software club CEPRN, conducted on ${formattedDate},`,
    cx,
    104.5,
    {
      align: "center",
      maxWidth: 190,
    }
  );

  doc.text(
    "in appreciation of their creativity and contribution towards shaping the visual identity of the community.",
    cx,
    110.5,
    {
      align: "center",
      maxWidth: 190,
    }
  );

  // --------------------------------------------------------------------------
  // H. RIGHT-SIDE VERIFICATION QR CODE
  // --------------------------------------------------------------------------

  if (qrDataUrl) {
    const qrBoxX = 242;
    const qrBoxY = 85;
    const qrBoxW = 42;
    const qrBoxH = 50;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.4);

    doc.roundedRect(
      qrBoxX,
      qrBoxY,
      qrBoxW,
      qrBoxH,
      2,
      2,
      "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(4, 120, 87);

    doc.text(
      "SCAN TO VERIFY",
      qrBoxX + qrBoxW / 2,
      qrBoxY + 5.5,
      { align: "center" }
    );

    try {
      doc.addImage(
        qrDataUrl,
        "PNG",
        qrBoxX + 6,
        qrBoxY + 8,
        30,
        30
      );
    } catch (err) {
      console.warn("QR embedding failed:", err);
    }

    doc.setFont("courier", "bold");
    doc.setFontSize(5);
    doc.setTextColor(71, 85, 105);

    doc.text(
      certId,
      qrBoxX + qrBoxW / 2,
      qrBoxY + 41.5,
      { align: "center", maxWidth: 38 }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(4, 120, 87);

    doc.text(
      "OFFICIAL & VALID",
      qrBoxX + qrBoxW / 2,
      qrBoxY + 46,
      { align: "center" }
    );
  }

  // ==========================================================================
  // I. FOUR AUTHENTIC LEADERSHIP SIGNATURES
  // ==========================================================================

  const sigY = 152;

  const colCenters = [45, 105, 165, 225];

  // Signature 1: COMMUNITY LEAD
  try {
    doc.addImage(
      sigCommunityLeadBase64,
      "JPEG",
      colCenters[0] - 15,
      sigY,
      30,
      16
    );
  } catch (err) {
    console.warn("Community Lead signature unavailable:", err);
  }

  drawPdfSignatureDetails(
    doc,
    colCenters[0],
    sigY,
    "Ms. ABIYA DANIEL",
    "COMMUNITY LEAD"
  );

  // Signature 2: FACULTY COORDINATOR
  try {
    doc.addImage(
      sigFaculty1Base64,
      "JPEG",
      colCenters[1] - 13,
      sigY,
      26,
      16
    );
  } catch (err) {
    console.warn("Faculty 1 signature unavailable:", err);
  }

  drawPdfSignatureDetails(
    doc,
    colCenters[1],
    sigY,
    "Ms. ANJU VENUGOPAL",
    "FACULTY COORDINATOR"
  );

  // Signature 3: FACULTY COORDINATOR
  try {
    doc.addImage(
      sigFaculty2Base64,
      "JPEG",
      colCenters[2] - 15,
      sigY + 1,
      30,
      15
    );
  } catch (err) {
    console.warn("Faculty 2 signature unavailable:", err);
  }

  drawPdfSignatureDetails(
    doc,
    colCenters[2],
    sigY,
    "Ms. SHAFEENA M B",
    "FACULTY COORDINATOR"
  );

  // Signature 4: PRINCIPAL
  try {
    doc.addImage(
      sigPrincipalBase64,
      "JPEG",
      colCenters[3] - 14,
      sigY,
      28,
      16
    );
  } catch (err) {
    console.warn("Principal signature unavailable:", err);
  }

  drawPdfSignatureDetails(
    doc,
    colCenters[3],
    sigY,
    "Dr BEJOY ABRAHAM",
    "PRINCIPAL"
  );

  // ==========================================================================
  // J. PDF OUTPUT
  // ==========================================================================

  const cleanName = attendee.full_name.replace(
    /[^a-zA-Z0-9_-]/g,
    "_"
  );

  const filename = `Certificate-${certId}-${cleanName}.pdf`;

  const pdfBlob = doc.output("blob");

  const pdfBase64 = doc
    .output("datauristring")
    .split(",")[1];

  // ==========================================================================
  // 2. HIGH-RESOLUTION PNG GENERATION
  // ==========================================================================

  const pngDataUrl = await generateCertificatePng({
    event,
    attendee,
    certId,
    attendeeName,
    formattedDate,
    qrDataUrl,
  });

  // ==========================================================================
  // 3. GOOGLE DRIVE SYNCHRONISATION
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
    } catch (driveErr) {
      console.warn(
        "Google Drive synchronisation failed:",
        driveErr
      );
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

// ============================================================================
// PDF SIGNATURE DETAILS HELPER
// ============================================================================

function drawPdfSignatureDetails(
  doc: jsPDF,
  x: number,
  y: number,
  name: string,
  designation: string
) {
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);

  doc.line(
    x - 22,
    y + 18,
    x + 22,
    y + 18
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  doc.text(name, x, y + 23, {
    align: "center",
    maxWidth: 55,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);

  doc.text(designation, x, y + 27.5, {
    align: "center",
    maxWidth: 55,
  });
}

// ============================================================================
// PDF CORNER DECORATIONS
// ============================================================================

function drawPdfCornerAccents(
  doc: jsPDF,
  w: number,
  h: number
) {
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

// ============================================================================
// 3. HIGH-RESOLUTION PNG GENERATOR
// ============================================================================

async function generateCertificatePng(params: {
  event: EventItem;
  attendee: EventRegistration;
  certId: string;
  attendeeName: string;
  formattedDate: string;
  qrDataUrl: string;
}): Promise<string> {
  const {
    event,
    certId,
    attendeeName,
    formattedDate,
    qrDataUrl,
  } = params;

  const width = 2970;
  const height = 2100;
  const cx = width / 2;

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not acquire canvas context");
  }

  // --------------------------------------------------------------------------
  // A. WHITE BACKGROUND
  // --------------------------------------------------------------------------

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // --------------------------------------------------------------------------
  // B. DOUBLE BORDER
  // --------------------------------------------------------------------------

  ctx.strokeStyle = "#064e3b";
  ctx.lineWidth = 12;

  ctx.strokeRect(
    80,
    80,
    width - 160,
    height - 160
  );

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 4;

  ctx.strokeRect(
    105,
    105,
    width - 210,
    height - 210
  );

  // --------------------------------------------------------------------------
  // C. CORNER DECORATIONS
  // --------------------------------------------------------------------------

  const cornerPad = 120;
  const cornerLen = 140;

  ctx.strokeStyle = "#047857";
  ctx.lineWidth = 14;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(cornerPad, cornerPad);
  ctx.lineTo(cornerPad + cornerLen, cornerPad);
  ctx.moveTo(cornerPad, cornerPad);
  ctx.lineTo(cornerPad, cornerPad + cornerLen);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(width - cornerPad, cornerPad);
  ctx.lineTo(width - cornerPad - cornerLen, cornerPad);
  ctx.moveTo(width - cornerPad, cornerPad);
  ctx.lineTo(width - cornerPad, cornerPad + cornerLen);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(cornerPad, height - cornerPad);
  ctx.lineTo(cornerPad + cornerLen, height - cornerPad);
  ctx.moveTo(cornerPad, height - cornerPad);
  ctx.lineTo(cornerPad, height - cornerPad - cornerLen);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(width - cornerPad, height - cornerPad);
  ctx.lineTo(width - cornerPad - cornerLen, height - cornerPad);
  ctx.moveTo(width - cornerPad, height - cornerPad);
  ctx.lineTo(width - cornerPad, height - cornerPad - cornerLen);
  ctx.stroke();

  // --------------------------------------------------------------------------
  // D. COLLEGE CREST + FOSS CEPRN LOGO
  // --------------------------------------------------------------------------

  const crestImg = await loadCertificateImage(crestLogoBase64);
  const fossImg = await loadCertificateImage(fossCeprnLogoBase64);

  // College crest - LEFT
  if (crestImg) {
    ctx.drawImage(
      crestImg,
      cx - 270,
      130,
      180,
      160
    );
  }

  // FOSS CEPRN logo - RIGHT
  if (fossImg) {
    ctx.drawImage(
      fossImg,
      cx + 90,
      130,
      300,
      160
    );
  }

  // --------------------------------------------------------------------------
  // E. TYPOGRAPHY SETTINGS
  // --------------------------------------------------------------------------

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // --------------------------------------------------------------------------
  // F. ORGANIZATION HEADER
  // --------------------------------------------------------------------------

  ctx.fillStyle = "#064e3b";
  ctx.font = "bold 38px 'Montserrat', Arial, sans-serif";

  ctx.fillText(
    "FREE AND OPEN SOURCE SOFTWARE CLUB",
    cx,
    355
  );

  ctx.fillStyle = "#475569";
  ctx.font = "bold 22px 'Montserrat', Arial, sans-serif";

  ctx.fillText(
    "FOSSCEPRN  |  COLLEGE OF ENGINEERING PERUMON",
    cx,
    405
  );

  // --------------------------------------------------------------------------
  // G. CERTIFICATE TITLE
  // --------------------------------------------------------------------------

  ctx.fillStyle = "#047857";
  ctx.font = "bold 64px 'Times New Roman', Georgia, serif";

  ctx.fillText(
    "CERTIFICATE OF PARTICIPATION",
    cx,
    530
  );

  // --------------------------------------------------------------------------
  // H. SUBTITLE
  // --------------------------------------------------------------------------

  ctx.fillStyle = "#64748b";
  ctx.font = "italic 28px 'Times New Roman', Georgia, serif";

  ctx.fillText(
    "This certificate is proudly awarded to",
    cx,
    620
  );

  // --------------------------------------------------------------------------
  // I. PARTICIPANT NAME
  // --------------------------------------------------------------------------

  ctx.fillStyle = "#0f172a";

  let nameFontSize = 74;

  if (attendeeName.length > 28) {
    nameFontSize = 58;
  } else if (attendeeName.length > 22) {
    nameFontSize = 66;
  }

  ctx.font = `bold ${nameFontSize}px 'Montserrat', Arial, sans-serif`;

  ctx.fillText(
    attendeeName,
    cx,
    780,
    2050
  );

  // Underline
  const lineW = Math.min(
    1800,
    Math.max(900, attendeeName.length * 42)
  );

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(cx - lineW / 2, 815);
  ctx.lineTo(cx + lineW / 2, 815);
  ctx.stroke();

  // --------------------------------------------------------------------------
  // J. EVENT DESCRIPTION
  // --------------------------------------------------------------------------

  ctx.fillStyle = "#334155";
  ctx.font = "500 28px system-ui, Arial, sans-serif";

  ctx.fillText(
    "in recognition of their active participation in the",
    cx,
    910
  );

  ctx.fillStyle = "#047857";
  ctx.font = "bold 36px system-ui, Arial, sans-serif";

  ctx.fillText(
    event.title,
    cx,
    975,
    2050
  );

  ctx.fillStyle = "#475569";
  ctx.font = "500 26px system-ui, Arial, sans-serif";

  ctx.fillText(
    `organized by Free and open source software club CEPRN, conducted on ${formattedDate},`,
    cx,
    1045,
    2050
  );

  ctx.fillText(
    "in appreciation of their creativity and contribution towards shaping the visual identity of the community.",
    cx,
    1105,
    2050
  );

  // --------------------------------------------------------------------------
  // K. RIGHT-SIDE VERIFICATION QR CODE
  // --------------------------------------------------------------------------

  if (qrDataUrl) {
    const qrImg = await loadCertificateImage(qrDataUrl);

    if (qrImg) {
      const qrBoxX = 2420;
      const qrBoxY = 850;
      const qrBoxW = 420;
      const qrBoxH = 500;

      // QR card background
      ctx.fillStyle = "#f8fafc";

      ctx.fillRect(
        qrBoxX,
        qrBoxY,
        qrBoxW,
        qrBoxH
      );

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 4;

      ctx.strokeRect(
        qrBoxX,
        qrBoxY,
        qrBoxW,
        qrBoxH
      );

      // Top label
      ctx.fillStyle = "#047857";
      ctx.font = "bold 18px system-ui, Arial, sans-serif";

      ctx.fillText(
        "SCAN TO VERIFY",
        qrBoxX + qrBoxW / 2,
        qrBoxY + 55
      );

      // QR image
      ctx.drawImage(
        qrImg,
        qrBoxX + 60,
        qrBoxY + 80,
        300,
        300
      );

      // Certificate ID
      ctx.fillStyle = "#475569";
      ctx.font = "bold 15px monospace";

      ctx.fillText(
        certId,
        qrBoxX + qrBoxW / 2,
        qrBoxY + 415
      );

      // Verification status
      ctx.fillStyle = "#047857";
      ctx.font = "bold 16px system-ui, Arial, sans-serif";

      ctx.fillText(
        "OFFICIAL & VALID",
        qrBoxX + qrBoxW / 2,
        qrBoxY + 460
      );
    }
  }

  // --------------------------------------------------------------------------
  // L. FOUR AUTHENTIC LEADERSHIP SIGNATURES
  // --------------------------------------------------------------------------

  const sigY = 1520;

  const colCenters = [
    450,
    1050,
    1650,
    2250,
  ];

  const sigImages = [
    {
      src: sigCommunityLeadBase64,
      name: "Ms. ABIYA DANIEL",
      role: "COMMUNITY LEAD",
      w: 300,
      h: 160,
    },
    {
      src: sigFaculty1Base64,
      name: "Ms. ANJU VENUGOPAL",
      role: "FACULTY COORDINATOR",
      w: 260,
      h: 160,
    },
    {
      src: sigFaculty2Base64,
      name: "Ms. SHAFEENA M B",
      role: "FACULTY COORDINATOR",
      w: 300,
      h: 150,
    },
    {
      src: sigPrincipalBase64,
      name: "Dr BEJOY ABRAHAM",
      role: "PRINCIPAL",
      w: 280,
      h: 160,
    },
  ];

  for (let i = 0; i < sigImages.length; i++) {
    const sig = sigImages[i];
    const x = colCenters[i];

    const img = await loadCertificateImage(sig.src);

    if (img) {
      ctx.drawImage(
        img,
        x - sig.w / 2,
        sigY,
        sig.w,
        sig.h
      );
    }

    // Signature line
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(x - 220, sigY + 180);
    ctx.lineTo(x + 220, sigY + 180);
    ctx.stroke();

    // Name
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 26px system-ui, Arial, sans-serif";

    ctx.fillText(
      sig.name,
      x,
      sigY + 230
    );

    // Designation
    ctx.fillStyle = "#64748b";
    ctx.font = "700 19px system-ui, Arial, sans-serif";

    ctx.fillText(
      sig.role,
      x,
      sigY + 275
    );
  }

  // --------------------------------------------------------------------------
  // M. EXPORT PNG
  // --------------------------------------------------------------------------

  return canvas.toDataURL("image/png");
}
