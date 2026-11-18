import { formatDate } from "./utils";

export interface EventPassTheme {
  id: string;
  name: string;
  primaryDark: string;       // Deep tone for headers, titles, stub gradient dark end
  primary: string;           // Main theme color for badges and stub gradient
  primaryLight: string;      // Mid tone for waves & accents
  accent: string;            // Vibrant bright accent
  softTint: string;          // Very soft background for pill box (e.g. #e6f4ea)
  borderTint: string;        // Border color for pill box
  textDark: string;          // Text color for title and labels
  pillBg: string;            // Dark background for ticket code pill
  badgeBg: string;           // FOSS badge background
  accentGradient: [string, string];
  cssStubGradient: string;
  cssPillBg: string;
  cssBorderColor: string;
  tailwindBorder: string;
}

export const EVENT_PASS_THEMES: EventPassTheme[] = [
  {
    id: "emerald",
    name: "Emerald Green",
    primaryDark: "#064e3b",
    primary: "#047857",
    primaryLight: "#10b981",
    accent: "#34d399",
    softTint: "#e6f4ea",
    borderTint: "#a7f3d0",
    textDark: "#064e3b",
    pillBg: "#022c22",
    badgeBg: "#047857",
    accentGradient: ["#064e3b", "#047857"],
    cssStubGradient: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
    cssPillBg: "#022c22",
    cssBorderColor: "#a7f3d0",
    tailwindBorder: "border-emerald-300",
  },
  {
    id: "indigo",
    name: "Royal Indigo",
    primaryDark: "#1e3a8a",
    primary: "#2563eb",
    primaryLight: "#3b82f6",
    accent: "#60a5fa",
    softTint: "#e8f0fe",
    borderTint: "#bfdbfe",
    textDark: "#1e3a8a",
    pillBg: "#172554",
    badgeBg: "#2563eb",
    accentGradient: ["#1e3a8a", "#2563eb"],
    cssStubGradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
    cssPillBg: "#172554",
    cssBorderColor: "#bfdbfe",
    tailwindBorder: "border-blue-300",
  },
  {
    id: "violet",
    name: "Deep Violet",
    primaryDark: "#4c1d95",
    primary: "#7c3aed",
    primaryLight: "#8b5cf6",
    accent: "#c084fc",
    softTint: "#f3e8ff",
    borderTint: "#ddd6fe",
    textDark: "#4c1d95",
    pillBg: "#2e1065",
    badgeBg: "#7c3aed",
    accentGradient: ["#4c1d95", "#7c3aed"],
    cssStubGradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
    cssPillBg: "#2e1065",
    cssBorderColor: "#ddd6fe",
    tailwindBorder: "border-purple-300",
  },
  {
    id: "crimson",
    name: "Ruby Crimson",
    primaryDark: "#881337",
    primary: "#e11d48",
    primaryLight: "#f43f5e",
    accent: "#fb7185",
    softTint: "#ffe4e6",
    borderTint: "#fecdd3",
    textDark: "#881337",
    pillBg: "#4c0519",
    badgeBg: "#e11d48",
    accentGradient: ["#881337", "#e11d48"],
    cssStubGradient: "linear-gradient(135deg, #881337 0%, #e11d48 100%)",
    cssPillBg: "#4c0519",
    cssBorderColor: "#fecdd3",
    tailwindBorder: "border-rose-300",
  },
  {
    id: "teal",
    name: "Ocean Teal",
    primaryDark: "#134e4a",
    primary: "#0d9488",
    primaryLight: "#14b8a6",
    accent: "#2dd4bf",
    softTint: "#e6fffa",
    borderTint: "#99f6e4",
    textDark: "#134e4a",
    pillBg: "#042f2e",
    badgeBg: "#0d9488",
    accentGradient: ["#134e4a", "#0d9488"],
    cssStubGradient: "linear-gradient(135deg, #134e4a 0%, #0d9488 100%)",
    cssPillBg: "#042f2e",
    cssBorderColor: "#99f6e4",
    tailwindBorder: "border-teal-300",
  },
  {
    id: "amber",
    name: "Warm Amber",
    primaryDark: "#78350f",
    primary: "#d97706",
    primaryLight: "#f59e0b",
    accent: "#fbbf24",
    softTint: "#fef3c7",
    borderTint: "#fde68a",
    textDark: "#78350f",
    pillBg: "#451a03",
    badgeBg: "#d97706",
    accentGradient: ["#78350f", "#d97706"],
    cssStubGradient: "linear-gradient(135deg, #78350f 0%, #d97706 100%)",
    cssPillBg: "#451a03",
    cssBorderColor: "#fde68a",
    tailwindBorder: "border-amber-300",
  },
  {
    id: "cyan",
    name: "Cerulean Blue",
    primaryDark: "#0e7490",
    primary: "#0284c7",
    primaryLight: "#38bdf8",
    accent: "#7dd3fc",
    softTint: "#e0f2fe",
    borderTint: "#bae6fd",
    textDark: "#0c4a6e",
    pillBg: "#082f49",
    badgeBg: "#0284c7",
    accentGradient: ["#0e7490", "#0284c7"],
    cssStubGradient: "linear-gradient(135deg, #0e7490 0%, #0284c7 100%)",
    cssPillBg: "#082f49",
    cssBorderColor: "#bae6fd",
    tailwindBorder: "border-sky-300",
  },
  {
    id: "fuchsia",
    name: "Electric Magenta",
    primaryDark: "#701a75",
    primary: "#c026d3",
    primaryLight: "#d946ef",
    accent: "#e879f9",
    softTint: "#fae8ff",
    borderTint: "#f5d0fe",
    textDark: "#701a75",
    pillBg: "#4a044e",
    badgeBg: "#c026d3",
    accentGradient: ["#701a75", "#c026d3"],
    cssStubGradient: "linear-gradient(135deg, #701a75 0%, #c026d3 100%)",
    cssPillBg: "#4a044e",
    cssBorderColor: "#f5d0fe",
    tailwindBorder: "border-pink-300",
  },
];

