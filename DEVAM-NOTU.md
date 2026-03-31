# Pusula Rehber — Devam Notu (23 Mart 2026)

Aşağıdaki metni yeni oturumda yapıştır:

---

## YAPTIŞTIR:

Bu proje "Pusula Rehber" — profesyonel İstanbul turist rehberleri için React Native Expo uygulaması. Kaldığımız yerden devam ediyoruz.

### Teknoloji:
- React Native Expo (SDK 54, React 19.1, Expo Router 6.0.23)
- `expo-linear-gradient`, `@expo-google-fonts/poppins`, `expo-image`, `expo-font`, `expo-splash-screen`
- Supabase (auth + real-time data)
- Light mode aktif (`hooks/use-tema.ts` → `isDark = false`)

### Proje Yapısı:
```
app/(tabs)/
  _layout.tsx    — 4 tab: Ana Sayfa, Acil, Ara, Profil (+ muzeler, bogaz, ulasim, muzeKart gizli)
  index.tsx      — Ana sayfa (~580 satır) — tüm gradient bantlar, 8'li ikon grid, modaller
  acil.tsx       — Acil numaralar, hesap
  ara.tsx        — Arama ekranı (placeholder)
  profil.tsx     — Profil ekranı (placeholder)
  muzeler.tsx    — 32 mekan, kategori, detay modal
  bogaz.tsx      — Vapur sefer saatleri
  ulasim.tsx     — Havalimanı ulaşım
  muzeKart.tsx   — Müze Kart bilgileri

components/
  canli-durum-panel.tsx — useSahaBildir hook + CanliDurumOzet + DurumBildirModal

constants/theme.ts — Palette, Space, Radius, TemaRenkleri, light/dark

hooks/
  use-tema.ts        — { t, isDark }
  use-canli-durum.ts — Supabase real-time saha bildirimleri

assets/icons/ — 8 SVG (beyaz line-art): namaz-vakitleri, muzeler, saraylar, bogaz-turlari, havalimani-ulasim, gemi-tarihleri, doviz-kuru, logo
```

### Ana Sayfa (index.tsx) Yapısı (yukarıdan aşağıya):
1. **Header** — `pusula [logo] istanbul`, mavi diagonal gradient `['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']`, Poppins font, logo ortada, yazılar `flex:1` ile simetrik
2. **Greeting Strip** — Aynı mavi gradient, saat (sol), "Hoş geldin" + canlı hava durumu (wttr.in API) + "İyi turlar" (sağ), tüm yazılar beyaz
3. **Saha Durumu bandı** — Aynı mavi gradient, "+ Bildir" butonu → useSahaBildir hook ile DurumBildirModal açılıyor
4. **Sultan Ahmet Camii bandı** — Aynı mavi gradient, tıklanınca Sultanahmet modal açılıyor, sağda AÇIK/KAPALI durumu
5. **Yaklaşan Etkinlikler bandı** — Sarı-turuncu-kırmızı diagonal gradient `['#FFD60A', '#FF9F1C', '#E63946', '#C1121F']`
6. **Ulaşım Uyarıları bandı** — Aynı sarı-kırmızı gradient
7. **8'li İkon Grid** (4x2) — Gradient mavi daireler, SVG ikonlar (44x44), sıra: Namaz, Müzeler, Saraylar, Boğaz, Havalimanı, Müze Kart, Gemi, Döviz
8. **Bugünkü Gemi Listesi bandı** — Aynı sarı-kırmızı gradient + gemi kartı/modal
- Tüm bantlar arası 3px beyaz `whiteSeparator`
- 3 Modal: Gemi Takvimi, Sultanahmet, Ayasofya
- Canlı hava durumu: wttr.in API, emoji ikon eşleme
- Sultanahmet ziyaret pencereleri: namaz vakitlerine göre dinamik hesaplama
- Galataport gemi takvimi: Mart-Mayıs 2026 verileri

### Canva Mockup Tasarım Kuralları:
- Poppins font ailesi (Regular, SemiBold, Bold, ExtraBold)
- `pusula` ve `istanbul` küçük harf
- Mavi gradient: `['#00A8E8', '#0077B6', '#0096C7', '#48CAE4']` diagonal
- Sarı-kırmızı gradient: `['#FFD60A', '#FF9F1C', '#E63946', '#C1121F']` diagonal
- Bantlar arası beyaz çizgi (3px)
- İkon daireleri gradient mavi, ikonlar beyaz SVG line-art
- Light mode, beyaz arka plan

### Tamamlanan İşler:
- Header gradient + logo ortalaması (flex:1 simetri)
- Greeting strip mavi gradient + canlı hava durumu (wttr.in)
- Tüm mavi bantlar aynı gradient (header = saat = saha = sultan ahmet)
- Tüm sarı-kırmızı bantlar aynı gradient + diagonal efekt
- Beyaz separatörler eşit kalınlıkta (3px)
- CanliDurumOzet kartı kaldırıldı (sadece bant)
- Sultanahmet kartı kaldırıldı (bant tıklanabilir → modal)
- Grid 4 sütun (4x2) düzeltildi
- İkon boyutu büyütüldü (44x44)
- Havalimanı SVG beyaz yapıldı
- Ara + Profil tabları eklendi
- Bildir butonu çalışır hale getirildi (useSahaBildir hook)
- Hava durumu: büyük font (18px, bold, beyaz)

### Yapılacaklar / Bilinen Eksikler:
- Grid ikon tıklamaları → ilgili ekranlara navigasyon (onPress handler'lar)
- Kullanıcı adını Supabase'den çekip "user surname" yerine göstermek
- Yaklaşan Etkinlikler ve Ulaşım Uyarıları bantlarına gerçek veri/içerik
- Namaz Vakitleri sayfası (grid'den tıklanınca açılacak)
- Döviz Kuru sayfası
- Saraylar sayfası
- Diğer ekranların mockup'a uygun tasarımı
- Tab bar ikonları emoji yerine SVG/ikon olabilir
- Dark mode toggle (altyapı hazır, şu an kapalı)
- Pull-to-refresh hava durumunu da güncelliyor (zaten aktif)

### Önemli Dosya Konumları:
- Ana sayfa: `app/(tabs)/index.tsx`
- Tab layout: `app/(tabs)/_layout.tsx`
- Root layout: `app/_layout.tsx`
- Tema: `constants/theme.ts`
- Saha bildirimi: `components/canli-durum-panel.tsx`
- Hook'lar: `hooks/use-tema.ts`, `hooks/use-canli-durum.ts`
- SVG ikonlar: `assets/icons/`

`app/(tabs)/index.tsx` dosyasını oku ve kaldığımız yerden devam et.
