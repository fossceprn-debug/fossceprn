// ============================================================================
// Official FOSS CEPrn Event Pass Generator
// Vertical Portrait Pass Format — Matching Official Perumon Chapter Design
//
// Key Features:
// 1. Portrait orientation (width: 720, height: 1100).
// 2. Dynamic event theme colors: Each event gets a distinct, vibrant palette.
// 3. Prominently displays Participant's Name in a big, bold way.
// 4. Ticket notch cutouts on left and right borders.
// 5. Scannable QR Code with center FOSS badge & vertical diamond accent rules.
// 6. Solid theme-colored ticket code pill & Event Coordinator contact card.
// 7. Generates ultra-crisp high-res PNG & Portrait PDF ticket.
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
 * Draws a rounded rectangle path.
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
 * Creates the outer portrait ticket path with rounded corners and side semicircular cutouts.
 */
function createPortraitTicketPath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  r: number,
  notchY: number,
  notchR: number
) {
  ctx.beginPath();
  // Top edge
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);

  // Right edge down to notch
  ctx.lineTo(w, notchY - notchR);
  // Right notch inward
  ctx.arc(w, notchY, notchR, -Math.PI / 2, Math.PI / 2, true);
  // Right edge to bottom
  ctx.lineTo(w, h - r);
  ctx.arcTo(w, h, w - r, h, r);

  // Bottom edge
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);

  // Left edge up to notch
  ctx.lineTo(0, notchY + notchR);
  // Left notch inward
  ctx.arc(0, notchY, notchR, Math.PI / 2, -Math.PI / 2, true);
  // Left edge to top
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
}

/**
 * Generates an ultra-crisp high-resolution portrait invitation pass PNG matching the official sample image.
 * Canvas resolution: 720 x 1100 px.
 */
