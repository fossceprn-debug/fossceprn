// ============================================================================
// Official FOSS CEPrn Event Pass Generator
// Matching the Official Preview Pass Design Exactly
//
// Key Specifications:
// 1. Portrait orientation (width: 720, height: 1320).
// 2. Dynamic event theme colors: Each event gets a distinct, vibrant palette.
// 3. Top Banner in primaryDark with white FOSS badge, Chapter subtitle & INVITATION title.
// 4. Prominently displays Participant's Name in a big, bold way with color accent bar.
// 5. 2-column Date & Venue box with themed icons and soft tint background.
// 6. Large scannable QR Code section in primaryDark with white container card.
// 7. Solid theme-colored ticket code pill & Registered Attendee / Coordinator details card.
// 8. Generates ultra-crisp high-res PNG & Portrait PDF ticket (A4 centered).
// ============================================================================

import { formatDate } from "./utils";
import jsPDF from "jspdf";

export interface EventPassTheme {
  id: string;
  name: string;
  primaryDark: string;    // Deep dark tone for headers & text
  primary: string;        // Main theme color for pills & borders
  primaryLight: string;   // Mid tone for waves & accents
  accent: string;         // Bright accent tone
  softTint: string;       // Very soft background for pill box
  borderTint: string;     // Border color for pill box
  textDark: string;       // Text color for title and labels
  pillBg: string;         // Background for ticket code pill
  badgeBg: string;        // FOSS badge background
  accentGradient: [string, string];
  cssStubGradient: string;
  cssPillBg: string;
  cssBorderColor: string;
  tailwindBorder: string;
}

export const EVENT_PASS_THEMES: EventPassTheme[] = [
  {
    id: "crimson",
    name: "Wine Crimson",
    primaryDark: "#70081d",
    primary: "#881337",
    primaryLight: "#9f1239",
    accent: "#e11d48",
    softTint: "#fdf2f4",
    borderTint: "#fecdd3",
    textDark: "#70081d",
    pillBg: "#70081d",
    badgeBg: "#881337",
    accentGradient: ["#70081d", "#881337"],
    cssStubGradient: "linear-gradient(135deg, #70081d 0%, #881337 100%)",
    cssPillBg: "#70081d",
    cssBorderColor: "#fecdd3",
    tailwindBorder: "border-rose-300",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    primaryDark: "#064e3b",
    primary: "#047857",
    primaryLight: "#059669",
    accent: "#10b981",
    softTint: "#ecfdf5",
    borderTint: "#a7f3d0",
    textDark: "#064e3b",
    pillBg: "#064e3b",
    badgeBg: "#047857",
    accentGradient: ["#064e3b", "#047857"],
    cssStubGradient: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
    cssPillBg: "#064e3b",
    cssBorderColor: "#a7f3d0",
    tailwindBorder: "border-emerald-300",
  },
  {
    id: "sapphire",
    name: "Royal Sapphire",
    primaryDark: "#172554",
    primary: "#1e40af",
    primaryLight: "#2563eb",
    accent: "#3b82f6",
    softTint: "#eff6ff",
    borderTint: "#bfdbfe",
    textDark: "#172554",
    pillBg: "#172554",
    badgeBg: "#1e40af",
    accentGradient: ["#172554", "#1e40af"],
    cssStubGradient: "linear-gradient(135deg, #172554 0%, #1e40af 100%)",
    cssPillBg: "#172554",
    cssBorderColor: "#bfdbfe",
    tailwindBorder: "border-blue-300",
  },
  {
    id: "violet",
    name: "Deep Purple",
    primaryDark: "#3b0764",
    primary: "#581c87",
    primaryLight: "#7c3aed",
    accent: "#9333ea",
    softTint: "#faf5ff",
    borderTint: "#e9d5ff",
    textDark: "#3b0764",
    pillBg: "#3b0764",
    badgeBg: "#581c87",
    accentGradient: ["#3b0764", "#581c87"],
    cssStubGradient: "linear-gradient(135deg, #3b0764 0%, #581c87 100%)",
    cssPillBg: "#3b0764",
    cssBorderColor: "#e9d5ff",
    tailwindBorder: "border-purple-300",
  },
  {
    id: "teal",
    name: "Ocean Teal",
    primaryDark: "#042f2e",
    primary: "#0f766e",
    primaryLight: "#14b8a6",
    accent: "#0d9488",
    softTint: "#f0fdfa",
    borderTint: "#99f6e4",
    textDark: "#042f2e",
    pillBg: "#042f2e",
    badgeBg: "#0f766e",
    accentGradient: ["#042f2e", "#0f766e"],
    cssStubGradient: "linear-gradient(135deg, #042f2e 0%, #0f766e 100%)",
    cssPillBg: "#042f2e",
    cssBorderColor: "#99f6e4",
    tailwindBorder: "border-teal-300",
  },
  {
    id: "amber",
    name: "Warm Bronze",
    primaryDark: "#451a03",
    primary: "#92400e",
    primaryLight: "#b45309",
    accent: "#d97706",
    softTint: "#fffbeb",
    borderTint: "#fde68a",
    textDark: "#451a03",
    pillBg: "#451a03",
    badgeBg: "#92400e",
    accentGradient: ["#451a03", "#92400e"],
    cssStubGradient: "linear-gradient(135deg, #451a03 0%, #92400e 100%)",
    cssPillBg: "#451a03",
    cssBorderColor: "#fde68a",
    tailwindBorder: "border-amber-300",
  },
  {
    id: "slate",
    name: "Midnight Slate",
    primaryDark: "#0f172a",
    primary: "#1e293b",
    primaryLight: "#334155",
    accent: "#475569",
    softTint: "#f8fafc",
    borderTint: "#cbd5e1",
    textDark: "#0f172a",
    pillBg: "#0f172a",
    badgeBg: "#1e293b",
    accentGradient: ["#0f172a", "#1e293b"],
    cssStubGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    cssPillBg: "#0f172a",
    cssBorderColor: "#cbd5e1",
    tailwindBorder: "border-slate-300",
  },
];

