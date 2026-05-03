# Pusula Istanbul - Mimari Kararlar ve Dersler

Bu dosya "neden boyle yapildi?", "neden boyle yapma!" sorularinin cevabini iceriyor. Yeni feature gelistirirken once buraya bak — ayni hatayi tekrarlama.

---

## 1. PENDING PATTERN — Stack Mount-Aware Navigation (v1.0.9)

### Problem
Cold start'ta deep link gelirse:
- App mount → `if (!fontsLoaded || oturum === null || abonelik.yukleniyor) return null;` ile **Stack hic render edilmiyor**
- Linking.getInitialURL() cabuk resolve eder, handleAuthDeepLink kosar, setSession basarili
- `router.replace('/sifre-sifirla')` cagrilir AMA Stack mount edilmemis — Expo Router silently fail eder
- Sonra fonts/oturum/abonelik resolve eder, Stack mount olur, initialRouteName="(tabs)" ile ana ekran acilir
- Kullanici sifre sifirlama ekranini GORMUYOR

### Cozum
`app/_layout.tsx`:
```typescript
// Yeni state
const [sifreSifirlamaPending, setSifreSifirlamaPending] = useState(false);

// handleAuthDeepLink icinde dogrudan router.replace YERINE:
setSifreSifirlamaPending(true);

// Yeni useEffect — Stack hazir olunca navigate eder:
useEffect(() => {
  if (!sifreSifirlamaPending) return;
  if (!fontsLoaded || oturum === null || abonelik.yukleniyor) return;
  router.replace('/sifre-sifirla' as never);
  setSifreSifirlamaPending(false);
}, [sifreSifirlamaPending, fontsLoaded, oturum, abonelik.yukleniyor]);
```

### Genel Ders
**router.replace silently fail eder Stack mount edilmeden once.** Expo Router'in tipik davranisi, hata firlatmaz. Cold start'ta async deep link handler'lari Stack mount oldugundan EMIN olduktan sonra navigate etmeli. Dependency'ler Stack render kosullariyla AYNI olmali.

---

## 2. STATE ASYNC, REF SENKRON

React state update'leri await aralarinda race olusturabilir. Recovery deep link gibi senaryolarda useRef ile senkron flag dusunulmeli.

### Ornegi (v1.0.8 fix)
- setSession() async — bu sirasinda state degisikligi olur
- Routing useEffect tetiklenip /(tabs)'a redirect yapabiliyordu
- Cozum: `sifreSifirlamaRef = useRef(false)` ile senkron flag, await sirasinda korur

---

## 3. detectSessionInUrl: false (lib/supabase.ts)

Mobile'da DOGRU karar — tek dogruluk kaynagi bizim handler. AMA bu durumda **manuel handler'in TIMING ve completeness'i daha kritik** hale gelir. SDK auto-detect yok, biz yakalayacagiz.

---

## 4. UCT (UC) KATMANLI GUVENLIK AGI — IAP Satin Alma (v1.0.6)

### Problem (23 Nisan 2026 — gercek odeme felaketi)
- aysetokkus@icloud.com gercek iPhone'da aylik abonelik satin aldi
- Apple parayi cekti, profil hala "Ucretsiz" goruniyordu
- "Satin Almalari Geri Yukle" da "Aktif Abonelik Bulunamadi" dondu

### 3 Ayri Bug
**(a) abone-ol.tsx sessiz basarisizlik:**
Satin alma sonrasi `entitlements.active['pro']` false donerse kod sessizce hicbir sey yapmiyordu — Alert yok, Supabase update yok, navigate yok. Kullanici limbo'da kaliyordu.

**(b) use-abonelik.ts RC listener dependency:**
useEffect dependency `[aktifAbonelik]` idi. RC ilk render'da hazir degilse (`isRCReady()` false) listener HICBIR ZAMAN eklenmiyordu.

**(c) Supabase profiles realtime dinleme YOKTU:**
abone-ol.tsx Supabase'i guncelliyor ama hook bunu bilmiyordu.

### Cozum — 3 katmanli guvenlik
1. **RC entitlement check** (ana yol)
2. **Basarisizsa otomatik restore** (`Purchases.restorePurchases()`)
3. **Supabase fallback update** — HER DURUMDA guncelleniyor (`abonelik_durumu='aktif'`, plan, bitis tarihi), basari Alert gosteriliyor
4. **Supabase realtime listener** — `abonelik-degisim` channel ile profiles UPDATE event'leri dinleniyor, `abonelik_durumu === 'aktif'` gelince `setAktifAbonelik(true)`

### use-abonelik.ts Onemli Detaylar
- useEffect dependency `[]` (bos) — RC hazir olana kadar 2sn arayla polling (max 15 deneme, 30sn)
- Listener icinde Supabase senkronizasyonu da yapiliyor

---

## 5. MANUAL RELEASE ZORUNLU (v1.0.7+)

### Felaket
v1.0.7 review hizla onaylandi ve **otomatik release** edildi (Manuel release secilmedigi icin) — sifremi unuttum bug'i ile birlikte yayina cikti.

### Karar
**Bundan sonra her release'de Manuel release sec** ki kritik bug fark edilirse cancel/reject sansi olsun.

### Ders: Kalite > Momentum
Ayse'nin pozisyonu: 30 yillik marka emegini koruyan profesyonel rehber. Sifre sifirlama gibi temel ozellik fix'ini iceren bir ucretli app cikamaz. **30 yillik marka emegi vs 3-5 gunluk launch gecikmesi karsilastirmasi her zaman birinciyi secmeli.**

---

## 6. PAID APPS AGREEMENT — IAP Test Etmeden ONCE Kontrol Et

### Felaket (v1.0.4 6. Reject — 20 Nisan 2026)
Reviewer iPad Air M3'te satin alma yapamadi. **Kod sorunu DEGIL** — Paid Apps Agreement "Pending User Info" durumundaydi.

