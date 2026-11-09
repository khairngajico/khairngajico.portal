// Robot peringatan yuran KhairNgaji.co. Berjalan setiap hari melalui GitHub Actions.
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY)) });
const db = admin.firestore();
const MS = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
const PR = { 'Al-Bayan': 47, 'Al-Hidayah': 70 };
const tx = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS } });

(async () => {
  const now = new Date();
  const my = new Date(now.getTime() + 8 * 3600e3);           // waktu Malaysia
  const y = my.getUTCFullYear(), m = my.getUTCMonth(), d = my.getUTCDate();
  const snap = await db.collection('students').where('status', '==', 'active').get();
  let sent = 0;
  for (const doc of snap.docs) {
    const s = doc.data();
    const au = s.accessUntil && s.accessUntil.toDate();
    const late = !au || au < now;
    let B = null;                                             // bulan yang perlu dibayar
    if (late) B = new Date(Date.UTC(y, m, 1));
    else if (d >= 20) {
      const end = new Date(Date.UTC(y, m + 2, 0, 15, 59, 59)); // hujung bulan depan, waktu Malaysia
      if (au < end) B = new Date(Date.UTC(y, m + 1, 1));
    }
    if (!B || !s.email) continue;
    const mo = MS[B.getUTCMonth()] + ' ' + B.getUTCFullYear();
    const due = new Date(Date.UTC(y, m + 1, 0)).getUTCDate() + ' ' + MS[m] + ' ' + y;
    const amt = PR[s.pk] || 47;
    const subject = late ? `Yuran ${mo} tertunggak | KhairNgaji.co` : `Peringatan yuran ${mo} | KhairNgaji.co`;
    const line = late
      ? `Yuran bulan <b>${mo}</b> (RM${amt}) masih belum disahkan dan langganan telah tamat.`
      : `Sila bayar yuran bulan <b>${mo}</b> (RM${amt}) sebelum <b>${due}</b>.`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px"><p>Assalamualaikum, ${s.name}.</p><p>${line}</p>
      <p>Log masuk akaun pelajar, tekan <b>Yuran</b> dan <b>Bayar sekarang</b>, kemudian muat naik resit.</p>
      <p><a href="https://khairngajico.github.io/khairngajico.portal/akaun.html">Buka akaun pelajar</a></p>
      <p style="color:#78716c;font-size:12px">Emel ini dihantar setiap hari sehingga bayaran disahkan. Abaikan jika anda sudah bayar dan menunggu pengesahan Ustaz.</p></div>`;
    await tx.sendMail({ from: `KhairNgaji.co <${process.env.GMAIL_USER}>`, to: s.email, subject, html });
    sent++;
  }
  console.log('Emel peringatan dihantar:', sent);
})().catch(e => { console.error(e); process.exit(1); });