/**
 * Deterministically get a distinct color theme for any event based on its id, slug, or title
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCalendarIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Box
  roundRect(ctx, x, y + 4, 32, 28, 6);
  ctx.stroke();

  // Header separator
  ctx.beginPath();
  ctx.moveTo(x, y + 13);
  ctx.lineTo(x + 32, y + 13);
  ctx.stroke();

  // Top binder hooks
  ctx.beginPath();
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 8, y + 6);
  ctx.moveTo(x + 24, y);
  ctx.lineTo(x + 24, y + 6);
  ctx.stroke();

  // 6 grid dots
  const dots = [
    [x + 8, y + 19],
    [x + 16, y + 19],
    [x + 24, y + 19],
    [x + 8, y + 25],
    [x + 16, y + 25],
    [x + 24, y + 25],
  ];
  for (const [dx, dy] of dots) {
    ctx.beginPath();
    ctx.arc(dx, dy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLocationPin(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Pin path
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 33);
  ctx.bezierCurveTo(x + 1, y + 21, x + 1, y + 6, x + 14, y + 6);
  ctx.bezierCurveTo(x + 27, y + 6, x + 27, y + 21, x + 14, y + 33);
  ctx.closePath();
  ctx.fill();

  // Inner cutout dot
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + 14, y + 15, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function createTicketPath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  splitX: number,
  r: number,
  notchR: number
) {
  ctx.beginPath();
  // Start after top-left corner
  ctx.moveTo(r, 0);
  // Line to top notch
  ctx.lineTo(splitX - notchR, 0);
  // Top notch (inward into card: counter-clockwise arc around (splitX, 0))
  ctx.arc(splitX, 0, notchR, Math.PI, 0, true);
  // Line to top-right corner
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);
  // Right edge
  ctx.lineTo(w, h - r);
  ctx.arcTo(w, h, w - r, h, r);
  // Line to bottom notch
  ctx.lineTo(splitX + notchR, h);
  // Bottom notch (inward into card: counter-clockwise arc around (splitX, h))
  ctx.arc(splitX, h, notchR, 0, Math.PI, true);
  // Line to bottom-left corner
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);
  // Left edge
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
}

/**
 * Generates an ultra-crisp high-resolution invitation pass PNG matching the official CEPRN template
 */
