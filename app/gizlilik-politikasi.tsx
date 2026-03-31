import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ═══════════════════════════════════════════
   Gizlilik Politikası & KVKK Aydınlatma Metni
   Pusula İstanbul — Profesyonel Rehber Uygulaması
   ═══════════════════════════════════════════ */

export default function GizlilikPolitikasi() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.icerik, { paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={styles.baslik}>Gizlilik Politikası ve KVKK Aydınlatma Metni</Text>
      <Text style={styles.tarih}>Son güncelleme: 28 Mart 2026</Text>

      <Text style={styles.altBaslik}>1. Veri Sorumlusu</Text>
      <Text style={styles.paragraf}>
        Pusula İstanbul uygulaması, Ayşe Tokkuş tarafından geliştirilmiş ve işletilmektedir.
        Bu gizlilik politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında
        kişisel verilerinizin nasıl işlendiğini açıklamaktadır.
      </Text>

      <Text style={styles.altBaslik}>2. Toplanan Veriler</Text>
      <Text style={styles.paragraf}>
        Uygulamamız aşağıdaki kişisel verileri toplamaktadır:
      </Text>
      <Text style={styles.madde}>• Kimlik bilgileri: Ad, soyad</Text>
      <Text style={styles.madde}>• İletişim bilgileri: E-posta adresi</Text>
      <Text style={styles.madde}>• Mesleki bilgi: TUREB ruhsat numarası</Text>
      <Text style={styles.madde}>• Konum bilgisi: Şehir (kullanıcı tarafından girilen)</Text>
      <Text style={styles.madde}>• Kullanım verileri: Uygulama içi etkileşimler, sohbet mesajları</Text>
      <Text style={styles.madde}>• Abonelik bilgileri: Abonelik durumu, plan türü</Text>

      <Text style={styles.altBaslik}>3. Verilerin İşlenme Amacı</Text>
      <Text style={styles.paragraf}>
        Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
      </Text>
      <Text style={styles.madde}>• Kullanıcı hesabı oluşturma ve yönetimi</Text>
      <Text style={styles.madde}>• Uygulama hizmetlerinin sunulması</Text>
      <Text style={styles.madde}>• Sohbet ve iletişim özelliklerinin sağlanması</Text>
      <Text style={styles.madde}>• Abonelik yönetimi ve ödeme işlemleri</Text>
      <Text style={styles.madde}>• İçerik moderasyonu ve güvenlik</Text>
      <Text style={styles.madde}>• Uygulama iyileştirme ve analiz</Text>

      <Text style={styles.altBaslik}>4. Verilerin Aktarımı</Text>
      <Text style={styles.paragraf}>
        Kişisel verileriniz aşağıdaki üçüncü taraflarla paylaşılabilir:
      </Text>
      <Text style={styles.madde}>• Supabase Inc. — Veritabanı altyapı hizmeti (ABD)</Text>
      <Text style={styles.madde}>• RevenueCat Inc. — Abonelik yönetim hizmeti (ABD)</Text>
      <Text style={styles.madde}>• Apple Inc. / Google LLC — Uygulama mağazası ve ödeme işlemleri</Text>
      <Text style={styles.paragraf}>
        Bu aktarımlar, KVKK'nın 9. maddesi kapsamında yeterli koruma bulunan ülkelere
        veya yeterli korumayı taahhüt eden veri sorumluları ile gerçekleştirilmektedir.
      </Text>

      <Text style={styles.altBaslik}>5. Verilerin Saklanma Süresi</Text>
      <Text style={styles.paragraf}>
        Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap silme talebinde
        bulunmanız halinde verileriniz 30 gün içinde silinir. Yasal zorunluluklar saklıdır.
      </Text>

      <Text style={styles.altBaslik}>6. Haklarınız (KVKK Madde 11)</Text>
      <Text style={styles.paragraf}>
        KVKK kapsamında aşağıdaki haklara sahipsiniz:
      </Text>
      <Text style={styles.madde}>• Kişisel verilerinizin işlenip işlenmediğini öğrenme</Text>
      <Text style={styles.madde}>• İşlenmişse buna ilişkin bilgi talep etme</Text>
      <Text style={styles.madde}>• İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</Text>
      <Text style={styles.madde}>• Aktarıldığı üçüncü kişileri bilme</Text>
      <Text style={styles.madde}>• Eksik veya yanlış işlenmişse düzeltilmesini isteme</Text>
      <Text style={styles.madde}>• Silinmesini veya yok edilmesini isteme</Text>
      <Text style={styles.madde}>• İşlenen verilerin münhasıran otomatik sistemler aracılığıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</Text>
      <Text style={styles.madde}>• Kanuna aykırı işleme sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</Text>

      <Text style={styles.altBaslik}>7. Çocukların Gizliliği</Text>
      <Text style={styles.paragraf}>
        Pusula İstanbul, profesyonel turist rehberlerine yönelik bir uygulamadır.
        18 yaşından küçük bireylerin kişisel verilerini bilerek toplamıyoruz.
      </Text>

      <Text style={styles.altBaslik}>8. Güvenlik</Text>
      <Text style={styles.paragraf}>
        Kişisel verilerinizin güvenliği için endüstri standardı şifreleme, güvenli bağlantılar (SSL/TLS)
        ve erişim kontrolü mekanizmaları kullanılmaktadır. Supabase altyapısı, SOC 2 Type II
        sertifikalıdır.
      </Text>

      <Text style={styles.altBaslik}>9. Değişiklikler</Text>
      <Text style={styles.paragraf}>
        Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişikliklerde
        uygulama içi bildirim yapılacaktır.
      </Text>

      <Text style={styles.altBaslik}>10. İletişim</Text>
      <Text style={styles.paragraf}>
        Gizlilik ile ilgili sorularınız ve KVKK kapsamındaki başvurularınız için:{'\n'}
        E-posta: info@pusulaistanbul.app
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  icerik: { padding: 20 },
  baslik: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  tarih: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 24,
  },
  altBaslik: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraf: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 8,
  },
  madde: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginLeft: 8,
    marginBottom: 4,
  },
});
