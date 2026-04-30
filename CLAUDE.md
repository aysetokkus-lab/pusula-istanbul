# Pusula Istanbul - Claude Oturum Indeksi

**Tarih (son guncelleme):** 29 Nisan 2026

---

## OKUMAN GEREKEN DOSYALAR — ZORUNLU, OPSIYONEL DEGIL

Bu CLAUDE.md'yi gordugun anda HEMEN, kullaniciya tek soru sormadan once, sirasiyla SU IKI DOSYAYI DA OKU:

1. `claude-context/STATE.md` — Su anki surum durumu, deploy durumu, aktif gorevler
2. `claude-context/PROJECT.md` — Tum teknik yapi, dosya yapisi, is mantigi, tasarim kurallari

Bu uc dosyayi (CLAUDE.md + STATE.md + PROJECT.md) okumadan kullaniciya cevap YAZMA. Toplam ~8k token, hepsi birden okunabilir, sorun degil.

Konu spesifikse asagidaki tabloya bak, **uygun moduli da hemen oku**. Birden fazla satira uyuyorsa hepsini oku.

| Kullanici sunlardan bahsediyorsa... | Hemen oku |
|---|---|
| Auth, sifre sifirlama, kayit, deep link, recovery, oturum acma | `DECISIONS.md` (ozellikle "Pending Pattern" + "RLS Sessiz Reddedebilir") |
| RevenueCat, IAP, satin alma, abonelik, premium gate, paywall | `DECISIONS.md` ("3 Katmanli Guvenlik Agi") + `INFRASTRUCTURE.md` ("RevenueCat") |
| Supabase, RLS, SQL, migration, jsonb, realtime | `DECISIONS.md` ("RLS Sessiz Reddedebilir", "Service Role Key") + `INFRASTRUCTURE.md` ("Supabase") |
| Email, SMTP, Resend, DKIM, DNS, template | `INFRASTRUCTURE.md` ("Email Altyapisi") |
| Yeni surum cikarma, build, eas submit, release notes | `INFRASTRUCTURE.md` ("EAS") + `CHANGELOG.md` (release notes formati) |
| Apple reject, App Store, EULA, subscription metadata | `DECISIONS.md` ("Paid Apps Agreement", "Subscription Group Localization") + `INFRASTRUCTURE.md` ("Apple") |
| Google Play, manifest, publish, alpha, license testing | `INFRASTRUCTURE.md` ("Google Play") |
| Bug, hata, "calismiyor", "olmuyor" — neyse | `ISSUES.md` (62 bug indeksli — benzer bir bug var mi diye once burada ara) |
| X API, Twitter, ulasim uyarisi, trafik bandi | `DECISIONS.md` ("Cift X API'den Global Timer'a") |
| Havalimani Ulasim, IST, SAW, Havaist, Havabus | `INFRASTRUCTURE.md` ("Havalimani Ulasim Veri Pipeline'i") |
| Eski surum ne degisti? v1.0.x ne icindeydi? | `CHANGELOG.md` |
| Tasarim kurali, emoji, renk, logo, font | `PROJECT.md` ("Tasarim Kurallari") |
| "Bu nasil yapilirdi?" / mimari tartisma | `DECISIONS.md` (24 mimari karar) |

---

## ASLA SORMAYACAGIN SORULAR

Asagidaki sorulari kullaniciya **sorma** — cevaplar bu dosyada veya okuman gereken modullerde mevcut. Sormak Ayse'nin vaktini bosa harcar ve onu sinirlendirir.

- "React Native surumun kac?" — **0.81.5** (`package.json`)
- "Expo SDK kac?" — **~54.0.33**
- "TypeScript surumun kac?" — **~5.9.2**
- "React surumun kac?" — **19.1.0**
- "Expo Router var mi?" — **Evet, ~6.0.23**
- "Hedef Android API/SDK kac?" — **Expo SDK 54'un getirdigi target = API 36 (Android 14)**, Expo prebuild ile yonetilir, app.json'da explicit yazmiyor
- "newArchEnabled aktif mi?" — **Evet** (reanimated 4.x icin zorunlu)
- "Bu uygulamayi tek basina mi gelistiriyorsun, ekiple mi?" — **Tek basina** (Ayse Tokkus Bayar — gelistirici, urun sahibi, profesyonel turist rehberi)
- "Bir geliştirici/ajansla mi calisiyorsun?" — **Hayir, Ayse + Claude**
- "Hangi backend kullaniyorsun?" — **Supabase** (URL: rzlfghjpsximthlolfxo.supabase.co)
- "Auth nasil?" — **Supabase Email/Password, email confirmation acik, custom SMTP (Resend)**
- "IAP nasil?" — **RevenueCat (entitlement: pro)** — App Store + Play Store
- "Bundle ID nedir?" — **com.pusulaistanbul.app**
- "Domain ne?" — **pusulaistanbul.app**
- "Hangi Node surumu?" — **Node 20 zorunlu (v24 uyumsuz)**
- "Expo Go calisir mi?" — **HAYIR**, native modules var (RC, expo-notifications, screen-capture). Custom dev client gerekir: `npx expo start --dev-client`
- "Apple/Google hesap aktif mi?" — **Ikisi de aktif**, Paid Apps Agreement Active (5 Nis 2026 - 31 Mar 2027)
- "Su an hangi surum yayinda?" — **STATE.md'ye bak, sorma. v1.0.8 App Store'da, v1.0.9 review'da.**
- "Proje dizini nerede?" — **/Users/aysetokkus/istanbul-rehber** (her zaman bu, sorma)