export async function generateInvitationPassImage(
  options: InvitationPassOptions
): Promise<string> {
  const width = 720;
  const height = 1100;
  const cornerR = 34;
  const notchY = 445; // Vertical position of the side ticket notches
  const notchR = 20;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create canvas rendering context");

  // Determine dynamic event color theme
  const theme =
    options.theme ||
    getEventPassTheme({
      id: options.eventId || undefined,
      slug: options.eventSlug || undefined,
      title: options.eventTitle,
    });

  // 1. Clip the entire ticket with rounded corners & left/right side notches
  ctx.save();
  createPortraitTicketPath(ctx, width, height, cornerR, notchY, notchR);
  ctx.clip();

  // 2. White Card Base
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 3. Top Accent Curve Ribbon (Top Left)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(240, 0);
  ctx.bezierCurveTo(150, 40, 70, 110, 0, 220);
  ctx.closePath();
  ctx.fillStyle = theme.softTint;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(160, 0);
  ctx.bezierCurveTo(90, 30, 40, 80, 0, 150);
  ctx.closePath();
  ctx.fillStyle = theme.primaryLight + "30";
  ctx.fill();
  ctx.restore();

  // 4. Bottom Fluid Waves (Matching Sample Pass)
  ctx.save();
  // Wave 1: Soft Tint
  ctx.beginPath();
  ctx.moveTo(0, height - 120);
  ctx.bezierCurveTo(120, height - 160, 320, height - 60, width, height - 110);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = theme.softTint;
  ctx.fill();

  // Wave 2: Mid Primary Tone
  ctx.beginPath();
  ctx.moveTo(0, height - 85);
  ctx.bezierCurveTo(180, height - 130, 420, height - 40, width, height - 75);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = theme.primary;
  ctx.fill();

  // Wave 3: Deep Dark Accent Ribbon
  ctx.beginPath();
  ctx.moveTo(0, height - 50);
  ctx.bezierCurveTo(220, height - 90, 500, height - 30, width, height - 45);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = theme.primaryDark;
  ctx.fill();
  ctx.restore();

  const cx = width / 2; // 360

  // 5. Header Brand Bar
  // Left: "FOSS" Pill Badge
  const badgeX = 54;
  const badgeY = 46;
  const badgeW = 96;
  const badgeH = 50;

  ctx.save();
  ctx.fillStyle = theme.primary;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 14);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS", badgeX + badgeW / 2, badgeY + badgeH / 2);
  ctx.restore();

  // Vertical Separator
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(badgeX + badgeW + 16, badgeY + 4);
  ctx.lineTo(badgeX + badgeW + 16, badgeY + badgeH - 4);
  ctx.stroke();

  // Right Header Text
  const headTextX = badgeX + badgeW + 30;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = theme.primary;
  ctx.font = "800 17px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS UNITED STUDENTS CHAPTER", headTextX, badgeY + 22);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("COLLEGE OF ENGINEERING PERUMON", headTextX, badgeY + 42);

  // 6. "INVITATION PASS" Title
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "900 44px system-ui, -apple-system, sans-serif";
  ctx.fillText("INVITATION PASS", cx, 155);

  // Subtitle with flanking lines
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 1.6;

  ctx.beginPath();
  ctx.moveTo(cx - 240, 180);
  ctx.lineTo(cx - 130, 180);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + 130, 180);
  ctx.lineTo(cx + 240, 180);
  ctx.stroke();

  ctx.fillStyle = theme.primary;
  ctx.font = "800 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOR ATTENDING THE EVENT", cx, 184);

  // 7. PARTICIPANT NAME IN A BIG WAY (Prominent, Bold, Uppercase)
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.primaryDark;

  const attendeeName = options.attendeeName.trim().toUpperCase();
  let nameSize = 34;
  if (attendeeName.length > 24) nameSize = 28;
  else if (attendeeName.length > 18) nameSize = 31;

  ctx.font = `900 ${nameSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(attendeeName, cx, 226);

  // Event Name
  ctx.fillStyle = "#1e293b";
  const eventTitle = options.eventTitle.trim();
  let titleSize = 22;
  if (eventTitle.length > 32) titleSize = 18;
  ctx.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(eventTitle, cx, 258);

  // 8. Date & Venue 2-Column Rounded Pill Box
  const pillBoxY = 280;
  const pillBoxW = width - 108;
  const pillBoxH = 68;
  const pillBoxX = 54;

  ctx.fillStyle = theme.softTint;
  roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, 18);
  ctx.fill();

  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Vertical divider between Date & Venue
  ctx.strokeStyle = theme.borderTint;
  ctx.beginPath();
  ctx.moveTo(cx, pillBoxY + 10);
  ctx.lineTo(cx, pillBoxY + pillBoxH - 10);
  ctx.stroke();

  // Left Column: Date & Time
  drawCalendarIcon(ctx, pillBoxX + 18, pillBoxY + 18, theme.primary);

  // Format readable Date & Time
  let dateLine = formatDate(options.startDate);
  let timeLine = "";
  try {
    const dt = new Date(options.startDate);
    if (!isNaN(dt.getTime())) {
      dateLine = dt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      timeLine = dt.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  } catch {}

  ctx.textAlign = "left";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.fillText(dateLine, pillBoxX + 54, pillBoxY + 32);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px system-ui, -apple-system, sans-serif";
  ctx.fillText(timeLine || "Starts on schedule", pillBoxX + 54, pillBoxY + 50);

  // Right Column: Venue
  drawLocationIcon(ctx, cx + 18, pillBoxY + 18, theme.primary);

  ctx.textAlign = "left";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";

  const venueText = options.venue || "Campus Lab / Online";
  const venueTruncated =
    venueText.length > 22 ? venueText.substring(0, 20) + "..." : venueText;
  ctx.fillText(venueTruncated, cx + 48, pillBoxY + 32);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("Campus Lab / Online", cx + 48, pillBoxY + 50);

  // 9. QR Code Section (Center, Symmetrical, High Resolution)
  const qrBoxY = 375;
  const qrSize = 310;
  const qrX = cx - qrSize / 2;

  // Flanking vertical accent lines with diamond markers on left & right of QR
  drawVerticalAccentRule(ctx, qrX - 35, qrBoxY + 40, qrSize - 80, theme.primary);
  drawVerticalAccentRule(ctx, qrX + qrSize + 35, qrBoxY + 40, qrSize - 80, theme.primary);

  // QR Container Card
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, qrX, qrBoxY, qrSize, qrSize, 22);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 3;
  roundRect(ctx, qrX, qrBoxY, qrSize, qrSize, 22);
  ctx.stroke();

  // QR Code Image
  const qrImg = new Image();
  qrImg.src = options.qrDataUrl;
  await new Promise((res) => {
    qrImg.onload = () => res(true);
    qrImg.onerror = () => res(false);
  });

  const innerQrPad = 18;
  ctx.drawImage(
    qrImg,
    qrX + innerQrPad,
    qrBoxY + innerQrPad,
    qrSize - innerQrPad * 2,
    qrSize - innerQrPad * 2
  );

  // QR Center Logo Pill Badge ("FOSS")
  const centerPillW = 74;
  const centerPillH = 34;
  const centerPillX = cx - centerPillW / 2;
  const centerPillY = qrBoxY + qrSize / 2 - centerPillH / 2;

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, centerPillX - 3, centerPillY - 3, centerPillW + 6, centerPillH + 6, 10);
  ctx.fill();

  ctx.fillStyle = theme.primary;
  roundRect(ctx, centerPillX, centerPillY, centerPillW, centerPillH, 8);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS", cx, qrBoxY + qrSize / 2);

  // 10. Ticket Code Pill (Solid Theme Color)
  const codePillY = qrBoxY + qrSize + 22;
  const codePillW = 320;
  const codePillH = 48;
  const codePillX = cx - codePillW / 2;

  ctx.fillStyle = theme.primaryDark;
  roundRect(ctx, codePillX, codePillY, codePillW, codePillH, 24);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 22px monospace";
  ctx.fillText(options.ticketCode, cx, codePillY + codePillH / 2);

  // Subtitle: SCAN FOR ENTRY CHECK-IN
  ctx.fillStyle = theme.primary;
  ctx.font = "800 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("SCAN FOR ENTRY CHECK-IN", cx, codePillY + codePillH + 18);

  // 11. Registered Attendee & Coordinator Details Box
  const detailsBoxY = codePillY + codePillH + 30;
  const detailsBoxW = width - 110;
  const detailsBoxH = 68;
  const detailsBoxX = cx - detailsBoxW / 2;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.04)";
  ctx.shadowBlur = 6;
  roundRect(ctx, detailsBoxX, detailsBoxY, detailsBoxW, detailsBoxH, 16);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1.4;
  roundRect(ctx, detailsBoxX, detailsBoxY, detailsBoxW, detailsBoxH, 16);
  ctx.stroke();

  // Vertical divider in the details box
  ctx.strokeStyle = theme.borderTint;
  ctx.beginPath();
  ctx.moveTo(cx, detailsBoxY + 8);
  ctx.lineTo(cx, detailsBoxY + detailsBoxH - 8);
  ctx.stroke();

  // Left Column: REGISTERED ATTENDEE
  ctx.textAlign = "left";
  ctx.fillStyle = theme.primary;
  ctx.font = "800 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("REGISTERED ATTENDEE", detailsBoxX + 16, detailsBoxY + 20);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  const attNameTrunc =
    options.attendeeName.length > 20
      ? options.attendeeName.substring(0, 18) + "..."
      : options.attendeeName;
  ctx.fillText(attNameTrunc, detailsBoxX + 16, detailsBoxY + 38);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 11px system-ui, -apple-system, sans-serif";
  const attSub = options.classSemester || options.attendeeEmail || "";
  const attSubTrunc = attSub.length > 22 ? attSub.substring(0, 20) + "..." : attSub;
  ctx.fillText(attSubTrunc, detailsBoxX + 16, detailsBoxY + 54);

  // Right Column: EVENT COORDINATORS
  ctx.fillStyle = theme.primary;
  ctx.font = "800 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("EVENT COORDINATORS", cx + 16, detailsBoxY + 20);

  const coord1 = options.coordinator1Name || options.coordinatorName || "Coordinator";
  const coord1Phone = options.coordinator1Phone || options.coordinatorPhone || "+91 9895461970";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    `${coord1} (${coord1Phone.replace("+91 ", "")})`,
    cx + 16,
    detailsBoxY + 38
  );

  const coord2 = options.coordinator2Name;
  const coord2Phone = options.coordinator2Phone;
  ctx.fillStyle = "#64748b";
  ctx.font = "600 11px system-ui, -apple-system, sans-serif";
  if (coord2) {
    ctx.fillText(`${coord2} (${coord2Phone || ""})`, cx + 16, detailsBoxY + 54);
  } else {
    ctx.fillText("FOSS CEPerumon Chapter", cx + 16, detailsBoxY + 54);
  }

  // 12. Warning Notice
  ctx.textAlign = "center";
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "800 11px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    "⚠️ SAVE THIS QR PASS • DO NOT MISS IT • SHOW AT ENTRY DESK",
    cx,
    detailsBoxY + detailsBoxH + 22
  );

  // 13. Outer Border Stroke for the entire Portrait Pass
  ctx.restore(); // restore clip
  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 2.5;
  createPortraitTicketPath(ctx, width, height, cornerR, notchY, notchR);
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

/**
 * Draws vertical decorative accent rules with two diamonds on either side of the QR code.
 */
function drawVerticalAccentRule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();

  // Two diamonds at 1/3 and 2/3
  const d1 = y + h * 0.38;
  const d2 = y + h * 0.62;
  drawDiamond(ctx, x, d1, 4.5);
  drawDiamond(ctx, x, d2, 4.5);
  ctx.restore();
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

function drawCalendarIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  roundRect(ctx, x, y + 2, 24, 22, 5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + 9);
  ctx.lineTo(x + 24, y + 9);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 6, y);
  ctx.lineTo(x + 6, y + 4);
  ctx.moveTo(x + 18, y);
  ctx.lineTo(x + 18, y + 4);
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
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(x + 11, y + 9, 8, Math.PI * 0.8, Math.PI * 2.2);
  ctx.lineTo(x + 11, y + 24);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + 11, y + 9, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export interface GeneratedTicketPdf {
  filename: string;
  pdfBlob: Blob;
  pdfDataUri: string;
  pdfBase64: string;
}

/**
 * Generates an official downloadable PDF ticket containing the vertical portrait pass.
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
  // A4: 210 x 297mm. Pass ratio: 720 / 1100 = ~0.6545
  const passWidthMm = 150;
  const passHeightMm = (150 / 720) * 1100; // ~229mm
  const xOffset = (210 - passWidthMm) / 2;
  const yOffset = (297 - passHeightMm) / 2;

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