### Cozum
- W-8BEN vergi formu (Turkey, Article 12(2), %10 withholding rate, TC Kimlik No)
- U.S. Certificate of Foreign Status (Individual/Sole proprietor)
- Banka hesabi Active
- Sonra Paid Apps Agreement "Active" oldu
- Ayni build resubmit edildi → onaylandi

### Genel Ders
**Yeni gelistiriciler icin: IAP test etmeden ONCE Business > Agreements'ta Paid Apps Agreement'in "Active" oldugunu kontrol et.** "Pending User Info" sandbox satin almayi sessizce ENGELLER.

---

## 7. SUBSCRIPTION GROUP LOCALIZATION ASIL PROBLEM

### Yanlis Yorum
Subscription urunlerinin "Missing Metadata" statusu — bireysel subscription metadata'sindan zannediliyordu.

### Asil Sebep
**Subscription GROUP Localization** eksikti.

### Cozum
Subscriptions > Pusula Istanbul Premium > Localization > Create > Turkish ekleyince her iki plan da "Ready to Submit" oldu, version sayfasinda "In-App Purchases and Subscriptions" bolumu gorundu, subscription'lar version'a baglandi.

### Ders
"Missing Metadata" yaziyorsa once **GROUP** lokalizasyonunu kontrol et, sonra urun bazli metadata'yi.

---

## 8. SUPABASE RLS SESSIZ REDDEDEBILIR

### Problem
UPDATE policy'si reddederse her zaman error donmez, sadece **0 row affected** olur. Frontend'de fark edilmez.

### Cozum (v1.0.8 use-canli-durum.ts)
```typescript
const { data, error } = await supabase
  .from('canli_durum')
  .update({...})
  .select(); // <-- ONEMLI

if (error) { /* gercek hata */ }
else if (data.length === 0) {
  Alert.alert('Yetki sorunu olabilir');
}
```

### Genel Ders
**Frontend'de UPDATE/DELETE sonrasi `.select()` ekle, dönen satir sayisini kontrol et.** RLS sessiz reddederse kullaniciya bildir.

---

## 9. RLS POLICY'DE 'rol' KOLON ADI ('role' DEGIL)

profiles tablosunda kolon adi `rol` (Turkce). RLS policy'leri yazarken `role` kullanma — calismaz.

```sql
-- DOGRU
CREATE POLICY ... USING (auth.uid() IN (SELECT id FROM profiles WHERE rol IN ('admin', 'moderator')));

-- YANLIS — calismaz
CREATE POLICY ... USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator')));
```

`is_admin_or_mod()` fonksiyonu var, kullanmak daha temiz:
```sql
CREATE POLICY ... USING (is_admin_or_mod());
```

---

## 10. EMAIL CONFIRMATION ACIK — RLS ENGELI ICIN if (data.session)

### Problem (25 Nisan 2026 fix)
Email confirmation acikken signUp sonrasi session null gelir. `await supabase.from('profiles').insert(...)` RLS'e takilir — `setYukleniyor(false)` hic calismaz, ekran sonsuza kadar loading'de kalir.

### Cozum (giris.tsx kayitOl)
```typescript
if (data.session) {
  // Profil INSERT yap (oturum acik, RLS gecer)
} 
// session yoksa profil INSERT atlanir
// Profil ilk giriste girisYap fonksiyonundaki kodla metadata'dan olusturulur
```

### Bonus
- `emailRedirectTo: 'https://pusulaistanbul.app/dogrulandi.html'` (eski deep link iOS Mail in-app browser'da acilmiyordu)
- `redirectTo: 'pusulaistanbul://giris'` (sifremiUnuttum icin)

---

## 11. CIFT X API SENKRONIZASYONUNDAN GLOBAL TIMER'A

### Problem (v1.0.5)
ulasim-uyari.tsx ve trafik-uyari.tsx **bagimsiz** useXUlasim() + setInterval kuruyordu — ayni veri 2 kere cekildi.

### Cozum
- Bilesenlerdeki senkron kaldirildi
- Tek global timer `_layout.tsx`'e tasindi
- Module-level mutex + 30sn minimum aralik (use-x-ulasim.ts)

### Sinirlama (v1.1.0'da Cozulecek)
Global timer SADECE app aciksa calisir. App kapaliyken arada gelen tweet'ler hic cekilmez. Sehir Hatlari pattern (scheduled task) ile merkezi cozume tasinmali.

---

## 12. SCHEDULED TASK = SERVICE_ROLE_KEY (RLS BYPASS)

### Sinir
RLS policy'si: sadece service_role veya admin/moderator INSERT/UPDATE yapabilir.
Anon key ile scheduled task INSERT'i bloke ediyordu.

### Cozum
- `.env`'e `SUPABASE_SERVICE_ROLE_KEY` eklendi (EXPO_PUBLIC_ prefix YOK — mobile app'e dahil edilmemeli!)
- Scheduled task'lar bu key'i `Authorization: Bearer ...` header'inda kullanir
- 4 task guncellendi: sehir-hatlari-iptal-takip, havalimani-tarife-guncelle, muze-saatleri-guncelle, saraylar-saatleri-guncelle

### KESINLIKLE
**Service role key sadece scheduled task'larda — mobile app'e ASLA dahil etme.** EXPO_PUBLIC_ prefix kullanma.

---

## 13. JSONB vs TEXT[] (havalimani_seferleri)

`sehirden_hav` ve `havdan_sehir` kolonlari **jsonb** tipindedir, ARRAY[] DEGIL.

```sql
-- DOGRU
UPDATE havalimani_seferleri SET sehirden_hav = '["03:00","03:30","04:00"]'::jsonb WHERE ...;

-- YANLIS — tip uyumsuzlugu
UPDATE havalimani_seferleri SET sehirden_hav = ARRAY['03:00','03:30'] WHERE ...;
```

---

## 14. EAS ENV (eski `eas secret:*` DEPRECATED)

