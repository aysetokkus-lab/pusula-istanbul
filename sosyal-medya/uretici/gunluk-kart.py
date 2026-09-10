"""
Pusula Istanbul — otomatik gunluk Instagram karti SABLONU (3 ornek icerik tipi, 1080x1350 PNG).
Kullanim:  cd sosyal-medya/uretici && python3 gunluk-kart.py
Cikti: ../gunluk-kart-ornekler/A-kruvaziyer.png, B-saha-notu.png, C-yarin-kapali.png
Yalnizca flexbox kullanilir (ileride Supabase Edge Function'da satori ile render edilecek).
NOT: Ipucu satirlarindaki "al / birak / koy" emir kipleri CODEX-BRIEF kurallarina AYKIRI — yeniden yazilacak.
"""
import base64, asyncio, pathlib
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent
ASSETS = ROOT/"assets"/"images"
def b64(p): return base64.b64encode((HERE/p if not isinstance(p, pathlib.Path) else p).read_bytes()).decode()
LOGO_W = "data:image/png;base64," + b64(ASSETS/"splash-logo.png")
LOGO_B = "data:image/png;base64," + b64(ASSETS/"logo-icon.png")
FONT = {w: "data:font/ttf;base64," + b64(f"fonts/Poppins-{w}.ttf") for w in ["Regular","SemiBold","Bold","ExtraBold"]}

CSS = f"""
@font-face{{font-family:P;font-weight:400;src:url({FONT['Regular']})}}
@font-face{{font-family:P;font-weight:600;src:url({FONT['SemiBold']})}}
@font-face{{font-family:P;font-weight:700;src:url({FONT['Bold']})}}
@font-face{{font-family:P;font-weight:800;src:url({FONT['ExtraBold']})}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1350px;font-family:P;color:#fff;display:flex}}
.card{{width:1080px;height:1350px;padding:72px 72px 64px;display:flex;flex-direction:column;
  background:linear-gradient(135deg,#1E40AF 0%,#4338CA 55%,#7C3AED 100%)}}
.top{{display:flex;align-items:center;justify-content:space-between}}
.brand{{display:flex;align-items:center;gap:20px}}
.brand img{{width:72px;height:78px}}
.brand span{{font-size:30px;font-weight:700;letter-spacing:2px}}
.date{{display:flex;font-size:28px;font-weight:600;padding:14px 28px;border-radius:999px;background:rgba(255,255,255,.16)}}
.kicker{{display:flex;align-items:center;gap:16px;margin-top:60px;font-size:30px;font-weight:700;letter-spacing:4px;color:#FCD34D}}
.kicker .dot{{display:flex;width:16px;height:16px;border-radius:999px;background:#FCD34D}}
.hero{{display:flex;flex-direction:column;margin-top:20px}}
.num{{font-size:196px;font-weight:800;letter-spacing:-9px;line-height:.95}}
.unit{{font-size:44px;font-weight:600;color:rgba(255,255,255,.85);margin-top:-14px}}
.title{{font-size:96px;font-weight:800;letter-spacing:-3px;line-height:1.05}}
.sub{{font-size:42px;font-weight:600;line-height:1.3;margin-top:22px;color:rgba(255,255,255,.92)}}
.panel{{display:flex;flex-direction:column;margin-top:auto;background:#fff;border-radius:28px;padding:28px 36px;color:#121A3E;
  box-shadow:0 24px 60px rgba(0,0,0,.18)}}
.row{{display:flex;align-items:center;justify-content:space-between;padding:18px 0}}
.row + .row{{border-top:2px solid #E6E8F5}}
.row .l{{display:flex;flex-direction:column;gap:6px}}
.row .name{{font-size:36px;font-weight:700}}
.row .meta{{font-size:28px;font-weight:400;color:#6B7290}}
.row .val{{display:flex;font-size:40px;font-weight:800;color:#1E40AF}}
.tip{{display:flex;align-items:center;gap:20px;margin-top:6px;padding:22px 28px;border-radius:20px;background:#FEF3C7;color:#78350F;font-size:32px;font-weight:600;line-height:1.3}}
.tip b{{font-weight:800}}
.foot{{display:flex;align-items:center;justify-content:space-between;margin-top:36px;font-size:26px;white-space:nowrap;font-weight:600;color:rgba(255,255,255,.85)}}
.foot .r{{display:flex;padding:12px 24px;border-radius:999px;background:#F59E0B;color:#1F1300;font-weight:700;font-size:24px}}
.badge{{display:flex;align-self:flex-start;padding:12px 24px;border-radius:999px;background:rgba(255,255,255,.18);font-size:28px;font-weight:600;margin-top:28px}}
.quote{{display:flex;flex-direction:column;gap:18px;padding:40px 44px;border-radius:28px;background:rgba(255,255,255,.14);border-left:10px solid #FCD34D;font-size:40px;font-weight:600;line-height:1.35}}
.quote small{{font-size:26px;font-weight:400;color:rgba(255,255,255,.75)}}
.sched{{display:flex;flex-direction:column;gap:14px}}
.sched .row .name{{font-size:36px}}
.closed{{display:flex;align-items:center;gap:18px;font-size:34px;font-weight:700;color:#DC2626}}
.closed .x{{display:flex;width:22px;height:22px;border-radius:999px;background:#DC2626}}
"""