/**
 * Deterministically gets a distinct color theme for any event based on its id, slug, or title.
 */
export function getEventPassTheme(
  eventOrKey?: { id?: string; title?: string; slug?: string } | string | null
): EventPassTheme {
  if (!eventOrKey) return EVENT_PASS_THEMES[0];
  const str =
    typeof eventOrKey === "string"
      ? eventOrKey
      : eventOrKey.id || eventOrKey.slug || eventOrKey.title || "default";

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % EVENT_PASS_THEMES.length;
  return EVENT_PASS_THEMES[index];
}

export interface InvitationPassOptions {
  eventTitle: string;
  startDate: string;
  venue: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string | null;
  classSemester?: string | null;
  ticketCode: string;
  qrDataUrl: string;
  coordinator1Name?: string | null;
  coordinator1Phone?: string | null;
  coordinator2Name?: string | null;
  coordinator2Phone?: string | null;
  coordinatorName?: string | null;
  coordinatorPhone?: string | null;
  eventId?: string | null;
  eventSlug?: string | null;
  theme?: EventPassTheme;
}

/**
 * Helper to draw a rounded rectangle.
 */
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

/**
 * Generates an ultra-crisp high-resolution portrait invitation pass PNG matching the preview card exactly.
 * Canvas resolution: 720 x 1320 px.
 */
