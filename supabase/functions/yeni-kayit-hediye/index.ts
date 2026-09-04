// Pusula Istanbul — Yeni Kayit Hos Geldin Edge Function (v3, Eyl 2026)
//
// v3: UYGULAMA TAMAMEN UCRETSIZ. Premium/trial grant KALDIRILDI — fonksiyon artik
//     yalnizca markali hos geldin maili gonderir. profiles.abonelik_* alanlarina DOKUNMAZ.
// v2: RESEND_API_KEY Vault'tan okunur (public.get_resend_api_key RPC).
// Tetikleyici: trg_yeni_kayit_hediye (AFTER INSERT ON profiles) → yeni_kayit_hediye_async() → pg_net POST.
// Kaynak repoda: supabase/functions/yeni-kayit-hediye/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const SENDER = "Pusula İstanbul <info@pusulaistanbul.app>";
const REPLY_TO = "info@pusulaistanbul.app";
const SUBJECT = "Pusula İstanbul'a Hoş Geldiniz – Tüm Özellikler Ücretsiz";
const LOGO_URL = "https://pusulaistanbul.app/logo-icon.png";

const OZELLIKLER: [string, string][] = [
  ["Güncel Veriler", "Müze, saray ve camilerin mevsime göre güncellenen ziyaret saatleri, giriş ücretleri ve MüzeKart bilgileri."],
  ["Anlık Saha Bildirimleri", "Müze yoğunlukları, bilet kuyrukları ve ani kapanışlar hakkında meslektaşlarınızdan canlı akış."],
  ["Ulaşım ve Trafik", "Raylı sistemler ve İBB Ulaşım ağındaki anlık arıza, gecikme ve trafik uyarıları."],
  ["Operasyonel Detaylar", "Havalimanı transferleri, Boğaz turu tarifeleri ve Galataport gemi takvimi."],
  ["Şehir Gündemi", "Etkinlik takvimleri, genel duyurular ve yol kapanmaları."],
  ["Mesleki Ağ", "Rehberden rehbere anında iletişim sağlayan canlı sohbet."],
];

function htmlIcerik(isim: string, soyisim: string | null): string {
  const adSoyad = soyisim ? `${isim} ${soyisim}` : isim;
  const liste = OZELLIKLER.map(([b, a]) => `<li><strong>${b}:</strong> ${a}</li>`).join("\n");
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pusula İstanbul'a Hoş Geldiniz</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8; padding:32px 16px;">
<tr>
<td align="center">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,90,141,0.12);">

<tr>
<td style="background-color:#0077B6; padding:36px 40px 30px 40px; text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
<tr>
<td style="vertical-align:middle; padding-right:20px;">
<span style="font-size:30px; font-weight:700; color:#ffffff; letter-spacing:3px;">PUSULA</span>
</td>
<td style="vertical-align:middle; padding:0 10px;">
<img src="${LOGO_URL}" alt="" width="70" height="50" style="display:block; border:0; outline:none;" />
</td>
<td style="vertical-align:middle; padding-left:20px;">
<span style="font-size:30px; font-weight:700; color:#ffffff; letter-spacing:3px;">İSTANBUL</span>
</td>
</tr>
</table>
<p style="margin:20px 0 0 0; font-size:12px; color:rgba(255,255,255,0.8); letter-spacing:2.5px;">
PROFESYONEL TURİST REHBERİNİN DİJİTAL ASİSTANI
</p>
</td>
</tr>

<tr>
<td style="padding:36px 40px 12px 40px;">

<p style="margin:0 0 24px 0; font-size:16px; color:#1a2b3c; line-height:1.8;">Sayın ${adSoyad},</p>

<p style="margin:0 0 20px 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
Pusula İstanbul'a hoş geldiniz. Profesyonel turist rehberlerinin sahadaki operasyonel süreçlerini kolaylaştırmak ve ihtiyaç duyulan tüm anlık bilgileri tek bir platformdan sunmak amacıyla hayata geçirdiğimiz bu uygulamada sizi aramızda görmekten mutluluk duyuyoruz.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
<td style="background:linear-gradient(135deg, #005A8D 0%, #0096C7 100%); border-radius:12px; padding:24px 28px;">
<p style="margin:0 0 10px 0; font-size:16px; font-weight:700; color:#ffffff;">Tüm özellikler, tüm rehberlere ücretsiz</p>
<p style="margin:0; font-size:15px; color:rgba(255,255,255,0.97); line-height:1.7;">Pusula İstanbul'da abonelik, deneme süresi veya uygulama içi satın alma yoktur. Hesabınızla giriş yaptığınız anda her şey açık.</p>
</td>
</tr>
</table>

<p style="margin:24px 0 12px 0; font-size:15px; font-weight:700; color:#005A8D;">Sizi neler bekliyor:</p>

<ul style="margin:0 0 24px 0; padding:0 0 0 18px; font-size:14px; color:#1a2b3c; line-height:1.9;">
${liste}
</ul>

