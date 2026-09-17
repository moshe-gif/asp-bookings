// Google Apps Script mail relay for ASP Management's Contract Builder "Send Contract" feature.
//
// Why this exists: the app's backend (a Supabase Edge Function) can't send email directly --
// serverless platforms like that block raw outbound SMTP the same way cheap VPS hosts do. This
// script runs inside a normal Google account instead and sends over Gmail's own API, reached by
// the backend over plain HTTPS (never blocked). See supabase/functions/send-contract-email/index.ts
// for the function that calls this.
//
// Setup: see ops/SEND_CONTRACT_SETUP.md for the full step-by-step.

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var sharedSecret = props.getProperty('SHARED_SECRET');

  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ ok: false, error: 'bad json' });
  }

  if (!sharedSecret || body.secret !== sharedSecret) {
    return respond({ ok: false, error: 'unauthorized' });
  }
  if (!body.to || !body.subject || !body.html) {
    return respond({ ok: false, error: 'missing fields (to, subject, html required)' });
  }

  try {
    MailApp.sendEmail({
      to: body.to,
      subject: body.subject,
      htmlBody: body.html,
      name: body.fromName || 'ASP Management',
      replyTo: body.replyTo || undefined,
    });
    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
