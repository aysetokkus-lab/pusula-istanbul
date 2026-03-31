import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ═══════════════════════════════════════════
   Kullanım Koşulları
   Pusula İstanbul — Profesyonel Rehber Uygulaması
   ═══════════════════════════════════════════ */

export default function KullanimKosullari() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.icerik, { paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={styles.baslik}>Kullanım Koşulları</Text>
      <Text style={styles.tarih}>Son güncelleme: 28 Mart 2026</Text>

      <Text style={styles.altBaslik}>1. Kabul</Text>
      <Text style={styles.paragraf}>
        Pusula İstanbul uygulamasını kullanarak bu kullanım koşullarını kabul etmiş sayılırsınız.
        Koşulları kabul etmiyorsanız uygulamayı kullanmayınız.
      </Text>

      <Text style={styles.altBaslik}>2. Hizmet Tanımı</Text>
      <Text style={styles.paragraf}>
        Pusula İstanbul, profesyonel turist rehberlerine yönelik bir bilgi ve iletişim uygulamasıdır.
        Müze bilgileri, ulaşım saatleri, ezan vakitleri, hava durumu, gemi takvimi, kent etkinlikleri
        ve rehberler arası sohbet özelliklerini sunmaktadır.
      </Text>

      <Text style={styles.altBaslik}>3. Hesap ve Kayıt</Text>
      <Text style={styles.paragraf}>
        Uygulamayı kullanmak için geçerli bir e-posta adresi ile kayıt olmanız gerekmektedir.
        Hesap bilgilerinizin doğruluğundan ve güvenliğinden siz sorumlusunuz.
        TUREB ruhsat numaranız doğrulama amacıyla talep edilmektedir.
      </Text>

      <Text style={styles.altBaslik}>4. Abonelik ve Ödeme</Text>
      <Text style={styles.paragraf}>
        Pusula İstanbul ücretli bir abonelik hizmetidir. Yeni kullanıcılara 7 günlük ücretsiz
        deneme süresi sunulmaktadır. Deneme süresi sonunda abonelik otomatik olarak başlar.
      </Text>
      <Text style={styles.madde}>• Aylık plan: 99 ₺/ay</Text>
      <Text style={styles.madde}>• Yıllık plan: 699 ₺/yıl</Text>
      <Text style={styles.paragraf}>
        Abonelikler, mevcut dönem sona ermeden en az 24 saat önce iptal edilmezse otomatik
        olarak yenilenir. İptal işlemi, cihazınızın uygulama mağazası ayarlarından yapılabilir.
        Kısmi dönem için iade yapılmamaktadır.
      </Text>

      <Text style={styles.altBaslik}>5. Kullanım Kuralları</Text>
      <Text style={styles.paragraf}>
        Uygulamayı kullanırken aşağıdaki kurallara uymayı kabul edersiniz:
      </Text>
      <Text style={styles.madde}>• Yasalara ve düzenlemelere uygun davranma</Text>
      <Text style={styles.madde}>• Diğer kullanıcılara saygılı olma</Text>
      <Text style={styles.madde}>• Küfür, hakaret, tehdit veya ayrımcı içerik paylaşmama</Text>
      <Text style={styles.madde}>• Spam, reklam veya yanıltıcı bilgi yaymama</Text>
      <Text style={styles.madde}>• Başkalarının kişisel bilgilerini izinsiz paylaşmama</Text>
      <Text style={styles.madde}>• Uygulamayı kötüye kullanmama veya teknik altyapıya zarar vermeme</Text>

      <Text style={styles.altBaslik}>6. Sohbet ve İçerik Moderasyonu</Text>
      <Text style={styles.paragraf}>
        Uygulama içi sohbet, otomatik küfür filtresi ve manuel moderasyon sistemiyle denetlenmektedir.
        Uygunsuz içerik paylaşan kullanıcıların hesapları geçici veya kalıcı olarak askıya alınabilir.
        Moderatör kararlarına itiraz için info@pusulaistanbul.app adresine başvurabilirsiniz.
      </Text>

      <Text style={styles.altBaslik}>7. Bilgi Doğruluğu</Text>
      <Text style={styles.paragraf}>
        Uygulamadaki müze saatleri, ulaşım bilgileri, ezan vakitleri ve diğer veriler bilgilendirme
        amaçlıdır. Bu bilgilerin anlık doğruluğunu garanti etmiyoruz. Resmi kaynaklardan
        teyit etmenizi öneriyoruz.
      </Text>

      <Text style={styles.altBaslik}>8. Fikri Mülkiyet</Text>
      <Text style={styles.paragraf}>
        Pusula İstanbul uygulamasının tüm içeriği, tasarımı, logosu ve yazılımı telif hakkıyla
        korunmaktadır. İzinsiz kopyalama, dağıtma veya değiştirme yasaktır.
      </Text>

      <Text style={styles.altBaslik}>9. Sorumluluk Sınırı</Text>
      <Text style={styles.paragraf}>
        Uygulama "olduğu gibi" sunulmaktadır. Teknik sorunlar, kesintiler veya veri kaybından
        doğabilecek zararlardan sorumlu değiliz. Uygulamadaki bilgilerin resmi niteliği yoktur.
      </Text>

      <Text style={styles.altBaslik}>10. Fesih</Text>
      <Text style={styles.paragraf}>
        Kullanım koşullarını ihlal etmeniz durumunda hesabınız bildirim yapılarak veya yapılmaksızın
        askıya alınabilir veya kapatılabilir. Hesabınızı istediğiniz zaman silme talebinde bulunabilirsiniz.
      </Text>

      <Text style={styles.altBaslik}>11. Uygulanacak Hukuk</Text>
      <Text style={styles.paragraf}>
        Bu kullanım koşulları Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklarda
        İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
      </Text>

      <Text style={styles.altBaslik}>12. Değişiklikler</Text>
      <Text style={styles.paragraf}>
        Bu koşullar önceden bildirimde bulunularak güncellenebilir. Güncelleme sonrası
        uygulamayı kullanmaya devam etmeniz, yeni koşulları kabul ettiğiniz anlamına gelir.
      </Text>

      <Text style={styles.altBaslik}>13. İletişim</Text>
      <Text style={styles.paragraf}>
        Sorularınız için:{'\n'}
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