def shell(inner, date):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="card">
  <div class="top">
    <div class="brand"><img src="{LOGO_W}"><span>PUSULA İSTANBUL</span></div>
    <div class="date">{date}</div>
  </div>
  {inner}
  <div class="foot">
    <div>@pusulaistanbul.app</div>
    <div class="r">Ücretsiz · App Store & Google Play</div>
  </div>
</div></body></html>"""

A = shell("""
  <div class="kicker"><span class="dot"></span>CUMA GALATAPORT'TA</div>
  <div class="hero"><div class="num">5.224</div><div class="unit">kruvaziyer yolcusu aynı gün</div></div>
  <div class="sub">İki gemi üst üste. Sultanahmet öğleden sonra dolar.</div>
  <div class="panel">
    <div class="row"><div class="l"><div class="name">MSC Fantasia</div><div class="meta">Varış 10:00 · Kalkış 23:00</div></div><div class="val">3.274</div></div>
    <div class="row"><div class="l"><div class="name">Celebrity Infinity</div><div class="meta">Limanda · Kalkış 20:00</div></div><div class="val">1.950</div></div>
    <div class="tip">💡 <span>Ayasofya ve Topkapı'yı <b>10:00 öncesine</b> al; Kapalıçarşı'yı sona bırak.</span></div>
  </div>
""", "11 Eylül Cuma")

B = shell("""
  <div class="kicker"><span class="dot"></span>SAHADAN BİLDİRİM</div>
  <div class="hero"><div class="title">Topkapı Sarayı</div></div>
  <div class="sub">Rehber gişesi kaldırıldı.</div>
  <div class="badge">📍 Bir meslektaşın bildirdi · 10:33</div>
  <div class="panel" style="background:transparent;box-shadow:none;padding:0;color:#fff">
    <div class="quote">"Öğrenci ve çocuk bileti için bile herkes genel sıraya giriyor. Grubu erken getirin."<small>Pusula İstanbul · Canlı Saha Durumu</small></div>
    <div class="tip" style="margin-top:20px">⏱ <span>Bilet sırası için <b>+30 dk</b> pay bırak. Bugün için geçerli.</span></div>
  </div>
""", "2 Eylül Çarşamba")

C = shell("""
  <div class="kicker"><span class="dot"></span>YARIN KAPALI</div>
  <div class="hero"><div class="title">Topkapı Sarayı</div></div>
  <div class="sub">Her salı kapalı — Harem ve Aya İrini dahil.</div>
  <div class="panel">
    <div class="row"><div class="l"><div class="name">Topkapı Sarayı</div><div class="meta">Salı · millisaraylar.gov.tr</div></div><div class="closed"><span class="x"></span>KAPALI</div></div>
    <div class="row"><div class="l"><div class="name">Ayasofya</div><div class="meta">09:00 – 20:00 · gişe 19:30</div></div><div class="val" style="color:#16A34A">AÇIK</div></div>
    <div class="row"><div class="l"><div class="name">Askeri Müze</div><div class="meta">09:00 – 16:30 · Mehter 15:00</div></div><div class="val" style="color:#16A34A">AÇIK</div></div>
    <div class="tip">🔁 <span>Salı programına <b>Dolmabahçe</b> ya da <b>Arkeoloji Müzesi</b> koy.</span></div>
  </div>
""", "14 Eylül Pazartesi")

async def main():
    out = HERE.parent/"gunluk-kart-ornekler"; out.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={"width":1080,"height":1350}, device_scale_factor=1)
        for name, html in [("A-kruvaziyer",A),("B-saha-notu",B),("C-yarin-kapali",C)]:
            await pg.set_content(html); await pg.wait_for_timeout(300)
            await pg.screenshot(path=str(out/f"{name}.png"), type="png")
            print("ok", name)
        await br.close()
asyncio.run(main())
