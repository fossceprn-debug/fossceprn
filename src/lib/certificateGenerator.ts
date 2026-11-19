// ============================================================================
// Official FOSS CEPrn Certificate of Appreciation / Participation
// Generated from Authentic Master Reference (Preserving exact 4 Signatures & Logos)
//
// Strict Standards:
// 1. Preserves exact College of Engineering Perumon Crest & FOSS CEPRN Logo.
// 2. Preserves authentic official headers & corner geometric ornaments.
// 3. Preserves ALL 4 AUTHENTIC LEADERSHIP SIGNATURES, names, and designations:
//    * Ms. ABIYA DANIEL — COMMUNITY LEAD
//    * Ms. ANJU VENUGOPAL — FACULTY COORDINATOR
//    * Ms. SHAFEENA M B — FACULTY COORDINATOR
//    * Dr BEJOY ABRAHAM — PRINCIPAL
// 4. Dynamic fields:
//    - Participant Full Name (prominently centered in bold uppercase).
//    - Event Title (bold emerald).
//    - Event Date ONLY (e.g. "19 November 2026") — STRICTLY NO TIME.
//    - Symmetrical, centered institutional verification QR seal.
// 5. High-resolution output (3392 x 2631 canvas, 300 DPI retina clarity).
// ============================================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { EventItem, EventRegistration } from "@/types";

export interface CertificateOptions {
  event: EventItem;
  attendee: EventRegistration;
}

export interface GeneratedCertificate {
  certificateId: string;
  pngDataUrl: string;
  pdfBlob: Blob;
  filename: string;
}

