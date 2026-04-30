# Pusula Istanbul — Store Screenshot Tasarim Rehberi

Bu rehber, Google Play ve App Store icin gerekli tum gorsel materyallerin boyutlarini, baslik metinlerini ve tasarim ipuclarini icerir.

---

## 1. BOYUT TABLOSU

| Materyal | Boyut (px) | Kullanim |
|----------|-----------|----------|
| Google Play Screenshot | 1080 x 1920 | Telefon (Samsung S22 cozunurlugu yeterli) |
| Google Play Feature Graphic | 1024 x 500 | Store ust banner (ZORUNLU) |
| App Store 6.7" (ZORUNLU) | 1290 x 2796 | iPhone 14 Pro Max / 15 Pro Max |
| App Store 5.5" (OPSIYONEL) | 1242 x 2208 | iPhone 8 Plus |

**Not:** Samsung S22 screenshot'lari 1080x2340 — Google Play icin dogrudan kullanilabilir. App Store icin Canva'da 1290x2796 boyutunda tasarim olusturup telefon mockup'i icine yerlestir.

---

## 2. SCREENSHOT LISTESI (6 Adet)

### Screenshot 1: Ana Sayfa
- **Ekran:** index.tsx (Ana Sayfa)
- **Gosterilecek:** Hava durumu, namaz vakitleri, gemi takvimi, canli durum grid ikonu
- **Baslik (TR):** Istanbul Rehberliginde Dijital Pusulaniz
- **Alt Baslik:** Hava, namaz, gemi takvimi ve canli saha durumu tek ekranda

### Screenshot 2: Canli Muze Durumu
- **Ekran:** Canli durum paneli veya muzeler.tsx
- **Gosterilecek:** Muze yogunluk bilgileri (Normal / Yogun / Kapali durumlari gorunsun)
- **Baslik (TR):** Anlik Muze Yogunluk Bilgisi
- **Alt Baslik:** 32+ muze ve sarayin kuyruk durumunu aninda gorun

### Screenshot 3: Rehber Sohbeti
- **Ekran:** sohbet.tsx
- **Gosterilecek:** Birkac ornek mesajla dolu sohbet ekrani
- **Baslik (TR):** Meslektaslarinizla Anlik Iletisim
- **Alt Baslik:** Guvenligi oncelikli, sifrelenmis rehber sohbet odasi

### Screenshot 4: Ulasim Bilgileri
- **Ekran:** ulasim.tsx
- **Gosterilecek:** Metro/tramvay/vapur hatlari, varsa bir uyari bandi
- **Baslik (TR):** Ulasim Uyarilari ve Hat Bilgileri
- **Alt Baslik:** Metro, tramvay, vapur ve Marmaray hatlari anlik takip

### Screenshot 5: Muze Kart / Muze Saatleri
- **Ekran:** muzeKart.tsx veya muzeler.tsx detay
- **Gosterilecek:** Muze saatleri, fiyatlar, MuzeKart gecerlilik bilgisi
- **Baslik (TR):** 32+ Muze ve Saray Bilgisi
- **Alt Baslik:** Saatler, fiyatlar ve MuzeKart gecerliligi tek yerde

### Screenshot 6: Acil Durum
- **Ekran:** acil.tsx
- **Gosterilecek:** Acil numaralar ve linkler listesi
- **Baslik (TR):** Kritik Bilgiler Bir Dokunus Uzaginda
- **Alt Baslik:** Acil durum numaralari ve muze iletisim hatlari

---

## 3. FEATURE GRAPHIC (1024 x 500)

Google Play store sayfasinin en ustunde gorunen banner gorsel.

- **Boyut:** 1024 x 500 piksel
- **Arkaplan:** Linear gradient soldan saga: #005A8D -> #0077B6 -> #0096C7
- **Ortada:** Pusula Istanbul logosu (windrose, beyaz) + "Pusula Istanbul" yazisi
- **Alt metin:** "Profesyonel Turist Rehberlerinin Dijital Yol Arkadasi"
- **Font:** Poppins Bold (baslik), Poppins Regular (alt metin)
- **Renk:** Beyaz metin, mavi gradient arkaplan
- **DIKKAT:** Onemli icerik tam ortada olmali — kenar boslugu en az 80px birak (kusuk ekranlarda kirpilabilir)

---

## 4. CANVA TASARIM IPUCLARI

