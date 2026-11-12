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
    const APP = 'https://khairngajico.github.io/khairngajico.portal/app.html';
    const P = t => `<p style="margin:0 0 12px">${t}</p>`;
    const H3 = t => `<h3 style="margin:24px 0 8px;font-size:16px;color:#064e3b">${t}</h3>`;
    const OL = a => `<ol style="margin:0 0 12px;padding-left:20px">${a.map(x => `<li style="margin-bottom:6px">${x}</li>`).join('')}</ol>`;
    const body = P(`Assalamualaikum, ${s.name}.`)
      + P(line)
      + H3('Ringkasan bayaran')
      + `<table style="width:100%;border-collapse:collapse;background:#f7f4eb;margin:0 0 14px">`
      + [['Pakej', 'Kelas ' + s.pk], ['Yuran bulan', mo], ['Jumlah', 'RM' + amt + '.00'], [late ? 'Status' : 'Bayar sebelum', late ? 'Tertunggak, langganan telah tamat' : due]]
          .map(r => `<tr><td style="padding:10px 14px;color:#78716c;width:40%;border-bottom:1px solid #e7e5e4">${r[0]}</td><td style="padding:10px 14px;border-bottom:1px solid #e7e5e4"><b>${r[1]}</b></td></tr>`).join('')
      + `</table>`
      + H3('Cara membayar')
      + OL(['Buka akaun pelajar anda dan tekan tab <b>Yuran</b>.', 'Tekan <b>Bayar sekarang</b>. Kod QR akan dipaparkan dengan masa 10 minit untuk menyelesaikan bayaran.', 'Imbas kod QR dengan aplikasi bank anda dan buat pembayaran.', 'Tekan <b>Saya sudah bayar</b>, muat naik gambar resit yang jelas, dan tekan <b>Hantar resit</b>.', 'Ustaz akan mengesahkan bayaran dan anda akan menerima emel resit rasmi.'])
      + (late ? P('Selagi yuran belum disahkan, akses kepada modul pembelajaran ditutup buat sementara waktu. Akses dibuka semula serta-merta selepas bayaran disahkan, dan semua rekod serta nota anda kekal tersimpan.') : P('Jika yuran dibayar sebelum tarikh akhir, langganan anda akan bersambung tanpa sebarang gangguan.'))
      + H3('Tentang emel ini')
      + P('Emel peringatan ini dihantar setiap hari bermula 20hb sehingga bayaran anda disahkan. Jika anda sudah membayar dan sedang menunggu pengesahan Ustaz, sila abaikan emel ini. Jika anda mengalami masalah semasa membayar, hubungi kami melalui WhatsApp <a href="https://wa.me/601158945036" style="color:#047857">01158945036</a>.')
      + `<p style="text-align:center;margin:26px 0 8px"><a href="${APP}" style="background:#064e3b;color:#fff;text-decoration:none;padding:15px 32px;border-radius:30px;font-weight:bold;display:inline-block">Buka akaun saya</a></p>`
      + `<p style="text-align:center;font-size:12.5px;color:#78716c;margin:0">Pautan akaun: <a href="${APP}" style="color:#047857">${APP}</a></p>`;
    const html = `<div style="background:#f7f4eb;padding:24px 10px;font-family:Arial,Helvetica,sans-serif"><div style="max-width:620px;margin:auto;background:#fff;border:1px solid #e7e5e4"><div style="background:#064e3b;padding:26px 28px"><div style="color:#facc15;font-size:13px">KhairNgaji.co</div><div style="color:#fff;font-size:22px;font-weight:bold;margin-top:6px">${late ? 'Yuran anda tertunggak' : 'Peringatan yuran bulanan'}</div></div><div style="padding:28px;color:#292524;font-size:15px;line-height:1.7">${body}</div><div style="background:#f7f4eb;padding:20px 28px;color:#78716c;font-size:12.5px;line-height:1.7">Emel ini dihantar secara automatik oleh KhairNgaji.co. Jika masuk ke folder Spam, sila tekan Bukan spam dan simpan alamat penghantar sebagai kenalan. © 2024</div></div></div>`;
    await tx.sendMail({ from: `KhairNgaji.co <${process.env.GMAIL_USER}>`, to: s.email, subject, html });
    sent++;
  }
  console.log('Emel peringatan dihantar:', sent);
})().catch(e => { console.error(e); process.exit(1); });
