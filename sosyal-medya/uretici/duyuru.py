"""
Pusula Istanbul — Instagram duyuru carousel'i uretici (6 slayt, 1080x1350 PNG).
Kullanim:  cd sosyal-medya/uretici && python3 duyuru.py
Gereksinim: pip install playwright && playwright install chromium
Cikti: ../duyuru-ucretsiz-2026-09/duyuru-1..6.png
Metinleri degistirmek icin yalnizca S1..S6 bloklarindaki Turkce dizeleri duzenle; CSS/yerlesim sabit.
Kurallar: sosyal-medya/CODEX-BRIEF.md
"""
import base64, asyncio, pathlib
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).parent          # sosyal-medya/uretici
ROOT = HERE.parent.parent                       # repo koku
ASSETS = ROOT/"assets"/"images"
def b64(p): return base64.b64encode((HERE/p if not isinstance(p, pathlib.Path) else p).read_bytes()).decode()
LOGO_W = "data:image/png;base64," + b64(ASSETS/"splash-logo.png")
LOGO_B = "data:image/png;base64," + b64(ASSETS/"logo-icon.png")
QR     = "data:image/png;base64," + b64("qr.png")
FONT = {w: "data:font/ttf;base64," + b64(f"fonts/Poppins-{w}.ttf") for w in ["Regular","SemiBold","Bold","ExtraBold"]}

CSS = f"""
@font-face{{font-family:P;font-weight:400;src:url({FONT['Regular']})}}
@font-face{{font-family:P;font-weight:600;src:url({FONT['SemiBold']})}}
@font-face{{font-family:P;font-weight:700;src:url({FONT['Bold']})}}
@font-face{{font-family:P;font-weight:800;src:url({FONT['ExtraBold']})}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1350px;font-family:P;display:flex}}
.s{{width:1080px;height:1350px;padding:80px 84px 72px;display:flex;flex-direction:column;position:relative;overflow:hidden}}
.grad{{background:linear-gradient(135deg,#1E40AF 0%,#4338CA 55%,#7C3AED 100%);color:#fff}}
.white{{background:#fff;color:#121A3E}}
.lav{{background:#F6F7FD;color:#121A3E}}
.top{{display:flex;align-items:center;justify-content:space-between}}
.brand{{display:flex;align-items:center;gap:18px;font-size:28px;font-weight:700;letter-spacing:2px}}
.brand img{{width:64px;height:70px}}
.pill{{display:flex;font-size:26px;font-weight:600;padding:12px 26px;border-radius:999px}}
.grad .pill{{background:rgba(255,255,255,.16)}}
.white .pill,.lav .pill{{background:#E8EDFB;color:#1E40AF}}
.kick{{display:flex;align-items:center;gap:16px;font-size:28px;font-weight:700;letter-spacing:4px}}
.grad .kick{{color:#FCD34D}} .white .kick,.lav .kick{{color:#7C3AED}}
.dot{{display:flex;width:14px;height:14px;border-radius:999px;background:currentColor}}
.h1{{font-size:112px;font-weight:800;letter-spacing:-4px;line-height:1.0}}
.h2{{font-size:88px;font-weight:800;letter-spacing:-3px;line-height:1.05}}
.lead{{font-size:42px;font-weight:600;line-height:1.35}}
.grad .lead{{color:rgba(255,255,255,.9)}} .white .lead,.lav .lead{{color:#6B7290}}
.num{{display:flex;align-items:center;justify-content:center;width:120px;height:120px;border-radius:32px;background:#1E40AF;color:#fff;font-size:52px;font-weight:800;letter-spacing:-2px}}
.bul{{display:flex;flex-direction:column;gap:26px}}
.b{{display:flex;align-items:flex-start;gap:22px;font-size:36px;font-weight:600;line-height:1.3}}
.b .c{{display:flex;flex-shrink:0;width:44px;height:44px;border-radius:999px;background:#DCFCE7;color:#16A34A;align-items:center;justify-content:center;font-size:28px;font-weight:800;margin-top:2px}}
.chips{{display:flex;flex-wrap:wrap;gap:20px}}
.chip{{display:flex;align-items:center;gap:18px;width:446px;padding:24px 28px;border-radius:24px;background:#fff;border:2px solid #E6E8F5;font-size:31px;font-weight:600}}
.chip .i{{display:flex;flex-shrink:0;width:60px;height:60px;border-radius:18px;background:#1E40AF;color:#fff;align-items:center;justify-content:center;font-size:30px}}
.foot{{display:flex;align-items:center;justify-content:space-between;margin-top:auto;font-size:26px;font-weight:600;white-space:nowrap}}
.grad .foot{{color:rgba(255,255,255,.85)}} .white .foot,.lav .foot{{color:#6B7290}}
.swipe{{display:flex;align-items:center;gap:14px}}
.big{{position:absolute;right:-60px;bottom:-40px;width:560px;opacity:.10}}
.free{{display:inline-flex;padding:16px 36px;border-radius:999px;background:#F59E0B;color:#1F1300;font-size:34px;font-weight:800;align-self:flex-start}}
.qrbox{{display:flex;align-items:center;gap:44px;background:#fff;border-radius:32px;padding:36px;color:#121A3E}}
.qrbox img{{width:300px;height:300px}}
.qrbox .t{{display:flex;flex-direction:column;gap:14px}}
.qrbox .t b{{font-size:40px;font-weight:800;line-height:1.1}}
.qrbox .t span{{font-size:28px;color:#6B7290;line-height:1.35}}
.stores{{display:flex;gap:20px}}
.store{{display:flex;padding:18px 30px;border-radius:18px;background:rgba(255,255,255,.14);font-size:28px;font-weight:700}}
"""

