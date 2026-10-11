'use strict';

const config = require('./config');

// "Gaze <me@example.com>"  or  "me@example.com"
function parseFrom(from) {
  const text = String(from || '').trim();
  const named = /^"?([^"<]*?)"?\s*<([^<>\s]+@[^<>\s]+)>$/.exec(text);
  if (named) return { name: named[1].trim() || 'Gaze', email: named[2] };
  if (/^[^\s<>@]+@[^\s<>@]+$/.test(text)) return { name: 'Gaze', email: text };
  return null;
}

// Brevo's web API (HTTPS). Render's free tier blocks SMTP ports, so we never use SMTP.
async function sendViaBrevo({ to, subject, html, text }) {
  const sender = parseFrom(config.emailFrom);
  if (!config.emailApiKey || !sender) {
    console.error('[email] Brevo is not configured: set EMAIL_API_KEY and EMAIL_FROM');
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': config.emailApiKey,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html, textContent: text }),
      signal: controller.signal
    });
    if (!res.ok) {
      let detail = '';
      try { const body = await res.json(); detail = body.code || body.message || ''; } catch (_) { /* no body */ }
      // never log the message itself: it contains one-time links
      console.error(`[email] Brevo rejected the message: HTTP ${res.status} ${String(detail).slice(0, 120)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send failed:', err.name === 'AbortError' ? 'timed out' : err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Returns true if the provider accepted the message. Never throws.
async function sendEmail(message) {
  if (!message || !message.to) return false;
  if (config.emailProvider === 'brevo') return sendViaBrevo(message);

  if (!config.isProd) {
    // local development: print the email (with its link) in the server window
    console.log(`\n[email:dev] To: ${message.to}\n[email:dev] Subject: ${message.subject}\n${message.text}\n`);
    return true;
  }
  // production without a provider: say so, but never print links into the logs
  console.error('[email] no email provider configured; message not sent');
  return false;
}

module.exports = { sendEmail, parseFrom };
