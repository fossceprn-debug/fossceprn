// ============================================================================
// Email Delivery Service for Event Passes
// Interacts with Supabase Edge Function `send-ticket-email` using Resend Free API
// Never exposes private API credentials in frontend client code.
// ============================================================================

import { supabase, isSupabaseConfigured } from "./supabase";
import { updateRegistrationEmailStatus } from "./adminService";
import { generateTicketPdf } from "./passGenerator";
import QRCode from "qrcode";
import type { EventItem, EventRegistration } from "@/types";

export interface SendTicketEmailPayload {
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

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Triggers automated ticket email dispatch through the secure Supabase Edge Function.
 * The Edge Function communicates with Resend Free API using backend secrets.
 */
export async function sendTicketEmail(
  payload: SendTicketEmailPayload
): Promise<EmailSendResult> {
  if (!payload.toEmail || !payload.ticketCode) {
    return { success: false, error: "Recipient email and ticket code are required." };
  }

  // If Supabase is configured, invoke the Edge Function
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke("send-ticket-email", {
        body: payload,
      });

      if (error) {
        console.warn("Supabase edge function invocation error:", error);
        await updateRegistrationEmailStatus(
          payload.registrationId,
          "failed",
          error.message || "Failed to invoke edge function"
        );
        return { success: false, error: error.message };
      }

      if (data && data.success) {
        await updateRegistrationEmailStatus(payload.registrationId, "sent");
        return { success: true, messageId: data.messageId };
      } else {
        const errorMsg = data?.error || "Email delivery failed via Edge Function";
        await updateRegistrationEmailStatus(payload.registrationId, "failed", errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      console.warn("Edge function call exception:", err);
      const errMsg = err?.message || "Network exception while dispatching ticket email.";
      await updateRegistrationEmailStatus(payload.registrationId, "failed", errMsg);
      return { success: false, error: errMsg };
    }
  }

  // Offline / Local Development Fallback Notice
  console.info(
    `[Local Dev Mode] Ticket email queued for ${payload.toEmail} (${payload.ticketCode}). Deploy Supabase Edge Function 'send-ticket-email' to send live emails via Resend Free API.`
  );
  await updateRegistrationEmailStatus(payload.registrationId, "sent");
  return { success: true, messageId: "local-dev-mock-id" };
}

/**
 * Helper to resend an event pass to an already registered participant.
 * Re-generates the QR code and PDF ticket dynamically and calls sendTicketEmail.
 */
export async function resendRegistrationTicket(
  registration: EventRegistration,
  event: EventItem
): Promise<EmailSendResult> {
  try {
    // 1. Generate QR Code
    const qrPayload = JSON.stringify({
      ticket_code: registration.ticket_code,
      event_id: registration.event_id,
      event_title: event.title,
      attendee: registration.full_name,
      email: registration.email,
      timestamp: registration.created_at,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // 2. Generate PDF Ticket
    const { pdfBase64 } = await generateTicketPdf({
      eventTitle: event.title,
      startDate: event.start_date,
      venue: event.venue,
      attendeeName: registration.full_name,
      attendeeEmail: registration.email,
      attendeePhone: registration.phone,
      classSemester: registration.class_semester,
      ticketCode: registration.ticket_code,
      qrDataUrl: qrDataUrl,
      coordinator1Name: event.coordinator1_name || event.coordinator_name || "FOSS Chapter Lead",
      coordinator1Phone: event.coordinator1_phone || event.coordinator_phone || "",
      coordinator2Name: event.coordinator2_name || "",
      coordinator2Phone: event.coordinator2_phone || "",
      eventId: event.id,
      eventSlug: event.slug,
    });

    // 3. Dispatch Email
    return await sendTicketEmail({
      registrationId: registration.id,
      toEmail: registration.email,
      attendeeName: registration.full_name,
      ticketCode: registration.ticket_code,
      eventTitle: event.title,
      startDate: event.start_date,
      venue: event.venue,
      pdfBase64: pdfBase64,
      qrDataUrl: qrDataUrl,
      coordinatorName: [event.coordinator1_name, event.coordinator2_name].filter(Boolean).join(" & ") || event.coordinator_name || "FOSS Chapter Lead",
      coordinatorPhone: event.coordinator1_phone || event.coordinator_phone || "",
    });
  } catch (err: any) {
    console.error("Failed to resend registration ticket:", err);
    return { success: false, error: err.message || "Failed to generate ticket for resend." };
  }
}