### Yeni Komutlar (v18.5+)
```bash
eas env:create --name EXPO_PUBLIC_X_BEARER_TOKEN --value "..." --environment production --visibility sensitive
eas env:list --environment production
eas env:delete --name EXPO_PUBLIC_X_BEARER_TOKEN --environment production
```

### Iki Onemli Kural
- **EXPO_PUBLIC_** prefix'li degiskenler `--visibility secret` kabul ETMEZ. `--visibility sensitive` kullan.
- **Her environment icin ayri ayri** olusturulmali (production, preview, development).

---

## 15. EMAIL TEMPLATE TASARIM DNA'SI

5 email template'in HEPSI ayni tasarimda:
- Header: 4-renk diyagonal gradient (`linear-gradient(135deg, #00A8E8 0%, #0077B6 33%, #0096C7 67%, #48CAE4 100%)`)
- Layout: `PUSULA · windrose logo · ISTANBUL` yatay (uppercase, font-weight 800, letter-spacing 5px)
- Logo: `https://pusulaistanbul.app/logo-icon.png` (white-on-transparent, width 67 height 48 — proportional 1.4:1)
- Font: Poppins (Google Fonts @import)
- CTA buton: #0077B6 mavi, beyaz metin
- Footer: signature, Instagram pembe buton, copyright + linkler
- Email-safe HTML: tablo bazli layout (Outlook uyumlu), inline styles

Yeni template eklenirse bu DNA korunmali.

---

## 16. A/B TEST PAHA BICILEMEZ

### v1.0.9 Tani Sureci
ayse.tokkus@gmail (bug var) vs kelebekiamarket@gmail (calisiyor) karsilastirmasi:
- Ayni akis, farkli sonuc → buggy davranis BELGELENDI
- "Kod yanlis" yerine "kullanici yanlis denedi" varsayimina dusulmedi
- last_sign_in_at karsilastirmasi: setSession koshtu mu kosmadi mi sorusunu DB seviyesinde kanitladi

### Genel Ders
**Reproducibility belirsizken iki farkli kullaniciyla AYNI akisi yap, sonuc karsilastir.** Metadata alanlari (last_sign_in_at, last_seen vb.) debug arac olarak kullanilabilir.

---

## 17. KOZULDU TESPITI: TWEET'LER ESKIDEN YENIYE ISLENMELI

### Problem (13 Nisan 2026)
X API tweet'leri en yeniden eskiye donduruyor. Ayni batch'te ariza+cozum gelince:
1. "normale donmustur" once islenir
2. Henuz DB'de olmayan ariza tweet'ini bulamaz
3. Cozum atilir, sonra ariza eklenir → ariza acik kalir, kullanici hatali bilgi gorur

### Cozum
use-x-ulasim.ts'te tweet'leri **eskiden yeniye** siralayarak isle.

---

## 18. ANDROID "ALREADY SUBMITTED" GECEKLI BIR HATA DEGIL

### Tuzak
eas submit basarisiz gibi gorunup aslinda Draft yuklenmis olabilir.

### Yapilacak
- Play Console'a manuel git
- Draft varsa oradan yayinla
- "Already submitted" hatasini kor kor tekrarlama

---

## 19. ENTITLEMENT_ID ESLESMESI ASIL

`lib/revenuecat.ts`'de `ENTITLEMENT_ID` constant'i **RevenueCat dashboard ile birebir eslemeli.** Yanlislikla 'premium' yazip dashboard 'pro' ise satin alma "basarili" goruntu, ama hak verilemez.

```typescript
export const ENTITLEMENT_ID = 'premium'; // RC dashboard'da ayni yazmali
```

**ONEMLI DUZELTME (1 May 2026):** Bu kararin daha eski versiyonlarinda "ENTITLEMENT_ID = 'pro'" yaziyordu (v1.0.4 fix sirasinda boyle dusunulmustu). Aslinda hem app kodu hem RC dashboard `premium` kullaniyor. CLAUDE.md de yanlis bilgiyi tasiyordu, 1 Mayis 2026'da duzeltildi. Yeni rehber: kodu kontrol et (lib/revenuecat.ts), dashboard'la karsilastir, ikisi `premium` ise sorun yok.

---

## 20. PROFIL HESAP SILME / CIKIS YAP — SADECE signOut() YETMIYOR

### Problem (v1.0.8 fix)
`cikisYap` sadece `supabase.auth.signOut()` cagiriyordu. Local state `kullanici` guncellenmediginden UI hala giris yapmis gibi gosteriyordu.

### Cozum
```typescript
await signOut();
setKullanici(null);
router.replace('/giris');
```
Ayni fix Hesap Silme akisinda da yapildi.

---

## 21. SOZLESME INDIRME: WebBrowser DEGIL Linking.openURL

### Problem (24 Nisan 2026)
acil.tsx'de docx linkleri `WebBrowser.openBrowserAsync` ile aciliyordu. Custom domain eklendikten sonra eski URL redirect yapiyor ama WebBrowser **redirect+binary dosya kombinasyonunu isleyemiyordu.**

### Cozum
```typescript
Linking.openURL('https://pusulaistanbul.app/musteri-rehber-sozlesmesi.docx')
```
Sistem tarayicisinda acilir, indirme dogru calisir.

---

## 22. EMOJI YOK — Genel Politika

v1.0.3'te (16 Nisan 2026) tum emojiler kaldirildi. Sebep:
- Apple Guideline 4.0 (iPad design)
- Profesyonel rehber kullanicisina uygun ton
- Cross-platform render uyumsuzlugu

Yeni kod yazarken **ASLA emoji ekleme.** Yerine:
- Renkli daire View
- Unicode karakterler (●/◐/✕/⚙)
- "!" metin
- Yazili etiket

---

## 23. PUSH NOTIFICATION ALTYAPISI HENUZ YOK

v1.1.0'da yapilacak. Su an sadece in-app realtime bildirim var. APNs Auth Key + FCM credentials + Supabase Edge Function gerekecek.

