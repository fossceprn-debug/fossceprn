import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Serverless Function: /api/send-email
 * Proxies email dispatches to Resend securely using server-side RESEND_API_KEY.
 * The API key never touches the browser bundle.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

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

    // Strip any Authorization header from client — always use server-side key
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let resendData = await resendRes.json().catch(() => ({}));

    if (resendRes.ok && resendData?.id) {
      return res.status(200).json(resendData);
    }

    // Handle Resend free-tier sandbox restriction:
    // On the free plan, you can only send to your own verified email.
    // Redirect to fossceprn@gmail.com with participant info in subject.
    const isSandboxError =
      resendRes.status === 403 ||
      (resendData?.message &&
        (String(resendData.message).includes("testing emails") ||
          String(resendData.message).includes("fossceprn@gmail.com") ||
          String(resendData.message).includes("only send") ||
          String(resendData.message).includes("domain") ||
          String(resendData.message).includes("verified")));

    if (isSandboxError) {
      console.warn("Resend sandbox restriction — redirecting to fossceprn@gmail.com");
      const originalTo = Array.isArray(payload.to) ? payload.to.join(", ") : payload.to || "unknown";
      const fallbackPayload = {
        ...payload,
        to: ["fossceprn@gmail.com"],
        subject: `[Certificate for: ${originalTo}] ${payload.subject || "FOSS CEPrn Certificate"}`,
      };

      const fbRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fallbackPayload),
      });

      const fbData = await fbRes.json().catch(() => ({}));

      if (fbRes.ok && fbData?.id) {
        return res.status(200).json({
          ...fbData,
          details: `Sandbox mode: certificate delivered to fossceprn@gmail.com on behalf of ${originalTo}`,
        });
      }

      return res.status(fbRes.status).json({
        ...fbData,
        error: `Sandbox fallback also failed: ${fbData?.message || "unknown error"}`,
      });
    }

    // Any other error — return Resend's response as-is
    return res.status(resendRes.status).json(resendData);
  } catch (err: any) {
    console.error("Vercel send-email error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
