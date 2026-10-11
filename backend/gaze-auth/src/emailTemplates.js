'use strict';

const esc = (value) =>
  String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout(heading, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:14px;padding:28px">
<tr><td>
<p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6366f1;font-weight:bold">Gaze</p>
<h1 style="margin:0 0 16px;font-size:22px">${esc(heading)}</h1>
${bodyHtml}
<p style="margin:24px 0 0;font-size:12px;color:#888">You are receiving this because of activity on your Gaze account.</p>
</td></tr></table></td></tr></table></body></html>`;
}

function button(link, label) {
  return `<p style="margin:20px 0"><a href="${esc(link)}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold">${esc(label)}</a></p>
<p style="font-size:12px;color:#888;word-break:break-all">If the button does not work, copy this link into your browser:<br>${esc(link)}</p>`;
}

const hello = (name) => `Hi ${esc(name || 'there')},`;

function verifyEmail({ name, link }) {
  return {
    subject: 'Confirm your email for Gaze',
    html: layout('Confirm your email', `<p>${hello(name)}</p><p>Tap the button to confirm this email address for your Gaze account. The link works for 24 hours.</p>${button(link, 'Confirm my email')}<p style="font-size:13px;color:#555">If you did not create a Gaze account, you can ignore this email.</p>`),
    text: `Hi ${name || 'there'},\n\nConfirm this email address for your Gaze account (link works for 24 hours):\n${link}\n\nIf you did not create a Gaze account, ignore this email.`
  };
}

function resetEmail({ name, link }) {
  return {
    subject: 'Reset your Gaze password',
    html: layout('Reset your password', `<p>${hello(name)}</p><p>We got a request to reset your Gaze password. The link works for 30 minutes and can be used once.</p>${button(link, 'Choose a new password')}<p style="font-size:13px;color:#555">If you did not ask for this, ignore this email. Your password stays the same.</p>`),
    text: `Hi ${name || 'there'},\n\nWe got a request to reset your Gaze password. This link works for 30 minutes and can be used once:\n${link}\n\nIf you did not ask for this, ignore this email. Your password stays the same.`
  };
}

function passwordChanged({ name, appUrl }) {
  return {
    subject: 'Your Gaze password was changed',
    html: layout('Password changed', `<p>${hello(name)}</p><p>The password on your Gaze account was just changed, and you were signed out of all devices.</p><p>If this was you, there is nothing to do. If it was not you, reset your password right away at <a href="${esc(appUrl)}">${esc(appUrl)}</a> using "Forgot password".</p>`),
    text: `Hi ${name || 'there'},\n\nThe password on your Gaze account was just changed and you were signed out of all devices.\n\nIf this was you, there is nothing to do. If it was not you, reset your password right away at ${appUrl} using "Forgot password".`
  };
}

module.exports = { verifyEmail, resetEmail, passwordChanged, esc };