---

## 24. SCHEDULED TASK NE ZAMAN MANTIKSIZ — Saraylar + Muzeler Karari (1 Mayis 2026)

### Problem — Saraylar (`saraylar-saatleri-guncelle`)
Millisaraylar.gov.tr'den haftalik scrape:
1. **Lokasyon-ozgu saatler kaybediliyordu:** Site mevsimsel ayrim yapmadan tek genel saat veriyor (09:00 / 17:30 / 17:00). DB'de mevsimsel=true ile yaz/kis ayri saatler tutuluyor. Yildiz Sarayi gercekte tek saatli (kompleks kucuk), ama DB ona da mevsimsel saat atiyordu.
2. **Supheli fiyat parse'i:** 30 Nisan'da Aynalikavak ve Maslak Kasirlari'nin yerli ucretleri 100→80 TL DUSURULDU. Site boyle dedigi icin yazildi ama gercekte de dusmus mu bilinmiyor — Kultur Bakanligi tarifesi nadir duser.

### Problem — Muzeler (`muze-saatleri-guncelle`)
muze.gov.tr + dosim.ktb.gov.tr'den haftalik scrape:
1. **URL redirect sorunu:** muze.gov.tr SectionId/DistId kombinasyonlari bazen yanlis muzeye gidiyor. Galata Mevlevihanesi (GMM01) hep Gumushane'ye redirect oluyor, dogru URL bulunamadi. Task uc farkli URL denemesi yapti, ucu de basarisiz.
2. **Uclu kaynak celiskisi:** Buyuk Saray Mozaikleri ornegi — web "09:00-19:00 acik" diyor, dosim "KAPALI" diyor, DB ise "09:00-17:30, gise yok". Hangisi dogru belirsiz, otomatik karar verilemez.
3. **Mevsimsel saatler tartismali:** Web 1 Nisan'dan beri "yaz" saatlerini gosterirken DB hala "kis" tutuyor olabilir (1 Mayis oncesi karari). Task ne zaman scrape edip ne zaman atlasin belirsiz.

### Ortak Karar
Iki task da **devre disi** birakildi (silinmedi — geri acilabilir). Hem saraylar hem muzeler/camiler/ozel_muzeler artik admin panelden (`admin-saatler.tsx`) Ayse tarafindan elle yonetiliyor.

### Neden Manuel Yonetim Burada Daha Iyi
- **10 sabit lokasyon** — kucuk, izlenmesi kolay
- **Dusuk frekans** — fiyat yilda 1-2, mevsim yilda 2 kez degisir
- **Uzmanlik avantaji** — Ayse TUREB ruhsatli rehber, Milli Saraylar konusunda site parse'inden cok daha guvenilir kaynak
- **Ozel durumlar** — Yildiz Sarayi tatil gunleri (resmi/dini bayramlar), Topkapi combined ticket gibi nuanslar otomatik scrape ile yakalanamaz

### Genel Ders
**Scheduled task her veri kaynagi icin DOGRU CEVAP DEGIL.** Dogru oldugu yerler:
- Yuksek frekansli degisim (Sehir Hatlari iptal seferleri — gunde defalarca)
- Buyuk hacim (havalimani 6+ rota)
- Kullanicinin uzman olmadigi alan

Manuel yonetim daha iyi olan yerler:
- Az sayida lokasyon, dusuk frekansli degisim
- Kullanicinin domain uzmanligi var
- Lokasyon-ozgu nuanslar otomatik parse edilemiyor
- Site verisi tutarsiz/eksik (mevsimsel ayrim yok ama DB'de var)

### Geri Acmak Istenirse
```
mcp__scheduled-tasks__update_scheduled_task taskId=saraylar-saatleri-guncelle enabled=true
mcp__scheduled-tasks__update_scheduled_task taskId=muze-saatleri-guncelle enabled=true cronExpression="0 10 * * 3"
```

---

## 25. EXCEL-AS-SOURCE-OF-TRUTH + HIBRIT YONETIM (1 Mayis 2026)

### Problem
Saraylar ve muzeler scheduled task'lari devre disi birakildiktan sonra (DECISIONS.md #24) toplu yonetim icin pratik bir yontem gerekti. Admin paneli tek tek mekan icin iyi ama 50+ mekanin yillik revizyonu admin panelden gun alir.

### Cozum: Excel + Python + Supabase REST
Uc parcali pipeline kuruldu:

1. **`scripts/template-olustur.py`** — Bos Excel template uretir (29 kolon, drop-down validation, kolon-grup renk kodlamasi, Yardim sayfasi).
2. **`scripts/template-doldur.py`** — Supabase REST API ile mevcut kayitlari template'e doldurur (Excel currency format'lari ile birlikte).
3. **`scripts/excel-full-sync-sql.py`** — Excel'i tek dogruluk kaynagi olarak alir, BEGIN/COMMIT atomic transaction icinde tum kayitlar icin UPDATE SQL'i uretir. Bos hucre = NULL.

### Hibrit Yonetim Modeli
- **Kucuk gunluk degisiklikler (1-3 mekan):** admin paneli (`admin-saatler.tsx`)
- **Buyuk toplu revizyon (10+ mekan):** Excel → SQL → Supabase
- **Cakisma onleme:** Admin'den yapilan degisiklik Excel'e de yansitilmali, yoksa bir sonraki full sync'te admin degisiklikleri gider. Alternatif: full sync oncesi `template-doldur.py` ile Excel'i DB'den yenile, sonra revizyon yap.

### Tasarim Karari: Bos Hucre = NULL (Full Sync)
Ilk versiyonda "bos hucre = dokunma" mantigi (diff-based) kullanildi. Ama Ayse "boş bıraktığım alanlar dolu görünüyor" diye sikayet etti — kafa karistirici. Ikinci versiyonda **full sync** mantigina gecildi: Excel = tek dogruluk kaynagi, bos hucre NULL yapar. Daha tutarli, daha az surpriz.

