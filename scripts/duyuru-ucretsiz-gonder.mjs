// Pusula İstanbul — "Tamamen ücretsiz" duyuru maili (Eylül 2026)
//
//   node scripts/duyuru-ucretsiz-gonder.mjs --dry            # kimlere gideceğini yazdır
//   node scripts/duyuru-ucretsiz-gonder.mjs --test <email>   # tek test maili, HEMEN
//   node scripts/duyuru-ucretsiz-gonder.mjs --schedule       # 8 Eyl 09:00'a planla
//   node scripts/duyuru-ucretsiz-gonder.mjs --durum          # planlanan gönderimin durumu
//   node scripts/duyuru-ucretsiz-gonder.mjs --iptal          # planlanan tüm mailleri iptal et
//
// .env: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KOK = resolve(__dirname, '..');

for (const line of readFileSync(resolve(KOK, '.env'), 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('='); if (i === -1) continue;
  if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const RESEND_KEY = process.env.RESEND_API_KEY;
const SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://rzlfghjpsximthlolfxo.supabase.co';

const SENDER  = 'Pusula İstanbul <info@pusulaistanbul.app>';
const REPLYTO = 'info@pusulaistanbul.app';
const KONU    = 'Pusula İstanbul artık tamamen ücretsiz';
const PLAN_UTC = '2026-09-08T06:00:00.000Z';           // 8 Eylül Salı 09:00 İstanbul
const HTML_YOL = resolve(KOK, 'duyuru-tamamen-ucretsiz-mail.html');
const KAYIT    = resolve(KOK, 'duyuru-gonderim-2026-09-08.json');

const HTML = readFileSync(HTML_YOL, 'utf8');
const METIN = `Merhaba,

Pusula İstanbul'da premium üyeliği kaldırdık. Bugünden itibaren uygulamadaki bütün özellikler, tüm rehberlere tamamen açık olacak.

Üstelik bu sürümle birlikte üç yeni özellik geliyor: iş ilanları, tur takvimi ve masraf pusulası.

İŞ İLANLARI
Rehber aranıyor ilanlarını görün ya da kendiniz ilan verin. Çalıştığınız dilleri seçin, o dilde rehber arandığında telefonunuza bildirim gelsin. İlan sahibine tek dokunuşla ulaşın: arama, WhatsApp ya da özel mesaj ile...

TUR TAKVİMİ
Turlarınızı ajandanıza kaydedin, boş günlerinizi ana ekranda tek bakışta görün.

MASRAF PUSULASI
Ajandanızda ilgili günün masraflarını yazın, fiş fotoğraflarını ekleyin. Otomatik hesaplayıcı devrede. Masraf pusulanızı ister telefona kaydedin ister tek tıkla acentenize gönderin.

Yeni özellikleri kullanmak için uygulamayı son sürüme güncellemeniz yeterli.
App Store: https://apps.apple.com/tr/app/pusula-istanbul/id6761419678
Google Play: https://play.google.com/store/apps/details?id=com.pusulaistanbul.app

Pusula İstanbul sizlerden gelen geri bildirimlerle büyüyor: info@pusulaistanbul.app

İyi turlar,
Pusula İstanbul
pusulaistanbul.app`;

const uyu = (ms) => new Promise(r => setTimeout(r, ms));

async function aliciListesi() {
  const alicilar = []; let sayfa = 1;
  while (true) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${sayfa}&per_page=1000`,
      { headers: { apikey: SR_KEY, Authorization: `Bearer ${SR_KEY}` } });
    const d = await r.json();
    const us = d.users || [];
    alicilar.push(...us);
    if (us.length < 1000) break;
    sayfa++;
  }
  const dogrulanmis = alicilar.filter(u => u.email && (u.email_confirmed_at || u.confirmed_at));
  const benzersiz = [...new Set(dogrulanmis.map(u => u.email.trim().toLowerCase()))];
  return { hepsi: alicilar.length, gonderilecek: benzersiz };
}

async function tekGonder(email, planla) {
  const govde = {
    from: SENDER, to: [email], reply_to: REPLYTO, subject: KONU, html: HTML, text: METIN,
    headers: { 'List-Unsubscribe': '<mailto:info@pusulaistanbul.app?subject=Listeden%20cikar>' },
  };
  if (planla) govde.scheduled_at = PLAN_UTC;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(govde),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, id: d.id, hata: r.ok ? null : (d.message || `HTTP ${r.status}`) };
}

const arg = process.argv.slice(2);
const komut = arg[0];

if (komut === '--dry') {
  const { hepsi, gonderilecek } = await aliciListesi();
  console.log(`Kayıtlı kullanıcı: ${hepsi} · Gönderilecek (doğrulanmış): ${gonderilecek.length}`);
  console.log(`Planlanan zaman: ${PLAN_UTC} (8 Eylül Salı 09:00 İstanbul)`);
  console.log(gonderilecek.slice(0, 5).join('\n') + '\n...');
} else if (komut === '--test') {
  const email = arg[1];
  if (!email) { console.error('Kullanım: --test <email>'); process.exit(1); }
  const s = await tekGonder(email, false);
  console.log(s.ok ? `TEST GİTTİ → ${email} (id ${s.id})` : `HATA: ${s.hata}`);
} else if (komut === '--schedule') {
  const { gonderilecek } = await aliciListesi();
  const kayit = { planlanan: PLAN_UTC, olusturma: new Date().toISOString(), gonderimler: [], hatalar: [] };
  let i = 0;
  for (const email of gonderilecek) {
    const s = await tekGonder(email, true);
    if (s.ok) kayit.gonderimler.push({ email, id: s.id });
    else kayit.hatalar.push({ email, hata: s.hata });
    if (++i % 25 === 0) console.log(`  ${i}/${gonderilecek.length}`);
    await uyu(550);                     // Resend limiti: 2 istek/sn
  }
  writeFileSync(KAYIT, JSON.stringify(kayit, null, 2));
  console.log(`PLANLANDI: ${kayit.gonderimler.length} mail · hata: ${kayit.hatalar.length}`);
  if (kayit.hatalar.length) console.log(kayit.hatalar.slice(0, 10));
  console.log(`Kayıt: ${KAYIT}`);
} else if (komut === '--durum') {
  if (!existsSync(KAYIT)) { console.error('Kayıt dosyası yok.'); process.exit(1); }
  const kayit = JSON.parse(readFileSync(KAYIT, 'utf8'));
  const ornek = kayit.gonderimler.slice(0, 12);
  const durumlar = {};
  for (const g of ornek) {
    const r = await fetch(`https://api.resend.com/emails/${g.id}`, { headers: { Authorization: `Bearer ${RESEND_KEY}` } });
    const d = await r.json().catch(() => ({}));
    durumlar[d.last_event || `hata_${r.status}`] = (durumlar[d.last_event || `hata_${r.status}`] || 0) + 1;
    await uyu(550);
  }
  console.log(`Planlanan toplam: ${kayit.gonderimler.length} · örneklem ${ornek.length}:`, durumlar);
} else if (komut === '--iptal') {
  const kayit = JSON.parse(readFileSync(KAYIT, 'utf8'));
  let n = 0;
  for (const g of kayit.gonderimler) {
    const r = await fetch(`https://api.resend.com/emails/${g.id}/cancel`, {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}` } });
    if (r.ok) n++;
    await uyu(550);
  }
  console.log(`İPTAL EDİLDİ: ${n}/${kayit.gonderimler.length}`);
} else {
  console.log('Komutlar: --dry | --test <email> | --schedule | --durum | --iptal');
}
