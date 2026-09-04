# Pusula İstanbul — Aylık Maliyet Raporu (3 Eylül 2026)

Kaynak: Gmail'deki gerçek makbuzlar (Ağustos 2026) + INFRASTRUCTURE.md. Kur: 1 USD = 50,17 TRY (Expo makbuzundaki Stripe kuru, 30 Ağu 2026).

## 1. Gerçekleşen aylık giderler

| Servis | Plan | Aylık (USD) | Aylık (TL) | Kaynak / Not |
|---|---|---:|---:|---|
| Supabase Pro | org `istanbul-rehber` | 25,00 (Ağu: 30,00) | 1.254 (1.505) | Fatura HUHONH-00008, 26 Ağu — Ağustos'ta +5 $ aşım var (compute/egress kontrol edilmeli) |
| Resend Transactional Pro | 50K mail/ay | 20,00 | 1.003 | Makbuz #2821-1442, 29 Ağu (26 Ağu'da kart reddedildi, 29'da ödendi) |
| Expo EAS Starter | 86 MAU, 5 Android build | 19,00 | 953 | Makbuz #2272-1036, 30 Ağu — 5 build = 5 $, plan kredisiyle sıfırlandı (27 Ağu'da kart reddedildi) |
| X Developer Platform | Pay-per-use, 25 $'lık yüklemeler | ~8–15 | ~400–750 | Yüklemeler: 29 Mar, 27 Nis, 4 Haz (her biri 25 $). Server-side bota geçişten (6 May) beri yükleme aralığı uzadı; Haziran'dan beri yeni yükleme yok |
| RevenueCat | Free (2.500 $ MTR altı) | 0 | 0 | Gelir eşiğinin çok altında |
| Apple Developer Program | 99 $/yıl (31 Mar 2026 üyelik) | 8,25 | 414 | Yıllık; yenileme Mart 2027 |
| Google Play Developer | 25 $ tek seferlik | 0 | 0 | Ödenmiş, tekrar yok |
| pusulaistanbul.app (GoDaddy) | .app yıllık | ~1,70 | ~85 | Makbuz Gmail'de yok (tahmini ~20 $/yıl) |
| GitHub Pages (web) | Free | 0 | 0 | — |
| Firecrawl | İPTAL (24 Haz 2026) | 0 | 0 | Artık gider değil |
| **TOPLAM** | | **~82–89 $** | **~4.100–4.500 TL** | Supabase aşımı olan aylarda ~+5 $ |

Not: Gmail'de görünen Transkriptor (99,99 $) ve Leonardo/ElevenLabs ödemeleri Pusula'ya ait değil (içerik üretimi), bu rapora dahil edilmedi.

## 2. Gelir tarafı (referans)
RevenueCat'te ~8 aktif abonelik (1 May 2026 ölçümü). 99 TL/ay × 8 ≈ 792 TL brüt, mağaza payı (%15–30) sonrası ≈ 550–670 TL net. Yani mevcut gelir aylık giderin yaklaşık **%15'ini** karşılıyor — uygulama zaten fiilen sübvanse ediliyor. Ücretsiz modele geçişin gelir kaybı ~600 TL/ay.

## 3. Ücretsiz model sonrası maliyet etkisi

**Kural (Ayşe, 3 Eyl 2026): Resend, Expo ve Supabase abonelikleri Hey İstanbul ile ortak kullanılıyor — iptal/downgrade YOK.** Bu üçü sabit giderdir; iki ürünün ortak altyapı bedeli olarak okunmalı (Pusula'ya düşen pay fiilen ~yarısı).

| Kalem | Etki |
|---|---|
| RevenueCat SDK kaldırıldı | 0 $ (zaten free) — ama native modül gitti, build küçüldü, Apple/Google abonelik metadata yükümlülükleri bitti |
| Mağaza abonelik ürünleri satıştan kalkıyor | Gelir −~600 TL/ay; giderde değişiklik yok |
| X API | Ulaşım uyarıları kaldıkça devam (~8–15 $) |
| Supabase +5 $ aşım (Ağustos) | Dashboard → Billing'den kalem kontrol edilmeli (compute/egress/Edge Function) — iki projenin ortak faturası |
| EAS build | Starter planda 5 build = 5 $ kredi ile sıfırlandı; redesign'ın store build'leri (Android+iOS ~2–4 build) bir aylık krediyi aşabilir → +5–15 $ o ay |

**Sonuç:** Ücretsiz model giderleri değiştirmiyor; aylık sabit gider ~82–89 $ (≈4.100–4.500 TL) olarak kalır, bunun Resend+Supabase+Expo kısmı (64 $) Hey İstanbul ile paylaşımlı.

## 4. Dikkat
- **Kart sorunu:** 26–27 Ağustos'ta Resend ve Expo tahsilatları önce reddedildi (Resend ₺1.001, Expo ₺951), birkaç gün sonra geçti. Mayıs'ta Supabase "Pending Shutdown" uyarısı da vardı. Canlı uygulamanın altyapısı için kartın limit/geçerlilik durumu takip edilmeli; Supabase kapanırsa uygulama komple durur.
- Yıllık kalemler (Apple 99 $ + domain ~20 $) nakit akışında Mart ayına yığılır.
