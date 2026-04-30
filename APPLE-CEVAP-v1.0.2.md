# Apple App Review — v1.0.2 Response

**App:** Pusula Istanbul
**Bundle ID:** com.pusulaistanbul.app
**Build:** 1.0.2 (7)
**Team ID:** 7UJVL94SMJ
**Submission ID:** 6761419678

---

## SUBMIT OLDUKTAN SONRA "App Review" > "Reply" alanina YAPISTIR:

---

Hello App Review Team,

Thank you for the detailed feedback on our previous submission. We have addressed every point raised in Guideline 3.1.1 and Guideline 1.2. This new build (1.0.2 / 7) includes the following changes:

### Guideline 3.1.1 — In-App Purchase: Restore Purchases

We have added a "Restore Purchases" feature in TWO locations so it is always one tap away for the user:

1. **Paywall screen (abone-ol.tsx)** — Footer of the subscription screen displays an underlined "Satın Almaları Geri Yükle" (Restore Purchases) button directly above the logout link.
2. **Profile tab > Support card** — A dedicated "Satın Almaları Geri Yükle" menu item next to "Send Feedback" is available for users who are already signed in.

Implementation calls `Purchases.restorePurchases()` from the RevenueCat SDK (`react-native-purchases`). If an active entitlement is found, the user's `abonelik_durumu` in our Supabase `profiles` table is updated to `'aktif'` and the user is routed into the app. If no active subscription is found, a clear dialog informs the user.

### Guideline 1.2 — User-Generated Content

Our chat feature ("Rehber Sohbeti") now includes the full set of moderation tools required by 1.2:

1. **EULA acceptance before access** — On the login/registration screen users must explicitly accept our Terms of Use and Privacy Policy. The Terms now explicitly state our ZERO-TOLERANCE policy for objectionable content and abusive behavior (Section 6, updated 14 April 2026). URLs:
   - Terms: https://aysetokkus-lab.github.io/pusula-istanbul/#terms
   - Privacy: https://aysetokkus-lab.github.io/pusula-istanbul/

2. **Flag / Report content** — Users can long-press any chat message to open an action sheet with a "Mesajı Raporla" (Report Message) option. Reports are written to the `raporlanan_mesajlar` Supabase table and appear in our moderation dashboard in real time.

3. **Block abusive users** — The same long-press action sheet offers "Kullanıcıyı Engelle" (Block User). Blocking inserts a row into the new `engellenen_kullanicilar` table. The blocked user's messages are filtered out of the chat feed immediately (local Set + database-level filter), and the block is persistent across sessions and devices.

4. **Developer moderation within 24 hours** — All reports are reviewed within 24 hours. Content that violates the Terms is removed and the offending account is suspended or permanently deleted. An automated profanity filter (populated from the `kufur_listesi` table) additionally blocks obvious slurs at submission time.

5. **Automatic profanity filter** — Messages containing banned terms are rejected before reaching the database.

### How to test the new flow

1. Launch the app → the login screen shows the Terms/Privacy links BEFORE any access to chat.
2. Sign in with the demo account (provided in App Review Information: demo@pusulaistanbul.app / Test1234!).
3. Open the "Sohbet" (Chat) tab — header subtitle notes: "Uzun basarak raporlayın veya engelleyin".
4. Long-press ANY message by another user → action sheet opens with "Mesajı Raporla" and "Kullanıcıyı Engelle".
5. Tap "Kullanıcıyı Engelle" → confirmation dialog → after confirm, all messages from that user are removed from the feed.
6. Go to Profil tab → "Destek" card → "Satın Almaları Geri Yükle" is visible and functional.
7. Go to paywall (sign out and sign in with a trial-expired account, or expire the trial) → "Satın Almaları Geri Yükle" button is visible in the footer.

Thank you for your time. We're committed to keeping Pusula Istanbul a safe, professional tool for Turkey's licensed tour guides. Please let us know if any further clarification is needed.

Best regards,
Ayşe Tokkuş Bayar
info@pusulaistanbul.app

---

## BUILD ONCESI KONTROL LISTESI (Ayşe — senin icin)

### 1. Supabase'de SQL calistir (KRITIK — aksi halde engelleme crash verir)
```bash
# Supabase Dashboard > SQL Editor > New Query
# supabase-migration-engelleme.sql icerigini yapistir ve "Run"
```

### 2. Ekran kayitlari (Apple icin opsiyonel ama onay hizlandirir)
App Review Information > Notes alanina yapistir veya ekran video'su yukle:
- **EULA akisi:** Giris ekraninda Kullanim Kosullari/Gizlilik linkleri → tiklama → icerik goster
- **Flag:** Sohbet mesaji uzun bas → "Mesaji Raporla" tikla → onay dialog
- **Block:** Sohbet mesaji uzun bas → "Kullaniciyi Engelle" → onay → mesajlar kayboluyor
- **Restore:** Profil > Destek > "Satin Almalari Geri Yukle" tikla

### 3. Build + Submit
```bash
cd /Users/aysetokkus/istanbul-rehber

# iOS production build
eas build --platform ios --profile production

# iOS submit (build bittikten sonra)
eas submit --platform ios --latest

# Android production build (paralel yapabilirsin)
eas build --platform android --profile production

# Android submit (Play Console Alpha'ya)
eas submit --platform android --latest
```

### 4. App Store Connect'te resubmit
- App Store Connect > My Apps > Pusula İstanbul > v1.0.2
- "App Review" sekmesi > Reply textbox'ina yukaridaki mektubu yapistir
- "Submit for Review" tikla

### 5. Demo hesap kontrolu
- demo@pusulaistanbul.app / Test1234!
- abonelik_bitis: 2027 (zaten ayarli)
- abonelik_durumu: 'aktif' (kontrol et, gerekirse SQL ile ayarla)

---

## v1.0.2 DEGISIKLIK OZETI

### Yeni dosyalar
- `supabase-migration-engelleme.sql` — engellenen_kullanicilar tablosu + RLS + Realtime

### Duzenlenen dosyalar
- `app/(tabs)/sohbet.tsx` — Uzun basma action sheet (Raporla + Engelle), engellenenleri filtreleme
- `app/abone-ol.tsx` — Paywall footer'a "Satin Almalari Geri Yukle" butonu
- `app/(tabs)/profil.tsx` — Destek kartina "Satin Almalari Geri Yukle" menu item
- `app/kullanim-kosullari.tsx` — Section 6: Sifir tolerans politikasi, 3 moderasyon araci (rapor/engelle/filtre), 24 saat taahhut
- `app.json` — version 1.0.2, versionCode 8, buildNumber 7

### Etkilenen Supabase tablolari
- `engellenen_kullanicilar` (YENI) — id, engelleyen_id, engellenen_id, engellenen_isim, sebep, olusturulma_tarihi, bildirildi
