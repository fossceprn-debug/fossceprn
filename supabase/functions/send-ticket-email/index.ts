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
  textBody?: string;
  htmlBody?: string;
}

serve(async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase =
      supabaseUrl && supabaseServiceKey
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
    } = body;

    if (!toEmail || !ticketCode || !eventTitle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: toEmail, ticketCode, eventTitle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format readable date & time
    let formattedDate = "Date TBA";
    let formattedTime = "Time TBA";
    try {
      const dt = new Date(startDate);
      if (!isNaN(dt.getTime())) {
        formattedDate = dt.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        formattedTime = dt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    } catch {}

    const fromAddress =
      Deno.env.get("RESEND_FROM_EMAIL") || "FOSS CEPrn <onboarding@resend.dev>";

    // Build Exact Text Body
    const textContent =
      body.textBody ||
      `Hello ${attendeeName},

Congratulations! 🎉

Your registration for ${eventTitle} has been successfully confirmed.

We're excited to have you join us!

📋 EVENT DETAILS

Event: ${eventTitle}

Date: ${formattedDate}

Time: ${formattedTime}

Venue: ${venue || "Campus Lab / Online"}

Registration ID: ${ticketCode}

🎟️ YOUR EVENT PASS

Your personalized event pass is attached to this email as a PDF.

Your pass includes a unique QR code. Please bring this pass with you to the event. Our organizers will scan your QR code during check-in.

IMPORTANT INSTRUCTIONS

Download your attached event pass.

Keep your registration ID safe.

Bring your event pass (digital or printed).

Arrive at the venue on time.

Present your QR code at the registration desk.

If you have any questions, please contact our organizing team.

Thank you for registering with FOSS CEPrn!

See you at the event! 🚀

Best regards,

FOSS CEPrn Team

Learn. Build. Share. Contribute.

Website: https://fossceprn.org

Contact: fossceprn@gmail.com`;

    // Build Exact HTML Body
    const htmlContent =
      body.htmlBody ||
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #064e3b; color: white; padding: 26px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
    .content { padding: 26px 24px; font-size: 14.5px; color: #334155; }
    .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin: 18px 0; }
    .card-title { color: #047857; font-weight: 800; font-size: 13px; text-transform: uppercase; margin-bottom: 10px; }
    .table-details { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .table-details td { padding: 6px 0; border-bottom: 1px dashed #dcfce7; }
    .instructions { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 18px 0; font-size: 13.5px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FOSS UNITED STUDENTS CHAPTER</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #a7f3d0; text-transform: uppercase;">College of Engineering Perumon</p>
    </div>
    <div class="content">
      <p>Hello <strong>${attendeeName}</strong>,</p>
      <p>Congratulations! 🎉</p>
      <p>Your registration for <strong>${eventTitle}</strong> has been successfully confirmed.</p>
      <p>We're excited to have you join us!</p>

      <div class="card">
        <div class="card-title">📋 EVENT DETAILS</div>
        <table class="table-details">
          <tr><td style="color: #64748b; font-weight: 600;">Event:</td><td style="text-align: right; font-weight: 700; color: #0f172a;">${eventTitle}</td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Date:</td><td style="text-align: right; font-weight: 700; color: #0f172a;">${formattedDate}</td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Time:</td><td style="text-align: right; font-weight: 700; color: #0f172a;">${formattedTime}</td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Venue:</td><td style="text-align: right; font-weight: 700; color: #0f172a;">${venue || "Campus Lab / Online"}</td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Registration ID:</td><td style="text-align: right; font-weight: 800; font-family: monospace; color: #047857;">${ticketCode}</td></tr>
        </table>
      </div>

      <p><strong>🎟️ YOUR EVENT PASS</strong></p>
      <p>Your personalized event pass is attached to this email as a PDF.</p>
      <p>Your pass includes a unique QR code. Please bring this pass with you to the event. Our organizers will scan your QR code during check-in.</p>

      <div class="instructions">
        <strong style="color: #0f172a; display: block; margin-bottom: 8px;">IMPORTANT INSTRUCTIONS</strong>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Download your attached event pass.</li>
          <li>Keep your registration ID safe.</li>
          <li>Bring your event pass (digital or printed).</li>
          <li>Arrive at the venue on time.</li>
          <li>Present your QR code at the registration desk.</li>
        </ul>
      </div>

      <p>If you have any questions, please contact our organizing team.</p>
      <p>Thank you for registering with FOSS CEPrn!</p>
      <p>See you at the event! 🚀</p>

      <p>Best regards,<br>
      <strong>FOSS CEPrn Team</strong><br>
      <em>Learn. Build. Share. Contribute.</em></p>
    </div>
    <div class="footer">
      <p style="margin: 0;">Website: <a href="https://fossceprn.org" style="color: #047857;">https://fossceprn.org</a> | Contact: <a href="mailto:fossceprn@gmail.com" style="color: #047857;">fossceprn@gmail.com</a></p>
    </div>
  </div>
</body>
</html>`;

    // Attach PDF if provided
    const attachments = [];
    if (pdfBase64) {
      attachments.push({
        filename: (body as any).attachmentFilename || (body as any).filename || `Ticket-${ticketCode}.pdf`,
        content: pdfBase64,
      });
    }

    const emailSubject =
      (body as any).subject || `Registration Confirmed: ${eventTitle} [Pass ID: ${ticketCode}]`;

    const templateObj = (body as any).template;
    const resendPayload: Record<string, any> = {
      from: fromAddress,
      to: [toEmail],
      subject: emailSubject,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    if (templateObj) {
      resendPayload.template = templateObj;
    } else {
      resendPayload.text = textContent;
      resendPayload.html = htmlContent;
    }

    // Call Resend API
    let resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    let resendData = await resendRes.json();

    // If template sending fails (e.g. template not created in Resend dashboard), fallback to text/html
    if (!resendRes.ok && templateObj) {
      console.warn("Template sending failed, falling back to html/text content:", resendData);
      resendPayload.template = undefined;
      resendPayload.text = textContent;
      resendPayload.html = htmlContent;
      resendPayload.tags = [{ name: "template", value: "certificate-delivery" }];

      resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendPayload),
      });
      resendData = await resendRes.json();
    }

    // Handle free tier sandbox domain restriction (403: only delivers to fossceprn@gmail.com)
    if (!resendRes.ok && resendRes.status === 403 && resendData.message?.includes("fossceprn@gmail.com")) {
      console.warn("Resend Sandbox Mode: Dispatching pass to verified account fossceprn@gmail.com");
      resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: ["fossceprn@gmail.com"],
          subject: `[Participant: ${attendeeName}] ${emailSubject}`,
          text: `[Recipient Email: ${toEmail}]\n\n` + textContent,
          html: `<p style="background: #fef3c7; color: #92400e; padding: 10px; border-radius: 8px;"><strong>Resend Sandbox Notice:</strong> Delivered to Chapter Admin. Recipient email: <strong>${toEmail}</strong></p>` + htmlContent,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });
      resendData = await resendRes.json();
    }

    if (!resendRes.ok) {
      const errMsg = resendData.message || resendData.error || "Failed to send email via Resend.";
      if (supabase && registrationId) {
        await supabase
          .from("event_registrations")
          .update({ email_status: "failed", email_error: errMsg })
          .eq("id", registrationId);
      }
      return new Response(
        JSON.stringify({ success: false, error: errMsg, details: resendData }),
        { status: resendRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