def top(pill, dark=True):
    logo = LOGO_W if dark else LOGO_B
    return f'<div class="top"><div class="brand"><img src="{logo}">PUSULA İSTANBUL</div><div class="pill">{pill}</div></div>'

def foot(n, total=6, extra=""):
    return f'<div class="foot"><div>{extra}</div><div class="swipe">{n} / {total} &nbsp;→</div></div>'

S1 = f"""<div class="s grad">{top("Eylül 2026")}
<div style="display:flex;flex-direction:column;margin-top:auto;margin-bottom:auto;gap:40px">
  <img src="{LOGO_W}" style="width:220px;height:240px">
  <div class="h1">Artık ücretsiz.</div>
  <div class="lead">Premium üyelik dönemi kapandı. Pusula İstanbul'un tüm özellikleri, bugünden itibaren profesyonel turist rehberlerinin hizmetinde.</div>
  <div class="free">Ücretsiz · Profesyonel turist rehberleri için</div>
</div>
{foot(1, extra="Üstelik üç yeni özellikle")}
</div>"""

def feat(n, name, h, bullets, total=6):
    bl = "".join(f'<div class="b"><div class="c">✓</div><div>{b}</div></div>' for b in bullets)
    return f"""<div class="s white">{top("Yeni", dark=False)}
<img class="big" src="{LOGO_B}">
<div style="display:flex;flex-direction:column;margin-top:72px;gap:36px">
  <div class="num">0{n}</div>
  <div class="kick"><span class="dot"></span>{name.upper()}</div>
  <div class="h2">{h}</div>
</div>
<div class="bul" style="margin-top:64px">{bl}</div>
{foot(n+1, total, "Yeni sürümde")}
</div>"""

S2 = feat(1, "Rehber Aranıyor", "İşler artık<br>sizi buluyor.", [
  "Rehber arayan meslektaşlarınız ve acenteler ilanını verir; başvuru tek dokunuşla.",
  "Çalıştığınız dillerde bir ilan açıldığı an, bildirim telefonunuzda.",
  "İlan sahibine arama, WhatsApp ya da özel mesajla anında ulaşılır.",
])
S3 = feat(2, "Tur Takvimi", "Ajandanız,<br>bir bakışta.", [
  "Tek günlük şehir turundan bir haftalık Anadolu turuna, tüm programınız tek takvimde.",
  "Dolu ve boş günleriniz, uygulama açılır açılmaz ana ekranda.",
  "Rehber Aranıyor ilanlarıyla aynı takvim: çakışma riski ortadan kalkıyor.",
])
S4 = feat(3, "Masraf Pusulası", "Fişler sizde,<br>hesap Pusula'da.", [
  "Günün masrafları ve fiş fotoğrafları, ilgili turun altında bir arada.",
  "₺, € ve $ karışık olsa da toplam otomatik; avans ve rehberlik ücreti dahil.",
  "PDF, Word ya da Excel çıktısı, acenteye mail veya WhatsApp ile tek dokunuşta iletilir.",
])

CHIPS = [("📍","Canlı saha durumu"),("🕌","Müze ve cami saatleri"),("⛴","Boğaz tarifeleri"),("🚢","Kruvaziyer takvimi"),
         ("🚦","Ulaşım uyarıları"),("🆘","Acil rehber"),("💬","Rehber sohbeti"),("✉️","Özel mesaj")]
S5 = f"""<div class="s lav">{top("Zaten içinde", dark=False)}
<div style="display:flex;flex-direction:column;margin-top:56px;gap:24px">
  <div class="kick"><span class="dot"></span>HEPSİ BİR ARADA</div>
  <div class="h2">Sahanın tamamı,<br>cebinizde.</div>
  <div class="lead">Rehberler için, rehberlerle birlikte. Her gün güncel, her zaman ücretsiz.</div>
</div>
<div class="chips" style="margin-top:56px">{"".join(f'<div class="chip"><div class="i">{e}</div>{t}</div>' for e,t in CHIPS)}</div>
{foot(5, extra="300'ü aşkın rehber şimdiden aramızda")}
</div>"""

S6 = f"""<div class="s grad">{top("Ücretsiz")}
<div style="display:flex;flex-direction:column;margin-top:80px;gap:32px">
  <div class="h1">Yeni sürüm<br>yayında.</div>
  <div class="lead">Uygulama telefonunuzdaysa güncelleme yeterli; değilse kurulum iki dakika. Kayıt, profesyonel turist rehberlerine açık.</div>
  <div class="stores"><div class="store">App Store</div><div class="store">Google Play</div></div>
</div>
<div class="qrbox" style="margin-top:auto">
  <img src="{QR}">
  <div class="t"><b>Bir meslektaşınıza da ulaşsın.</b><span>Rehber çoğaldıkça saha bilgisi canlanır. Paylaşılan her gönderi, sahayı biraz daha büyütür.</span></div>
</div>
{foot(6, extra="pusulaistanbul.app")}
</div>"""

async def main():
    out = HERE.parent/"duyuru-ucretsiz-2026-09"; out.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={"width":1080,"height":1350})
        for i, s in enumerate([S1,S2,S3,S4,S5,S6], 1):
            html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{s}</body></html>'
            await pg.set_content(html); await pg.wait_for_timeout(250)
            await pg.screenshot(path=str(out/f"duyuru-{i}.png"))
            print("ok", i)
        await br.close()
asyncio.run(main())
