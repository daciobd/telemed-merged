import axios from 'axios';

type NotifyTarget = { email?: string; phone?: string };

export async function notifyPatient(target: NotifyTarget, message: string, attachmentUrl?: string) {
  // MVP: log only. Replace with email (SES/SendGrid) and WhatsApp (Twilio/WATI) later.
  console.log('[notify] to=', target, 'message=', message, 'attachment=', attachmentUrl);
  // Example placeholder for WhatsApp provider
  if (process.env.NOTIFY_WHATSAPP_PROVIDER === 'twilio' && target.phone) {
    try {
      await axios.post('https://api.twilio.example/send', { to: target.phone, body: message, mediaUrl: attachmentUrl });
    } catch (e) {
      console.warn('[notify] twilio placeholder failed (expected in dev)');
    }
  }
}