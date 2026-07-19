/**
 * Email notification system for Nirbhoy
 * Uses Resend (free tier: 100 emails/day) — sign up at https://resend.com
 * 
 * Add RESEND_API_KEY to .env.local
 */

import { logger } from "./logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@nirbhoy.app";
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL;

/**
 * Send email via Resend API
 */
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY not set — email notifications disabled.");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ err }, "Email send failed");
    }
  } catch (err) {
    logger.error({ err }, "Email send error");
  }
}

/**
 * Notify moderators about a new complaint
 */
export async function notifyNewComplaint(caseId, title, type) {
  if (!ADMIN_NOTIFY_EMAIL) return;
  
  const typeLabel = type === "incident" ? "অপরাধ / ঘটনা" : "সাধারণ অভিযোগ";
  
  await sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `[Nirbhoy] নতুন রিপোর্ট: ${caseId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8892A4;">নতুন রিপোর্ট জমা হয়েছে</h2>
        <p style="color: #8A94A6;">একটি নতুন রিপোর্ট মডারেশনের অপেক্ষায় রয়েছে।</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; color: #5C6577; font-size: 12px;">কেস নম্বর</td>
            <td style="padding: 8px; color: #8892A4; font-family: monospace;">${caseId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #5C6577; font-size: 12px;">ধরন</td>
            <td style="padding: 8px; color: #E7E9EC;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #5C6577; font-size: 12px;">শিরোনাম</td>
            <td style="padding: 8px; color: #E7E9EC;">${title}</td>
          </tr>
        </table>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin" 
           style="display: inline-block; padding: 12px 24px; background: #7C8BA0; color: #0A0E15; text-decoration: none; border-radius: 6px; font-weight: 600;">
          মডারেটর প্যানেলে যান
        </a>
      </div>
    `,
  });
}

/**
 * Notify when complaint status changes (for future use with submitter email - optional)
 */
export async function notifyStatusChange(caseId, status) {
  logger.info({ caseId, status }, "Status change notification");
}

/**
 * Alert for urgent incidents
 */
export async function notifyUrgentIncident(caseId, title, description) {
  if (!ADMIN_NOTIFY_EMAIL) return;

  await sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `[⚠️ জরুরি] গুরুতর ঘটনা রিপোর্ট: ${caseId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C4634F;">⚠️ জরুরি রিপোর্ট</h2>
        <p style="color: #8A94A6;">একটি গুরুতর ঘটনার রিপোর্ট জমা হয়েছে যা দ্রুত মনোযোগ প্রয়োজন।</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; color: #5C6577; font-size: 12px;">কেস নম্বর</td>
            <td style="padding: 8px; color: #C4634F; font-family: monospace;">${caseId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #5C6577; font-size: 12px;">শিরোনাম</td>
            <td style="padding: 8px; color: #E7E9EC;">${title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #5C6577; font-size: 12px;">বিবরণ</td>
            <td style="padding: 8px; color: #E7E9EC;">${description.substring(0, 200)}...</td>
          </tr>
        </table>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin" 
           style="display: inline-block; padding: 12px 24px; background: #C4634F; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          এখনই পর্যালোচনা করুন
        </a>
      </div>
    `,
  });
}