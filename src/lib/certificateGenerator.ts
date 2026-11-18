// ============================================================================
// Certificate Generator for Attended Participants
// FOSS United Students Chapter • College of Engineering Perumon
// Only generates certificates for attended students (checked_in === true).
// Supports coordinator-uploaded custom background templates or official FOSS layout.
// ============================================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";
import { formatDate } from "./utils";
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
 * Generates an event participation certificate for an attendee who was present.
 * STRICT CHECK: Will throw an error if the attendee is not checked in.
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
    `CERT-${attendee.ticket_code || attendee.id.substring(0, 8).toUpperCase()}`;

  const width = 1920;
  const height = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire canvas 2D context");

  const hasCustomTemplate = Boolean(event.certificate_template_url);

  if (hasCustomTemplate && event.certificate_template_url) {
    // ------------------------------------------------------------------------
    // CASE A: Custom Coordinator-Uploaded Template
    // ------------------------------------------------------------------------
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = event.certificate_template_url;

    await new Promise((resolve) => {
      bgImg.onload = () => resolve(true);
      bgImg.onerror = () => {
        console.warn("Could not load custom certificate template, falling back to default.");
        resolve(false);
      };
    });

    if (bgImg.naturalWidth) {
      ctx.drawImage(bgImg, 0, 0, width, height);

      // Overlay Recipient Name in center
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 56px 'Times New Roman', Georgia, serif";
      ctx.fillText(attendee.full_name, width / 2, height * 0.52);

      // Event Title
      ctx.font = "italic 30px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#334155";
      ctx.fillText(event.title, width / 2, height * 0.63);

      // Certificate ID & Date at bottom
      ctx.font = "600 18px monospace";
      ctx.fillStyle = "#64748b";
      ctx.fillText(`Certificate ID: ${certId} • Issued: ${formatDate(new Date().toISOString())}`, width / 2, height * 0.88);
    } else {
      drawDefaultCertificate(ctx, width, height, event, attendee, certId);
    }
  } else {
    // ------------------------------------------------------------------------
    // CASE B: Official Default FOSS United CEPrn Certificate Layout
    // ------------------------------------------------------------------------
    drawDefaultCertificate(ctx, width, height, event, attendee, certId);
  }

  // Generate QR Verification Badge for Certificate
  try {
    const certQrData = await QRCode.toDataURL(
      JSON.stringify({
        certificate_id: certId,
        attendee: attendee.full_name,
        ticket: attendee.ticket_code,
        event: event.title,
        verified_by: "FOSS United Students Chapter CEPerumon",
      }),
      { width: 140, margin: 1 }
    );

    const qrImg = new Image();
    qrImg.src = certQrData;
    await new Promise((res) => {
      qrImg.onload = () => res(true);
      qrImg.onerror = () => res(false);
    });
    ctx.drawImage(qrImg, width - 210, height - 210, 130, 130);
  } catch {}

  const pngDataUrl = canvas.toDataURL("image/png");

  // Create A4 Landscape PDF using jsPDF
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
 * Draws the elegant default FOSS CEPrn Certificate of Participation.
 */
function drawDefaultCertificate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  event: EventItem,
  attendee: EventRegistration,
  certId: string
) {
  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Subtle pattern background fill
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#f8fafc");
  grad.addColorStop(0.5, "#ffffff");
  grad.addColorStop(1, "#f0fdf4");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Outer Decorative Borders
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#064e3b"; // Deep Emerald
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#10b981"; // Emerald accent
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#cbd5e1";
  ctx.strokeRect(54, 54, width - 108, height - 108);

  // Corner Ornaments
  const drawCorner = (x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "#047857";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawCorner(54, 54, 0);
  drawCorner(width - 54, 54, 0);
  drawCorner(54, height - 54, 0);
  drawCorner(width - 54, height - 54, 0);

  const cx = width / 2;

  // Header Title
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // FOSS United Chapter pill badge
  ctx.fillStyle = "#047857";
  ctx.font = "800 20px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS UNITED STUDENTS CHAPTER", cx, 130);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 16px system-ui, -apple-system, sans-serif";
  ctx.fillText("COLLEGE OF ENGINEERING PERUMON", cx, 160);

  // Divider Line
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 200, 185);
  ctx.lineTo(cx + 200, 185);
  ctx.stroke();

  // "CERTIFICATE OF PARTICIPATION"
  ctx.fillStyle = "#064e3b";
  ctx.font = "900 52px system-ui, -apple-system, sans-serif";
  ctx.fillText("CERTIFICATE OF PARTICIPATION", cx, 270);

  // Subtitle
  ctx.fillStyle = "#64748b";
  ctx.font = "600 20px system-ui, -apple-system, sans-serif";
  ctx.fillText("THIS IS PROUDLY PRESENTED TO", cx, 340);

  // Attendee Name (Prominent & Elegant)
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 64px 'Times New Roman', Georgia, serif";
  ctx.fillText(attendee.full_name, cx, 440);

  // Underline beneath name
  ctx.strokeStyle = "#047857";
  ctx.lineWidth = 2.5;
  const nameW = ctx.measureText(attendee.full_name).width;
  ctx.beginPath();
  ctx.moveTo(cx - nameW / 2 - 30, 465);
  ctx.lineTo(cx + nameW / 2 + 30, 465);
  ctx.stroke();

  // Body Description
  ctx.fillStyle = "#334155";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    "for actively participating in the workshop / technical session on",
    cx,
    540
  );

  // Event Title
  ctx.fillStyle = "#047857";
  ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
  ctx.fillText(`"${event.title}"`, cx, 615);

  // Date and Venue
  ctx.fillStyle = "#475569";
  ctx.font = "600 20px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    `Conducted on ${formatDate(event.start_date)} at ${event.venue || "College Campus"}`,
    cx,
    675
  );

  // Signatures Section
  const c1Name = event.coordinator1_name || event.coordinator_name || "Chapter Coordinator";
  const c2Name = event.coordinator2_name || "Faculty Advisor";

  const sigY = 870;

  // Left Signature
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(350, sigY);
  ctx.lineTo(650, sigY);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.fillText(c1Name, 500, sigY + 30);
  ctx.fillStyle = "#64748b";
  ctx.font = "600 15px system-ui, -apple-system, sans-serif";
  ctx.fillText("Event Coordinator", 500, sigY + 54);

  // Right Signature
  ctx.beginPath();
  ctx.moveTo(cx + 250, sigY);
  ctx.lineTo(cx + 550, sigY);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.fillText(c2Name, cx + 400, sigY + 30);
  ctx.fillStyle = "#64748b";
  ctx.font = "600 15px system-ui, -apple-system, sans-serif";
  ctx.fillText("Staff / ExeCom Lead", cx + 400, sigY + 54);

  // Certificate ID & Security Watermark
  ctx.textAlign = "left";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 14px monospace";
  ctx.fillText(`Certificate ID: ${certId}`, 100, height - 70);
  ctx.fillText(`Verified Attendee: ${attendee.ticket_code}`, 100, height - 50);
}