/**
 * Format date for certificate presentation (e.g. "19 November 2026") — strictly NO TIME.
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
 * Generates an official event participation/appreciation certificate for an attended participant.
 * STRICT: Throws if attendee is not checked in.
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

  // Canvas resolution: 3392 x 2631 (matching high-res reference master template)
  const width = 3392;
  const height = 2631;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire canvas 2D context");

  // Determine template URL (Coordinator custom URL or default official master)
  const templateUrl =
    event.certificate_template_url || "/templates/certificate-master.png";

  // Build the live verification URL embedded in the QR Code
  const baseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://fossceprn.org";
  const certDateParam = formatCertificateDate(event.start_date || new Date().toISOString());
  const verifyUrl = `${baseUrl}/verify-certificate?id=${encodeURIComponent(
    certId
  )}&name=${encodeURIComponent(attendee.full_name)}&email=${encodeURIComponent(
    attendee.email
  )}&event=${encodeURIComponent(event.title)}&date=${encodeURIComponent(
    certDateParam
  )}&status=VALID`;

  // Generate the Verification QR Code as high-res DataURL
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 400,
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

  // Load the template image
  const bgImg = new Image();
  bgImg.crossOrigin = "anonymous";
  bgImg.src = templateUrl;

  const imageLoaded = await new Promise<boolean>((resolve) => {
    bgImg.onload = () => resolve(true);
    bgImg.onerror = () => {
      // Try fallback sample if master is not reachable
      if (!templateUrl.includes("certificate-sample.jpg")) {
        bgImg.src = "/templates/certificate-sample.jpg";
      } else {
        resolve(false);
      }
    };
  });

  if (imageLoaded && bgImg.naturalWidth) {
    // ------------------------------------------------------------------------
    // CASE A: Render on top of the authentic Master Certificate Template
    // ------------------------------------------------------------------------
    ctx.drawImage(bgImg, 0, 0, width, height);

    const isOfficialTemplate =
      templateUrl.includes("certificate-master.png") ||
      templateUrl.includes("certificate-sample.jpg") ||
      !event.certificate_template_url;

    if (isOfficialTemplate) {
      const cx = width / 2; // 1696

      // 1. Cleanly clear the dynamic central region
      // (Leaves top headers/logos y < 1000 and bottom 4 signatures y > 1860 100% untouched)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(350, 1030, 2692, 800);

      // 2. Participant Full Name (prominently centered, bold, elegant uppercase)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#0f172a"; // Deep Slate / Charcoal

      const attendeeName = attendee.full_name.trim().toUpperCase();
      let nameFontSize = 84;
      if (attendeeName.length > 28) nameFontSize = 66;
      else if (attendeeName.length > 22) nameFontSize = 74;

      ctx.font = `bold ${nameFontSize}px 'Montserrat', 'Helvetica Neue', Arial, sans-serif`;
      ctx.fillText(attendeeName, cx, 1170);

      // 3. Body Text (Flowing institutional typography — STRICTLY NO TIME)
      ctx.fillStyle = "#334155";
      ctx.font =
        "500 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(
        "in recognition of their active participation in the",
        cx,
        1310
      );

      // Event Title (Bold Emerald)
      let titleFontSize = 46;
      if (event.title.length > 40) titleFontSize = 38;
      else if (event.title.length > 30) titleFontSize = 42;

      ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = "#047857";
      ctx.fillText(event.title, cx, 1375);

      // Organization & Date (NO TIME)
      ctx.font =
        "500 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#475569";
      const formattedDate = formatCertificateDate(
        event.start_date || new Date().toISOString()
      );

      ctx.fillText(
        `organized by the Free and open source software club CEPRN, conducted on ${formattedDate},`,
        cx,
        1435
      );

      ctx.fillText(
        "in appreciation of their creativity and contribution towards shaping the visual identity of the community.",
        cx,
        1495
      );

      // 4. Centered Symmetrical Verification Seal & QR Code (y: 1570 to 1820)
      if (qrDataUrl) {
        await drawCenteredVerificationSeal(ctx, qrDataUrl, certId, cx, 1565);
      }
    } else {
      // Custom Coordinator-Uploaded Template
      const cx = width / 2;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 80px 'Times New Roman', Georgia, serif";
      ctx.fillText(attendee.full_name, cx, height * 0.52);

      ctx.font = "italic 44px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#047857";
      ctx.fillText(event.title, cx, height * 0.62);

      ctx.font = "600 32px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#475569";
      const formattedDate = formatCertificateDate(
        event.start_date || new Date().toISOString()
      );
      ctx.fillText(
        `Conducted on ${formattedDate} • Certificate ID: ${certId}`,
        cx,
        height * 0.7
      );

      if (qrDataUrl) {
        await drawCenteredVerificationSeal(ctx, qrDataUrl, certId, cx, height * 0.77);
      }
    }
  } else {
    // ------------------------------------------------------------------------
    // CASE B: Full High-End Vector Certificate Fallback
    // ------------------------------------------------------------------------
    await drawFallbackOfficialCertificate(
      ctx,
      width,
      height,
      event,
      attendee,
      certId,
      qrDataUrl
    );
  }

  const pngDataUrl = canvas.toDataURL("image/png");

  // Create A4 Landscape PDF using jsPDF (297mm x 210mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  doc.addImage(pngDataUrl, "PNG", 0, 0, 297, 210, undefined, "FAST");

  const cleanName = attendee.full_name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Certificate-${certId}-${cleanName}.pdf`;
  const pdfBlob = doc.output("blob");

  return {
    certificateId: certId,
    pngDataUrl,
    pdfBlob,
    filename,
  };
}

/**
 * Draws the elegant, symmetrical verification seal centered horizontally.
 */
async function drawCenteredVerificationSeal(
  ctx: CanvasRenderingContext2D,
  qrDataUrl: string,
  certId: string,
  cx: number,
  startY: number
) {
  const qrSize = 136;
  const qrX = cx - qrSize / 2;
  const qrY = startY + 10;

  // Flanking decorative lines
  const lineY = qrY + qrSize / 2;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;

  // Left line with diamond
  ctx.beginPath();
  ctx.moveTo(cx - 520, lineY);
  ctx.lineTo(cx - 105, lineY);
  ctx.stroke();

  ctx.fillStyle = "#10b981";
  drawDiamond(ctx, cx - 105, lineY, 6);

  // Right line with diamond
  ctx.beginPath();
  ctx.moveTo(cx + 105, lineY);
  ctx.lineTo(cx + 520, lineY);
  ctx.stroke();

  drawDiamond(ctx, cx + 105, lineY, 6);

  // QR Container Box
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.06)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
  ctx.fill();
  ctx.restore();

  // Thin emerald border
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2;
  roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
  ctx.stroke();

  // QR Image
  const qrImg = new Image();
  qrImg.src = qrDataUrl;
  await new Promise((res) => {
    qrImg.onload = () => res(true);
    qrImg.onerror = () => res(false);
  });
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Under-QR verification label
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#047857";
  ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
  ctx.fillText("✓ SCAN TO VERIFY CERTIFICATE", cx, qrY + qrSize + 25);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 14px monospace";
  ctx.fillText(certId, cx, qrY + qrSize + 45);
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Fallback vector certificate with the EXACT 4 leadership signatures and branding.
 */
