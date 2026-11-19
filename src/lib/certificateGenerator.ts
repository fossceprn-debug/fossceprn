// ============================================================================
// Official FOSS CEPrn Certificate of Appreciation / Participation
// Generated from the official user-provided template (media_1795064593090_50c5befc.jpg)
//
// Requirements:
// 1. Uses the official template:
//    - Preserves College of Engineering Perumon Crest & FOSS CEPRN logo.
//    - Preserves "FREE AND OPEN SOURCE SOFTWARE CLUB", "FOSSCEPRN | COLLEGE OF ENGINEERING PERUMON",
//      "CERTIFICATE OF APPRECIATION", and "This certificate is proudly awarded to".
//    - Preserves the 4 authentic leadership signatures:
//      * Ms. ABIYA DANIEL — COMMUNITY LEAD
//      * Ms. ANJU VENUGOPAL — FACULTY COORDINATOR
//      * Ms. SHAFEENA M B — FACULTY COORDINATOR
//      * Dr BEJOY ABRAHAM — PRINCIPAL
//    - Preserves all corner geometric ornaments.
// 2. Dynamic text:
//    - Participant's Name (bold uppercase, centered directly above the printed line).
//    - Event Name in bold emerald.
//    - Event Date (e.g. "19 November 2026") — STRICTLY NO TIME.
//    - STRICTLY NO QR CODE on the certificate.
// 3. High-resolution canvas (2048 x 1448 px) and A4 landscape PDF output.
// 4. Automatically stores and syncs to provided Google Drive folder link.
// ============================================================================

import jsPDF from "jspdf";
import type { EventItem, EventRegistration } from "@/types";
import { syncCertificateToDrive } from "./driveSync";

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
 * Generates an official event participation certificate for an attended participant.
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

  // Canvas resolution: 2048 x 1448 (2x of sample 1024 x 724)
  const width = 2048;
  const height = 1448;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire canvas 2D context");

  // Determine template URL (Coordinator custom URL or default official template)
  const templateUrl =
    event.certificate_template_url || "/templates/certificate-user-template.jpg";

  // Load the template image
  const bgImg = new Image();
  bgImg.crossOrigin = "anonymous";
  bgImg.src = templateUrl;

  const imageLoaded = await new Promise<boolean>((resolve) => {
    bgImg.onload = () => resolve(true);
    bgImg.onerror = () => {
      // Fallback to master or sample if needed
      if (!templateUrl.includes("certificate-user-template.jpg")) {
        bgImg.src = "/templates/certificate-user-template.jpg";
      } else {
        resolve(false);
      }
    };
  });

  if (imageLoaded && bgImg.naturalWidth) {
    // Draw the authentic template
    ctx.drawImage(bgImg, 0, 0, width, height);

    const cx = width / 2; // 1024

    // 1. Participant Full Name
    // In the template, the horizontal line is at y = 776.
    // The name sits centered directly above the line (y = 750).
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#0f172a"; // Deep Charcoal Black

    const attendeeName = attendee.full_name.trim().toUpperCase();
    let nameFontSize = 58;
    if (attendeeName.length > 28) nameFontSize = 46;
    else if (attendeeName.length > 22) nameFontSize = 52;

    ctx.font = `bold ${nameFontSize}px 'Montserrat', 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillText(attendeeName, cx, 750);

    // 2. Clean out any previous text between the line and the signatures
    // (Clears y: 800 to 1050; leaves the 4 bottom signatures y > 1080 100% untouched)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(200, 800, 1648, 260);

    // 3. Body Text (NO TIME, NO QR CODE)
    ctx.fillStyle = "#334155";
    ctx.font =
      "500 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(
      "in recognition of their active participation in the",
      cx,
      850
    );

    // Event Title (Bold Emerald)
    let eventTitleFontSize = 32;
    if (event.title.length > 40) eventTitleFontSize = 26;
    else if (event.title.length > 30) eventTitleFontSize = 28;

    ctx.font = `bold ${eventTitleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = "#047857";
    ctx.fillText(event.title, cx, 895);

    // Organization & Formatted Date (NO TIME)
    ctx.font =
      "500 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#475569";
    const formattedDate = formatCertificateDate(
      event.start_date || new Date().toISOString()
    );

    ctx.fillText(
      `organized by Free and open source software club CEPRN, conducted on ${formattedDate},`,
      cx,
      945
    );

    ctx.fillText(
      "in appreciation of their creativity and contribution towards shaping the visual identity of the community.",
      cx,
      985
    );
  } else {
    // Fallback Vector Certificate
    await drawFallbackOfficialCertificate(ctx, width, height, event, attendee, certId);
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
  const pdfBase64 = doc.output("datauristring").split(",")[1];

  // If coordinator provided a Google Drive link, automatically sync
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
 * Fallback vector certificate with the EXACT 4 leadership signatures and branding.
 */
async function drawFallbackOfficialCertificate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  event: EventItem,
  attendee: EventRegistration,
  certId: string
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 10;
  ctx.strokeStyle = "#064e3b";
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#10b981";
  ctx.strokeRect(56, 56, width - 112, height - 112);

  const cx = width / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#064e3b";
  ctx.font = "800 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("FREE AND OPEN SOURCE SOFTWARE CLUB", cx, 140);

  ctx.fillStyle = "#047857";
  ctx.font = "700 20px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSSCEPRN  |  COLLEGE OF ENGINEERING PERUMON", cx, 175);

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 300, 205);
  ctx.lineTo(cx + 300, 205);
  ctx.stroke();

  ctx.fillStyle = "#047857";
  ctx.font = "900 52px system-ui, -apple-system, sans-serif";
  ctx.fillText("CERTIFICATE OF APPRECIATION", cx, 290);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("This certificate is proudly awarded to", cx, 360);

  // Participant Name
  ctx.fillStyle = "#0f172a";
  ctx.font =
    "bold 60px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(attendee.full_name.toUpperCase(), cx, 470);

  // Underline
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 350, 495);
  ctx.lineTo(cx + 350, 495);
  ctx.stroke();

  // Description (NO TIME, NO QR CODE)
  ctx.fillStyle = "#334155";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("in recognition of their active participation in the", cx, 570);

  ctx.fillStyle = "#047857";
  ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
  ctx.fillText(event.title, cx, 625);

  ctx.fillStyle = "#475569";
  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  const formattedDate = formatCertificateDate(
    event.start_date || new Date().toISOString()
  );
  ctx.fillText(
    `organized by Free and open source software club CEPRN, conducted on ${formattedDate},`,
    cx,
    675
  );
  ctx.fillText(
    "in appreciation of their creativity and contribution towards shaping the visual identity of the community.",
    cx,
    715
  );

  // EXACT 4 LEADERSHIP SIGNATURES
  const sigY = height - 240;
  const colWidth = (width - 240) / 4;

  const signatories = [
    { name: "Ms. ABIYA DANIEL", role: "COMMUNITY LEAD" },
    { name: "Ms. ANJU VENUGOPAL", role: "FACULTY COORDINATOR" },
    { name: "Ms. SHAFEENA M B", role: "FACULTY COORDINATOR" },
    { name: "Dr BEJOY ABRAHAM", role: "PRINCIPAL" },
  ];

  signatories.forEach((sig, idx) => {
    const colX = 120 + idx * colWidth + colWidth / 2;

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(colX - 110, sigY);
    ctx.lineTo(colX + 110, sigY);
    ctx.stroke();

    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(sig.name, colX, sigY + 36);

    ctx.font = "700 14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(sig.role, colX, sigY + 62);
  });
}
