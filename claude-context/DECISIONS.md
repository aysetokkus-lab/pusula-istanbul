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

---

## 32. KAPALI_GUN KONVENSIYONU: NULL=YOK, 0..6=JS Date.getDay() (4 Mayis 2026)

### Sorun
DB'de `mekan_saatleri.kapali_gun INT` alani vardi ama **iki farkli yorumlama** uretmis vardi:
- **Excel veri girisi**: Ayse, Excel'de "0 = her gun acik" mantigiyla 15 mekanin Kapali Gun hucresine `0` yazmisti.
- **Frontend** (`muzeler.tsx`, `ara.tsx`): `GUNLER = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']` dizisi tanimliyor (JS `Date.getDay()` ile uyumlu — Pazar=0). Sonra: `m.kapali_gun !== null && m.kapali_gun === gun` kontrolu ile `GUNLER[0] = 'Paz'` gosteriyor.

Sonuc: 15 mekanda (Yerebatan, TIEM, Galata Kulesi, Kiz Kulesi, Camlica Kulesi, Serefiye, Ayasofya Muzesi, Arkeoloji, Islam Bilim, Adam Mickiewicz, Mehmet Akif, Santralistanbul, Yildiz Cini, Havalimani Muzesi, Akvaryum) app'te yanlis "Pazar kapali" yazisi cikiyordu — gercekte hepsi her gun aciktilar.

### Karar — Konvensiyon Netlestirildi
| Deger | Anlam |
|-------|-------|
| `NULL` | Kapali gun yok (her gun acik) |
| `0` | Pazar kapali |
| `1` | Pazartesi kapali |
| `2` | Sali kapali |
| `3` | Carsamba kapali |
| `4` | Persembe kapali |
| `5` | Cuma kapali |
| `6` | Cumartesi kapali |

Bu konvensiyon **JS `Date.getDay()` ile uyumlu** — frontend'de hicbir +1/-1 donusumu gerekmiyor.

