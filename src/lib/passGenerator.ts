import { formatDate } from "./utils";

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
  coordinatorName?: string | null;
  coordinatorPhone?: string | null;
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

export async function generateInvitationPassImage(options: InvitationPassOptions): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 680;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create canvas rendering context");
  }

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 680);
  bgGrad.addColorStop(0, "#021c14");
  bgGrad.addColorStop(0.35, "#064e3b");
  bgGrad.addColorStop(0.7, "#042f24");
  bgGrad.addColorStop(1, "#021811");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 680);

  // Decorative ambient glow
  const glow = ctx.createRadialGradient(900, 100, 20, 900, 100, 400);
  glow.addColorStop(0, "rgba(16, 185, 129, 0.2)");
  glow.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 680);

  // Outer Border & Corner Accents
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#10b981";
  roundRect(ctx, 16, 16, 1168, 648, 24);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
  roundRect(ctx, 24, 24, 1152, 632, 18);
  ctx.stroke();

  // 2. FOSS Logo & Header
  // Logo Shield
  const logoGrad = ctx.createLinearGradient(50, 45, 110, 105);
  logoGrad.addColorStop(0, "#10b981");
  logoGrad.addColorStop(1, "#047857");
  ctx.fillStyle = logoGrad;
  roundRect(ctx, 50, 45, 60, 60, 14);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FOSS", 80, 83);

  // Header Title
  ctx.textAlign = "left";
  ctx.fillStyle = "#34d399";
  ctx.font = "800 15px system-ui, sans-serif";
  ctx.fillText("FOSS UNITED STUDENTS CHAPTER • CE PERUMON", 125, 68);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 13px system-ui, sans-serif";
  ctx.fillText("College of Engineering Perumon • Official Event Entry Pass", 125, 90);

  // 3. MAIN HEADING BANNER: "INVITATION PASS FOR ATTENDING THE EVENT"
  const bannerGrad = ctx.createLinearGradient(50, 125, 780, 175);
  bannerGrad.addColorStop(0, "rgba(16, 185, 129, 0.25)");
  bannerGrad.addColorStop(1, "rgba(6, 78, 59, 0.4)");
  ctx.fillStyle = bannerGrad;
  roundRect(ctx, 50, 125, 740, 48, 12);
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(52, 211, 153, 0.6)";
  roundRect(ctx, 50, 125, 740, 48, 12);
  ctx.stroke();

  ctx.fillStyle = "#fef08a"; // Subtle warm gold / emerald shine
  ctx.font = "900 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✨ INVITATION PASS FOR ATTENDING THE EVENT ✨", 420, 156);

  // 4. EVENT DETAILS
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 28px system-ui, sans-serif";

  // Wrap Event Title if long
  const maxWidth = 720;
  const titleWords = options.eventTitle.split(" ");
  let titleLine = "";
  let titleY = 215;

  for (let n = 0; n < titleWords.length; n++) {
    const testLine = titleLine + titleWords[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(titleLine.trim(), 50, titleY);
      titleLine = titleWords[n] + " ";
      titleY += 34;
      if (titleY > 250) break; // limit to 2 lines
    } else {
      titleLine = testLine;
    }
  }
  ctx.fillText(titleLine.trim(), 50, titleY);

  // Date and Venue Pills
  const infoY = Math.max(titleY + 36, 260);

  // Date Pill
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  roundRect(ctx, 50, infoY, 350, 36, 10);
  ctx.fill();
  ctx.fillStyle = "#6ee7b7";
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillText("📅 " + formatDate(options.startDate), 65, infoY + 23);

  // Venue Pill
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  roundRect(ctx, 415, infoY, 375, 36, 10);
  ctx.fill();
  ctx.fillStyle = "#6ee7b7";
  ctx.font = "700 13px system-ui, sans-serif";
  const venueText = "📍 " + options.venue;
  ctx.fillText(venueText.length > 38 ? venueText.substring(0, 35) + "..." : venueText, 430, infoY + 23);

  // 5. ATTENDEE & COORDINATOR SECTION
  const attY = infoY + 54;
  ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
  roundRect(ctx, 50, attY, 740, 140, 14);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(52, 211, 153, 0.3)";
  roundRect(ctx, 50, attY, 740, 140, 14);
  ctx.stroke();

  // Attendee Name & Class
  ctx.fillStyle = "#34d399";
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.fillText("REGISTERED ATTENDEE", 70, attY + 25);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 20px system-ui, sans-serif";
  ctx.fillText(options.attendeeName, 70, attY + 50);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.fillText(options.classSemester || "CE Perumon Student", 70, attY + 70);

  // Contact Info
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 12px system-ui, sans-serif";
  ctx.fillText(`Email: ${options.attendeeEmail}   •   Phone: ${options.attendeePhone || "N/A"}`, 70, attY + 92);

  // Coordinator Contact Line
  const coordName = options.coordinatorName || "FOSS CEPrn Coordinators";
  const coordPhone = options.coordinatorPhone ? ` (Ph: ${options.coordinatorPhone})` : "";
  ctx.fillStyle = "#38bdf8";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillText(`Event Coordinator: ${coordName}${coordPhone}`, 70, attY + 118);

  // 6. PROMINENT WARNING & INSTRUCTION NOTICE
  const warnY = attY + 155;
  ctx.fillStyle = "rgba(245, 158, 11, 0.14)";
  roundRect(ctx, 50, warnY, 740, 70, 14);
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#f59e0b";
  roundRect(ctx, 50, warnY, 740, 70, 14);
  ctx.stroke();

  ctx.fillStyle = "#fbbf24";
  ctx.font = "800 14px system-ui, sans-serif";
  ctx.fillText("⚠️ PLEASE SAVE THIS QR CODE PASS! DO NOT MISS IT!", 70, warnY + 28);

  ctx.fillStyle = "#fef3c7";
  ctx.font = "500 12px system-ui, sans-serif";
  ctx.fillText(
    "Show this digital pass at the entrance registration desk for instant QR check-in & attendance verification.",
    70,
    warnY + 50
  );

  // 7. RIGHT SECTION: PERFORATED TICKET STUB WITH QR CODE
  // Vertical Perforation Line
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(820, 30);
  ctx.lineTo(820, 650);
  ctx.stroke();
  ctx.setLineDash([]); // reset dash

  // Perforation top and bottom punch circles
  ctx.fillStyle = "#021811";
  ctx.beginPath();
  ctx.arc(820, 16, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(820, 664, 14, 0, Math.PI * 2);
  ctx.fill();

  // Ticket Stub Header
  ctx.textAlign = "center";
  ctx.fillStyle = "#34d399";
  ctx.font = "800 12px system-ui, sans-serif";
  ctx.fillText("OFFICIAL ENTRY PASS", 1000, 65);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillText("VERIFIED ATTENDANCE TICKET", 1000, 85);

  // QR Code Box (White Card)
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 870, 110, 260, 260, 18);
  ctx.fill();

  // Load and draw QR Code Image
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

  ctx.drawImage(qrImg, 885, 125, 230, 230);

  // Ticket Code Pill
  ctx.fillStyle = "rgba(6, 78, 59, 0.9)";
  roundRect(ctx, 870, 390, 260, 50, 12);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#34d399";
  roundRect(ctx, 870, 390, 260, 50, 12);
  ctx.stroke();

  ctx.fillStyle = "#34d399";
  ctx.font = "900 22px monospace";
  ctx.fillText(options.ticketCode, 1000, 423);

  // Instructions under ticket code
  ctx.fillStyle = "#a7f3d0";
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.fillText("SCAN FOR ENTRY CHECK-IN", 1000, 470);

  ctx.fillStyle = "#64748b";
  ctx.font = "500 11px system-ui, sans-serif";
  ctx.fillText("FOSS CEPrn • Chapter Event", 1000, 490);

  return canvas.toDataURL("image/png");
}