### Yan Etkiler / Ogrenilen Dersler
- **Excel currency format'i** (`#,##0\\ [$€-1]`) hucre value'sunda sayisal saklar, sembolu format'ta tutar. `cell.value` sadece sayiyi verir → format okumayi unutursan EUR sembolleri kaybolur. `hucre_degeri_format_ile()` fonksiyonu bunu cozer.
- **PostgreSQL NOT NULL constraint'lar** Excel'de bos birakilan zorunlu alanlari (orn. `kapanis`) reddeder. Cozum: post-processing kurali — `kapanis` bos VE `gise_kapanis` dolu ise `kapanis = gise_kapanis` (cogu mekanda mantikli, kullanici onayladi).
- **Atomic transaction kritik** — BEGIN/COMMIT icinde herhangi bir UPDATE patlarsa hepsi rollback olur, DB tutarli kalir. Bu sayede defalarca deneyebilir, veriyi bozmazsin.
- **String icindeki `;` Supabase statik analizinde false positive uretir** ("WHERE clause olmadan UPDATE" uyarisi). Multi-statement SQL'lerde gercek WHERE eksik olup olmadigini grep ile dogrula.

### Pipeline Bir Cumlede
"Excel doldur → script ile DB'den fark alma yerine TUM Excel'i DB'ye yansit → atomic transaction ile guvenli uygula → hata olursa rollback otomatik."

### Bu Yaklasim Hangi Veri Tipleri Icin Uygun
- Az sayida lokasyon (50-100), kullanici uzman
- Periyodik manuel revizyon (yilda 2-4 kez)
- Site scrape'inin guvenilir olmadigi alanlar (lokasyon-ozgu nuanslar, mevsimsel saatler, ozel notlar)

### Bu Yaklasim Hangi Veri Tipleri Icin UYGUN DEGIL
- Yuksek frekansli degisim (saatte bir, gunde bir) — scheduled task daha iyi
- Buyuk hacim (1000+ kayit) — Excel zorlanir
- Otomatik kaynaktan zaten temiz veri geliyor (havalimani tarifeleri gibi)

---

## 26. CLAUDE-CONTEXT KLASORU (Bu Yapi)

Eski tek dosyali CLAUDE.md (1511 satir, 66k token) bolundu. Sebep:
- Her oturumda 66k token okutmak savurganlik
- Cogu bilgi her oturumda gerekmiyor

Yeni yapi (28 Nisan 2026):
- `CLAUDE.md` (root, ~3-4k token) — Lean index
- `claude-context/PROJECT.md` — Statik proje bilgisi
- `claude-context/STATE.md` — Mevcut dinamik durum
- `claude-context/CHANGELOG.md` — Surum gecmisi
- `claude-context/DECISIONS.md` — Bu dosya (mimari kararlar + dersler)
- `claude-context/ISSUES.md` — Bilinen sorunlar
- `claude-context/INFRASTRUCTURE.md` — Email, payment, EAS, DNS

`CLAUDE.md.eski` proje kokunde yedek olarak duruyor.

### Lazy Loading Mantigi
Ana CLAUDE.md "kapi bekcisi" — bir konuda calisirken ilgili modulu okur. Ornek:
- Auth/sifre sifirlama → DECISIONS.md + PROJECT.md ozel ekranlar
- Supabase RLS → DECISIONS.md "RLS Sessiz Reddedebilir"
- Yeni surum cikarma → STATE.md + CHANGELOG.md + INFRASTRUCTURE.md (EAS env)

---

## 27. PLAY CONSOLE BASE PLAN BILLING PERIOD VERIFICATION (1 Mayis 2026)

### Felaket
v1.0.10 yayina ciktiktan birkac saat sonra Orcun Taran bildirdi: yillik plan satin alma ekraninda "TRY 699,99/month" goruyor. Ayse'nin orijinal tasarimi: yilda bir kez 699,99 TL. Gercek konfigurasyon: aylik 699,99 TL otomatik yenileme. Yani kullanici 12 ay boyunca 699,99 TL × 12 = 8.400 TL odeyebilirdi (12x amaclanan miktar).

Play Console'da Yillik Plan urununun base plan'ini olustururken **"Fatura dönemi" varsayilani Aylik** olarak gelir. Form doldururken bu alan dikkat edilmeden gecilmis, Yillik Plan'a "Aylik" billing donemi atanmis. Cok ince bir detay, cok buyuk sonuc.

### Etkilenenler
- Mustafa Tanribilir (mtanribilir60@yahoo.com)
- Sebnem Buyukkaragoz (sebnem.buyukkaragoz@gmail.com)

Her ikisinin Play Store siparisleri Refund + Iptal edildi (Sipariş yönetimi ekranından), RC'de manuel premium grant ile 1 yil ucretsiz erisim verildi.

### Cozum: Yeni Base Plan + RC Yenileme
Play Console'da BASE PLAN'ın billing period'u sonradan **DEGISTIRILEMEZ** (Google'in kurali). Bu yuzden:
1. Eski `yillik` base plan'i icin "Devre disi birak" yerine,
2. Yeni `yillik-yeni` base plan'i olustur (Yillik dönem, 699,99 TL Türkiye, sadece Türkiye)
3. Aktif et
4. Eski `yillik` base plan'i devre disi birak
5. RC'de Import + Attach entitlement (premium) + Edit offering's annual package → yeni urune yonlendir

### Genel Ders 1 — Yapilandirma Dogrulamasi Yap
Yeni base plan olustururken **otomatik dogrulamali check yap:**
- Fatura dönemi seçimi cikti mi?
- Onay sayfasinda "Yillik" mi yaziyor?
- Test alici hesabi ile **gercek bir satin alma denemesi yap** (sandbox/test purchase)
- "in 1 year" expires gorunmeli, "in 1 month" gorunurse bug var

Bu kuralı diger urunlere/abonelik tiplerine de uygula. Test once.

