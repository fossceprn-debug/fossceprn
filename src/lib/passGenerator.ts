// ============================================================================
// Official FOSS CEPrn Event Pass Generator
// Vertical Portrait Pass Format — Matching Official Perumon Chapter Design
//
// Key Features:
// 1. Portrait orientation (width: 720, height: 1100).
// 2. Dynamic event theme colors: Each event gets a distinct, vibrant palette.
// 3. Prominently displays Participant's Name in a big, bold way.
// 4. Ticket notch cutouts on left and right borders with dashed perforation line.
// 5. Scannable QR Code with center FOSS badge & vertical diamond accent rules.
// 6. Solid theme-colored ticket code pill & Registered Attendee / Coordinator cards.
// 7. Generates ultra-crisp high-res PNG & Portrait PDF ticket (A4 centered).
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
 * Generates an ultra-crisp high-resolution portrait invitation pass PNG matching the official Perumon Chapter design.
 * Canvas resolution: 720 x 1100 px.
 */
export async function generateInvitationPassImage(
  options: InvitationPassOptions
): Promise<string> {
  // Portrait, print-friendly pass. Keep the QR region large and unobstructed.
  const width = 720;
  const height = 1100;
  const cornerR = 30;
  const notchY = 455;
  const notchR = 18;

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

  const cx = width / 2;
  const margin = 54;
  const contentW = width - margin * 2;

  // Ticket silhouette with side punch/cut notches.
  ctx.save();
  createPortraitTicketPath(ctx, width, height, cornerR, notchY, notchR);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Minimal corner accents; keep the main content clean and formal.
  ctx.fillStyle = theme.softTint;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(230, 0);
  ctx.bezierCurveTo(130, 38, 58, 112, 0, 210);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = theme.primaryLight + "24";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(145, 0);
  ctx.bezierCurveTo(80, 32, 35, 82, 0, 145);
  ctx.closePath();
  ctx.fill();

  // Bottom subtle waves, below the QR and ticket code.
  ctx.fillStyle = theme.softTint;
  ctx.beginPath();
  ctx.moveTo(0, height - 120);
  ctx.bezierCurveTo(150, height - 165, 360, height - 78, width, height - 125);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = theme.primary + "18";
  ctx.beginPath();
  ctx.moveTo(0, height - 85);
  ctx.bezierCurveTo(190, height - 132, 440, height - 45, width, height - 82);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Header: organization identity only — no coordinator name at the top.
  const badgeX = margin;
  const badgeY = 38;
  const badgeW = 74;
  const badgeH = 42;
  ctx.fillStyle = theme.primary;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 18px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS", badgeX + badgeW / 2, badgeY + badgeH / 2);

  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(badgeX + badgeW + 16, badgeY + 5);
  ctx.lineTo(badgeX + badgeW + 16, badgeY + badgeH - 5);
  ctx.stroke();

  const headX = badgeX + badgeW + 30;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "800 16px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS UNITED STUDENTS CHAPTER", headX, badgeY + 18);
  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("COLLEGE OF ENGINEERING PERUMON", headX, badgeY + 36);

  // Formal pass title.
  ctx.textAlign = "center";
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "900 36px system-ui, -apple-system, sans-serif";
  ctx.fillText("OFFICIAL ENTRY PASS", cx, 135);
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 150, 157);
  ctx.lineTo(cx - 90, 157);
  ctx.moveTo(cx + 90, 157);
  ctx.lineTo(cx + 150, 157);
  ctx.stroke();
  ctx.fillStyle = theme.primary;
  ctx.font = "700 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("AUTHORIZED EVENT ATTENDEE", cx, 161);

  // Participant name is the main visual focal point.
  const attendeeName = (options.attendeeName || "PARTICIPANT").trim().toUpperCase();
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "900 34px system-ui, -apple-system, sans-serif";
  let attendeeFont = 34;
  while (ctx.measureText(attendeeName).width > contentW - 16 && attendeeFont > 22) {
    attendeeFont -= 1;
    ctx.font = `900 ${attendeeFont}px system-ui, -apple-system, sans-serif`;
  }
  ctx.fillText(attendeeName, cx, 205);

  // Event name: fit within the card width rather than overflowing.
  const eventTitle = (options.eventTitle || "EVENT").trim();
  ctx.fillStyle = "#1e293b";
  let eventFont = 23;
  ctx.font = `800 ${eventFont}px system-ui, -apple-system, sans-serif`;
  while (ctx.measureText(eventTitle).width > contentW - 20 && eventFont > 16) {
    eventFont -= 1;
    ctx.font = `800 ${eventFont}px system-ui, -apple-system, sans-serif`;
  }
  ctx.fillText(eventTitle, cx, 239);

  // Date and venue information in a compact two-column official details panel.
  const infoY = 260;
  const infoH = 76;
  ctx.fillStyle = theme.softTint;
  roundRect(ctx, margin, infoY, contentW, infoH, 15);
  ctx.fill();
  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1.4;
  roundRect(ctx, margin, infoY, contentW, infoH, 15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, infoY + 10);
  ctx.lineTo(cx, infoY + infoH - 10);
  ctx.stroke();

  drawCalendarIcon(ctx, margin + 18, infoY + 18, theme.primary);
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
  } catch {
    // Keep the fallback formatted date.
  }
  ctx.textAlign = "left";
  ctx.fillStyle = theme.primary;
  ctx.font = "800 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("DATE & TIME", margin + 54, infoY + 22);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 14px system-ui, -apple-system, sans-serif";
  ctx.fillText(dateLine, margin + 54, infoY + 43);
  ctx.fillStyle = "#64748b";
  ctx.font = "600 11px system-ui, -apple-system, sans-serif";
  ctx.fillText(timeLine || "As scheduled", margin + 54, infoY + 60);

  drawLocationIcon(ctx, cx + 18, infoY + 18, theme.primary);
  const venue = (options.venue || "Campus / Online").trim();
  ctx.fillStyle = theme.primary;
  ctx.font = "800 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("VENUE", cx + 48, infoY + 22);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 13px system-ui, -apple-system, sans-serif";
  let venueFont = 13;
  while (ctx.measureText(venue).width > width - (cx + 48) - margin - 8 && venueFont > 10) {
    venueFont -= 1;
    ctx.font = `700 ${venueFont}px system-ui, -apple-system, sans-serif`;
  }
  ctx.fillText(venue, cx + 48, infoY + 43);
  ctx.fillStyle = "#64748b";
  ctx.font = "600 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("Event location", cx + 48, infoY + 60);

  // Attendee details card. Coordinator information is moved to the bottom footer.
  const attendeeBoxY = 350;
  const attendeeBoxH = 68;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, margin, attendeeBoxY, contentW, attendeeBoxH, 14);
  ctx.fill();
  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1.3;
  roundRect(ctx, margin, attendeeBoxY, contentW, attendeeBoxH, 14);
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = theme.primary;
  ctx.font = "800 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("REGISTERED ATTENDEE", margin + 16, attendeeBoxY + 20);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 14px system-ui, -apple-system, sans-serif";
  const attendeeLabel = options.attendeeName || "Participant";
  ctx.fillText(attendeeLabel.length > 38 ? attendeeLabel.slice(0, 35) + "..." : attendeeLabel, margin + 16, attendeeBoxY + 39);
  ctx.fillStyle = "#64748b";
  ctx.font = "600 11px system-ui, -apple-system, sans-serif";
  const attendeeSub = options.classSemester || options.attendeeEmail || options.attendeePhone || "Registered attendee";
  ctx.fillText(attendeeSub.length > 70 ? attendeeSub.slice(0, 67) + "..." : attendeeSub, margin + 16, attendeeBoxY + 55);

  // Dashed perforation line and side cut-outs.
  ctx.save();
  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(notchR + 9, notchY);
  ctx.lineTo(width - notchR - 9, notchY);
  ctx.stroke();
  ctx.restore();

  // QR: larger, centered, and kept clear for reliable scanning.
  const qrSize = 320;
  const qrY = 485;
  const qrX = cx - qrSize / 2;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(15, 23, 42, 0.10)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, qrX, qrY, qrSize, qrSize, 18);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 2.5;
  roundRect(ctx, qrX, qrY, qrSize, qrSize, 18);
  ctx.stroke();

  const qrImg = new Image();
  qrImg.src = options.qrDataUrl;
  await new Promise<void>((resolve) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = () => resolve();
  });
  if (qrImg.complete && qrImg.naturalWidth > 0) {
    const qrPad = 15;
    ctx.drawImage(qrImg, qrX + qrPad, qrY + qrPad, qrSize - qrPad * 2, qrSize - qrPad * 2);
  }

  // Small centered label requested: IEPRN. Keep it compact to protect QR readability.
  const centerBadgeW = 62;
  const centerBadgeH = 28;
  const centerBadgeX = cx - centerBadgeW / 2;
  const centerBadgeY = qrY + qrSize / 2 - centerBadgeH / 2;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, centerBadgeX - 4, centerBadgeY - 4, centerBadgeW + 8, centerBadgeH + 8, 8);
  ctx.fill();
  ctx.fillStyle = theme.primary;
  roundRect(ctx, centerBadgeX, centerBadgeY, centerBadgeW, centerBadgeH, 6);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("ieprn", cx, centerBadgeY + centerBadgeH / 2);

  // Ticket code directly below QR in a solid, high-contrast pill.
  const codeY = qrY + qrSize + 20;
  const codeW = 300;
  const codeH = 44;
  const codeX = cx - codeW / 2;
  ctx.fillStyle = theme.primaryDark;
  roundRect(ctx, codeX, codeY, codeW, codeH, 22);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 20px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(options.ticketCode, cx, codeY + codeH / 2);

  ctx.fillStyle = theme.primary;
  ctx.font = "800 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("SCAN QR CODE FOR ENTRY VERIFICATION", cx, codeY + codeH + 19);
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "700 10px system-ui, -apple-system, sans-serif";
  ctx.fillText("KEEP THIS PASS READY AT THE ENTRY DESK", cx, codeY + codeH + 39);

  // Coordinator name is only shown as a small footer, not at the top.
  const coordinator1 = options.coordinator1Name || options.coordinatorName || "FOSS CEPerumon Chapter";
  const coordinator1Phone = options.coordinator1Phone || options.coordinatorPhone || "";
  const coordinator2 = options.coordinator2Name || "";
  const coordinator2Phone = options.coordinator2Phone || "";
  const coordinatorDetails = [
    coordinator1Phone ? `${coordinator1} • ${coordinator1Phone}` : coordinator1,
    coordinator2 ? (coordinator2Phone ? `${coordinator2} • ${coordinator2Phone}` : coordinator2) : "",
  ].filter(Boolean).join("  |  ");
  const coordinatorFooter = `EVENT COORDINATOR: ${coordinatorDetails}`;
  ctx.fillStyle = "#475569";
  ctx.font = "600 9px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(coordinatorFooter.length > 90 ? coordinatorFooter.slice(0, 87) + "..." : coordinatorFooter, cx, 1040);
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "800 9px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS UNITED STUDENTS CHAPTER • COLLEGE OF ENGINEERING PERUMON", cx, 1060);

  // Restore clip and draw the clean ticket outline.
  ctx.restore();
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
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.arc(x + 10, y + 9, 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 10, y + 16);
  ctx.lineTo(x + 10, y + 24);
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
