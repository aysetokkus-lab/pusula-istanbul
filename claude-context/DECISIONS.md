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
export const ENTITLEMENT_ID = 'pro'; // RC dashboard'da ayni yazmali
```

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

## 24. CLAUDE-CONTEXT KLASORU (Bu Yapi)

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