### Uygulama
1. **DB**: 15 kayit icin `kapali_gun = 0` -> `NULL` (atomik PATCH).
2. **Excel** (`mekan-saatleri-veri-giris.xlsx`): Ayni 15 satirda Kapali Gun hucresi bosaltildi (yoksa bir dahaki sync DB'yi tekrar bozar).
3. **Sync script** (`scripts/excel-full-sync-sql.py`, `scripts/excel-diff-sql.py`): Konvensiyon yorumu eklendi. Excel'de "0" yazarsa artik literal "Pazar kapali" anlamina gelir, NULL'a otomatik donusturulmez. (Erken denenen "0 -> NULL toleransli kural" kaldirildi cunku konvensiyon ile celisiyordu.)
4. **Kaynak SQL** (`mekan-saatleri-full-sync.sql`): `kapali_gun = 0` satirlari `kapali_gun = NULL` olarak guncellendi.

### Genel Ders 1 — Konvensiyon Once, Veri Sonra
Excel ile DB arasinda veri tasiniyorsa, kolon basina semantik konvensiyonu **once netlestirilmeli**, sonra veri girilmeli. Aksi halde bir uctaki yorum (Excel'de "0 = yok") digerinde (DB/frontend'de "0 = Pazar") sessizce ters dusmus calisir, bug aylar sonra gorunur olur.

### Genel Ders 2 — Excel Yardim Sayfasi Sadece Format Degil, Anlam da Yazsin
`mekan-saatleri-veri-giris.xlsx`'in "Yardim" sayfasi su an `Bosluk = NULL = "veri yok"` diyor — formati anlatiyor ama her kolonun degerlerinin **ne anlama geldigini** soylemiyor. Yeni kolonlar eklenirken her sayisal kodun anlami da Yardim'e yazilmali (orn. "Kapali Gun: 0=Paz, 1=Pzt, ..., 6=Cmt; bos = her gun acik").

### Genel Ders 3 — `!== null` Yeterli Degil, `!== null && deger === beklenen` Lazim
Frontend kodunda `if (m.kapali_gun !== null) ...` yazinca 0 degeri null kontrolunu gecer. JS truthy/falsy ile yanlis is yapma riski yok ama "yok" anlami `null` ile temsil ediliyorsa, ozel sentinel olmayan deger (0) acik olarak kontrol edilmeli. Kod su anki formda dogru calisiyor (`kapali_gun === gun` esitlik kontrolu var, gun=0 ile eslesirse Pazar gosteriyor) — sadece veri tarafinda 0=NULL karisikligi vardi.

---

## 33. PROFILES.EMAIL KOLONU + AUTH.USERS SYNC TRIGGER (4 Mayis 2026)

### Sorun
Admin panelden moderator atama: `app/admin.tsx` line 87 `supabase.from('profiles').select(...).eq('email', email)` calistiriyordu. Hata: `column profiles.email does not exist`. Cunku `profiles` tablosunda email kolonu yoktu — Supabase'in standardi email'i `auth.users` tablosunda tutmaktir.

### Karar — Profiles'a Email Kolonu Ekle
Iki secenek vardi:
- **(A) Frontend'i degistir**: `auth.users`'a RPC fonksiyonu uzerinden eris. Admin tarafli erisim, RLS karisiklik, frontend birden fazla yerde degisecek.
- **(B) Profiles'a email kolonu ekle**, auth.users'tan sync et. Frontend kodu degismez.

**(B) tercih edildi**. Sebepler:
- Frontend kodu zaten `profiles.email` bekliyordu — minimal degisiklik.
- Email arama indeksi (LOWER(email)) uzerine kurulabilir, hizli lookup.
- Postgres trigger'lari ile auth.users <-> profiles email senkronu tek seferlik kurulup arka planda calisir, application kodu hic dokunmaz.

### Migration
```sql
-- 1. Kolonu ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Mevcut 96 profili auth.users'tan doldur
UPDATE public.profiles p SET email = u.email
FROM auth.users u WHERE p.id = u.id;

-- 3. Lookup index (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(LOWER(email));

-- 4. auth.users -> profiles senkronu (yeni kayit, email degisikligi)
CREATE FUNCTION public.sync_email_to_profiles() RETURNS TRIGGER ...
CREATE TRIGGER auth_users_sync_email AFTER INSERT OR UPDATE OF email ON auth.users ...

-- 5. profiles INSERT'te email bos ise auth.users'tan auto-doldur (cift guvenlik)
CREATE FUNCTION public.fill_profile_email_from_auth() RETURNS TRIGGER ...
CREATE TRIGGER profiles_fill_email BEFORE INSERT ON public.profiles ...
```

Detayli migration SQL: `add_profiles_email_with_auth_sync` (Supabase migration log).

### Neden BEFORE INSERT Trigger ile Cift Guvenlik?
Pusula'da kayit akisi:
1. `supabase.auth.signUp()` → auth.users INSERT (email burada)
2. Email confirmation sonrasi → app `profiles` INSERT (email girilmemis olabilir)

Eger profiles INSERT'i email'siz gelirse, BEFORE INSERT trigger auth.users'tan o id icin email'i okuyup yeni satira yaziyor. Boylece her durumda email dolu kalir.

### Genel Ders — "Eksik Kolon" Hatasi Genelde Mimari Niyet Sorusudur
"profiles.email yok" sorusu su soruyu acar: **Email nereye ait?** Auth concern (auth.users), profile concern (profiles), ya da iki yere mirror'lansin mi? Pusula'da "kullanici search'u yapilmasi gerekiyor" gereksinimi profiles'a kopyayi gerekli kildi. Eger email tek yerde tutulmali deniliyorsa — RPC fonksiyonu yazilirdi.

Bu karar **Pusula'ya ozgu**: profiles'ta isim/soyisim/telefon var, email de mantiken oraya ait. Bir rehber uygulamasi olmasaydi (ornek: tek IDP / SSO odakli sistem) auth.users'da kalmasi mantikli olabilirdi.

---

## 34. PROFILES UPDATE RLS — ADMIN BASKASININ PROFILINI DEGISTIREMIYORDU (4 Mayis 2026)

### Sorun
DECISIONS.md #33 (profiles.email) cozulduktun sonra admin moderator atama akisi yine bug verdi. Bu sefer DB hatasi yok, frontend "Basarili: Ela Karaman moderator olarak atandi" diyordu — ama DB'de Ela'nin `rol` alani hala `user` olarak kaliyordu.

Tani: `profiles` tablosunda **iki RLS policy** vardi:
- `Kendi profilini düzenleyebilir` (FOR ALL) — `USING (auth.uid() = id)`
- `Herkes okuyabilir` (FOR SELECT) — `USING (true)`

UPDATE icin sadece "kendi id'sine" izin veriyordu. Admin (Ayse), Ela'nin (baska bir id) satirini UPDATE etmeye calistiginda RLS satiri **gizledi**, UPDATE 0 satir etkiledi. PostgREST `error` donmedi cunku teknik olarak query basariliydi (sadece etki yoktu). Frontend `if (updateErr) throw` kontrolu hata yakalamadi → kullaniciya yalan basari mesaji.

Bu, DECISIONS.md "RLS Sessiz Reddedebilir" patterninin yeni bir varyanti — daha onceki vakalar canli_durum/sohbet uzerindeydi. Bu sefer profiles UPDATE'de.

### Karar — `is_admin()` Helper + Yeni RLS Policy
```sql
-- 1. is_admin() — RLS recursion'i bypass eden SECURITY DEFINER fonksiyonu
CREATE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin');
$$;

-- 2. Admin baskasini UPDATE edebilir
CREATE POLICY "Admin tum profilleri guncelleyebilir" ON public.profiles
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

Mevcut "Kendi profilini düzenleyebilir" policy'si **korundu**. Postgres RLS'te birden fazla PERMISSIVE policy `OR` mantigiyla birlesir — yani UPDATE icin: (kendi id'sine erisim) **VEYA** (admin yetkili). Moderator KENDI profilini hala duzenleyebilir, baskasini edemez.

### Neden `is_admin_or_mod()` Kullanmadik?
Mevcut `is_admin_or_mod()` fonksiyonu zaten vardi (DECISIONS.md #14). Onu kullansaydik **moderator de baska kullanicinin rol'unu degistirebilirdi** — moderator'un yetkisini admin'e tasimak demek olurdu. Bu Pusula'nin yetki modelini bozardi (PROJECT.md "Moderator Yetkileri": sadece etkinlik + Sultanahmet saat + saha bildirimleri). Yeni bir `is_admin()` fonksiyonu yazip sadece admin'e tam profil duzenleme yetkisi verildi.

### Frontend Defansif Kod (v1.0.12)
RLS sessiz red'i ileride baska policy'lerde tekrar olabilir. Bu yuzden `app/admin.tsx`'te iki yer guncellendi:

```typescript
// moderatorAta + moderatorKaldir
const { data: guncel, error } = await supabase
  .from('profiles')
  .update({ rol: '...' })
  .eq('id', profil.id)
  .select()
  .single();
if (error) throw error;
if (!guncel) throw new Error('Yetki sorunu — kayıt güncellenmedi.');
```

`.select().single()` UPDATE'in sonucunu donduruyor. RLS satiri gizlerse `data` null donuyor, "Yetki sorunu" alert'ine duser. Bu yaklasim DECISIONS.md "RLS Sessiz Reddedebilir" pattern'i ile uyumlu — `durumKaldir` (saha bildirimleri) icin de zaten kullaniliyordu.

### Genel Ders 1 — UPDATE Yetki Modeli RLS'te De Kuruldukca Karmasiklasir
"Kullanici kendi satirini guncelleyebilir + admin tum satirlari" iki ayri policy yazilarak temiz kuruldu. Tek bir policy icine `OR` ile karistirmak da mumkundu (`USING (auth.uid() = id OR public.is_admin())`) ama:
- Iki ayri policy okunurken niyet daha net ("kendi profili icin" vs "admin override").
- Yeni roller eklendiginde (orn. moderator'un sadece kendi profil + kendi atadigi user'lar) ayri policy'ler olarak buyutmek temiz.

### Genel Ders 2 — Frontend "Basarili" Mesaji DB'den Onaylanmali
PostgREST UPDATE 0 satir etkilerse hata atmaz. "Basarili" mesaji icin `.select()` ile etkilenen satiri geri al, null degilse onay et. Bu pattern artik Pusula'da uc fonksiyonda kullaniliyor:
- `durumKaldir` (saha bildirimleri silme — DECISIONS.md "RLS Sessiz Reddedebilir")
- `moderatorAta` (4 Mayis 2026, v1.0.12)
- `moderatorKaldir` (4 Mayis 2026, v1.0.12)

Yeni admin operasyonlari yazilirken hep bu defansif sablon kullanilmali.

---

## 35. KAYIT ZORUNLULUGU + FREEMIUM SIKILASTIRMA — IRO MAILI ONCESI YAPISAL DUZELTME (5 Mayis 2026)

### Tetikleyen
Ayse'nin gozlemi: "Insta'da uygulamayi paylasan ama kayit bile olmayan bir suru rehber var. Catir catir kullaniyorlar, bedava sayilarak gidiyorlar, bir de promosyon maili bile atamam." Aktif kayitli sayisiyla App Store/Play Store indirme sayisi arasindaki devasa makas. Ne metrik var, ne pazarlama listesi, ne conversion firsati.

Ayni zamanda IRO (Istanbul Rehberler Odasi) tum rehberlere tanitim maili gondermeye hazirlaniyor — bu mail gitmeden kayitsiz akis kapali olmaliydi.

### Kok Sebep
Pusula "freemium" zannediliyordu ama aslinda "free + opsiyonel premium" islettirildi. Gercek freemium'da kayit ürünün giris kapisidir, premium iceride bir kapidir. Pusula'da kayit yan kapiydi, hatta bahceden de giriliyordu (`_layout.tsx`'te `initialRouteName="(tabs)"` ve oturum kontrolusuz tab erisimi).

### Iki Buyuk Degisiklik Bir Surume

#### Degisiklik 1: Kayit Zorunlulugu (auth gate)
`app/_layout.tsx` routing useEffect'ine kural eklendi: `if (!oturum && !girisEkraninda) router.replace('/giris')`. `Stack initialRouteName` oturuma bagli. Korunan ekranlar: giris, hos-geldin, gizlilik-politikasi, kullanim-kosullari, abone-ol, sifre-sifirla.

#### Degisiklik 2: Freemium Kapsam Sikilastirma (vitrin pattern)
- Muze · Saray · Cami: Saraylar bedava, diger 3 sekme (Muzeler, Ozel Muzeler, Camiler) premium duvar
- Bogaz Turlari: Turyol kart bedava, "Tum sefer saatleri" dugmesi premium duvar; Dentur ve Sehir Hatlari tamamen premium duvar
- Ana sayfa Sultanahmet bandi: Bant gorunur (anlik durum vitrin), banta tiklayinca acilan saatler ekrani premium duvar
- Acil sekmesi: Iki sozlesme (Müşteri-Rehber + Acente-Rehber) indirme premium duvar

### Vitrin Pattern Karari
Premium duvar tasarimi icin uc secenek tartisildi:
- (A) Sayfayi tamamen kapat — yeni kullanici hicbir sey gormez, agresif, "ne ise yariyor" diyemeyecek
- (B) Liste bedava + detay premium — vitrin gorunur, asil bilgi premium ("vitrin bedava, tezgahin alti ucretli")
- (C) Tum bilgi bedava + "abone ol" karti yan tarafta — yumusak, paywall etkisiz

(B) secildi ama Ayse'nin son karari **karma vitrin** oldu: bazi yerlerde (Saraylar, Turyol) tam vitrin, bazi yerlerde (Muzeler/Cami sekmeleri, Dentur/Sehir Hatlari) komple kapali — her sekmenin ticari degerine gore farklilastirilmis.

### Disiplin Istisnasi: Iki Buyuk Degisiklik Bir Surume
Normalde "iki buyuk degisikligi ayni surume koyma" kurali var (olcum temizligi icin) — once kayit zorunlulugu, sonra premium gating gibi. AMA IRO mailinin zamanlamasi onceligi degistirdi. Mail giderse rehberler v1.0.12 ile gelir, kayitsiz kullanir, geriye donus yok. Bu sebeple iki degisiklik birden v1.0.13'e alindi.

**Genel ders:** Disiplin kurali her zaman uyulmaz, ama saparken sebebi belgele. Bu kararin geri donusumlu olmadigi (mail gittikten sonra kullanici akisi sabitlenir) iki buyuk degisikligi birlikte gerektirdi.

### Mevcut Kullanici Etki Analizi (4 grup)
- **Premium aboneler (~8-10 kisi)**: Sifir negatif etki, oturum acik, premium tum sayfa.
- **Kayitli ucretsiz**: Premium duvarlari fark ederler, tepki olabilir, planin parcasi.
- **Misafir/kayitsiz (en buyuk grup)**: Splash sonrasi giris ekrani gorur. Ya kayit olur (zafer), ya kapatip gider (temizlik).
- **Otomatik guncelleme kapali (~%15)**: Eski v1.0.12 ile takilirlar; v1.1.0'da "in-app guncelleme uyarisi" planli.

### Apple/Google Risk Degerlendirmesi
- **Apple Guideline 5.1.1(iv):** "Anlamli hizmet kayitli hesaba bagliysa kayit zorunlulugu kabul edilir." Pusula bu maddenin altin ornegi: peer-to-peer messaging, personalized push, subscription tied to account. Reject riski dusuk.
- **Apple Sign-In zorunlulugu (4.8):** Sosyal login eklendiginde tetiklenir. Pusula hala email/sifre, sosyal yok, zorunluluk yok.
- **Hesap silme (5.1.1(v)):** Zaten var, kayit zorunlulugu eklerken bu olmasaydi reject kaciniilmazdi.
- **Apple Review Notes:** Gerekce metni hazirlandi (CHANGELOG.md v1.0.13 entry'sinde), ASC Notes'a yapistirilacak.

### Genel Ders 1 — Conversion Mimari Hatasi
"Free but registered" mantikli, "free without registration" olamaz. Kayit olmamis kullanici uretmedigi metric, olusturmadigi listenin paydaci, conversion icin aday degil — sadece bedava yardakci. Mimariyi kursalar zaman boyle bir kapi koymak ucuza kapatilirdi; sonradan koymak agriya mal oluyor (mevcut ucretsiz kullanicilarin tepkisi vb.).

### Genel Ders 2 — Vitrin Pattern Klasik Freemium Tutamagidir
"Liste bedava, detay premium" yaklasimi consumer freemium'da denenmis bir yaklasim (TripAdvisor, Yelp benzeri). Profesyonel B2B benzeri uygulamalarda (Pusula gibi) daha agresif olarak "sekme bazli kapatma" da islevsel — niş kullanici icin kategori hangileri bedava bilirse, premium'a karar vermek kolaylasir.

### Genel Ders 3 — Disiplin Istisnasinin Belgelenmesi
"Tek surume tek buyuk degisiklik" kuralini bozarken sebebi yazili olarak belge altina alindi. Boylece 3 ay sonra "neden 2 sey ayni anda yaptik" diye sorulduginda cevap hazir. Bu disiplin kuralinin kendisi degil, kuraldan sapma seffafligi onemli.

### Bugday vs Saman: IRO Maili Stratejisi
v1.0.13 yayina cikana kadar IRO maili **gonderilmemeli**. Cunku:
- Mail bugun giderse, gelen rehberler v1.0.12'yi indirir, kayitsiz kullanir
- v1.0.12 daha 24-48 saat yayinda kalacak (v1.0.13 review'a gonderilecek)
- Ideal sira: v1.0.13 her iki platformda Production'da yayinda → telefondan dogrula ("1.0.13" yazisi gorunmeli) → IRO mailini ATTIRT

Acele etme; 24-48 saat fark, "kayit listesi olusmaya basliyor" ile "ne sayim ne pazarlama" arasindaki fark.

---

## 36. X API SENKRONU CLIENT-SIDE'DAN EDGE FUNCTION'A TASINDI (6 Mayis 2026)

### Problem
`hooks/use-x-ulasim.ts` her 15 dakikada bir 4 X (Twitter) hesabini cekip `ulasim_uyarilari` tablosuna yaziyordu — AMA **client-side**, yani uygulamanin acik olmasini gerektiriyordu. `app/_layout.tsx` line 184: `setInterval(senkronize, X_SENKRON_ARALIK_DK * 60 * 1000)`. Uygulama kapanirsa interval temizlenir, kimse senkronize etmez. 

Sonuc: 6 May 2026 saat ~15:00'te Marmaray'de Fatih istasyonunda intihar vakasi → Marmaraytcdd "Tek hat" tweet'i ingest edildi (uyari aktif). Saat 16:18'de Marmaray "cift hattan isletilmeye baslanmis olup" duzelme tweet'i atti — ama 33+ dakika sonra Ayse uygulamayi acip kontrol ettiginde uyari **hala aktif gorunuyordu**. Cunku kimse o 33 dakikada uygulamayi senkronize etmek icin acmamisti, dolayisiyla duzelme tweet'i hic ingest edilmedi, mevcut uyari `cozuldu=false` kaldi. Geriye donuk bakildiginda: 13 Nisan, 9 Nisan, 7 Nisan, 31 Mart Marmaray "uzucu olay" arizalarinin **hicbiri** otomatik kapatilmamis — hepsi `cozuldu=false aktif=false` (sadece 7-gun-eski silme cron'u devreye girmis).

Daha kotusu: `lib/config.ts` line 10: `EXPO_PUBLIC_X_BEARER_TOKEN`. **EXPO_PUBLIC_** prefix'i Expo'da bu env'i client bundle'ina gomuyor (Expo docs: https://docs.expo.dev/guides/environment-variables/). APK'yi decompile eden herkes Twitter Bearer Token'ina erisebilir.

Ayrica X API quota: 4 hesap × ~25 aktif kullanici × her 15 dk = saatte ~400 cagri. Pay-per-use planinda son 30 gunde ~$20 yakilmis. Kullanici sayisi arttikca quota katlanarak buyur, surdurulemez.

### Cozum
Client-side hook'tan sunucuya tasidik:

1. **Edge Function: `ulasim-senkron`** (Deno) — `supabase/functions/ulasim-senkron/index.ts`. `use-x-ulasim.ts`'in birebir port'u; tek farkliliklar: (a) service role key ile RLS bypass, (b) `verify_jwt=false` + custom `x-pusula-cron-secret` header check (cron tetikleme icin).
2. **pg_cron schedule:** `*/15 * * * *` cron, Vault'tan `pusula_cron_secret`'i okuyup HTTP POST atar Edge Function'a.
3. **pg_net + supabase_vault extension'lari acildi.**
4. **Secret'lar Edge Function tarafinda:** `X_BEARER_TOKEN` (yeni regenerate edilmis Twitter Bearer Token) + `CRON_SECRET` (rastgele 32-byte hex).
5. **Vault'ta:** `pusula_cron_secret` — cron'un Edge Function'a yollayacagi header degeri.
6. **Client-side hook hala aktif** ama yeni tweet `tweet_id` UNIQUE constraint nedeniyle insert edemez; sessiz no-op olur. v1.1.0 build'inde tamamen silinecek.

### Mimari Karsilastirma

```
Once: [25 cihaz] → 15 dk × 4 hesap = 100 cagri/15dk = 400/saat
                ↓ (her cihaz ayri)
              [X API]
                ↓
              [ulasim_uyarilari]   (client-driven, kullanici acik olmazsa yok)

Sonra: [pg_cron 15dk] → [Edge Function (1 instance)] → 4 cagri/15dk = 16/saat
                                ↓
                              [X API]
                                ↓
                              [ulasim_uyarilari]   (her zaman, kullanici-bagimsiz)
```

%96 quota tasarrufu (400 → 16 cagri/saat). Maliyet: ~$20/ay → tahminen ~$3-5/ay sabit, kullanici sayisindan bagimsiz.

### Deploy Sirasi (6 May 2026)
1. Geriye donuk DB temizligi: 5 Marmaray + tum 24-saatten-eski aktif=false ariza/gecikme/kesinti kayitlarini cozuldu=true yapan UPDATE
2. Edge Function dosyasini yaz: `supabase/functions/ulasim-senkron/index.ts` (288 satir)
3. Supabase'e deploy: `mcp__supabase__deploy_edge_function` (v2, verify_jwt=false)
4. Migration: `pg_cron` + `pg_net` extension + Vault secret + cron schedule (`*/15 * * * *`)
5. Manuel test: `net.http_post` cagrisi → 401 (CRON_SECRET henuz Edge Function'a eklenmemisti — beklenen davranis)
6. Ayse Supabase Dashboard'tan Edge Function Secrets ekledi: `X_BEARER_TOKEN` (yeni regenerate edilmis Twitter token) + `CRON_SECRET`
7. Manuel test 2: 200 + `{"ok":true,"yeni":1,"guncellenen":0,...}` — duzelme tweet'i basarili sekilde ingest edildi, `aktif=false cozuldu=true` olarak kayitlandi

### Dersler

**Client-side cron isletim hatasi.** 15 dakika icinde uygulamayi acan kullanici yoksa, "her 15 dakikada bir" diye tasarladigin sey hic calismaz. Production'da gercek istatistik: 25 aktif kullanicidan en az %50'si gun icinde uygulamayi acmiyor (rehberlik turunda kisa surelerde aciliyor). Periyodik gorevler **MUTLAKA** sunucu tarafinda olmali — pg_cron, scheduled task, GitHub Actions, ne olursa.

**EXPO_PUBLIC_ ile sensitive data ASLA.** EXPO_PUBLIC_ prefix'i Expo'nun "bunu client bundle'a gom" sinyalidir. API key, bearer token, secret hicbir zaman bu prefix'le olmamali. Bu projede `EXPO_PUBLIC_X_BEARER_TOKEN` zaten v1.0.0'dan beri yayindaki bundle'larda gomulu — bunu duzeltmenin tek yolu yeni token (eski'yi revoke ederek otomatik gecersiz kil) + sunucuda sakla.

**verify_jwt=false + custom header secret = pragmatik cozum.** Vault'a service_role_key koymak Ayse'nin Dashboard'dan kopyalamasini gerektirirdi (ben service role key'i bilmiyorum). Onun yerine: Edge Function `verify_jwt=false` (public endpoint), icinde `req.headers.get('x-pusula-cron-secret')` kontrolu, secret'i pg_cron Vault'tan cekiyor. Sonuc: 1 manuel adim (Edge Function secrets'a CRON_SECRET ekle) ile uctan uca calisiyor.

**Geriye donuk veri temizligi gerekiyordu.** Sadece bot'u duzeltmek yetmiyor — onceki bug'in birakttigi 5 acik Marmaray ariza kaydi vardi. Bu kayitlar `aktif=false`'tu (7-gun-eski cron'u kapatmisti) ama `cozuldu=false`'tu, yani veri tutarsizdi. Mimari fix yaparken birikmis veri durumunu da netlestir.

**`cozuldu` ve `aktif` ayni anda set edilmeli.** Yeni bot mantigi: cozuldu tweet'i geldiginde insert ederken aktif=false set ediyor (eskiden aktif=true geliyordu, sonra "48 saat eski cozulmus" cron'u false yapiyordu). Bu, "su an aktif aramaktayim" sorgularina temizlik getirir.

### Ilgili Dosyalar
- `supabase/functions/ulasim-senkron/index.ts` (yeni, 288 satir)
- `hooks/use-x-ulasim.ts` (eski, v1.1.0'da silinecek — su an no-op yedek)
- `app/_layout.tsx` line 184 (`useXUlasim` cagrisi, v1.1.0'da kaldirilacak)
- `lib/config.ts` line 10-13 (`X_BEARER_TOKEN`, `X_SENKRON_ARALIK_DK` — v1.1.0'da kaldirilacak)
- Supabase: cron job `ulasim-senkron-15dk`, vault secret `pusula_cron_secret`, edge function secrets `X_BEARER_TOKEN` + `CRON_SECRET`

---

---

## 37. REACT-NATIVE-SCREENS 4.24 ATLANDI - BOTTOMTABS EKSIK (27 Mayis 2026)

**Karar:** v1.0.13'teki ScreenStack drawing crash bug'ini fix etmek icin react-native-screens 4.16.0'dan upgrade yapilirken **4.24.0 atlandi, 4.23.0 secildi**. Ayrica 4.25.0+ surumler RN 0.82 peer dep istedigi icin (bizde RN 0.81.5) bunlar da kapali.

### Baglam

**Ana bug:** v1.0.13 production'da `java.lang.IndexOutOfBoundsException: getChildDrawingOrder() returned invalid index 2 (child count is 2)` — stack trace tepesinde `com.swmansion.rnscreens.ScreenStack.performDraw`. Play Console Vitals'ta 16 onaylanmis kullanici etkilendi, 12 farkli cihaz markasi (Samsung baskin ama dagilim cok genis = OEM uyumsuzluk degil, kod bug'i). Bilinen `react-native-screens` 4.x serisi bug'i, software-mansion/react-native-screens GitHub'da defalarca raporlanmis.

**Cozum arayisi:**
1. **Expo bundledNativeModules.json onerisi: 4.16.0** (= mevcut surum) — yani Expo SDK 54 ile dondurulmus olan. Crash fix'i icermez.
2. **NPM latest: 4.25.2** — RN 0.82+ peer dep, bizde 0.81.5, uyumsuz.
3. **Aradaki sabit: 4.16-4.24 arasi tum surumler RN * (wild) peer dep**, yani teorik olarak uyumlu.

**4.24.0 deneme:** Mac'te npm install + EAS build. iOS Xcode patlatti:
```
use of undeclared identifier 'RNSBottomTabsScreenComponentView'
unknown type name 'RNSBottomTabsScreenComponentView'; did you mean 'RNSTabsScreenComponentView'?
```

**Tani:** npm pack inceleme — 4.24.0 paketinde **BottomTabs iOS implementasyonu 0 dosya**, **Android implementasyonu 0 dosya**. JS spec'i de 0. Ama codegen baska bir yerden hala `RNSBottomTabsScreenComponentView` ariyor. Yani 4.24.0 **yarim kalmis bir surum** — BottomTabs henuz hazir degildi, 4.25.0'da yeniden eklendi (RN 0.82'nin gerektigi). 4.24'te component'ler silinmis, codegen referanslari kalmis = build patlar.

**4.23.0 secimi:** Bir onceki minor, BottomTabs iOS 28 dosya + Android 4 dosya (saglam). ScreenStack defansif kod cogu fix burada degil ama 4.16'dan 7 minor sonra, kucuk iyilestirmeler birikmis. **Risk:** Crash devam edebilir. **Plan B:** Devam ederse `patch-package` ile 4.24'teki ScreenStack defansif kodunu 4.23'e transplant et.

### Dersler

**Expo bundledNativeModules.json donmus.** SDK release zamani snapshot alinir, sonradan guncellenmez. Native paketler patch surumlerinde kritik bug fix yapsa bile Expo bunu yansitmaz — sen manuel kontrol etmek zorundasin.

**NPM `latest` tag yalan soyleyebilir.** "Latest" o paketin en yeni surumudur ama **senin RN sureum ile uyumlu en yeni surum DEGIL.** Peer dep'i kontrol et — `npm view PACKAGE@VERSION peerDependencies`.

**Native impl dosya sayisini kontrol et.** Paket boyutu, surum numarasi falan yetersiz isaretler. `npm pack && tar -xzf && find ./package/ios -iname "*Component*"` — sayisi 0 ise paket yarim. Bunu CI'da otomatize et.

**Major degisiklikler genelde minor surumlerde sizar.** 4.24 → 4.25 deneysel reset gibi gozukuyor. Yarim kalmis surumler diger paketlerle uyumsuz olur. **Patch atlamak: bir geriye dus, en stabil son surumu sec.**

**iOS Xcode vs Android Kotlin codegen.** iOS "tanimsiz sembol" hatasi acik verir, derleme patlar. Android Kotlin codegen daha esnek, eksik siniflari silent fallback yapar — derleme gecer ama runtime davranisi belirsiz. **Versiyon tutarliligi:** her zaman ayni react-native-screens surumu ile her iki platform birden build al.

### Ilgili Dosyalar / Komutlar

- `package.json` line 46: `"react-native-screens": "4.23.0"` (exact pin, ~ yok — Expo install'in 4.16 onerisini override eder)
- Mac'te yenileme: `npm install react-native-screens@4.23.0 --save-exact && npx expo install --check`
- Build dogrulamasi: `eas build --platform all --profile production` (her iki platform birden, versiyon tutarliligi)
- Plan B (gerekirse): `npm install patch-package --save-dev`, sonra `node_modules/react-native-screens/android/src/main/java/.../ScreenStack.kt` icine 4.24'teki `currentVisibleBottom` field + `updateA11yForVisibleScreens` + `shouldDisableFocusabilityBeneathTopScreen` defansif kodunu transplant, `npx patch-package react-native-screens` ile patch dosyasi olustur, git'e commit.

---

## 38. CSS TEXT-TRANSFORM TURKCE KARAKTER BOZAR (27 Mayis 2026)

**Karar:** HTML email template'lerinde ve UI'da **`text-transform: uppercase` KULLANMAYACAGIZ**. Bunun yerine metni dogrudan buyuk harf yaz.

### Baglam

Manuel onay bilgilendirme maili gonderildiginde header alt yazisi yanlis render oldu: `text-transform: uppercase` CSS'i `i` → `I` (ASCII) cevirir, ama Turkce'de `i` → `İ` ve `İ` → `İ` olmali. Sonuc:

| Niyet | CSS uppercase'lenen sonuc | Dogru hali |
|---|---|---|
| Profesyonel Turist Rehberinin Dijital Asistanı | PROFESYONEL TURIST REHBERININ DIJITAL ASISTANI | PROFESYONEL TURİST REHBERİNİN DİJİTAL ASİSTANI |

CSS `text-transform: uppercase`, Unicode locale'a duyarsiz — browser engine'in default'una gore davranir. Cogu mobile mail client (iOS Mail, Gmail Android) Turkce locale'i yok sayar, kelimeyi ASCII upper case'e dondurur. `İ` ve `ı` kayıp gider, marka kimligi bozulur.

### Cozum

**HTML'de:** `text-transform` ozelligini kaldir, metni elle buyuk harf yaz:

```html
<!-- YANLIS: -->
<p style="text-transform: uppercase;">Profesyonel Turist Rehberinin Dijital Asistanı</p>

<!-- DOGRU: -->
<p>PROFESYONEL TURİST REHBERİNİN DİJİTAL ASİSTANI</p>
```

Iste etkilenen yerler:
- ✓ `scripts/manuel-onay-bilgilendirme.mjs` (27 May'da duzeltildi)
- ⚠️ `test-kullanici-mail.html` (HALA BOZUK — duzeltilmeli)
- ⚠️ Supabase Auth template'leri (sifre sifirlama vs.) — Supabase Dashboard'dan kontrol et

### Dersler

**`text-transform: uppercase` lokale uygun degil.** En iyi pratik: metni elle olusun istedigin formatta yaz. Ozellikle Turkce, Almanca (`ß` → `SS`), Yunanca, Rusca gibi locale-sensitive scriptler icin kritik.

**`font-variant: small-caps` da benzer sorun cikarir** — defansif olun.

**CI'a Turkce karakter regex testi ekle.** Generated HTML'de `[A-Z]` arasi i, I varsa uyari (Turkce icerikte `İ` veya `ı` olmali). Otomatik catch.

### Ilgili Dosyalar

- `scripts/manuel-onay-bilgilendirme.mjs` line ~150 (uppercase kaldirildi, direkt buyuk harf yazildi)
- `test-kullanici-mail.html` line 32 — HALA BOZUK, duzeltme bekliyor
- Supabase Dashboard → Authentication → Email Templates (manuel kontrol gerekli)

---

## 39. MICROSOFT/YAHOO SPAM FILTRESI - MANUEL ONAY + MARKALI BILGILENDIRME PATTERN (27 Mayis 2026)

**Karar:** Microsoft (Hotmail/Outlook) ve Yahoo kullanicilarinin onay maili spam filtresine takildigi durumlarda **(1) hesabi manuel onayla, (2) Pusula Istanbul markasiyla bilgilendirme maili gonder**. Bu IRO maili sonrasi tekrarlanan pattern oldu, yapilandirilmis araclar yazildi.

### Sorun

Supabase Auth Custom SMTP uzerinden Resend ile gonderilen onay mailleri Microsoft/Yahoo'da agresif filtreleniyor:
- Resend dashboard'da: **"Delivered" status** (kullanici tarafina ulasti)
- Microsoft/Yahoo tarafinda: spam/junk/onemsiz e-posta klasoruyna atildi, gelen kutusunda gorunmedi
- Kullanici: "Mail gelmedi" — Outlook mobile gosteriyor olabilir, Outlook web'de junk altinda olabilir (ayri klasor takibi)

Net pattern, IRO sonrasi 20 gunde **16 kullanici** bu durumdan etkilendi (Bengi Kayaslan, Yavuz Doganay, Ali Karacayli, Sevgi Aktas, Kadri Vanlioglu, Fevziye Akman, Erol Zeybey, Mustafa Soysal, Omur Kahraman, Yigit Ersin, Abdullah Er, Tina Pinto, Melike Korkmaz, Ali Akkaya, Mert Taner, Burak Sansal).

### Cozum Pattern

**Adim 1 — Manuel onay (SQL):**

```sql
UPDATE auth.users
SET email_confirmed_at = NOW(), updated_at = NOW()
WHERE email IN (
  'kullanici1@hotmail.com',
  'kullanici2@yahoo.com',
  ...
)
AND email_confirmed_at IS NULL;
```

**Adim 2 — Markali bilgilendirme maili:**

`scripts/manuel-onay-bilgilendirme.mjs` araci. Resend API direct fetch (Supabase Auth SMTP bypass — daha onceki spam'e dusen sender ile karistirmamak adina **info@pusulaistanbul.app** sender adresi kullanir). Markali HTML template (test-kullanici-mail.html pattern: gradient header + windrose logo base64 inline + buyuk basligli "PUSULA ISTANBUL" + alt yazi). Kullanim:

```bash
node scripts/manuel-onay-bilgilendirme.mjs --dry          # icerik onizle
node scripts/manuel-onay-bilgilendirme.mjs --test <email> # kendine
node scripts/manuel-onay-bilgilendirme.mjs --all          # ALICILAR listesindekine
```

ALICILAR listesi script icinde `[{ ad, soyad, email, hitap }, ...]` array'i. Yeni vakalarda bu listeyi guncelle, dry → test → all.

**Email icerik tonu (kurumsal):**
- Subject: "Pusula Istanbul Hesabiniz Hakkinda Bilgilendirme"
- Hitap: "Sayin {ad} {Bey/Hanim}"
- Aciklama: e-posta saglayicisinin spam filtresine takilmis olabilir, biz manuel onayladik, sifre ile direkt giris
- Mavi gradient kutuda: aktif olan v1.0.X guncelleme bilgisi (cifte fayda: hem onay hem update notice)
- Imza: "Pusula Istanbul" (kurumsal kimlik, kisi adi yok)

### Dersler

**SMTP "Delivered" guvenilir bir sinyaldir, ama yetersiz.** Mail server kabul etti = gonderildi. Spam'e atildi mi ASLA bilmezsin. Resend webhook ile bounce/complaint izlersin ama spam-filter ayri bir sey.

**Microsoft son 2-3 ay agresif filtreliyor.** Otomatik gonderilen no-reply maillerine karsi cok katı. **Cozum yollari:**
- DKIM + DMARC + SPF tam doğrulanmis olmali (kuruldu, 26 Nis)
- Sender adresi `info@` veya `noreply@` farkli aliaslarla cesitlendirilebilir
- Subject ve icerik tonu kisisel, marka-yogun (kurumsal jargon ile)
- Frequency cap: bir kullaniciya 24 saatte 1 otomatik mail (Resend Audience bunu yapar)

**Microsoft kullanicilarini onceden ele al.** IRO mailini fark eden kullanicinin hesap onayini agresif izle: 24 saat icinde `email_confirmed_at IS NULL` ise spam filtresine takilmis ihtimali yuksek, proaktif manuel onay + bilgilendirme maili. v1.1.0 idea: admin paneline "Onaysiz Kullanicilar (>24 saat)" widget'i.

**Kurumsal ton spam filtresine yardimci.** "Sayin {ad}", "tarafimizca onaylanmistir", "ilettigimiz" gibi resmi dil. Bot algilanmama olasiligi yuksek.

### Ilgili Dosyalar / Servisler

- `scripts/manuel-onay-bilgilendirme.mjs` — yeniden kullanilabilir mail araci
- `.env` line: `RESEND_API_KEY=re_H7PYreCJ...` (yeni "manuel-bilgilendirme" key, pusula-supabase-prod key'inden ayri)
- Resend dashboard: https://resend.com/emails (gonderim log izleme)
- Supabase: `auth.users.email_confirmed_at` (manuel onay alani)

---

## 40. EMAIL TEMPLATE LOGO — BASE64 INLINE DEGIL, EXTERNAL URL (Gmail Render Sorunu, 27 Mayis 2026)

**Karar:** Custom mail script'lerindeki (manuel-onay-bilgilendirme.mjs, kurban-bayrami-hediye.mjs, gelecekteki tum benzerleri) marka logosu **inline base64 PNG ile degil, `https://pusulaistanbul.app/logo-icon.png` external URL ile** gosterilir. Ayrica `<img>` tag'inde **PNG'nin orijinal en-boy oranina (288x206 = 1.4:1) saygi gosterilmelidir.** Kare zorlamak (width=56 height=56) logoyu asimetrik/yamuk gosterir.

### Sorun (27 Mayis 2026 sabah test sirasinda)

`scripts/manuel-onay-bilgilendirme.mjs` ve ondan turetilen `kurban-bayrami-hediye.mjs` ilk versiyonu `test-kullanici-mail.html` pattern'ini takip etti: 80x80 windrose PNG'yi base64 ile `data:image/png;base64,...` formatinda inline gomdu. Ayse'ye gonderilen test mailinde **logo yerinde "?" sembollu kirik resim placeholder'i** gozuktu (Gmail dark mode, masaustu). Manuel-onay-bilgilendirme.mjs ile 1. grup 7 kisiye gonderilen mailde de muhtemelen ayni sorun var (gormedikten sonra).

### Tani

- Gmail base64 inline image'leri **tutarsiz** render eder. Hassasiyet: data URI buyuklugu, satir kirilmalari, MIME tipi, surum farklari, Gmail web/iOS/Android tutarsizligi.
- test-kullanici-mail.html'de aynı pattern vardi ama Ayse'nin "Designed for iPad" Mac test ekraninda muhtemelen Apple Mail render etti (Apple Mail base64 destegi daha tutarli).
- Gmail external image URL'leri **default olarak gosterir** veya sender domain "trusted" oldugunda otomatik gosterir. pusulaistanbul.app Resend ile DKIM signed, "trusted sender" durumu var.
- Daha onemlisi: **Supabase Auth template'leri (sifre sifirlama, kayit dogrulama vb.) zaten bu pattern'i kullaniyor** — `https://pusulaistanbul.app/logo-icon.png` ile yatay "PUSULA [logo] ISTANBUL" banner. Ayse'nin sifre sifirlama mail screenshot'inda logo perfect render edildi. INFRASTRUCTURE.md Bolum 1 "Tasarim DNA'si"nde bu zaten yazili (width 67 height 48 — proportional 1.4:1).

### Cozum

```html
<!-- Header: PUSULA [logo] ISTANBUL yatay banner -->
<tr>
<td style="background-color:#0077B6; padding:36px 40px 30px 40px; text-align:center;">
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
  <tr>
    <td style="vertical-align:middle; padding-right:20px;">
      <span style="font-size:30px; font-weight:700; color:#ffffff; letter-spacing:3px;">PUSULA</span>
    </td>
    <td style="vertical-align:middle; padding:0 10px;">
      <img src="https://pusulaistanbul.app/logo-icon.png" alt=""
           width="70" height="50"
           style="display:block; border:0; outline:none;" />
    </td>
    <td style="vertical-align:middle; padding-left:20px;">
      <span style="font-size:30px; font-weight:700; color:#ffffff; letter-spacing:3px;">İSTANBUL</span>
    </td>
  </tr>
  </table>
</td>
</tr>
```

**Onemli ozellik:** `alt=""` olarak birakildi (`alt="Pusula Istanbul"` degil). Cunku logo render edilemez ise yan taraftaki "PUSULA" ve "ISTANBUL" yazilari zaten markayi soyluyor — alt text duplicate gostermesin diye boş. Resim destekli mail client'ta logo gozukur, gozukmezse text-only marka kalir, her iki durumda da temiz.

**Boyut karari (70x50):** PNG dosyasi `docs/logo-icon.png` 288x206 piksel (yatay 1.4:1 oran). 56x56 (kare) zorlamak yamuk gosterir. INFRASTRUCTURE.md'deki Supabase Auth pattern'i 67x48 kullaniyor — biz 70x50 yaptik (yakin, biraz daha buyuk gorunum). Kucuk fark, ikisi de dogru.

### Genel Ders

1. **Inline base64 PNG mail icin guvenilmez.** Apple Mail kabul eder, Gmail tutarsiz, Outlook genelde reddeder. Kullanilmayacak.
2. **External URL + DKIM-signed sender** Gmail'de tipik olarak guvenilir → image otomatik render.
3. **PNG'nin gercek en-boy oranini kontrol et** (`PIL.Image.open(...).size` ya da `file` komutu). Kare olmayan logoyu kare olarak gosterme.
4. **alt="" bilincli secim** olabilir — yan tarafta zaten text marka varsa logo alt'i bos birak.
5. **Pattern referansi:** INFRASTRUCTURE.md Bolum 1 "Tasarim DNA'si" — Supabase Auth template'lerinde bu pattern zaten standart, custom script'ler de ayni standardi takip etmeli.

### Geriye Donuk Etki

- ✓ `scripts/kurban-bayrami-hediye.mjs` — base64 → external URL cevirildi, test mail onaylandi, 168 kisilik gonderim 07:00 scheduled task ile bekliyor.
- ✗ `scripts/manuel-onay-bilgilendirme.mjs` — hala base64 inline kullanyor. 1. grup 7 kisiye logo broken gitmis olabilir (Gmail/Yahoo). YENI OTURUMDA: external URL pattern'ine cevir, 2. grup 8 onaysiza yeni versiyonu gonder. STATE.md BEKLEYEN madde 2.
- ✗ `test-kullanici-mail.html` — referans pattern olarak base64'lu kalmis, kullanilmiyor ama "kotu ornek" olarak silinmeli ya da external URL'e cevirilmeli.

### Ilgili Dosyalar

- `scripts/kurban-bayrami-hediye.mjs` (referans dogru implementasyon)
- `docs/logo-icon.png` (public asset, GitHub Pages uzerinden serve edilir)
- INFRASTRUCTURE.md Bolum 1 (Supabase Auth template Tasarim DNA'si — ayni pattern)

---

## 41. SUPABASE PROFILE.ID == REVENUECAT APP_USER_ID (Kesif, 1 Haziran 2026)

**Karar:** RevenueCat alias'i (`app_user_id`) ile Supabase profile UUID'si **birebir aynidir**. `profiles.revenuecat_id` NULL ise `id` kolonundan kopyalanabilir (premium kullanicilar icin). Bu, geriye donuk veri temizliginde ve gelecekteki destek vakalarinda en hizli es deger.

### Kesif (1 Haziran 2026)

Bayram donemi 3 organik yillik conversion'in (Asli Cetin, Ceren Varol, Melike Yazicioglu) `revenuecat_id` kolonu NULL'di. Sorun DECISIONS #31 paterniyle ayni: hizli kullanici (kayit+4 dakikada yillik satin alma) `use-abonelik.ts` client-side listener'inin RC SDK tam ready olmadan sync etmesine sebep olmus → RC alias Supabase'e yazilmamis.

Ayse RC dashboard'dan `active.csv` indirdi (36 aktif premium kullanici). CSV'deki `app_user_id` kolonu ile Supabase'deki `profiles.id` kolonu yan yana konunca **tum 3 conversion'da tam UUID eslesmesi** cikti:

| Kullanici | profile.id | RC app_user_id |
|---|---|---|
| Asli Cetin | `87122d26-2de4-4bf2-8f82-7286c96ad468` | `87122d26-2de4-4bf2-8f82-7286c96ad468` |
| Ceren Varol | `cefc02ab-aa35-4785-9a28-a24835d74564` | `cefc02ab-aa35-4785-9a28-a24835d74564` |
| Melike Yazicioglu | `1e538543-e203-4078-8bd3-fea055b64693` | `1e538543-e203-4078-8bd3-fea055b64693` |

### Sebep

`lib/revenuecat.ts`'te `revenueCatLogin(userId)` Supabase user.id ile cagriliyor:
```ts
await Purchases.logIn(supabaseUserId);
```
RC SDK bu cagrida `app_user_id`'yi gelen string ile set ediyor. Yani **RC alias = Supabase ID** by design — sadece bunu Supabase'e geri yazma adimi `use-abonelik.ts`'de timing yarisinda kaybediliyor.

### Sonuc — v1.1.0 Fix Cok Basitlesti

Onceki plan: `Purchases.setAttributes({'$email': user.email})` + complex retry/sync logic. Yeni plan iki basit adim:

1. **Bir defalik geri-doldurma migration (v1.1.0 build oncesi bile yapilabilir):**
   ```sql
   UPDATE public.profiles
   SET revenuecat_id = id
   WHERE revenuecat_id IS NULL
     AND abonelik_durumu = 'aktif'
     AND id IN (SELECT id FROM public.profiles WHERE abonelik_plani IN ('aylik','yillik'));
   ```
   Tum mevcut NULL'lari tek seferde kapatir.

2. **`use-abonelik.ts` defansif kod (v1.1.0):** RC satin alma callback'inde `revenuecat_id` write'i Supabase'e atilirken **ID'yi `Purchases.getAppUserID()` yerine direkt Supabase `user.id`'den al** — hangisinin bos donme ihtimali daha yuksekse onunla degil, garantili olanla yaz. RC zaten bu ID'yi alias olarak set etmis durumda, riziko yok.

3. **`Purchases.setAttributes({'$email': ...})` bonus olarak kalsin** — RC dashboard'da email ile arama icin (destek vakasi UX). Iki cozumun ikisi de dogru ama oncelikleri farkli.

### Genel Ders

1. **Iki ayri sistem ID kullaniyorsa ortak alani test et.** Bizde "iki ayri ID kullaniyor olabiliriz" varsayimi yanlis cikti — aslinda ayni ID hem her iki tarafa konuyor, sadece bizim DB'ye yazma kayitsizdi.
2. **RC dashboard CSV export hayat kurtarici.** Email atribute set edilmemis olsa bile `app_user_id` + `first_purchase_at` ile capraz eslestirme yapilabilir.
3. **Unix timestamp / TR-UTC conversion kontrolu sart.** CSV'deki `first_purchase_at` Unix millisaniye, Supabase'deki `abonelik_bitis` Postgres timestamptz. Capraz eslestirmede saniye/millisaniye yuvarlama bazi kayitlarda eslesme kacirir (Ceren'in 3 saniyelik fark gibi). Tolerans pencereli SQL daha guvenli.
4. **Hizli satin alma == hizli bug.** Kayit + 4 dk yillik (Asli), kayit + 6 saat yillik (Ceren, Melike) — niyet yuksek kullanici aciligini bekledigi anda sistemde bir adim atlaniyor olabilir. Test senaryolarinda "kayit -> 30 saniye sonra yillik" akisi mutlaka kontrol edilmeli.

### Ilgili Dosyalar/Kararlar

- `lib/revenuecat.ts` (revenueCatLogin — Supabase ID'yi RC alias olarak set ediyor)
- `hooks/use-abonelik.ts` (RC listener — Supabase'e geri yazma adimi)
- DECISIONS #31 (USE-ABONELIK RC LISTENER EKSIK SYNC, 3 May 2026 — bu kesif #31'in genelleme halini ortaya koyuyor)
- DECISIONS #30 (NULL profile varyanti — ayni sinif sorun)
- STATE.md "1 Haziran 2026" bolumu (3 yillik conversion baglandi)
- `claude-context/raporlar/bayram-hediye-otomatik-rapor.md` (kapsamli bayram kampanyasi raporu)

---

## 42. PUSH NOTIFICATION MIMARISI — Server-Side Trigger + Edge Function (Client Realtime Kaldirildi, 1 Haz 2026)

**Karar:** Push notifications **tamamen server-side** uretilir: Supabase tablo trigger'lari → `push_gonder_async()` SQL helper → `push-gonder` Edge Function → Expo Push API → APNs/FCM. Client-side realtime listener'lar (eski use-bildirimler.ts'teki 6 kategori subscription) **kaldirildi**. Client sadece izin alir + token kaydeder + Android kanallari olusturur + foreground push gosterir.

### Sorun (v1.0.x — Eski Davranis)

Eski `use-bildirimler.ts` 6 Supabase Realtime kanali kuruyordu (ulasim, trafik, saha, etkinlikler, sohbet, sistem). Her INSERT/UPDATE event'inde lokal `expo-notifications.scheduleNotificationAsync()` ile local notification uretiyordu. **Sorun:** sadece uygulama acikken calisir. Kullanici uygulamayi kapatinca Realtime channel kopar, bildirim hic uretilmez. Telefon kilitliyken Marmaray arizasi gelse rehber haberdar olmaz. Bayram hediyesi mail'inin %86.5 'i hic acmadi — push olmadigi icin farkindalik yok.

### Mimari Karar (v1.1.0)

1. **Trigger'lar:** her tabloda (ulasim_uyarilari, canli_durum, etkinlikler, sohbet_mesajlari, mekan_saatleri, havalimani_seferleri, bogaz_turlari, genel_duyurular) INSERT/UPDATE trigger → `public.push_gonder_async(kategori, baslik, icerik, veri, kullanici_id_haric)`.

2. **`push_gonder_async` SQL helper:** vault'tan `pusula_cron_secret` okur, `pg_net` ile async HTTP POST atar (fire-and-forget, DB transaction'i bloke etmez).

3. **`push-gonder` Edge Function (Deno):** payload alir, profiles tablosundan token + tercih sorgular (premium gate dahil), Expo Push API'ye 100'erlik batch gonderir. DeviceNotRegistered hatasi alan tokenları temizler.

4. **Client `use-bildirimler.ts`:** Realtime kanallari SILINDI. Sadece izin + Android kanallari + tiklama handler.

5. **Tercih senkronu:** `use-bildirim-tercihleri.ts` AsyncStorage'a yazarken Supabase `profiles.bildirim_tercihleri` JSONB'ye de yazar. Push gonderici server-side bu kolonu kontrol eder, kullanici tercih kapali ise gonderim atlanir.

### Premium Gate Listesi (Edge Function'da)

```ts
const PREMIUM_KATEGORILER = ['sahaDurumu', 'ulasim', 'trafik', 'etkinlikler'];
// Sohbet ve admin freemium kullanicilara da gider
// (Sohbet pin'li mesaj = kritik saha bilgisi, paywall arkasinda olmamali)
```

### Genel Ders

1. **Realtime listener uygulama-icrasi-baglidir.** App background'da Realtime kopar — bu durum local notification'i imkansiz kilar. Uygulamayi acmayan kullaniciya bildirim atmanin **tek yolu** server-side push.
2. **Cift bildirim cakismasi onlemek icin client realtime listener kaldirilmali.** Server-side trigger zaten ayni isi yapiyor, foreground'da push handler `shouldShowAlert: true` ile bildirim gosterilir.
3. **pg_net fire-and-forget Edge Function cagirma pattern'i** scheduled task disindaki kullanim icin de uygulanabilir (admin moderasyon aksiyonlari, kullanici onaylari vb.).
4. **Vault secret pattern'i** (DECISIONS #36'da X API icin baslamis, burada genisledi): tum trigger'lar `pusula_cron_secret`'i okuyor, tek noktadan yonetim.
5. **APNs Key sandboxlik vs production karari onemli.** EAS credentials'a yuklenirken "Sandbox & Production" secimi yapmali, sonradan degistirilemez. (V7FM2HN5N7 dogru kuruldu.)

### Ilgili Dosyalar

- `supabase/functions/push-gonder/` (Edge Function)
- `hooks/use-push-token.ts` (token kayitlama)
- `hooks/use-bildirimler.ts` (refactor — sade)
- `hooks/use-bildirim-tercihleri.ts` (Supabase senkron yazma)
- `lib/revenuecat.ts` (login'de email attribute — RC dashboard senkronu)
- 8 trigger SQL'i (sohbet_mesajlari.pinned dahil)
- `app.json` (googleServicesFile + iOS Photos izinleri)
- DECISIONS #36 (X API Senkronu Edge Function'a tasindi — push pattern'inin onceli)
- INFRASTRUCTURE.md (Push Notification altyapisi bolumu — yeni eklenecek)

---

## 43. TARIH/SAAT PICKER'DA TIMEZONE +03:00 SABIT EKLE — TZ-less ISO String PostgreSQL UTC Sanır (1 Haz 2026)

**Karar:** Local tarih/saat girisi yapan tum picker'lar, ISO string uretirken **sabit `+03:00` (Turkiye) timezone offset'i ekler**. Onceden TZ'siz string (`2026-06-15T08:00:00`) uretiyorduk, PostgreSQL bunu UTC olarak parse edip cihazda 3 saat ileride gosteriyordu.

### Sorun (Etkinlik Takvimi 3 Saat Fark — 1 Haz 2026)

`components/tarih-saat-secici.tsx`'teki `isoFormat()`:
```ts
// ESKI - bug'li
function isoFormat(yil, ay, gun, saat, dakika) {
  return `${yil}-${pad(ay+1)}-${pad(gun)}T${pad(saat)}:${pad(dakika)}:00`;
}
```

Picker'da "08:00" seciliyor → string `2026-06-15T08:00:00` (TZ yok) → Supabase'e POST → PostgreSQL bunu **UTC olarak alir** (server timezone'a degil) → veri `2026-06-15T08:00:00Z` olarak saklanir → cihazda `new Date()` ile parse edilince `2026-06-15T11:00:00 TR` (+3 saat) olarak gosterilir.

Ayse 8 girip 11 gordugu icin **5 yazarak 8 gostermek** zorunda kaliyordu (3 saat geri).

### Fix

```ts
// YENI - dogru
function isoFormat(yil, ay, gun, saat, dakika) {
  return `${yil}-${pad(ay+1)}-${pad(gun)}T${pad(saat)}:${pad(dakika)}:00+03:00`;
}
```

Picker "08:00" seciyor → `2026-06-15T08:00:00+03:00` → PostgreSQL dogru parse → DB'de `2026-06-15T05:00:00+00` (UTC) → cihazda `08:00 TR` olarak gosterilir.

### Neden +03:00 Sabit (DST Yok)

Turkiye 2016'dan beri **kalici yaz saati** uyguluyor — DST yok, sabit UTC+3. Bu yuzden offset sabit yazilabilir.

### Genel Ders

1. **JavaScript `Date` constructor TZ'siz string'i yerel zaman olarak yorumlar** ama farkli sistemlerde davranisi degisebilir (Node, Deno, mobile RN).
2. **PostgreSQL `timestamptz` kolonuna TZ'siz string yazarsan UTC olarak alir** — server timezone'a guvenme.
3. **Tum ISO string'lerde TZ offset acikca yazilmali.** Soyle bir kod kuralı: hicbir zaman `T${saat}:${dakika}:00` yazma, daima `T${saat}:${dakika}:00${tz_offset}`.
4. **Date.toISOString()** her zaman UTC dondurur (`Z`). Bunu kullaniyorsan zaten sorun yok (UTC anlamiyla saklanir, cihazda lokal'e cevrilir). Sorun TZ-less manuel string yazimda.
5. **Test:** Yeni picker komponenti yazarken once Supabase'e bir kayit at, sonra geri oku — saat ayni cikiyor mu? Cikmiyorsa TZ bug var.

### Ilgili Dosyalar

- `components/tarih-saat-secici.tsx` (line 32-34)
- DB tablolari: `etkinlikler.tarih`, `etkinlikler.bitis_tarih`, ileride yeni timestamptz kolonlari da ayni pattern ile

### Geriye Donuk Etki

- Mevcut etkinlik kayitlari yanlis saatte (3 saat ileride). 1 Haz itibariyle sadece 1 etkinlik aktif: "29 Mayis Fetih Kutlamalari" (gecmis). Pasif yapilacak. Yeni etkinlikler dogru calisacak.
- Bu fix'in `mekan_saatleri` veya diger kolonlara etkisi yok — onlar string saat ("08:00") tutuyor, timestamptz degil.



---

## 44. HAVAIST RESMI BACKEND API > FIRECRAWL SCRAPE (Veri Kaynagi Mimarisi, 2 Haz 2026)

### Kesif

`www.hava.ist/sefer-saatleri.php` sayfasinin formu submit edildiginde, browser arka planda `https://s.hava.ist/api.php` endpoint'ine POST atiyor. Bu Havaist'in **kendi resmi backend API'si** — kullaniciya acik bir dokumantasyon yok ama public reachable. Eski Firecrawl-based scrape pipeline'i bu API'yi atlayip HTML'i parse etmeye calisiyordu (4 May 2026'da devre disi birakilmisti — yanlis fiyat ve donem celliskileri).

### Iki API Endpoint Yeterli

1. `POST ?query=get-from-stations` → tum 57 durak + her birinin baglandigi hat
2. `POST ?query=get-to-stations-price` → hat icin yon-spesifik sefer saatleri, fiyat, sure, gunduzergah

Gerekli headers: `Origin: https://www.hava.ist`, `Referer: https://www.hava.ist/`, `X-Requested-With: XMLHttpRequest`. Bu olmadan 403 doner.

Tek bir senkron run'unda 12 benzersiz hat icin 25 API cagrisi atiliyor (~12 saniye, rate-limit 250ms uyumlu).

### Karar

**Havaist tarafindaki tum veri (firma='havaist', havalimani='IST') artik `s.hava.ist` API'sinden besleniyor.** Pipeline:

- `scripts/havaist-senkron.mjs` (Node, .env'den `SUPABASE_SERVICE_ROLE_KEY` okur)
- Scheduled task `havaist-senkron`, gunluk 07:00 +03 (`0 7 * * *`)
- Idempotent: hicbir fark yoksa PATCH atmaz → `push_havalimani_trigger` tetiklenmez → kullaniciya bos push gitmez
- Audit log: `scripts/data/havaist-senkron-log.json`

Havabus (firma='havabus', havalimani='SAW') bu API'de yok — onun icin admin panel + (gerektiginde) Firecrawl pattern'i devam ediyor.

### Neden Bu Iyi

1. **Resmi kaynak = kesin veri.** Fiyat ve saatlerin kaynagi havalimanin kendi sistemleri.
2. **Hizli.** Firecrawl ile site scrape'inde her sayfa 2-5 saniye, kredi yiyordu. Direkt API'de 250ms/cagri.
3. **Kredi tasarrufu.** Firecrawl Hobby planinin ~3000 kredi/ay limiti var. Eski havalimani task'i haftada 1 ~10 sayfa cekip ~10 kredi yiyordu (yilda ~520). Yeni pipeline 0 Firecrawl kredisi.
4. **Tip-guvenli.** API JSON doner, HTML parse riski yok (selector kaymasi, content yapisi degisikligi).
5. **Genis kapsam.** Eski sistem 8 IST durak (eski Firecrawl). Yeni sistem 14 IST kaydi (10 HVL + 4 HVIST) — toplam ag yapisini yansitir. Daha once eksik olan HVL-2 Beylikduzu, HVL-3 Otogar, HVL-4 Merter/Bakirkoy, HVL-7 Avcilar, HVIST-5A Arnavutkoy, HVIST-7 Silivri/Catalca, HVIST-13 Sabiha Gokcen artik gozukuyor.
6. **Push spam kontrolu yerinde.** Trigger sadece UPDATE'lerde tetikleniyor, idempotency kontrolu ile her gun bos push olmuyor.

### Genel Ders

Bir web sitesinin form submit'i yapildiginda **once browser Network panelini ac**, asagidaki istekleri incele. Cogu modern site arka planda bir JSON API'ye gidiyor. Public reachable ise (auth gerektirmiyorsa) Firecrawl/Puppeteer/Playwright'a gerek yok — direkt fetch() ile bagla. Daha hizli, daha guvenilir, daha ucuz.

Ayni mantik **havabus.com icin denenmedi** — eski url pattern (`/yolcuservisi/...aspx`) MVC arkitekturlu, statik HTML doner. Ama bilet.havabus.com modern, oraya da bakilabilir (gelecekte).

### Ilgili Dosyalar

- `scripts/havaist-senkron.mjs`
- `claude-context/INFRASTRUCTURE.md` (Bolum 12, 11 — guncellendi)
- `claude-context/SCRIPTS.md` (yeni section eklendi)
- Scheduled task: `/Users/aysetokkus/Documents/Claude/Scheduled/havaist-senkron/SKILL.md`

### Geriye Donuk Etki

- Eski 7 IST kaydinin fiyat ve saatleri guncellendi:
  - Aksaray: 355₺ (Ocak 2026 birgun.net) → 426₺ (Haziran 2026 resmi)
  - Kadikoy: 390₺ → 468₺
  - Taksim/Beşiktaş: gidis/donus 34 → 30 sefer
  - Bahcesehir/Halkali/Sultanahmet: "TL" format → "₺" format normalizasyonu
- 7 yeni IST hatti eklendi (Beylikduzu, Otogar Esenler, Merter/Bakirkoy, Avcilar, Arnavutkoy, Silivri/Catalca, Sabiha Gokcen)
- Eski `havalimani-tarife-guncelle` scheduled task'i tarihte kalir (DEVRE DISI olarak)
- `havalimani_guncelle.sql` (proje kokundeki eski manuel migration) artik kullanilmiyor


---

## 45. ANDROID NOTIFICATION CHANNEL SES BUG'I — `sound: 'default'` STRING'I SESSIZ KANAL OLUSTURUYOR (2 Haz 2026)

### Sorun

v1.1.0'da push notification altyapisi kuruldugunda (DECISIONS #42), 6 Android bildirim kanali `expo-notifications` `setNotificationChannelAsync` ile olusturuldu, her birinde `sound: 'default'` string parametresi verildi. Push gondertildiginde bildirim **gorunuyor** (banner duser) ama **ses cikmiyor**. Ayse'nin iki Android telefonunda dogrulandi.

### Kok Sebep (Hipotez Dogrulandi)

`expo-notifications`'da `setNotificationChannelAsync({ sound: 'default' })` cagrisi, string `'default'` ifadesini **ozel ses dosyasi adi** olarak yorumluyor (`default.wav` aramaya gidiyor). Bu dosya app bundle'inda yok, Android kanali **sessiz** (sound=null) olarak olusturuluyor.

Test ile kanitlandi: Ayse'nin telefonunda Android Ayarlar → Pusula → Bildirimler → "Saha Durumu" → Ses kontrolu yapildi, "Yok" yaziyordu. Manuel "Varsayilan" yapinca ses gelmeye basladi.

### Android'in Zorlu Kurali (Kritik!)

**Bir kanal olusturulduktan sonra kod uzerinden importance/sound/vibration ayarlari DEGISTIRILEMEZ.** Sadece kullanici Android Ayarlardan manuel degistirebilir. Yani v1.1.0 cihazlarda sessiz kanallar kod degisikligi ile duzelmez.

### Iki Asamali Cozum

**Asama 1 — Server tarafi acil hotfix (2 Haz 2026, deploy edildi):**

`push-gonder` Edge Function'un `KANAL_MAP`'i tum kategorilerde `-v2` suffix'li yeni kanal ID'lerine point edildi:
```
ulasim → ulasim-uyari-v2
trafik → trafik-uyari-v2
sahaDurumu → saha-durumu-v2
etkinlikler → etkinlikler-v2
sohbet → sohbet-v2
admin → sistem-v2
```

**Mekanizma:** v1.1.0 yayindaki cihazlarda bu yeni ID'ler kayitli kanal olarak bulunamaz, Android **default kanala fallback** yapar. Default kanal sistem varsayilan ses ile gelir. Sonuc: manuel ayar gerekmeden ses cikar.

**Trade-off:** v1.1.1 yayinlanana kadar kategori-bazli user control (orn. kullanicinin Android Ayarlar'dan "Sohbet" bildirimini sessize alma yetkisi) kullanilmaz. Default kanal kullanildigi icin hepsi ayni davranisi yapar. Bu kabul edilebilir gecici durum.

**Asama 2 — Client tarafi kalici cozum (v1.1.1 build'i):**

`hooks/use-bildirimler.ts` icinde:

1. `deleteNotificationChannelAsync` ile eski 6 kanal ID'si silinir (kullanici v1.1.0'dan guncelliyorsa eski sessiz kanallari temizler)
2. Yeni 6 kanal `-v2` suffix'li ID'lerle olusur
3. `sound` parametresi **hic verilmiyor** — Expo/Android sistem varsayilani devreye girer (= default ses)
4. `enableVibrate: true`, `showBadge: true` aciktir
5. Importance seviyeleri: ulasim/trafik/saha/sohbet=4 (HIGH), etkinlikler/sistem=3 (DEFAULT)

v1.1.1 yuklendikten sonra v1.1.0 sessiz kanallar silinir, yeni sesli kanallar olusur → kategori-bazli kontrol geri gelir.

### Genel Ders

1. **Android kanal ayarlari immutable.** Olusturduktan sonra kod ile guncellenemez. Tek yol: `deleteNotificationChannelAsync` + yeniden olustur.
2. **String `'default'` magic value kullanma.** Expo/RN'de `sound: 'default'` gibi string'ler runtime'da ya enum'a ya da dosya adina mapleniyor — explicit olmayan davranis tehlikeli. **Parametreyi hic vermemek** Expo/sistem varsayilanini aktiflestirir, daha guvenli.
3. **Production'da push bildirimi test ederken HER ZAMAN ses ayarini kontrol et.** Bildirim banner'i gostermek != bildirim sesli geldi. Ses kanal ayarlarina bagli, ama bunlar kod review'unda fark edilmiyor.
4. **Server-side kanal ID degisikligi acil hotfix yontemi.** Client build'i beklemeden Edge Function'da kanal ID'yi degistirmek, Android'in "kanal yoksa default'a fallback" davranisi sayesinde tum kullaniciyi tek seferde duzeltir. Bu ozellik gizli bir altin patikadir.
5. **Kanal versioning (`-v1`, `-v2` suffix) iyi bir pattern.** Future-proof: ileride bir kanal ayari degisikligi gerekirse, ID suffix'i artirarak temiz migration yapilabilir.

### Test Akisi (Dogrulamak Icin)

1. SQL: `SELECT public.push_gonder_async('sahaDurumu', 'Test', 'Test mesaji', '{}'::jsonb, NULL);`
2. Mevcut v1.1.0 cihazda push banner ucar + ses calar (default kanal)
3. v1.1.1 yayinlandiktan + yuklendikten sonra, ayni test sesli calar (yeni kanal)
4. `bildirim_tercihleri` NULL kontrolu: Edge Function `kullanicilar.filter(... tercih[kategori] !== false)` — NULL = tum acik
5. Premium gate kontrol: 'admin' ve 'sohbet' kategorileri tum kullanicilara, digerleri sadece aktif abonelik/admin/moderator'e

### Ilgili Dosyalar

- `hooks/use-bildirimler.ts` (kanal olusturma + silme)
- `supabase/functions/push-gonder/index.ts` (KANAL_MAP `-v2` versiyon)
- Edge Function: push-gonder, version 2 (2 Haz 2026 deploy)

### Geriye Donuk Etki

- v1.0.x kullanicilarinda push hic yoktu (push altyapisi v1.1.0'da geldi) — etkilenmez
- v1.1.0 yayindaki tum Android kullanicilar Edge Function v2 deploy'undan sonra ses almaya basladi (default kanal fallback). Manuel ayara gerek yok.
- iOS push notifikasyonlari Android channel'lardan etkilenmez, ayri mekanizma (APNs Key V7FM2HN5N7) ile calisir, bu bug iOS'i etkilemedi
- v1.1.1 yuklenince eski kanallar silinir, yeni temiz kanallar olusur, kategori-bazli user control geri gelir


---

## 46. YENI KAYIT 7 GUN PREMIUM TRIAL — Otomatik Hediye Sistemi (2 Haz 2026, oglen)

### Karar

Pusula Istanbul'a her yeni kayit olan kullaniciya **otomatik 7 gun premium uyelik** taninir. Hediye anliktir (gerçek-zamanli trigger), mail kayit akisi siralarinda kullaniciya ulasir.

### Mimari

```
Kayit akisi:
  signUp() → auth.users INSERT
       ↓ (mevcut sync trigger)
  profiles INSERT
       ↓ (YENI trg_yeni_kayit_hediye)
  pg_net ile fire-and-forget POST → Edge Function 'yeni-kayit-hediye'
       ↓
  profiles UPDATE: abonelik_durumu='aktif', plan='aylik', bitis=NOW()+7days, revenuecat_id=id
       ↓
  Resend ile hos geldin maili (markali HTML + altin gradient kutu)
```

**Bilesenler:**
- **Vault secret:** `resend_api_key` (Resend Pro key, Edge Function vault.decrypted_secrets'tan okur)
- **RPC function:** `public.get_resend_api_key()` (SECURITY DEFINER, sadece service_role GRANT)
- **Edge Function:** `yeni-kayit-hediye` v2 (verify_jwt=false, CRON_SECRET header auth)
- **SQL function:** `public.yeni_kayit_hediye_async()` (trigger function, pg_net ile async POST)
- **Trigger:** `trg_yeni_kayit_hediye` AFTER INSERT ON profiles FOR EACH ROW

### Idempotency / Skip Kosullari

Edge Function 3 katmanli filtre uygular:
1. **rol IN ('admin', 'moderator')** → atla (admin manuel kayit'sa hediye gereksiz)
2. **abonelik_durumu = 'aktif'** → atla (manuel grant, geri-doldurma vakalari icin coruyucu)
3. **email NULL** → premium grant yapilir, mail gonderilmez (hata logu)

SQL trigger ayrica admin/moderator + zaten 'aktif' kontrolu yapar — gereksiz HTTP cagrisini onler.

### Trial Suresi Hesabi

Kullanici kayit oldugu **gun** + 7 gun, gece 23:59'a kadar. Bitis tarihi `Date()` ile JavaScript'te hesaplanir:
```javascript
const bitis = new Date();
bitis.setDate(bitis.getDate() + 7);
bitis.setHours(23, 59, 59, 999);
```

Ornek: 2 Haz 14:00'de kayit → bitis 9 Haz 23:59:59. Toplam ~8 gun (yuvarlanmis, kullanici lehine).

### Trial Bitis Davranisi

7 gun sonunda `abonelik_bitis < NOW()` olur. `use-abonelik.ts` client-side bunu kontrol eder ve **kullaniciyi otomatik freemium katmana cevirir**. Hicbir manuel mudahale gerekmez. Kullanici uygulama icinden Aylik 99,99 TL veya Yillik 699,99 TL plani secebilir.

### Vault Pattern (RESEND_API_KEY)

Edge Function secrets'a Supabase Dashboard'tan ekleme yerine **Vault tercih edildi**. Sebep:
- Tum secret yonetimi tek yerde (`vault.decrypted_secrets`)
- Service Role Key ile programmatik erisim mumkun (Supabase MCP / scripts)
- Audit log Supabase iclerinde tutulur
- Dashboard'a girip manuel ekleme adimi yok

`vault.create_secret(value, name)` ile insert, `SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name=...` ile read. Edge Function `supabase.rpc('get_resend_api_key')` ile cagirir.

Bu pattern push-gonder Edge Function'in `pusula_cron_secret` kullanim deseniyle ayni — proje icindeki standart secret yonetim sablonu.

### Maliyet

- **pg_net trigger HTTP cagrisi:** Bedava (Supabase iclerinde)
- **Edge Function invocation:** 500K/ay ucretsiz (mevcut kayit hizinda ~1000/ay)
- **Resend mail:** Pro plan (Ayşe'nin) — kayit hizinda quota icinde
- **Premium grant:** 7 gun trial, sonra otomatik dusus → ek RC veya stripe maliyeti yok
- **Beklenen ROI:** Bayram kampanyasinda %1.5 conversion (3 yillik/193 hediye) gormustuk. Trial sirasinda taze rehberin premium ozelliklerini deneyimlemesi → bilesik etki.

### Genel Ders

1. **Anlik tetikleme > Scheduled task** dene zamani onemli senaryolarda. Scheduled task 15 dk gecikme, kullanici "kayit oldum ama hediye gelmedi" diye anlik destek talebi acabilir.
2. **Vault > Dashboard Secrets** programmatik yonetim icin daha ozgur. Dashboard secret'lara MCP/CLI ile yazma kisitli.
3. **pg_net fire-and-forget** trigger icinde ideal — INSERT akisini bloke etmez, edge function async calisir.
4. **3 katmanli idempotency filtresi** (rol, abonelik_durumu, email) — hata ile cift hediye verme riskini bilime indirir.

### Ilgili Dosyalar

- Edge Function: `yeni-kayit-hediye` v2 (Supabase, ezbr_sha256 a8f37ca8...)
- SQL: `public.get_resend_api_key()`, `public.yeni_kayit_hediye_async()`
- Trigger: `trg_yeni_kayit_hediye` ON public.profiles
- Mail template: Bayram script HTML (`scripts/yeni-kayit-bayram-hediye.mjs`) referans, yeni metin Ayse onayli

### Devre Dısı Bırakma / Pause Etme

Trigger'i gecici disable: `ALTER TABLE public.profiles DISABLE TRIGGER trg_yeni_kayit_hediye;`
Kalici kaldirma: `DROP TRIGGER trg_yeni_kayit_hediye ON public.profiles;`


---

## 47. GORUNMEZ UI BUG'I — Parent flexDirection 'row' Kalinca Yeni Eklenen Bar 0 Genislikte Render Olur (4 Haz 2026)

**Vaka:** Genel duyuru kartina v1.1.1'de eklenen yetkili aksiyon bari (Duzenle | Sabitle | Sil) hicbir cihazda gorunmuyordu. Iki gun boyunca "eski build / OTA inmiyor / RLS reddi" teorileri kovalandi — hepsi yanlisti. Kod her pakette VARDI.

**Kok sebep:** `kart` stili eski tasarimdan `flexDirection: 'row'` kalmisti. Aksiyon bari karta dikey eklenmek istenmisti ama row parent icinde icerigin SAGINA dizildi. Bar'in cocuklari `flex: 1` (flex-basis 0) oldugu icin intrinsic genisligi ~2px (sadece ayrac cizgileri) → gorunmez ama render agacinda mevcut. Fix: `kart` → `flexDirection: 'column', alignItems: 'stretch'` (icerik+thumbnail yatay dizilimi zaten `kartIcerikSarmal` wrapper'inda).

**Tani surecindeki iki yanlis sinyal (gelecekte tekrarlanmasin):**
1. **`strings <bundle> | grep "Sabit Kaldır"` YANLIS NEGATIF verdi** — Hermes bytecode Turkce karakterli (i, ı, ü...) string'leri UTF-16 saklayabiliyor, `strings` ASCII tarar. Binary bundle icerik dogrulamasi SADECE ASCII marker ile yapilmali (or. style key `yetkiliAksiyonBar`, fonksiyon adi `duyuruGuncelle`). Dogru komut: `grep -ac "asciiMarker" bundle.hbc`
2. **"Ayni `isYetkili` flag'ine bagli '+ Yeni' gorunuyor ama bar gorunmuyor → JS eski olmali" cikarimi yanlisti** — ikisi de render ediliyordu, biri 0 genislikteydi. Conditional render calisiyor diye layout'un dogru oldugu varsayilamaz.

**Cozum dagitimi:** EAS Update OTA (runtime 1.1.1, update group `afd5d662`) ile magaza review'i olmadan tum yayindaki cihazlara (Android vc43 + iOS 1.1.1) dakikalar icinde dagitildi. Magaza build'i gerekmedi. OTA altyapisinin (app.json `updates.url` + `runtimeVersion: appVersion` + eas.json `channel`) ilk basarili gercek kullanim vakasi.

**Dersler:**
- Yeni UI elemani eklerken parent container'in `flexDirection`'ini KONTROL ET — ozellikle eski layout'a wrapper eklenen refactor'larda.
- UI ozelligi "calisiyor" demek icin EKRANDA GORMEK sart; kod + build + deploy zinciri tek basina kanit degil. v1.1.1 "silme UI fix'i" hicbir cihazda gorsel dogrulanmadan yayinlanmisti.
- JS-only fix'lerde once OTA dusun: review yok, dakikalar icinde tum runtime-uyumlu cihazlara ulasir. Native degisiklik varsa (yeni paket, izin, config plugin) OTA YETMEZ, store build sart.
- Binary bundle dogrulamasinda Turkce karakterli string KULLANMA (yukaridaki yanlis negatif).

---

## 48. TRIGGER FONKSIYONLARI SECURITY DEFINER OLMALI — EXECUTE Revoke Edilen Fonksiyonu Cagiran Trigger'lar Invoker Yetkisiyle Patlar (5 Haz 2026)

**Vaka:** #46'daki security temizliginde `push_gonder_async` PUBLIC EXECUTE revoke edildi. Trigger fonksiyonlari SECURITY INVOKER (varsayilan) oldugu icin authenticated kullanicinin DML'i trigger icindeki push cagrisinda "permission denied" aldi. Sonuc: admin panel bogaz/havalimani/mekan saat guncellemeleri FAIL + tum kullanici-kaynakli push'lar 2-5 Haz arasi sessiz olu (zirhli trigger'lar hatayi yutuyordu).

**Pattern:** Kisitli (EXECUTE revoke edilmis) helper fonksiyon cagiran trigger fonksiyonlari **SECURITY DEFINER + SET search_path** olmali. `RETURNS trigger` fonksiyonlar PostgREST RPC'den dogrudan cagrilamaz, bu yuzden DEFINER yapmak spam/abuse kapisi acmaz. Helper kilitli kalir.

**Iki katmanli kural (artik standart):**
1. Trigger fonksiyonu: `SECURITY DEFINER SET search_path TO 'public'`
2. Icindeki her yan-etki cagrisi: `BEGIN ... EXCEPTION WHEN OTHERS THEN RAISE WARNING` (push fail olsa bile asil DML yasamali)

**Kontrol sorgusu (yeni trigger eklerken):**
```sql
SELECT proname, prosecdef, (pg_get_functiondef(oid) LIKE '%EXCEPTION%') as zirhli
FROM pg_proc WHERE proname LIKE 'trg_push_%';
```