async function drawFallbackOfficialCertificate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  event: EventItem,
  attendee: EventRegistration,
  certId: string,
  qrDataUrl: string
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 14;
  ctx.strokeStyle = "#064e3b";
  ctx.strokeRect(50, 50, width - 100, height - 100);

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#10b981";
  ctx.strokeRect(74, 74, width - 148, height - 148);

  const cx = width / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#064e3b";
  ctx.font = "800 40px system-ui, -apple-system, sans-serif";
  ctx.fillText("FREE AND OPEN SOURCE SOFTWARE CLUB", cx, 200);

  ctx.fillStyle = "#047857";
  ctx.font = "700 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSSCEPRN  |  COLLEGE OF ENGINEERING PERUMON", cx, 250);

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 400, 290);
  ctx.lineTo(cx + 400, 290);
  ctx.stroke();

  ctx.fillStyle = "#047857";
  ctx.font = "900 70px system-ui, -apple-system, sans-serif";
  ctx.fillText("CERTIFICATE OF APPRECIATION", cx, 410);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 32px system-ui, -apple-system, sans-serif";
  ctx.fillText("This certificate is proudly awarded to", cx, 510);

  ctx.fillStyle = "#0f172a";
  ctx.font =
    "bold 86px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(attendee.full_name.toUpperCase(), cx, 660);

  ctx.fillStyle = "#334155";
  ctx.font = "500 34px system-ui, -apple-system, sans-serif";
  ctx.fillText("in recognition of their active participation in the", cx, 790);

  ctx.fillStyle = "#047857";
  ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
  ctx.fillText(event.title, cx, 870);

  ctx.fillStyle = "#475569";
  ctx.font = "500 32px system-ui, -apple-system, sans-serif";
  const formattedDate = formatCertificateDate(
    event.start_date || new Date().toISOString()
  );
  ctx.fillText(
    `organized by the Free and open source software club CEPRN, conducted on ${formattedDate},`,
    cx,
    940
  );
  ctx.fillText(
    "in appreciation of their creativity and contribution towards shaping the visual identity of the community.",
    cx,
    995
  );

  if (qrDataUrl) {
    await drawCenteredVerificationSeal(ctx, qrDataUrl, certId, cx, 1070);
  }

  // EXACT 4 LEADERSHIP SIGNATURES
  const sigY = height - 360;
  const colWidth = (width - 400) / 4;

  const signatories = [
    { name: "Ms. ABIYA DANIEL", role: "COMMUNITY LEAD" },
    { name: "Ms. ANJU VENUGOPAL", role: "FACULTY COORDINATOR" },
    { name: "Ms. SHAFEENA M B", role: "FACULTY COORDINATOR" },
    { name: "Dr BEJOY ABRAHAM", role: "PRINCIPAL" },
  ];

  signatories.forEach((sig, idx) => {
    const colX = 200 + idx * colWidth + colWidth / 2;

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(colX - 160, sigY);
    ctx.lineTo(colX + 160, sigY);
    ctx.stroke();

    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(sig.name, colX, sigY + 50);

    ctx.font = "700 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(sig.role, colX, sigY + 86);
  });

  ctx.textAlign = "left";
  ctx.font = "600 20px monospace";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`Certificate ID: ${certId}`, 100, height - 90);
  ctx.fillText(`Recipient Gmail: ${attendee.email}`, 100, height - 60);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