export async function generateInvitationPassImage(options: InvitationPassOptions): Promise<string> {
  const canvas = document.createElement("canvas");
  const width = 1300;
  const height = 580;
  const splitX = 890; // ~68.5% main body, ~31.5% ticket stub
  const cornerR = 28;
  const notchR = 20;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create canvas rendering context");
  }

  // Determine dynamic color theme
  const theme =
    options.theme ||
    getEventPassTheme({
      id: options.eventId || undefined,
      slug: options.eventSlug || undefined,
      title: options.eventTitle,
    });

  // 1. Clip entire ticket with rounded corners and top/bottom notches
  ctx.save();
  createTicketPath(ctx, width, height, splitX, cornerR, notchR);
  ctx.clip();

  // 2. Main Body (Left: 0 to splitX) - Clean White Card
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, splitX, height);

  // 3. Ticket Stub (Right: splitX to width) - Rich Theme Gradient
  const stubGrad = ctx.createLinearGradient(splitX, 0, width, height);
  stubGrad.addColorStop(0, theme.accentGradient[0]);
  stubGrad.addColorStop(1, theme.accentGradient[1]);
  ctx.fillStyle = stubGrad;
  ctx.fillRect(splitX, 0, width - splitX, height);

  // 4. Left Body Decorative Corner Curves & Waves (Matching Sample Pass Design)
  // Top-left subtle pastel arc
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(160, 0);
  ctx.bezierCurveTo(90, 45, 45, 90, 0, 160);
  ctx.closePath();
  ctx.fillStyle = theme.softTint;
  ctx.fill();

  // Top-left delicate accent wave
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(100, 0);
  ctx.bezierCurveTo(55, 30, 25, 60, 0, 100);
  ctx.closePath();
  ctx.fillStyle = theme.accent + "30";
  ctx.fill();

  // Bottom-left layered sweeping ribbons
  // Layer 1: Soft Tint
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.bezierCurveTo(80, 365, 230, 475, 300, 580);
  ctx.lineTo(0, 580);
  ctx.closePath();
  ctx.fillStyle = theme.softTint;
  ctx.fill();

  // Layer 2: Bright Accent
  ctx.beginPath();
  ctx.moveTo(0, 395);
  ctx.bezierCurveTo(70, 410, 195, 495, 240, 580);
  ctx.lineTo(0, 580);
  ctx.closePath();
  ctx.fillStyle = theme.primaryLight;
  ctx.fill();

  // Layer 3: Main Theme Tone
  ctx.beginPath();
  ctx.moveTo(0, 445);
  ctx.bezierCurveTo(60, 455, 155, 520, 180, 580);
  ctx.lineTo(0, 580);
  ctx.closePath();
  ctx.fillStyle = theme.primary;
  ctx.fill();

  // Layer 4: Deep Primary Dark Tone
  ctx.beginPath();
  ctx.moveTo(0, 495);
  ctx.bezierCurveTo(45, 495, 115, 545, 125, 580);
  ctx.lineTo(0, 580);
  ctx.closePath();
  ctx.fillStyle = theme.primaryDark;
  ctx.fill();

  // --------------------------------------------------------------------------
  // Left Section Content
  // --------------------------------------------------------------------------
  const leftCenterX = splitX / 2; // 445

  // 5. FOSS Badge
  ctx.fillStyle = theme.primary;
  roundRect(ctx, 55, 40, 92, 50, 14);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 24px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FOSS", 101, 65);

  // Vertical Header Divider
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(162, 44);
  ctx.lineTo(162, 86);
  ctx.stroke();

  // Chapter Sub-header Text
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "800 15px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS UNITED STUDENTS CHAPTER", 176, 59);

  ctx.fillStyle = "#64748b";
  ctx.font = "700 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("COLLEGE OF ENGINEERING PERUMON", 176, 79);

  // 6. Main Title: "INVITATION PASS"
  ctx.textAlign = "center";
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "900 42px system-ui, -apple-system, sans-serif";
  ctx.fillText("INVITATION PASS", leftCenterX, 138);

  // Subtitle: "────── FOR ATTENDING THE EVENT ──────"
  const subText = "FOR ATTENDING THE EVENT";
  ctx.font = "800 14px system-ui, -apple-system, sans-serif";
  const subWidth = ctx.measureText(subText).width;

  ctx.strokeStyle = theme.primaryDark;
  ctx.lineWidth = 1.5;
  // Left rule
  ctx.beginPath();
  ctx.moveTo(leftCenterX - subWidth / 2 - 90, 156);
  ctx.lineTo(leftCenterX - subWidth / 2 - 16, 156);
  ctx.stroke();
  // Centered subtitle text
  ctx.fillStyle = theme.primaryDark;
  ctx.fillText(subText, leftCenterX, 161);
  // Right rule
  ctx.beginPath();
  ctx.moveTo(leftCenterX + subWidth / 2 + 16, 156);
  ctx.lineTo(leftCenterX + subWidth / 2 + 90, 156);
  ctx.stroke();

  // 7. Prominent Event Title
  ctx.textAlign = "center";
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 23px system-ui, -apple-system, sans-serif";

  const maxTitleW = 730;
  const titleWords = (options.eventTitle || "FOSS Chapter Event").split(" ");
  let titleLines: string[] = [];
  let curLine = "";
  for (const w of titleWords) {
    const test = curLine ? curLine + " " + w : w;
    if (ctx.measureText(test).width > maxTitleW && curLine) {
      titleLines.push(curLine);
      curLine = w;
    } else {
      curLine = test;
    }
  }
  if (curLine) titleLines.push(curLine);
  if (titleLines.length > 2) {
    titleLines = [titleLines[0], titleLines[1] + "..."];
  }

  const titleStartY = titleLines.length === 1 ? 198 : 192;
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i], leftCenterX, titleStartY + i * 26);
  }

  // 8. Info Pill Box (Date/Time & Venue)
  const pillY = titleLines.length === 1 ? 232 : 246;
  const pillW = 740;
  const pillH = 74;
  const pillX = leftCenterX - pillW / 2;

  // Background
  ctx.fillStyle = theme.softTint;
  roundRect(ctx, pillX, pillY, pillW, pillH, 18);
  ctx.fill();

  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.borderTint;
  roundRect(ctx, pillX, pillY, pillW, pillH, 18);
  ctx.stroke();

  // Divider inside pill box
  ctx.beginPath();
  ctx.moveTo(leftCenterX, pillY + 12);
  ctx.lineTo(leftCenterX, pillY + pillH - 12);
  ctx.strokeStyle = theme.borderTint;
  ctx.stroke();

  // Left side: Calendar Icon + Date & Time
  drawCalendarIcon(ctx, pillX + 24, pillY + 19, theme.primaryDark);
  ctx.textAlign = "left";
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "800 15px system-ui, -apple-system, sans-serif";
  ctx.fillText(formatDate(options.startDate), pillX + 70, pillY + 34);

  let timeFormatted = "";
  try {
    const dt = new Date(options.startDate);
    if (!isNaN(dt.getTime())) {
      timeFormatted = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  } catch {}
  ctx.fillStyle = "#475569";
  ctx.font = "600 13px system-ui, -apple-system, sans-serif";
  ctx.fillText(timeFormatted || "Event Schedule", pillX + 70, pillY + 54);

  // Right side: Location Pin + Venue
  drawLocationPin(ctx, leftCenterX + 24, pillY + 17, theme.primaryDark);
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "800 15px system-ui, -apple-system, sans-serif";
  const rawVenue = options.venue || "College Campus";
  const venueDisplay = ctx.measureText(rawVenue).width > 260 ? rawVenue.substring(0, 26) + "..." : rawVenue;
  ctx.fillText(venueDisplay, leftCenterX + 64, pillY + 34);

  ctx.fillStyle = "#475569";
  ctx.font = "600 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("Campus Lab / Online", leftCenterX + 64, pillY + 54);

  // 9. Attendee & Coordinator Details Section
  const detailsY = pillY + pillH + 20;

  // Left: Attendee Info
  ctx.textAlign = "left";
  ctx.fillStyle = theme.primary;
  ctx.font = "800 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("REGISTERED ATTENDEE", 85, detailsY);

  ctx.fillStyle = "#0f172a";
  ctx.font = "800 17px system-ui, -apple-system, sans-serif";
  ctx.fillText(options.attendeeName, 85, detailsY + 22);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px system-ui, -apple-system, sans-serif";
  const attMeta = options.classSemester ? `${options.classSemester} • ${options.attendeeEmail}` : options.attendeeEmail;
  ctx.fillText(attMeta.length > 44 ? attMeta.substring(0, 42) + "..." : attMeta, 85, detailsY + 41);

  // Right: Event Coordinators Info
  ctx.fillStyle = theme.primary;
  ctx.font = "800 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("EVENT COORDINATORS", leftCenterX + 15, detailsY);

  const c1Name = options.coordinator1Name || options.coordinatorName || "FOSS Chapter Lead";
  const c1Phone = options.coordinator1Phone || options.coordinatorPhone || "";
  const c2Name = options.coordinator2Name || "";
  const c2Phone = options.coordinator2Phone || "";

  let c1Text = c1Name + (c1Phone ? ` (Ph: ${c1Phone})` : "");
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 13px system-ui, -apple-system, sans-serif";
  ctx.fillText(c1Text.length > 44 ? c1Text.substring(0, 42) + "..." : c1Text, leftCenterX + 15, detailsY + 22);

  if (c2Name) {
    let c2Text = c2Name + (c2Phone ? ` (Ph: ${c2Phone})` : "");
    ctx.fillStyle = "#475569";
    ctx.font = "600 12px system-ui, -apple-system, sans-serif";
    ctx.fillText(c2Text.length > 44 ? c2Text.substring(0, 42) + "..." : c2Text, leftCenterX + 15, detailsY + 41);
  } else {
    ctx.fillStyle = "#64748b";
    ctx.font = "600 12px system-ui, -apple-system, sans-serif";
    ctx.fillText("FOSS United CEPerumon Chapter", leftCenterX + 15, detailsY + 41);
  }

  // 10. Diamond Ornament Line & Pass Instructions
  const ornY = detailsY + 62;
  ctx.strokeStyle = theme.borderTint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftCenterX - 180, ornY);
  ctx.lineTo(leftCenterX - 16, ornY);
  ctx.stroke();

  drawDiamond(ctx, leftCenterX, ornY, 5, theme.primary);

  ctx.beginPath();
  ctx.moveTo(leftCenterX + 16, ornY);
  ctx.lineTo(leftCenterX + 180, ornY);
  ctx.stroke();

  // Save Reminder Notice
  ctx.textAlign = "center";
  ctx.fillStyle = theme.primaryDark;
  ctx.font = "800 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("⚠️ SAVE THIS QR PASS • DO NOT MISS IT • SHOW AT ENTRY DESK", leftCenterX, ornY + 24);

  // --------------------------------------------------------------------------
  // Right Section (Ticket Stub) Content
  // --------------------------------------------------------------------------
  // Perforation dashed divider line along splitX
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(splitX, 30);
  ctx.lineTo(splitX, height - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  const stubCenterX = splitX + (width - splitX) / 2; // 890 + 205 = 1095

  // 11. White Rounded Card for QR Code
  const qrCardW = 290;
  const qrCardH = 290;
  const qrCardX = stubCenterX - qrCardW / 2;
  const qrCardY = 55;

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 20);
  ctx.fill();

  // Draw QR Image
  const qrImg = new Image();
  qrImg.src = options.qrDataUrl;
  await new Promise((resolve) => {
    if (qrImg.complete) {
      resolve(true);
    } else {
      qrImg.onload = () => resolve(true);
      qrImg.onerror = () => resolve(false);
    }
  });

  // Render QR Code inside white card
  ctx.drawImage(qrImg, qrCardX + 15, qrCardY + 15, qrCardW - 30, qrCardH - 30);

  // 12. Monospace Ticket Code Pill Badge (as in sample pass)
  const pillCodeW = 280;
  const pillCodeH = 48;
  const pillCodeX = stubCenterX - pillCodeW / 2;
  const pillCodeY = qrCardY + qrCardH + 28;

  // Dark Pill Background
  ctx.fillStyle = theme.pillBg;
  roundRect(ctx, pillCodeX, pillCodeY, pillCodeW, pillCodeH, 24);
  ctx.fill();

  // White Translucent Pill Border
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  roundRect(ctx, pillCodeX, pillCodeY, pillCodeW, pillCodeH, 24);
  ctx.stroke();

  // Ticket Code Text
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 21px monospace, ui-monospace, sans-serif";
  ctx.fillText(options.ticketCode, stubCenterX, pillCodeY + pillCodeH / 2);

  // 13. Subtitle: "SCAN FOR ENTRY CHECK-IN"
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("SCAN FOR ENTRY CHECK-IN", stubCenterX, pillCodeY + pillCodeH + 34);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "600 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("FOSS UNITED STUDENTS CHAPTER", stubCenterX, pillCodeY + pillCodeH + 54);

  // 14. Restore context from clipping and draw outer border
  ctx.restore();

  // Clean subtle boundary stroke
  createTicketPath(ctx, width, height, splitX, cornerR, notchR);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.stroke();

  return canvas.toDataURL("image/png");
}