### Genel Ders 2 — Yapılandırma Bug'lari = Kod Bug'larindan Daha Tehlikeli
Kod bug'i goz onunde, code review ile yakalanir. Store/cloud yapilandirma bug'lari tek bir UI tıklamasıyla olur, izlemez, sadece kullanici raporuyla anlaşılır. **Yeni urun olusturulduktan sonra urunu en az bir kere gercek bir test hesabıyla acından satin al.**

### Genel Ders 3 — Generic UI Metni > Platform-Spesifik Metni
Ayni gun fark edildi: `app/abone-ol.tsx` ve `app/(tabs)/profil.tsx`'te "Bu Apple ID ile..." metni hardcoded'di. Android kullanicilar yanlis gorulu mesaj goruyordu. Generic "Hesabiniz ile..." metni hem iOS hem Android icin dogru. **Platform jargonu kullanma, kullanici zaten hangi mağazada olduğunu biliyor.**

### Yedek Plan: Refund + RC Manuel Grant
Etkilenen kullanicilar icin:
1. Play Console → Sipariş yönetimi → siparişe tıkla → "Geri ödeme" → "Yararlanma hakkını kaldır" CHECK + "Ürün kusurlu" reason → Submit
2. RC → Customer profile → "+ Grant" → entitlement (premium) + duration (1 year)
3. Supabase'de profile zaten 'aktif' olarak set edilmis olmalı (yoksa manuel SET)

Bu üc katmani olusturarak kullanicinin premium erisimi kesintisiz.

---

## 28. SUPABASE ADMIN-SIDE USER CREATION (1 Mayis 2026)

### Senaryo
Orcun Taran bug'i raporladi ama Pusula Istanbul'a uye olmadi (Play Store satin almasi banka tarafindan bloke edildi). Onu uye yapmak icin iki yol vardi:

**A) Onun kendisi uye olsun, sonra biz premium veririz.** Standart yol, en temiz.

**B) Biz Supabase admin yetkisiyle hesap olusturalim.** Hizli ama daha karmasik.

### Karar: B (Ayse'nin tercihi)
Orcun cok mesgul, "siz halledin" dedi. B yolunu sectik.

### Adimlar
1. **Supabase Dashboard → Authentication → Users → "Add User"**
   - Email: taranorcun@gmail.com
   - Password: Pusula2026! (gecici)
   - **"Auto Confirm User?"** ON (email confirmation atla, hemen aktif olsun)
   - "Create user"

