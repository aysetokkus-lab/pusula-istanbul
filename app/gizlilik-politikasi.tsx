// Eyl 2026 redesign — "Kobalt & Menekşe"; işlev değişmedi.
// Yalnızca tipografi (Poppins Font + tema tokenları) yeniden boyandı; metinler ve insets kullanımı aynen.
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../hooks/use-tema';
import { Font } from '../constants/theme';

/* ═══════════════════════════════════════════
   Gizlilik Politikası & KVKK Aydınlatma Metni
   Pusula İstanbul — Profesyonel Rehber Uygulaması
   ═══════════════════════════════════════════ */

export default function GizlilikPolitikasi() {
  const insets = useSafeAreaInsets();
  const { t } = useTema();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={[styles.icerik, { paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={[styles.baslik, { color: t.text }]}>Gizlilik Politikası ve KVKK Aydınlatma Metni</Text>
      <Text style={[styles.tarih, { color: t.textMuted }]}>Son güncelleme: 4 Eylül 2026</Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>1. Veri Sorumlusu</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Pusula İstanbul uygulaması, Ayşe Tokkuş Bayar tarafından geliştirilmiş ve işletilmektedir.
        Bu gizlilik politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında
        kişisel verilerinizin nasıl işlendiğini açıklamaktadır.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>2. Toplanan Veriler</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Uygulama, yalnızca hizmetin çalışması için gereken verileri toplar:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Kimlik bilgileri: Ad, soyad, isteğe bağlı profil fotoğrafı</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• İletişim bilgileri: E-posta adresi, cep telefonu numarası (beyan usulü, doğrulama kodu gönderilmez)</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Mesleki bilgiler: TUREB ruhsat numarası, ruhsatnamenizde ekli olan diller, TUREB rehber veritabanındaki kayıt durumu (ad-soyad eşleşmesiyle)</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Giriş bilgileri: Google veya Apple ile giriş yaptıysanız bu hesaplardan gelen ad, soyad ve e-posta</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Kullanım verileri: Genel sohbet mesajları ve görselleri, saha bildirimleri, iş ilanları, tepkiler</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Özel veriler: Özel mesajlar (DM) ve görselleri, tur ajandası, masraf pusulası, rehberlik ücreti, avans ve fiş fotoğrafları (bkz. Madde 5)</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Cihaz verileri: Bildirim gönderebilmek için cihazınıza ait anlık bildirim (push) belirteci, işletim sistemi ve uygulama sürümü</Text>
      <Text style={[styles.altBaslik, { color: t.text }]}>3. Verilerin İşlenme Amacı</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Kullanıcı hesabı oluşturma, giriş ve hesap yönetimi</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Rehberler arası iletişim (genel sohbet, özel mesaj), iş ilanları ve saha bilgisi paylaşımı</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Tur ajandası ve masraf pusulası tutma; masraf dosyalarını sizin seçtiğiniz alıcıya göndermeniz</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Anlık bildirimler (yalnızca açık bıraktığınız kategoriler)</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Genel sohbet ve ilanlarda içerik moderasyonu, kötüye kullanımın önlenmesi</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Uygulama iyileştirme; kişisel veriler reklam amacıyla kullanılmaz, üçüncü kişilere satılmaz</Text>
      <Text style={[styles.altBaslik, { color: t.text }]}>4. Verilerin Aktarımı ve Hizmet Sağlayıcılar</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Verileriniz yalnızca hizmetin çalışması için gereken altyapı sağlayıcılarına aktarılır:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Supabase Inc. — Veritabanı, kimlik doğrulama ve dosya depolama; sunucular Almanya (Frankfurt, AB)</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Expo (650 Industries, Inc.) — Anlık bildirim iletimi (ABD); bildirim başlığı ve kısa önizleme metni bu servis üzerinden geçer</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Resend, Inc. — Hesap ve bilgilendirme e-postaları (ABD / AB sunucuları)</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Google LLC / Apple Inc. — Yalnızca bu hesaplarla giriş yapmayı seçtiyseniz, kimlik doğrulama</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• TUREB (Turist Rehberleri Birliği) — Rozet için ad-soyadınız TUREB’in herkese açık rehber veritabanında sorgulanır; başka veri gönderilmez</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Uygulama içinde ücretli özellik veya abonelik yoktur; ödeme verisi toplanmaz. Aktarımlar KVKK’nın 9. maddesi kapsamında, yeterli korumayı taahhüt eden veri sorumluları ile gerçekleştirilmektedir.
      </Text>
      <Text style={[styles.altBaslik, { color: t.text }]}>5. Özel Mesajlar, Ajanda ve Masraf Verileri</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Özel mesajlarınız (DM), tur ajandanız, masraf pusulanız, rehberlik ücretleriniz, avanslarınız ve fiş fotoğraflarınız size özeldir:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Bu veriler uygulama üzerinden Pusula İstanbul yöneticileri ve moderatörleri dahil hiç kimse tarafından görüntülenemez. Erişim, veritabanı seviyesinde satır bazlı güvenlik kurallarıyla (RLS) yalnızca veri sahibine (özel mesajlarda yalnızca iki katılımcıya) kısıtlanmıştır.</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Özel mesaj görselleri ve fiş fotoğrafları herkese açık olmayan özel depolama alanlarında tutulur; yalnızca yetkili kişiye süreli imzalı bağlantıyla gösterilir.</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Masraf pusulası dosyaları (PDF/Word/Excel) sizin oturumunuzla üretilir ve yalnızca sizin seçtiğiniz kanaldan (telefonunuzun e-posta uygulaması, WhatsApp, cihaza kaydetme) gönderilir; Pusula İstanbul bu dosyaları kimseye göndermez ve saklamaz.</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Bir özel mesajı raporladığınızda yalnızca raporladığınız mesajın metni moderatöre iletilir.</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Veriler aktarım sırasında (TLS) ve depoda şifreli tutulur.</Text>
      <Text style={[styles.altBaslik, { color: t.text }]}>6. Verilerin Saklanma Süresi</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap silme talebinde bulunmanız halinde hesabınız ve size ait tüm veriler (özel mesajlar, ajanda, masraflar ve fişler dahil) 30 gün içinde silinir. Yasal zorunluluklar saklıdır.
      </Text>
      <Text style={[styles.altBaslik, { color: t.text }]}>7. Haklarınız (KVKK Madde 11)</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        KVKK kapsamında aşağıdaki haklara sahipsiniz:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Kişisel verilerinizin işlenip işlenmediğini öğrenme</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• İşlenmişse buna ilişkin bilgi talep etme</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Aktarıldığı üçüncü kişileri bilme</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Eksik veya yanlış işlenmişse düzeltilmesini isteme</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Silinmesini veya yok edilmesini isteme</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• İşlenen verilerin münhasıran otomatik sistemler aracılığıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Kanuna aykırı işleme sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</Text>
      <Text style={[styles.altBaslik, { color: t.text }]}>8. Çocukların Gizliliği</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Pusula İstanbul, profesyonel turist rehberlerine yönelik bir uygulamadır. 18 yaşından küçük bireylerin kişisel verilerini bilerek toplamıyoruz.
      </Text>
      <Text style={[styles.altBaslik, { color: t.text }]}>9. Güvenlik</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Kişisel verilerinizin güvenliği için güvenli bağlantılar (TLS), depoda şifreleme, satır bazlı erişim kuralları (RLS) ve erişim kontrolü mekanizmaları kullanılmaktadır. Supabase altyapısı SOC 2 Type II sertifikalıdır.
      </Text>
      <Text style={[styles.altBaslik, { color: t.text }]}>10. Değişiklikler</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişikliklerde uygulama içi bildirim yapılacaktır.
      </Text>
      <Text style={[styles.altBaslik, { color: t.text }]}>11. İletişim</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Gizlilik ile ilgili sorularınız ve KVKK kapsamındaki başvurularınız için:{'\n'}
        E-posta: info@pusulaistanbul.app
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  icerik: { paddingHorizontal: 16, paddingTop: 20 },
  baslik: {
    fontFamily: Font.extrabold,
    fontSize: 20,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  tarih: {
    fontFamily: Font.regular,
    fontSize: 11,
    marginBottom: 24,
  },
  altBaslik: {
    fontFamily: Font.bold,
    fontSize: 16,
    letterSpacing: -0.3,
    marginTop: 20,
    marginBottom: 8,
  },
  paragraf: {
    fontFamily: Font.regular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  madde: {
    fontFamily: Font.regular,
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 8,
    marginBottom: 4,
  },
});