Eger `package.json`'a, `app.json`'a, ya da `eas.json`'a bakman lazim olan basit bir teknik soru varsa **dosyaya kendin bak**, kullaniciya sorma.

---

## KULLANICI: AYSE TOKKUS BAYAR

- **Tercih ettigi dil:** Türkçe (UI, kod yorumu, sohbet — hepsi)
- **Bilimsel/kanitli bilgi odakli, ateist, bilime inanir**
- **Iletisim tonu:** cesaret verici, konuskan, hossohbet, pratik, hemen konuya gir, kurumsal jargonla yaz
- **Yanitlarda empatik ve anlayisli ol, ileri gorusluluk benimse, guclu fikirleri rahatlikla paylas**
- **Uygun durumlarda hizli ve zekice esprilerle renklendir**
- **Ilgi alanlari (proje disi):** Tarihi Istanbul'da sokak yasami, sosyal hayat, ticaret, uretim, emek gucu
- **EMOJI YOK** (kesinlikle, kodda da, sohbette de — istemediginde kullanma)
- **Iyi Fransizca, orta Ingilizce, az Ispanyolca**
- 17 yasinda oglu var, evli
- Tup mide ameliyatli (8 Ocak 2024)
- **Iletisim:** info@pusulaistanbul.app — ayni zamanda app gelistiricisi

---

## PROJE OZETI — Hemen Anla

### Bu Uygulama Nasil Yapiliyor
**Pusula Istanbul, Claude Cowork ile gelistiriliyor.** Ayse Tokkus Bayar (profesyonel turist rehberi, 30 yillik marka emegi) urunun tek sahibi ve gelistiricisi — gelistirme partner'i olarak Claude'u (Cowork modu) kullaniyor. Klasik anlamda yazilim ekibi YOK, baska gelistirici/ajans YOK. Kararlari Ayse aliyor, kodu Claude yaziyor — ama kalite kontrol Ayse'de.

### Ne Yapan Bir Uygulama
**Pusula Istanbul** — Istanbul'daki profesyonel turist rehberleri icin **freemium** mobil uygulama. Hedef kullanici dar ve net: TUREB ruhsatli, sahada turla calisan rehber. Sundugu sey:

- **Operasyonel veri:** muze/saray/cami ziyaret saatleri (mevsimsel), gise kapanislari, giris ucretleri, MuzeKart gecerlilik
- **Anlik saha bilgisi:** muze yogunlugu/kuyruk durumu, ulasim arizalari (rayli sistem + IBB Ulasim trafigi), etkinlikler, gemi takvimi
- **Rehberden rehbere iletisim:** canli sohbet, saha guncellemeleri, raporlama/engelleme
- **Yardimcı:** havalimani transferleri (Havaist/Havabus), Bogaz turlari, doviz, namaz vakitleri (musterileri icin), acil durum (112)

### Temel Altyapi
- **Frontend:** React Native + Expo SDK 54 + TypeScript + Expo Router (tab + stack)
- **Backend:** Supabase (Postgres + Auth + Realtime + RLS)
- **Odeme:** RevenueCat (App Store + Play Store, entitlement: `pro`)
- **Email:** Custom SMTP (Resend Pro → AWS SES Dublin → kullanici)
- **Web:** GitHub Pages + custom domain (pusulaistanbul.app)
- **Web scraping:** Firecrawl MCP (havabus, sehirhatlari, millisaraylar)
- **CI/CD:** EAS Build + EAS Submit
- **Yapay zeka destek:** Claude Cowork (kod + mimari + bu dosyalar)

### Su An Hangi Asamadayiz (29 Nisan 2026)
**Henuz lansman YAPILMADI** — kasitli olarak. Kalite > momentum. Ayse 30 yillik markasini bug'li bir ucretli urunle riske atmiyor. Sira:

