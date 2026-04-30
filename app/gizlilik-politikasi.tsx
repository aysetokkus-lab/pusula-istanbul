import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../hooks/use-tema';

/* ═══════════════════════════════════════════
   Gizlilik Politikası & KVKK Aydınlatma Metni
   Pusula İstanbul — Profesyonel Rehber Uygulaması
   ═══════════════════════════════════════════ */

export default function GizlilikPolitikasi() {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useTema();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bgCard }]}
      contentContainerStyle={[styles.icerik, { paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={[styles.baslik, { color: t.text }]}>Gizlilik Politikası ve KVKK Aydınlatma Metni</Text>
      <Text style={[styles.tarih, { color: t.textMuted }]}>Son güncelleme: 16 Nisan 2026</Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>1. Veri Sorumlusu</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Pusula İstanbul uygulaması, Ayşe Tokkuş Bayar tarafından geliştirilmiş ve işletilmektedir.
        Bu gizlilik politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında
        kişisel verilerinizin nasıl işlendiğini açıklamaktadır.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>2. Toplanan Veriler</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Uygulamamız aşağıdaki kişisel verileri toplamaktadır:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Kimlik bilgileri: Ad, soyad</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• İletişim bilgileri: E-posta adresi</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Mesleki bilgi: TUREB ruhsat numarası</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Konum bilgisi: Şehir (kullanıcı tarafından girilen)</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Kullanım verileri: Uygulama içi etkileşimler, sohbet mesajları</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Abonelik bilgileri: Abonelik durumu, plan türü</Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>3. Verilerin İşlenme Amacı</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Kullanıcı hesabı oluşturma ve yönetimi</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Uygulama hizmetlerinin sunulması</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Sohbet ve iletişim özelliklerinin sağlanması</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Abonelik yönetimi ve ödeme işlemleri</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• İçerik moderasyonu ve güvenlik</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Uygulama iyileştirme ve analiz</Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>4. Verilerin Aktarımı</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Kişisel verileriniz aşağıdaki üçüncü taraflarla paylaşılabilir:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Supabase Inc. — Veritabanı altyapı hizmeti (ABD)</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• RevenueCat Inc. — Abonelik yönetim hizmeti (ABD)</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Apple Inc. / Google LLC — Uygulama mağazası ve ödeme işlemleri</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Bu aktarımlar, KVKK'nın 9. maddesi kapsamında yeterli koruma bulunan ülkelere
        veya yeterli korumayı taahhüt eden veri sorumluları ile gerçekleştirilmektedir.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>5. Verilerin Saklanma Süresi</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap silme talebinde
        bulunmanız halinde verileriniz 30 gün içinde silinir. Yasal zorunluluklar saklıdır.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>6. Haklarınız (KVKK Madde 11)</Text>
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

      <Text style={[styles.altBaslik, { color: t.text }]}>7. Çocukların Gizliliği</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Pusula İstanbul, profesyonel turist rehberlerine yönelik bir uygulamadır.
        18 yaşından küçük bireylerin kişisel verilerini bilerek toplamıyoruz.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>8. Güvenlik</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Kişisel verilerinizin güvenliği için endüstri standardı şifreleme, güvenli bağlantılar (SSL/TLS)
        ve erişim kontrolü mekanizmaları kullanılmaktadır. Supabase altyapısı, SOC 2 Type II
        sertifikalıdır.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>9. Değişiklikler</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişikliklerde
        uygulama içi bildirim yapılacaktır.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>10. İletişim</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Gizlilik ile ilgili sorularınız ve KVKK kapsamındaki başvurularınız için:{'\n'}
        E-posta: info@pusulaistanbul.app
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  icerik: { padding: 20 },
  baslik: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  tarih: {
    fontSize: 12,
    marginBottom: 24,
  },
  altBaslik: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraf: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  madde: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 8,
    marginBottom: 4,
  },
});