<p style="margin:24px 0 0 0; font-size:14px; color:#1a2b3c; line-height:1.8;">
Pusula İstanbul, büyük bir özveriyle hayata geçirilen bağımsız bir platformdur. Uygulamayı daha da ileriye taşımak için ileteceğiniz her geri bildirim doğrudan bana ulaşacak ve sistemin gelişimine yön verecektir. Soru, görüş ve önerileriniz için bu e-postayı dilediğiniz zaman yanıtlayabilirsiniz.
</p>

<p style="margin:28px 0 0 0; font-size:15px; color:#1a2b3c; line-height:1.8;">
İyi turlar,<br>
<strong style="color:#005A8D;">Ayşe Tokkuş Bayar</strong><br>
Pusula İstanbul
</p>

</td>
</tr>

<tr><td style="padding:0 40px;"><div style="border-top:1px solid #e2e8f0; margin:20px 0 0 0;"></div></td></tr>

<tr>
<td style="padding:20px 40px 32px 40px; text-align:center;">
<p style="margin:0 0 8px 0; font-size:13px; color:#8899aa;">
<a href="https://pusulaistanbul.app" style="color:#005A8D; text-decoration:none;">pusulaistanbul.app</a>
&nbsp;·&nbsp; info@pusulaistanbul.app
</p>
<p style="margin:0; font-size:12px; color:#aabbcc;">Pusula İstanbul — Profesyonel Turist Rehberinin Dijital Asistanı</p>
</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>`;
}

function textIcerik(isim: string, soyisim: string | null): string {
  const adSoyad = soyisim ? `${isim} ${soyisim}` : isim;
  const liste = OZELLIKLER.map(([b, a]) => `• ${b}: ${a}`).join("\n");
  return `Sayın ${adSoyad},

Pusula İstanbul'a hoş geldiniz. Profesyonel turist rehberlerinin sahadaki operasyonel süreçlerini kolaylaştırmak ve ihtiyaç duyulan tüm anlık bilgileri tek bir platformdan sunmak amacıyla hayata geçirdiğimiz bu uygulamada sizi aramızda görmekten mutluluk duyuyoruz.

TÜM ÖZELLİKLER, TÜM REHBERLERE ÜCRETSİZ
Pusula İstanbul'da abonelik, deneme süresi veya uygulama içi satın alma yoktur. Hesabınızla giriş yaptığınız anda her şey açık.

SİZİ NELER BEKLİYOR:
${liste}

Pusula İstanbul, büyük bir özveriyle hayata geçirilen bağımsız bir platformdur. Uygulamayı daha da ileriye taşımak için ileteceğiniz her geri bildirim doğrudan bana ulaşacak ve sistemin gelişimine yön verecektir.

İyi turlar,
Ayşe Tokkuş Bayar
Pusula İstanbul
—
pusulaistanbul.app
info@pusulaistanbul.app
`;
}

async function mailGonder(supabase: any, email: string, isim: string, soyisim: string | null) {
  const { data: apiKey, error: keyErr } = await supabase.rpc("get_resend_api_key");
  if (keyErr || !apiKey) throw new Error(`Vault RESEND_API_KEY okunamadi: ${keyErr?.message}`);

  const body = {
    from: SENDER,
    to: email,
    reply_to: REPLY_TO,
    subject: SUBJECT,
    html: htmlIcerik(isim, soyisim),
    text: textIcerik(isim, soyisim),
  };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  const incomingSecret = req.headers.get("x-pusula-cron-secret") ?? "";
  if (!CRON_SECRET || incomingSecret !== CRON_SECRET) return json({ ok: false, error: "unauthorized" }, 401);

  let body: { user_id?: string; test_email?: string; test_isim?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // TEST modu — sadece mail
  if (body.test_email) {
    try {
      const sonuc = await mailGonder(supabase, body.test_email, body.test_isim || "Test", null);
      return json({ ok: true, mode: "test", sonuc });
    } catch (e) {
      return json({ ok: false, error: String(e) }, 500);
    }
  }

  const userId = body.user_id;
  if (!userId) return json({ ok: false, error: "user_id required" }, 400);

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, isim, soyisim, email, rol")
    .eq("id", userId).single();

  if (pErr || !profile) return json({ ok: false, error: "profile_not_found", detay: pErr?.message }, 404);
  if (profile.rol === "admin" || profile.rol === "moderator") return json({ ok: true, skipped: "admin_or_mod" });
  if (!profile.email) return json({ ok: false, error: "email_yok" }, 400);

  // v3: premium grant YOK — profiles guncellenmez, yalnizca hos geldin maili
  let mailSonuc: any = null;
  let mailHata: string | null = null;
  try {
    mailSonuc = await mailGonder(supabase, profile.email, profile.isim || "Rehber", profile.soyisim);
  } catch (e) {
    mailHata = String(e);
    console.warn("Mail gonderim hatasi:", mailHata);
  }

  return json({
    ok: true, user_id: userId, surum: "v3-ucretsiz",
    mail_id: mailSonuc?.id || null, mail_hata: mailHata,
    zaman: new Date().toISOString(),
  });
});