- **App Store:** v1.0.8 yayinda AMA **sifre sifirlama bug'i var** (ilk deneme tutmadi). v1.0.9 review'da, ~24-48 saat. Bu sefer **Manual release** secildi (v1.0.7 felaketi sonrasi karari).
- **Google Play:** v1.0.9 Production review'da (3-7 gun). Alpha'da fix DOGRULANDI — Ayse v1.0.9'u kendi telefonuna tester olarak kurdu, sifre sifirlama akisinin sorunsuz calistigini bizzat gordu.
- **6 Apple reject** atlatildi (Demo hesap, IAP Restore, iPad Design, EULA, Subscription Group Localization, Paid Apps Agreement). Hepsinin dersi `DECISIONS.md`'de.
- **Custom SMTP** kuruldu (26 Nis), email akisi calisiyor, 5 markali Turkce template hazir.
- **4 scheduled task** aktif (sehir hatlari iptal seferleri, havalimani tarife, muzeler, saraylar).
- **v1.1.0 planlamasi:** push notification altyapisi, X API'yi scheduled task'a tasimak, ana ekran widget'i.

Detayli surum durumu icin: `claude-context/STATE.md`

---

## CLAUDE-CONTEXT KLASORU YAPISI

```
istanbul-rehber/
├── CLAUDE.md                          (BU DOSYA — yalin index, ~2.5k token)
├── CLAUDE.md.eski                     (eski tek dosya, 31k token, yedek)
└── claude-context/
    ├── STATE.md                       (mevcut dinamik durum: surum, deploy, aktif gorevler)
    ├── PROJECT.md                     (statik proje bilgisi: tech, dosya, is mantigi, tasarim)
    ├── CHANGELOG.md                   (surum gecmisi, release notes, eski v1.0.x)
    ├── DECISIONS.md                   (24 mimari karar + ders — SIK BAKILACAK!)
    ├── ISSUES.md                      (bilinen sorunlar, 62 cozulmus bug)
    └── INFRASTRUCTURE.md              (email, EAS, Apple, Google, RC, DNS, scheduled tasks, havalimani pipeline)
```

### Dosyalari Guncel Tutma Disiplini
- **Yeni surum cikarinca:** `STATE.md` ve `CHANGELOG.md` guncellenir
- **Yeni mimari karar / kalici ders:** `DECISIONS.md`'ye eklenir
- **Yeni bug fix:** `ISSUES.md`'ye eklenir
- **Yeni servis / DNS / EAS env:** `INFRASTRUCTURE.md` guncellenir
- **Yeni hook / ekran / kategori:** `PROJECT.md` guncellenir
- **Bu dosya (`CLAUDE.md`):** YALNIZCA "snapshot" + tablo guncellemesi gerekiyorsa

---

## HIZLI KOMUT REFERANSI

### Build & Submit
```bash
eas build --platform all --profile production
eas submit --platform ios --latest
eas submit --platform android --latest
```

### EAS Env (eski `eas secret:*` deprecated)
```bash
eas env:create --name <NAME> --value "..." --environment production --visibility sensitive
eas env:list --environment production
```

### Mevsim Gecisi (Muzeler — 1 Mayis'ta calistirilacak)
```sql
UPDATE mekan_saatleri SET aktif_mevsim = 'yaz', guncelleme_tarihi = NOW()
WHERE mevsimsel = true AND tip NOT IN ('saray', 'kasir');
```

### Demo Hesap Sifre Reset
```sql
UPDATE auth.users SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email = 'aysetokkus@hotmail.com';
```

### Node 20
```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
```

### Development Build
```bash
npx expo start --dev-client
```

---

## TEMEL KIMLIKLER

| Servis | Bilgi |
|--------|-------|
| Apple Team ID | `7UJVL94SMJ` |
| App Store App ID | `6761419678` |
| Bundle/Package | `com.pusulaistanbul.app` |
| Scheme | `pusulaistanbul` |
| Supabase URL | `https://rzlfghjpsximthlolfxo.supabase.co` |
| RC Entitlement | `pro` |
| Demo (premium) | aysetokkus@hotmail.com / 123456 |
| Demo (suresi dolmus) | demo.test@pusulaistanbul.app / 123456 |
| Web | https://pusulaistanbul.app |

Detayli kimlikler, API anahtarlari ve servis konfigurasyonlari `INFRASTRUCTURE.md`'de.

---

## ERISIMLER (Yeni oturumda lazim olabilir)

Asagidaki linklere ihtiyacin olabilir, kullanici tarayicidan acabilir veya sana yapistirabilir:

- Supabase Dashboard: https://supabase.com/dashboard/project/rzlfghjpsximthlolfxo
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- EAS Build: https://expo.dev/accounts/pusula-istanbul-app/projects/pusula-istanbul/builds
- RevenueCat: https://app.revenuecat.com
- Resend: https://resend.com
- GoDaddy DNS: https://dcc.godaddy.com/manage/dns
- Web Sayfasi: https://pusulaistanbul.app
- Scheduled Task Klasoru (Mac): `/Users/aysetokkus/Documents/Claude/Scheduled`
- Firecrawl MCP: Web scraping (Hobby plan, ~3000 kredi/ay)
