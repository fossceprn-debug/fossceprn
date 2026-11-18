// ============================================================================
// Supabase Edge Function: send-ticket-email
// Description: Automatically emails an event pass with PDF attachment & QR code
//              to registered attendees using the Resend Free Email API.
// Security: Never exposes RESEND_API_KEY to frontend code.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailPayload {
  registrationId: string;
  toEmail: string;
  attendeeName: string;
  ticketCode: string;
  eventTitle: string;
  startDate: string;
  venue: string;
  pdfBase64?: string;
  qrDataUrl?: string;
  coordinatorName?: string;
  coordinatorPhone?: string;
}

serve(async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured in Supabase environment secrets.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = supabaseUrl && supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    const body: EmailPayload = await req.json();
    const {
      registrationId,
      toEmail,
      attendeeName,
      ticketCode,
      eventTitle,
      startDate,
      venue,
      pdfBase64,
      qrDataUrl,
      coordinatorName,
      coordinatorPhone,
    } = body;

    if (!toEmail || !ticketCode || !eventTitle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: toEmail, ticketCode, eventTitle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format readable date
    let formattedDate = startDate;
    try {
      const dt = new Date(startDate);
      if (!isNaN(dt.getTime())) {
        formattedDate = dt.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {}

    // Resend Free Tier sender address
    // Default is "onboarding@resend.dev" for free tier without a custom domain.
    // If user has verified their domain in Resend, they can set RESEND_FROM_EMAIL.
    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "FOSS CEPrn <onboarding@resend.dev>";

    // Build Email HTML Template
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Ticket - ${eventTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 13px; color: #a7f3d0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 24px; }
    .salutation { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .message { font-size: 14px; color: #475569; margin-bottom: 24px; }
    .ticket-card { background: #f0fdf4; border: 2px dashed #059669; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .ticket-label { font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .ticket-code { font-family: monospace, monospace; font-size: 26px; font-weight: 900; color: #064e3b; letter-spacing: 2px; background: #ffffff; padding: 10px 18px; border-radius: 10px; display: inline-block; border: 1px solid #a7f3d0; margin-bottom: 12px; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 16px; text-align: left; }
    .details-table td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    .details-table td.label { color: #64748b; font-weight: 600; width: 35%; }
    .details-table td.val { color: #0f172a; font-weight: 700; }
    .notice-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 6px; margin: 24px 0; font-size: 13px; color: #1e40af; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
    .footer a { color: #059669; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>FOSS United Students Chapter • CEPerumon</p>
      <h1>Official Event Pass</h1>
    </div>
    <div class="content">
      <div class="salutation">Hello ${attendeeName},</div>
      <div class="message">
        Your registration for <strong>${eventTitle}</strong> is confirmed! Your personalized ticket and QR check-in pass are ready.
      </div>

      <div class="ticket-card">
        <div class="ticket-label">Your Check-In Ticket Code</div>
        <div class="ticket-code">${ticketCode}</div>
        <p style="margin: 0; font-size: 12px; color: #047857; font-weight: 600;">
          📎 Your printable PDF ticket is attached to this email.
        </p>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Event:</td>
          <td class="val">${eventTitle}</td>
        </tr>
        <tr>
          <td class="label">Date & Time:</td>
          <td class="val">${formattedDate}</td>
        </tr>
        <tr>
          <td class="label">Venue:</td>
          <td class="val">${venue || "College Campus"}</td>
        </tr>
        <tr>
          <td class="label">Attendee:</td>
          <td class="val">${attendeeName} (${toEmail})</td>
        </tr>
        ${
          coordinatorName
            ? `<tr>
                <td class="label">Coordinator:</td>
                <td class="val">${coordinatorName} ${coordinatorPhone ? `(${coordinatorPhone})` : ""}</td>
              </tr>`
            : ""
        }
      </table>

      <div class="notice-box">
        <strong>⚠️ Entry Instructions:</strong> Please save this email or download the attached PDF ticket. Present either the PDF or ticket code <strong>${ticketCode}</strong> at the entry registration desk on the event day for verified entry.
      </div>
    </div>
    <div class="footer">
      Sent with ❤️ by <strong>FOSS United Students Chapter</strong>, College of Engineering Perumon.<br>
      For event inquiries, contact the chapter coordinator.
    </div>
  </div>
</body>
</html>
    `;

    // Attach PDF if provided
    const attachments = [];
    if (pdfBase64) {
      attachments.push({
        filename: `Ticket-${ticketCode}.pdf`,
        content: pdfBase64,
      });
    }

    // Call Resend API
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject: `Your Event Ticket: ${eventTitle} [${ticketCode}]`,
        html: htmlBody,
        attachments: attachments.length > 0 ? attachments : undefined,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      const errMsg = resendData.message || resendData.error || "Failed to send email via Resend.";
      console.error("Resend API error:", errMsg);

      // Record failure in Supabase if registrationId provided
      if (supabase && registrationId) {
        await supabase
          .from("event_registrations")
          .update({
            email_status: "failed",
            email_error: errMsg,
          })
          .eq("id", registrationId);
      }

      return new Response(
        JSON.stringify({ success: false, error: errMsg, details: resendData }),
        { status: resendRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record success in Supabase if registrationId provided
    if (supabase && registrationId) {
      await supabase
        .from("event_registrations")
        .update({
          email_status: "sent",
          email_sent_at: new Date().toISOString(),
          email_error: null,
        })
        .eq("id", registrationId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        email_status: "sent",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("send-ticket-email function error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

