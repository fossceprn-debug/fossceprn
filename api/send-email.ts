import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Serverless Function: /api/send-email
 * Proxies email dispatches to Resend securely using server-side RESEND_API_KEY.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const resendApiKey =
    process.env.RESEND_API_KEY ||
    process.env.VITE_RESEND_API_KEY ||
    "";

  if (!resendApiKey) {
    return res.status(500).json({
      error: "RESEND_API_KEY is not configured in Vercel environment variables.",
    });
  }

  try {
    const payload = req.body;
    let resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let resendData = await resendRes.json();

    // Handle free tier sandbox domain restriction (403: only delivers to fossceprn@gmail.com)
    if (
      !resendRes.ok &&
      resendRes.status === 403 &&
      (resendData.message?.includes("testing emails") ||
        resendData.message?.includes("fossceprn@gmail.com") ||
        resendData.message?.includes("domain"))
    ) {
      console.warn("Resend Sandbox Mode: Dispatching to verified account fossceprn@gmail.com");
      const fallbackPayload = {
        ...payload,
        to: ["fossceprn@gmail.com"],
        subject: `[Participant: ${(payload.to || []).join(", ")}] ${payload.subject}`,
      };
      resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fallbackPayload),
      });
      resendData = await resendRes.json();
      if (resendRes.ok) {
        return res.status(200).json({
          ...resendData,
          details: `Delivered copy to fossceprn@gmail.com (Resend Sandbox mode for ${(payload.to || []).join(", ")})`,
        });
      }
    }

    return res.status(resendRes.status).json(resendData);
  } catch (err: any) {
    console.error("Vercel send-email function error:", err);
    return res.status(500).json({ error: err.message || "Failed to process email dispatch" });
  }
}