2. **UUID al** (yeni kullanicinin auth.users.id'si)

3. **Profile satirini INSERT et** (UPSERT ile guvenli):
```sql
INSERT INTO profiles (
  id, isim, soyisim,
  abonelik_durumu, abonelik_plani, abonelik_bitis
)
VALUES (
  'df345993-37ea-43c0-b86c-44304784b957',
  'Orcun', 'Taran',
  'aktif', 'yillik', '2027-05-01 00:00:00+00'
)
ON CONFLICT (id) DO UPDATE SET
  isim = EXCLUDED.isim, soyisim = EXCLUDED.soyisim,
  abonelik_durumu = EXCLUDED.abonelik_durumu,
  abonelik_plani = EXCLUDED.abonelik_plani,
  abonelik_bitis = EXCLUDED.abonelik_bitis;
```

4. **Kullaniciya WhatsApp/email** ile gecici sifre + "ilk giristen sonra sifrenizi degistirin" notu

5. **RC Grant gerekmez** (use-abonelik.ts hook'u Supabase fallback'i destekliyor — bkz. lib hook kodu)

### Genel Ders 1 — Auto Confirm User Dikkatli Kullan
Email confirmation'i atlamak hizli ama:
- Kullanici email'ini "duzenleyemez" (kayit eden sen oldun)
- Email'in gercekten kullanicinin oldugunu dogrulamamis olursun
- Sadece YONETICININ teyit ettigi durumlarda kullan (Orcun WhatsApp uzerinden teyit etti)

### Genel Ders 2 — Gecici Sifre Iletisi
Gecici sifre WhatsApp'tan paylasilmasi guvenlik acisindan ideal degil ama:
- Pratik gercekligi yansitir (kullanici hizli erisim ister)
- "Ilk giristen sonra degistirin" zorunlu hatirlatma
- Iyi bir alternatif: "Magic link" e-posta gonder (Supabase admin "send invite" ile), kullanici linke basinca giris yapar, sonra sifre belirler

### Genel Ders 3 — App'in 3 Katmanli Premium Kontrol Mantigi
`hooks/use-abonelik.ts` hook'u sirayla:
1. **RC entitlement** (gercek IAP, ana yol)
2. **Supabase fallback** (`abonelik_durumu='aktif'` + `abonelik_bitis` gelecekte ise → premium aktif)

Yani admin-side hesap olusturup Supabase'i set etmek, app'i tamamen kandirmak icin yeterli (RC olmadan da). Test/demo/manuel hesap olusturmak bu sayede kolay. Production icinde duzgun calisiyor.

---

## 29. VERGI MUKIMLIGI vs VERGI MUKELLEFIYETI AYRIMI (1 Mayis 2026)

### Karisikligin Kaynagi
Google Play vergi formu doldururken Ayse "ben vergi mukellefi degilim, mukimlik belgesi alabilir miyim?" diye sordu. Önemli bir ayrim, herkesin karistirdigi kavramlar:

**Vergi Mukellefi:**
- Aktif ticari faaliyet icin vergi numarasi acmis kişi/şirket
- Esnaf, sirket, serbest meslek erbabi
- Düzenli vergi beyannamesi verir
- Pusula Istanbul'dan gelir elde ediyorsa Ayse yavaş yavas mukellef olmaya yaklaşıyor (gelir vergisi)

**Vergi Mukimi:**
- Bir ulkede 6 aydan fazla yasayan **herkes**
- Vergi bakimindan o ulkede "yerleşik" sayilir
- Ev kadini, ogrenci, emekli, calisan — fark etmez
- Cifte vergilendirme anlasmalarinda kullanilan terim

### Pratik Sonuc
Ayse vergi MUKELLEFI degil, vergi MUKIMI. Mukimlik belgesi alabilir. Mukimlik belgesi icin mukellef olmak gerekmez. TC Kimlik No 2006'dan beri vergi numarasi olarak kabul edilir, ekstra kayit gerekmiyor.

Bu ayrım onemli cunku:
- Apple W-8BEN sadece TC Kimlik istedi (kendi beyaniyla yetinir)
- Google Ireland W-9-benzeri **kanitli mukimlik belgesi** istiyor (resmi GIB belgesi)

### Belge Nasil Alinir
- **e-Devlet:** "Mukimlik Belgesi" arama → posta talebi (1-2 hafta)
- **GIB Interaktif Vergi Dairesi (https://ivd.gib.gov.tr/):** e-Devlet ile giris, Belge talebi → bazen ayni gun PDF
- **Vergi dairesine sahsen gitme:** TC Kimlik kart yeter, ayni gun mühürlü belge

### Genel Ders
Yurt dışı ödeme/vergi sürecinde "mukimlik belgesi" sıkça istenir. Bu Türkiye'de yaşayan herkesin alabileceği belge, korkma. Ama posta yöntemi yavaş, fiziksel vergi dairesi gidişi en hızlı.

---

## 30. 3-KATMANLI GUVENLIK AGI VARYANTI: PROFILE FIELDS NULL (1 Mayis 2026)

### Eski Bug (DECISIONS.md #4)
v1.0.6'daki "3 Katmanli Guvenlik Agi" RC entitlement check + restorePurchases() + Supabase fallback update + realtime listener kombinasyonuyla satin alma sonrasi premium aktivasyonunu garanti ediyor.

### Yeni Varyant (1 Mayis 2026 fark edildi)
Sebnem Buyukkaragoz'un satin almasi ardindan profile state:
- abonelik_durumu = 'aktif' ✓
- abonelik_plani = NULL ✗
- abonelik_bitis = NULL ✗

Yani Layer 3 (Supabase fallback update) kismi calismis: durumu aktif yapmis ama plan ve bitis tarihini doldurmamis. Bu, abone-ol.tsx'in update'inde sadece durumu degil, plan + bitis tarihini de set etmesi gerektigini gosteriyor.

Mustafa'da bu sorun yoktu (tum alanlar dolu) — race condition'a benziyor, ya da farkli code yolu izlenmis.

### Manual Fix (Sebnem icin)
```sql
UPDATE profiles 
SET abonelik_plani = 'yillik',
    abonelik_bitis = '2027-05-01 11:45:00+00'
WHERE id = '6035f525-9f7c-4266-b58e-e66ff3f2ae90';
```

### v1.1.0'da Yapilacak: abone-ol.tsx Audit
`app/abone-ol.tsx` icindeki tum profiles UPDATE kodlarini gozden gecir, **abonelik_durumu yanisira plan + bitis tarihini de SET ediyor** mu? Eger sadece durum guncelliyorsa, eksik. Tam guncelleme olmali:
```typescript
await supabase.from('profiles').update({
  abonelik_durumu: 'aktif',
  abonelik_plani: 'yillik', // veya 'aylik' — pakete gore
  abonelik_bitis: hesaplanan_bitis_tarihi,
}).eq('id', user.id);
```

### Genel Ders
**Realtime listener veya hook tek alani guncellerse, sonradan o alanin tam doldurulmasini garanti eden ek bir update gerekir.** Veya tum atomik bir tek update'le yapilmali.

---

## 31. USE-ABONELIK.TS RC LISTENER EKSIK SYNC = SISTEMIK NULL PROFILE (3 Mayis 2026)

### Sebnem Tek Vaka Degildi (2-3 Mayis Kesfi)
DECISIONS.md #30'da Sebnem'in NULL profile durumu "race condition" gibi yorumlanmisti. **Yanlismis.** 2 Mayis sabahi yapilan tarama sonucu 6 kullanicida ayni desen tespit edildi:
- Selim Olcuoglu, Nadriye Oguz, Betul Uzun, Ebru Gokteke (4 gercek kullanici)
- + 2 dev hesap (Ayse'nin test profilleri)

Hepsinde `abonelik_durumu='aktif'`, `abonelik_plani=NULL`, `abonelik_bitis=NULL`. Race condition degil, **sistematik kod hatasi**.

### Kok Sebep — Iki Yer
`hooks/use-abonelik.ts`'de RC entitlement aktif kullanici icin Supabase senkronizasyonunda iki farkli yerde sadece `abonelik_durumu` yaziliyor, plan ve bitis tarihi atlaniyor:

**Yer 1 — `kontrolEt()` icindeki RC kontrolu (eski line 100-105):**
```typescript
if (rcAktif) {
  if (profil.abonelik_durumu !== 'aktif') {
    await supabase.from('profiles').update({
      abonelik_durumu: 'aktif',  // SADECE BU
    }).eq('id', user.id);
  }
}
```

**Yer 2 — `addCustomerInfoUpdateListener` callback (eski line 173-175):**
```typescript
supabase.from('profiles').update({
  abonelik_durumu: 'aktif',  // SADECE BU
}).eq('id', user.id);
```

`abone-ol.tsx` zaten satin alma anında üç alanı dolduruyor (line 137-141), ama o yol sadece kullanıcı app içinde "Pusula İstanbul'u Aktifleştir" tuşuna basıp satın alma akışını tamamladığında çalışıyor. **Restore purchases**, **anonymous→logged user merge**, **başka cihazdan giriş**, ve **app açılışında RC entitlement zaten aktifse hook'un ilk kontrolü** durumlarında satın alma akışı `abone-ol.tsx`'ten geçmiyor — RC listener veya `kontrolEt()`'in RC dalı çalışıyor, ve onlar sadece durumu yazıyordu.

### Fix (v1.0.11 — 3 Mayis 2026)
Üç değişiklik:

1. **Yardimci `planFromProductId()`** — RC entitlement'ın `productIdentifier`'ından plan tipini çıkarır. Apple format `com.pusulaistanbul.app.yillik`, Play format `com.pusulaistanbul.app.yillik:yillik-yeni`. İkisi de `includes('yillik')` veya `includes('aylik')` ile yakalanır.

2. **`rcAbonelikKontrol()` zenginleştirildi** — eskiden `boolean` dönüyordu, artık `{aktif, productId, expirationDate}` döndürüyor.

3. **İki kritik yer güncellendi** — `kontrolEt()` içindeki RC dalı + RC listener callback'i, üç alanı (durumu + plan + bitis) hem yazıyor hem de gerçekten farklı olanı yazıyor (gereksiz network call yok).

```typescript
const yeniPlan = planFromProductId(rcSonuc.productId);
const update: Record<string, any> = {};
if (profil.abonelik_durumu !== 'aktif') update.abonelik_durumu = 'aktif';
if (yeniPlan && profil.abonelik_plani !== yeniPlan) update.abonelik_plani = yeniPlan;
if (rcSonuc.expirationDate && profil.abonelik_bitis !== rcSonuc.expirationDate) {
  update.abonelik_bitis = rcSonuc.expirationDate;
}
if (Object.keys(update).length > 0) {
  await supabase.from('profiles').update(update).eq('id', user.id);
}
```

Kullanıcı bir kez giriş yaptığında hook çalışır, RC'den entitlement'ı okur, eksik alanları otomatik doldurur. Yani v1.0.11 kullanıcılarda yayıldıkça mevcut NULL kayıtlar **kendi kendine** düzelir.

### Manuel Doldurma (3 Mayis 2026)
v1.0.11 yayına çıkmadan önce 4 gerçek kullanıcının profili RC verisinden manuel SQL ile dolduruldu (atomic transaction):
| Kullanıcı | Plan | Bitis |
|-----------|------|-------|
| Ebru Gokteke | yillik | 2027-05-01 11:08 UTC |
| Betul Uzun | yillik | 2027-05-01 17:17 UTC |
| Nadriye Oguz | aylik | 2026-06-01 12:45 UTC |
| Selim Olcuoglu | aylik | 2026-06-02 08:07 UTC |

İki dev hesap (proteste_angel + ayse.tokkus@gmail) NULL bırakıldı — Ayşe'nin test profilleri, biri admin rolünde (line 86-91 her zaman premium döner), diğeri için Ayşe karar verecek.

### Önemli Yan Bulgu: Hepsi iOS Apple, Sıfır Yeni Mağdur
RC üzerinde 4 kullanıcının da satın alma kayıtları incelendi. Hepsinin Customer history'sinde "Started a subscription of [Apple icon] [Yıllık/Aylık] Plan" var. **Hiçbiri Play Store'dan değil.** Yani 1 Mayıs'taki Play Store config bug'ından yeni mağdur YOK — sadece Mustafa + Şebnem etkilendi.

Bunun mantığı: **Apple'ın subscription ürün modeli farklı.** App Store Connect'te subscription duration ürün özelliği, "base plan" ayrımı yok. Play Console'daki gibi base plan'in fatura döneminin yanlış konfigüre edilmesi Apple tarafında **mümkün değil**.

### Genel Ders 1 — "Race Condition" Yanlış Tanı Olabilir
İlk vakada (Sebnem) "race condition" dendi, ama tek vaka tek hipotezi haklılaştırmaz. **Aynı deseni gösteren ikinci vaka çıktığında, tarama yap.** N=2 sistematik soruna işaret eder, N=1 race condition olabilir. Sebnem + Ebru + Betül + Nadriye + Selim aynı desende görüldüğünde "kod bug'ı" hipotezi kanıtlandı.

### Genel Ders 2 — RC Entitlement Verisi Tek Doğruluk Kaynağı
RC `entitlement.productIdentifier` ve `entitlement.expirationDate` her zaman güncel ve güvenilir — App Store / Play Store webhook'larıyla otomatik senkronize. Supabase profile alanları RC'nin "yansıması" olmalı, manuel olarak ayrı tutulmamalı. Yeni satın alma yolları eklendiğinde (gelecek `abone-ol.tsx` revizyonu, restore purchases UX iyileştirmesi, vs.) hep **RC'den oku, Supabase'e yaz** disiplini tutulmalı.

### Genel Ders 3 — Atomic Update veya "Aynı Veri Kalmasın" Disiplini
Birden fazla yerden veri güncelleyen kod tehlikelidir. İki seçenek:
- **(A) Atomic update**: tüm alanları beraber yaz, asla kısmi yazım yapma.
- **(B) Idempotent reconciler**: her okuyuşta "var olan veri RC'yle uyumlu mu?" kontrolü yap, eksik/farklıyı tamamla. v1.0.11 fix bu yaklaşımı kullanıyor.

**(B) tercih edildi** çünkü kod yolu birden fazla (`abone-ol.tsx` purchase, hook initial check, RC listener, restore purchases) — atomic disiplini zor, idempotent reconciler kendi kendini düzeltir.

### Etkisini Sınırlandıran Faktör
NULL plan/bitis durumu **app içinde görünmez** — `useAbonelik` hook'unun `aktifAbonelik` state'i RC'ye bakıyor, Supabase'e değil. Yani kullanıcı premium'unu kullanmaya devam etti. Ama eğer RC erişilemez olursa (offline + yeni cihazda restore'a kadar olan boşluk, RC outage, vb.) Supabase fallback yolu (line 142-150) `abonelik_bitis` NULL olduğunda premium döndürmez → kullanıcı paywall'a düşer. Yani fix güvenlik ağının kalan deliğini kapatıyor.
