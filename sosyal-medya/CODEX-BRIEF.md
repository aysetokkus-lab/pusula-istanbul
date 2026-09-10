# Pusula İstanbul — Instagram Projesi · Codex Brief

> Bu dosya, `sosyal-medya/` klasöründeki işi devralan yapay zekâ asistanı (Codex) için yazıldı.
> Önce bunu oku; sonra `duyuru-ucretsiz-2026-09/` içindeki 6 PNG'ye bak; sonra `uretici/duyuru.py`'yi aç.
> Proje sahibi: Ayşe (profesyonel turist rehberi, Pusula İstanbul'un tek geliştiricisi). Hitap: "sen".

---

## 1. Ürün ve durum (10 Eylül 2026)

**Pusula İstanbul**, İstanbul'daki **profesyonel turist rehberleri** için mobil uygulama (React Native/Expo + Supabase; App Store + Google Play). Slogan: *"Profesyonel Turist Rehberinin Dijital Asistanı."*

- **v1.2.0 yayında** (iOS 5 Eyl, Play 8 Eyl). Bu sürümle **premium üyelik kaldırıldı, uygulama tamamen ücretsiz oldu** ve üç yeni özellik geldi: **Rehber Aranıyor** (iş ilanları), **Tur Takvimi** (ajanda), **Masraf Pusulası** (masraf + fiş + PDF/Excel çıktı).
- Zaten içinde olanlar: canlı saha durumu (rehberler sahadan yoğunluk/kuyruk/kapalı bölüm bildirir), müze–saray–cami ziyaret saatleri ve ücretleri, Boğaz turu tarifeleri, kruvaziyer gemi takvimi (Galataport), İBB ulaşım uyarıları, acil rehber, rehber sohbeti, özel mesaj.
- ~330 kayıtlı rehber. 8 Eyl'de 286 kişiye "artık ücretsiz" e-postası gitti (`duyuru-tamamen-ucretsiz-mail.html`). E-posta metni ile Instagram metni **aynı üç özelliği** anlatmalı, birbiriyle çelişmemeli.

## 2. Instagram hesabı ve hedef

- **@pusulaistanbul.app** — 9 Eyl 2026 itibarıyla **0 gönderi, 321 takipçi**. Yani bu duyuru **hesabın ilk gönderisi** olacak; grid'in ilk karesi.
- Hedef kitle: **yalnızca profesyonel (kokartlı) turist rehberleri.** Turist değil, acente değil, genel halk değil.
- Amaç, sırasıyla: (1) mevcut üyeleri güncellemeye ikna etmek, (2) Ayşe'nin tanımadığı rehberlere ulaşmak. Veri şunu gösterdi: rehberler arası **ağızdan ağıza** (İRO WhatsApp grupları) bir gecede 21 kayıt getirdi; e-posta yalnızca 8. Bu yüzden her içeriğin son hedefi **"bir meslektaşına ilet"**tir — beğeni değil, paylaşım.

## 3. Şu anki iş: Duyuru carousel'i (6 slayt, 1080×1350)

Tasarım **onaylı ve sabit**: kobalt→menekşe gradyan kapak/kapanış, beyaz özellik slaytları, lavanta "hepsi bir arada" slaytı; Poppins; beyaz pusula logosu. **Tasarımı ve yerleşimi değiştirme.** Metinleri değiştirdiğinde slayt taşmasın (başlıklar 2 satır, maddeler en fazla 2 satır).

**Ayşe'nin geri bildirimi: mevcut metinler "içine sinmedi".** Üç tur yazıldı; son hâli kurallara uyuyor ama hâlâ istenen seviyede değil. Codex'ten beklenen: **profesyonel bir Türk reklam editörünün elinden çıkmış**, akıcı, sıcak ama ciddi, çeviri kokmayan metinler. Aşağıdaki kurallar **kesin**dir; onların dışında özgürsün.

### 3a. Metin kuralları (Ayşe koydu — istisnasız)

1. **Hedef kitle yalnız rehberler.** "Herkese açık", "şart yok", "kim olursanız olun" gibi ifadeler **yazılmaz**. Doğru: "profesyonel turist rehberlerine açık / rehberlerin hizmetinde".
2. **"Reklam yok" vaadi verilmez.** Şimdilik reklam yok ama ileride olabilir. "Ücretsiz" demek serbest; "reklamsız" demek yasak.
3. **Kaba emir kipi yok.** "yap, aç, et, geç, kur, indir, ilet, gönder, seç" gibi 2. tekil emirler **kullanılmaz**. "Siz" hitabı; tercihen **bildirim cümleleri**: "güncelleme yeterli", "tek dokunuşla iletilir", "bildirim telefonunuzda". Nazik siz-emri ("güncelleyin") bile son çare; mümkünse kaçın.
4. **"Biz" dili yerine marka adı.** Uygulamayı tek kişi yapıyor; "biz yaptık / hesabı biz tutalım" yerine "Pusula" ("hesap Pusula'da").
5. Yazım: **TUREB** (Ü yok), **İRO**, **Pusula İstanbul** (İ noktalı), **Rehber Aranıyor**, **Tur Takvimi**, **Masraf Pusulası** — özellik adları büyük harfle, tırnaksız.
6. Rakam ve iddia uydurma. Elde olanlar: 300'ü aşkın rehber, 3 yeni özellik, 8 hazır özellik. "En iyi", "tek", "#1" gibi üstünlük iddiası yok.
7. Her slaytta **tek ana cümle**; gerisi ona yaslanır. Türkçe'nin kendi ritmi: kısa cümle, virgülle nefes, gereksiz "ve" yok.

### 3b. Mevcut metin (v3 — iyileştirilecek)

| # | Zemin | Başlık | Alt metin / maddeler |
|---|---|---|---|
| 1 | gradyan | **Artık ücretsiz.** | Premium üyelik dönemi kapandı. Pusula İstanbul'un tüm özellikleri, bugünden itibaren profesyonel turist rehberlerinin hizmetinde. — şerit: *Ücretsiz · Profesyonel turist rehberleri için* — dip: *Üstelik üç yeni özellikle* |
| 2 | beyaz | 01 REHBER ARANIYOR — **İşler artık sizi buluyor.** | • Rehber arayan meslektaşlarınız ve acenteler ilanını verir; başvuru tek dokunuşla. • Çalıştığınız dillerde bir ilan açıldığı an, bildirim telefonunuzda. • İlan sahibine arama, WhatsApp ya da özel mesajla anında ulaşılır. |
| 3 | beyaz | 02 TUR TAKVİMİ — **Ajandanız, bir bakışta.** | • Tek günlük şehir turundan bir haftalık Anadolu turuna, tüm programınız tek takvimde. • Dolu ve boş günleriniz, uygulama açılır açılmaz ana ekranda. • Rehber Aranıyor ilanlarıyla aynı takvim: çakışma riski ortadan kalkıyor. |
| 4 | beyaz | 03 MASRAF PUSULASI — **Fişler sizde, hesap Pusula'da.** | • Günün masrafları ve fiş fotoğrafları, ilgili turun altında bir arada. • ₺, € ve $ karışık olsa da toplam otomatik; avans ve rehberlik ücreti dahil. • PDF, Word ya da Excel çıktısı, acenteye mail veya WhatsApp ile tek dokunuşta iletilir. |
| 5 | lavanta | HEPSİ BİR ARADA — **Sahanın tamamı, cebinizde.** | Rehberler için, rehberlerle birlikte. Her gün güncel, her zaman ücretsiz. — 8 chip: Canlı saha durumu · Müze ve cami saatleri · Boğaz tarifeleri · Kruvaziyer takvimi · Ulaşım uyarıları · Acil rehber · Rehber sohbeti · Özel mesaj — dip: *300'ü aşkın rehber şimdiden aramızda* |
| 6 | gradyan | **Yeni sürüm yayında.** | Uygulama telefonunuzdaysa güncelleme yeterli; değilse kurulum iki dakika. Kayıt, profesyonel turist rehberlerine açık. — QR kutusu: **Bir meslektaşınıza da ulaşsın.** Rehber çoğaldıkça saha bilgisi canlanır. Paylaşılan her gönderi, sahayı biraz daha büyütür. |

Açıklama metni (caption) `duyuru-ucretsiz-2026-09/aciklama-metni.txt` — slaytlarla aynı tonda yeniden yazılmalı; 12 hashtag'i koru.

### 3c. Neyin eksik olduğuna dair dürüst tahmin (Ayşe teyit etmedi, Codex sorgulasın)

- Maddeler **özellik listesi gibi** okunuyor; rehberin sahadaki hâlini (sabah 7'de Galataport, Ayasofya kuyruğu, acenteye fiş yetiştirme derdi) hissettirmiyor. İyi reklam metni önce **anı** kurar, sonra çözümü söyler.
- "Ajandanız, bir bakışta" ve "Sahanın tamamı, cebinizde" **jenerik**; herhangi bir uygulama söyleyebilir. Pusula'ya özgü olan şey: **rehberler birbirine sahayı anlatıyor** — bu duygu başlıklarda yok.
- Kapak "Artık ücretsiz." doğru ama **kuru**. Rehbere "bu senin için" dedirten bir cümle eksik.
- Maddeler biraz uzun; telefonda 36px'te iki satıra sarıyor. Daha kısa, daha keskin.

Codex'ten istenen çıktı: **her slayt için 2 alternatif** (biri güvenli, biri cesur), ardından Ayşe'nin seçimiyle `uretici/duyuru.py` içindeki dizelerin güncellenmesi ve PNG'lerin yeniden üretilmesi.

## 4. Dosyalar ve üretim

```
sosyal-medya/
├── CODEX-BRIEF.md                  ← bu dosya
├── duyuru-ucretsiz-2026-09/        ← 6 PNG + aciklama-metni.txt (mevcut çıktı)
├── gunluk-kart-ornekler/           ← otomatik kart şablonunun 3 örneği (bkz. §5)
└── uretici/
    ├── duyuru.py                   ← carousel üretici (Playwright/Chromium → PNG)
    ├── gunluk-kart.py              ← günlük kart şablonu üretici
    ├── fonts/Poppins-{Regular,SemiBold,Bold,ExtraBold}.ttf
    └── qr.png                      ← https://pusulaistanbul.app QR'ı
```

- Çalıştırma: `pip install playwright && playwright install chromium`, sonra `cd sosyal-medya/uretici && python3 duyuru.py`.
- Metin değişikliği **yalnızca** `S1..S6` bloklarındaki Türkçe dizelerde. CSS, ölçüler, renkler sabit. Emoji chip'ler Noto Color Emoji ister (Linux'ta `fonts-noto-color-emoji`).
- Marka varlıkları repoda: `assets/images/splash-logo.png` (beyaz pusula), `assets/images/logo-icon.png` (kobalt pusula), palet `constants/theme.ts` (kobalt #1E40AF, menekşe #7C3AED, safran #F59E0B, metin #121A3E, kart #F6F7FD, border #E6E8F5). Hey İstanbul'un turkuaz/mercan paleti **kullanılmaz**.
- Üretilen PNG'ler `duyuru-ucretsiz-2026-09/` üzerine yazılır; eskisini istersen önce git'ten al.

## 5. Sıradaki iş (bu brief'in kapsamı dışında ama bilinmesi gerekli): otomatik günlük kart

Tasarımı onaylı, otomasyonu yapılmadı. Fikir: Pusula'nın **kendi verisi** rehberin işine yarayan Instagram kartına dönüşsün; Ayşe'nin vakti yok, süreç tamamen otomatik olsun.

- Kaynaklar (Supabase, public şema): `gemi_takvimi` (tarih, gemi, şirket, yolcu, geliş/gidiş saati), `canli_durum` (nokta_id, durum, not_metni, bekleme_dk), `mekan_saatleri` (isim, açılış/kapanış, gişe, kapalı_gun, fiyatlar), `ulasim_uyarilari`, `bogaz_turlari`.
- Üç kart tipi (örnekleri `gunluk-kart-ornekler/`): **Kruvaziyer** ("Cuma Galataport'ta 5.224 yolcu"), **Sahadan bildirim** (bir rehberin canlı notu), **Yarın kapalı** (kapalı gün + açık alternatifler).
- Mimari: pg_cron 07:00 → "bugün paylaşmaya değer bir şey var mı" kuralı → Edge Function (Deno) **satori + resvg** ile PNG → Supabase Storage public URL → Instagram Content Publishing API (`POST /{ig-user-id}/media` image_url + `POST /media_publish`). Hesap Professional ve FB sayfasına bağlı (hazır). Gerekli: Meta developer app, uzun ömürlü token (60 günde yenileme).
- **İlke:** her gün paylaşmak hedef değil; yalnızca gerçek değişiklikte, haftada 2-3 kart. Sıkıcı hesap ölür.
- Şablon bilerek yalnız flexbox — satori kısıtı. Kart ipuçlarındaki "al / bırak / koy" ifadeleri §3a-3 kuralına aykırı, yeniden yazılacak.
- Açık kararlar: ipucu satırı kural tabanlı mı (örn. >4.000 yolcu → "sabah erken" ipucu) elle mi; beyaz zemin alternatifi.

## 6. Dokunulmayacaklar

- **Resend, Expo (EAS) ve Supabase abonelikleri** — Hey İstanbul projesiyle ortak; iptal/downgrade önerme, dokunma.
- Uygulama kodu (`app/`, `components/`, `lib/`, `supabase/`) bu işin kapsamı dışında.
- `duyuru-alicilar.json`, `duyuru-gonderim-*.json`, `abonelik-hatirlatma-*.json` — kişisel e-posta listeleri; git'e ekleme, paylaşma.
- Ayşe'nin onayı olmadan Instagram'a **hiçbir şey yayınlanmaz**; API otomasyonu bile önce kuru çalıştırma (dry-run) ile gösterilir.

## 7. Çalışma tarzı

- Ayşe kısa, net, sonuç odaklı yazışır; uzun açıklama istemez. Taslak değiştirdiğinde **tam metni** ver, sadece değişen satırı değil.
- Araştırma/tarama turlarına onaysız başlama; planı söyle, "tamam" bekle.
- Türkçe yaz. Ekran görüntüsü/gerçek uygulama görseli istersen ondan iste (repodaki `docs/ss-*.png` eski palet, kullanılmaz).