export async function generateInvitationPassImage(
  options: InvitationPassOptions
): Promise<string> {
  const width = 720;
  const height = 1320;
  const cornerR = 36;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create canvas rendering context");

  const theme =
    options.theme ||
    getEventPassTheme({
      id: options.eventId || undefined,
      slug: options.eventSlug || undefined,
      title: options.eventTitle,
    });

  const cx = width / 2; // 360

  // 1. Clip outer rounded card
  ctx.save();
  roundRect(ctx, 0, 0, width, height, cornerR);
  ctx.clip();

  // 2. White Card Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 3. Top Banner (primaryDark with decorative background circles)
  const bannerH = 260;
  ctx.fillStyle = theme.primaryDark;
  ctx.fillRect(0, 0, width, bannerH);

  // Decorative translucent circles
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.arc(width - 40, -20, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(40, bannerH + 40, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Brand Row inside Banner
  const brandY = 40;
  const badgeW = 90;
  const badgeH = 46;
  const badgeX = 50;

  // White FOSS badge
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, badgeX, brandY, badgeW, badgeH, 14);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS", badgeX + badgeW / 2, brandY + badgeH / 2);

  // Vertical line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(badgeX + badgeW + 16, brandY + 4);
  ctx.lineTo(badgeX + badgeW + 16, brandY + badgeH - 4);
  ctx.stroke();

  // Chapter Name
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 15px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS UNITED STUDENTS CHAPTER", badgeX + badgeW + 28, brandY + 18);

  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "700 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("COLLEGE OF ENGINEERING PERUMON", badgeX + badgeW + 28, brandY + 36);

  // Banner Title: INVITATION
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "900 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("OFFICIAL ENTRY PASS", cx, 140);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 46px system-ui, -apple-system, sans-serif";
  ctx.fillText("INVITATION", cx, 190);

  // Subtitle with flanking lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 1.4;

  ctx.beginPath();
  ctx.moveTo(cx - 210, 222);
  ctx.lineTo(cx - 130, 222);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + 130, 222);
  ctx.lineTo(cx + 210, 222);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = "800 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOR ATTENDING THE EVENT", cx, 226);

  // 4. Participant Section
  ctx.textAlign = "center";
  ctx.fillStyle = theme.primary;
  ctx.font = "900 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("THIS PASS IS ISSUED TO", cx, 305);

  const attendeeName = options.attendeeName.trim().toUpperCase();
  let nameSize = 34;
  if (attendeeName.length > 26) nameSize = 28;
  else if (attendeeName.length > 20) nameSize = 31;

  ctx.fillStyle = theme.primaryDark;
  ctx.font = `900 ${nameSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(attendeeName, cx, 350);

  // Center accent bar
  ctx.fillStyle = theme.primary;
  roundRect(ctx, cx - 35, 368, 70, 5, 2.5);
  ctx.fill();

  // Event Title
  const eventTitle = options.eventTitle.trim();
  let titleSize = 24;
  if (eventTitle.length > 32) titleSize = 20;
  ctx.fillStyle = "#1e293b";
  ctx.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(eventTitle, cx, 412);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "700 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("EVENT PARTICIPANT", cx, 436);

  // 5. Date & Venue 2-Column Box
  const boxX = 45;
  const boxY = 460;
  const boxW = width - 90;
  const boxH = 76;

  ctx.fillStyle = theme.softTint;
  roundRect(ctx, boxX, boxY, boxW, boxH, 18);
  ctx.fill();

  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1.4;
  roundRect(ctx, boxX, boxY, boxW, boxH, 18);
  ctx.stroke();

  // Vertical divider
  ctx.beginPath();
  ctx.moveTo(cx, boxY + 12);
  ctx.lineTo(cx, boxY + boxH - 12);
  ctx.stroke();

  // Left: Date
  drawCalendarIcon(ctx, boxX + 16, boxY + 18, theme.primary);
  ctx.textAlign = "left";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "800 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("DATE", boxX + 54, boxY + 30);

  ctx.fillStyle = theme.primaryDark;
  ctx.font = "900 14px system-ui, -apple-system, sans-serif";
  ctx.fillText(formatDate(options.startDate), boxX + 54, boxY + 50);

  // Right: Venue
  drawLocationIcon(ctx, cx + 16, boxY + 18, theme.primary);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "800 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("VENUE", cx + 54, boxY + 30);

  ctx.fillStyle = theme.primaryDark;
  ctx.font = "900 14px system-ui, -apple-system, sans-serif";
  const venueTrunc =
    options.venue && options.venue.length > 20
      ? options.venue.substring(0, 18) + "..."
      : options.venue || "College Campus";
  ctx.fillText(venueTrunc, cx + 54, boxY + 50);

  // 6. QR Code Section (Inside dark card matching preview)
  const qrCardY = 560;
  const qrCardW = width - 90;
  const qrCardH = 370;

  ctx.fillStyle = theme.primaryDark;
  roundRect(ctx, boxX, qrCardY, qrCardW, qrCardH, 24);
  ctx.fill();

  // Heading inside QR Card
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("── ENTRY VERIFICATION ──", cx, qrCardY + 32);

  // White QR container card with shadow
  const qrInnerPad = 14;
  const qrImgSize = 230;
  const qrCardInnerW = qrImgSize + qrInnerPad * 2;
  const qrCardInnerH = qrImgSize + qrInnerPad * 2;
  const qrInnerX = cx - qrCardInnerW / 2;
  const qrInnerY = qrCardY + 48;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, qrInnerX, qrInnerY, qrCardInnerW, qrCardInnerH, 18);
  ctx.fill();
  ctx.restore();

  // QR Code Image
  const qrImg = new Image();
  qrImg.src = options.qrDataUrl;
  await new Promise((res) => {
    qrImg.onload = () => res(true);
    qrImg.onerror = () => res(false);
  });
  ctx.drawImage(qrImg, qrInnerX + qrInnerPad, qrInnerY + qrInnerPad, qrImgSize, qrImgSize);

  // QR Bottom Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("SCAN QR CODE FOR ENTRY CHECK-IN", cx, qrCardY + qrCardH - 30);

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "700 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS UNITED STUDENTS CHAPTER", cx, qrCardY + qrCardH - 14);

  // 7. Ticket Code Pill
  const pillY = 955;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "900 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("YOUR UNIQUE TICKET NUMBER", cx, pillY);

  const codePillW = 320;
  const codePillH = 50;
  const codePillX = cx - codePillW / 2;
  const codePillY = pillY + 12;

  ctx.fillStyle = theme.primaryDark;
  roundRect(ctx, codePillX, codePillY, codePillW, codePillH, 25);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 22px monospace";
  ctx.fillText(options.ticketCode, cx, codePillY + codePillH / 2 + 1);

  // 8. Attendee & Coordinator Details Box
  const infoY = 1045;
  const infoW = width - 90;
  const infoH = 145;

  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1.4;
  roundRect(ctx, boxX, infoY, infoW, infoH, 18);
  ctx.stroke();

  // Attendee Section
  ctx.textAlign = "left";
  ctx.fillStyle = theme.primary;
  ctx.font = "900 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("REGISTERED ATTENDEE", boxX + 20, infoY + 24);

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 15px system-ui, -apple-system, sans-serif";
  ctx.fillText(options.attendeeName, boxX + 20, infoY + 44);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px system-ui, -apple-system, sans-serif";
  const subText = options.classSemester
    ? `${options.attendeeEmail} • ${options.classSemester}`
    : options.attendeeEmail;
  ctx.fillText(subText, boxX + 20, infoY + 62);

  // Divider
  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 20, infoY + 76);
  ctx.lineTo(boxX + infoW - 20, infoY + 76);
  ctx.stroke();

  // Coordinator Section
  ctx.fillStyle = theme.primary;
  ctx.font = "900 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("EVENT COORDINATORS", boxX + 20, infoY + 98);

  const coordNames = [
    options.coordinator1Name || options.coordinatorName,
    options.coordinator2Name,
  ].filter(Boolean).join(" & ") || "FOSS Chapter Lead";

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.fillText(coordNames, boxX + 20, infoY + 116);

  const coordPhones = [
    options.coordinator1Phone || options.coordinatorPhone,
    options.coordinator2Phone,
  ].filter(Boolean).join(" • ");

  if (coordPhones) {
    ctx.fillStyle = "#64748b";
    ctx.font = "600 11px system-ui, -apple-system, sans-serif";
    ctx.fillText(`Ph: ${coordPhones}`, boxX + 20, infoY + 132);
  }

  // 9. Important Notice
  ctx.textAlign = "center";
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "900 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("• SAVE THIS PASS • SHOW AT ENTRY DESK •", cx, 1222);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("This pass is issued specifically to the registered participant.", cx, 1242);

  // 10. Bottom Theme Strip
  ctx.fillStyle = theme.primary;
  ctx.fillRect(0, height - 16, width, 16);

  // Outer Border Stroke
  ctx.restore(); // restore clip
  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 2.5;
  roundRect(ctx, 0, 0, width, height, cornerR);
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

function drawCalendarIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  roundRect(ctx, x, y + 2, 26, 24, 6);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + 26, y + 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 7, y);
  ctx.lineTo(x + 7, y + 4);
  ctx.moveTo(x + 19, y);
  ctx.lineTo(x + 19, y + 4);
  ctx.stroke();
  ctx.restore();
}

function drawLocationIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.arc(x + 11, y + 10, 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 11, y + 18);
  ctx.lineTo(x + 11, y + 26);
  ctx.stroke();
  ctx.restore();
}

export interface GeneratedTicketPdf {
  filename: string;
  pdfBlob: Blob;
  pdfDataUri: string;
  pdfBase64: string;
}

/**
 * Generates an official event admission pass PDF formatted for standard A4 portrait print/display.
 */
export async function generateTicketPdf(
  options: InvitationPassOptions
): Promise<GeneratedTicketPdf> {
  const passDataUrl = await generateInvitationPassImage(options);

  // A4 Portrait PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4", // 210mm x 297mm
  });

  // Calculate proportional dimensions to fit centered on A4 page
  // A4: 210 x 297mm. Pass ratio: 720 / 1320 = ~0.545
  const passWidthMm = 140;
  const passHeightMm = (140 / 720) * 1320; // ~256.6mm
  const xOffset = (210 - passWidthMm) / 2; // 35mm
  const yOffset = (297 - passHeightMm) / 2; // ~20.2mm

  doc.addImage(passDataUrl, "PNG", xOffset, yOffset, passWidthMm, passHeightMm, undefined, "FAST");

  const cleanName = options.attendeeName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Ticket-${options.ticketCode}-${cleanName}.pdf`;

  const pdfBlob = doc.output("blob");
  const pdfDataUri = doc.output("datauristring");
  const pdfBase64 = doc.output("datauristring").split(",")[1];

  return {
    filename,
    pdfBlob,
    pdfDataUri,
    pdfBase64,
  };
}