### Genel Yaklasim
Her screenshot icin Canva'da su yapıyi kullan:
1. Ust kisim (%30): Baslik metni (beyaz, Poppins Bold)
2. Orta kisim (%60): Telefon mockup'i icinde gercek screenshot
3. Alt kisim (%10): Marka rengi gradient veya bos alan

### Arkaplan Secenekleri
- **Secenek A — Duz gradient:** #005A8D -> #0077B6 -> #0096C7 (uygulama renk paleti)
- **Secenek B — Acik arkaplan:** #F0F8FF (cok acik mavi) + mavi metin
- **Secenek C — Istanbul temalı:** Hafif bulanik Istanbul silueti + gradient overlay

### Telefon Mockup
- Canva'da "Elements" > "Frames" > "Phone" ara
- Veya "Mockups" bolumunden Samsung/Android telefon cercevesi sec
- Screenshot'i cerceve icine surukle-birak

### Tipografi
- Baslik: Poppins Bold, 48-60px, beyaz
- Alt baslik: Poppins Regular, 24-32px, beyaz veya #48CAE4 (acik mavi)
- Emoji KULLANMA

### Renk Paleti (Hizli Kopyala)
- Istanbul Mavi: #0077B6
- Koyu Mavi: #005A8D
- Orta Mavi: #0096C7
- Acik Mavi: #48CAE4
- Parlak Mavi: #00A8E8
- Beyaz: #FFFFFF

---

## 5. STORE LISTING METINLERI

### Google Play

**Uygulama Adi:** Pusula Istanbul

**Kisa Aciklama (max 80 karakter):**
Istanbul rehberleri icin canli muze durumu, ulasim ve sohbet platformu

**Uzun Aciklama:**
Pusula Istanbul, Istanbul'daki profesyonel turist rehberleri icin gelistirilen kapsamli bir mobil uygulamadir.

Canli Saha Durumu: 32'den fazla muze ve sarayin anlik kuyruk ve yogunluk bilgilerini takip edin. Hangi muzenin bosaldigi, hangisinin yogun oldugu parmaklarinizin ucunda.

Lojistik ve Ulasim: Metro, tramvay, vapur ve Marmaray hatlarinin anlik durumunu gorun. Havalimani ulasim sefer saatleri, Bogaz turu tarifeleri ve Galataport kruvaziyer gemi takvimi tek uygulamada.

Rehber Sohbet Odasi: Meslektaslarinizla guvenli ve anlik iletisim kurun. Saha guncellemelerini paylassin, kuyruk bilgisi alin, guzergah onerileri degistirin.

Kent Etkinlikleri: Kapanan yollar, mitingler, konser ve etkinlikler, guzergah degisiklikleri — hepsinden aninda haberdar olun.

Kritik Bilgiler: Acil durum numaralari, muze iletisim hatlari, MuzeKart gecerlilik bilgileri ve daha fazlasi.

Pusula Istanbul — profesyonel turist rehberlerinin dijital yol arkadasi.

### App Store

**Uygulama Adi:** Pusula Istanbul
**Alt Baslik:** Profesyonel Rehber Asistani

**Anahtar Kelimeler (max 100 karakter, virgul ile ayir):**
istanbul,rehber,turist,muze,ulasim,sohbet,kuyruk,yogunluk,vapur,tramvay

**Aciklama:**
(Google Play uzun aciklamasinin aynisi kullanilabilir)

**Kategori:** Utilities (zaten secilmis)
**Icerik Derecelendirmesi:** 12+ (sohbet ozelligi)

---

## 6. KONTROL LISTESI

- [ ] 6 adet screenshot alindi (Ana Sayfa, Muze, Sohbet, Ulasim, MuzeKart, Acil)
- [ ] Google Play: 1080x1920 boyutunda 6 screenshot tasarimi (telefon mockup + baslik)
- [ ] Google Play: 1024x500 Feature Graphic
- [ ] App Store: 1290x2796 boyutunda 6 screenshot tasarimi (6.7 inch)
- [ ] App Store: 1242x2208 boyutunda screenshot tasarimi (5.5 inch, opsiyonel)
- [ ] Tum basliklar Turkce ve emoji icerikmiyor
- [ ] Screenshot koruması sohbet.tsx'de geri acildi
- [ ] Metinler Google Play ve App Store'a girildi
