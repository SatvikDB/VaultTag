const nodemailer = require('nodemailer');

/**
 * Create a transporter from env vars.
 * Supports Gmail (SMTP) or any SMTP provider.
 * Falls back to Ethereal (test) if no env vars set.
 */
async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  // Ethereal test account — emails visible at https://ethereal.email
  const testAccount = await nodemailer.createTestAccount();
  console.log('📧 Using Ethereal test email — preview at https://ethereal.email');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
}

/**
 * Send order confirmation email to buyer
 */
async function sendOrderConfirmation(order, adminNote = '', transferResults = []) {
  try {
    const transporter = await getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@vaulttag.com';

    const itemRows = order.items.map(i =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1E2440">${i.productName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1E2440;text-align:right">$${Number(i.price).toFixed(2)}</td>
      </tr>`
    ).join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#050810;font-family:'Inter',sans-serif;color:#E8E8ED">
  <div style="max-width:560px;margin:40px auto;background:#111633;border-radius:16px;overflow:hidden;border:1px solid #1E2440">
    <div style="background:linear-gradient(135deg,#00D4AA,#009E7E);padding:32px;text-align:center">
      <h1 style="margin:0;color:#050810;font-size:1.6rem">✅ Order Confirmed!</h1>
      <p style="margin:8px 0 0;color:#050810;opacity:0.8">VaultTag — Blockchain Authenticated Products</p>
    </div>
    <div style="padding:32px">
      <p style="color:#8A8AA3;margin-top:0">Hi <strong style="color:#E8E8ED">${order.buyerName || order.buyer}</strong>,</p>
      <p style="color:#8A8AA3">Your order <strong style="color:#00D4AA">#${order.orderId}</strong> has been confirmed by the admin. Your NFT ownership will be transferred shortly.</p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#0A0E27;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#1E2440">
            <th style="padding:10px 12px;text-align:left;font-size:0.75rem;color:#8A8AA3;text-transform:uppercase">Product</th>
            <th style="padding:10px 12px;text-align:right;font-size:0.75rem;color:#8A8AA3;text-transform:uppercase">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:10px 12px;color:#8A8AA3">Platform fee (2.5%)</td>
            <td style="padding:10px 12px;text-align:right;color:#8A8AA3">$${Number(order.fee).toFixed(2)}</td>
          </tr>
          <tr style="background:#1E2440">
            <td style="padding:12px;font-weight:700;color:#C9A962">Total Paid</td>
            <td style="padding:12px;text-align:right;font-weight:700;color:#C9A962">$${Number(order.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#0A0E27;border-radius:8px;padding:16px;margin-bottom:24px">
        <div style="font-size:0.8rem;color:#8A8AA3;margin-bottom:4px">Payment Method</div>
        <div style="font-weight:600">${order.paymentMethod.toUpperCase()}</div>
        ${order.paymentRef ? `<div style="font-size:0.75rem;color:#5A5A72;margin-top:4px;font-family:monospace">${order.paymentRef}</div>` : ''}
      </div>

      ${adminNote ? `<div style="background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.3);border-radius:8px;padding:16px;margin-bottom:24px"><div style="font-size:0.8rem;color:#00D4AA;margin-bottom:4px">Note from Admin</div><div style="color:#E8E8ED">${adminNote}</div></div>` : ''}

      ${transferResults.length > 0 ? `
      <div style="background:rgba(0,212,170,0.08);border:1px solid rgba(0,212,170,0.2);border-radius:8px;padding:16px;margin-bottom:24px">
        <div style="font-size:0.8rem;color:#00D4AA;margin-bottom:10px;font-weight:600">🔄 NFT Ownership Transfer</div>
        ${transferResults.map(r => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:0.82rem">
            <span style="color:${r.success ? '#00D4AA' : '#E24B4A'}">${r.success ? '✅' : '❌'}</span>
            <span style="color:#E8E8ED">${r.productName || 'Token #'+r.tokenId}</span>
            ${r.success ? `<span style="color:#5A5A72">→ transferred to your account</span>` : `<span style="color:#E24B4A">${r.reason}</span>`}
          </div>`).join('')}
      </div>` : ''}

      <p style="color:#8A8AA3;font-size:0.85rem">Your NFT will be transferred to your account. You can verify your product at any time using the token ID.</p>

      <div style="text-align:center;margin-top:32px">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-nfts.html"
           style="background:#00D4AA;color:#050810;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;display:inline-block">
          View My NFTs →
        </a>
      </div>
    </div>
    <div style="padding:20px;text-align:center;border-top:1px solid #1E2440">
      <p style="color:#5A5A72;font-size:0.75rem;margin:0">© 2026 VaultTag — Polygon Blockchain Authenticated</p>
    </div>
  </div>
</body>
</html>`;

    const info = await transporter.sendMail({
      from: `"VaultTag" <${from}>`,
      to: order.buyer,
      subject: `✅ Order Confirmed — #${order.orderId} | VaultTag`,
      html
    });

    console.log(`📧 Confirmation email sent to ${order.buyer} — ${nodemailer.getTestMessageUrl(info) || info.messageId}`);
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendOrderConfirmation };
