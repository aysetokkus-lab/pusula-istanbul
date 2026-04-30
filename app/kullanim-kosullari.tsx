import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../hooks/use-tema';

/* ═══════════════════════════════════════════
   Kullanım Koşulları
   Pusula İstanbul — Profesyonel Rehber Uygulaması
   ═══════════════════════════════════════════ */

export default function KullanimKosullari() {
  const insets = useSafeAreaInsets();
  const { t, isDark } = useTema();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bgCard }]}
      contentContainerStyle={[styles.icerik, { paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={[styles.baslik, { color: t.text }]}>Kullanım Koşulları</Text>
      <Text style={[styles.tarih, { color: t.textMuted }]}>Son güncelleme: 16 Nisan 2026</Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>1. Kabul</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Pusula İstanbul uygulamasını kullanarak bu kullanım koşullarını kabul etmiş sayılırsınız.
        Koşulları kabul etmiyorsanız uygulamayı kullanmayınız.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>2. Hizmet Tanımı</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Pusula İstanbul, profesyonel turist rehberlerine yönelik bir bilgi ve iletişim uygulamasıdır.
        Müze bilgileri, ulaşım saatleri, ezan vakitleri, hava durumu, gemi takvimi, kent etkinlikleri
        ve rehberler arası sohbet özelliklerini sunmaktadır.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>3. Hesap ve Kayıt</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Uygulamayı kullanmak için geçerli bir e-posta adresi ile kayıt olmanız gerekmektedir.
        Hesap bilgilerinizin doğruluğundan ve güvenliğinden siz sorumlusunuz.
        TUREB ruhsat numaranız doğrulama amacıyla talep edilmektedir.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>4. Abonelik ve Ödeme</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Pusula İstanbul ücretsiz olarak indirilebilir ve temel özellikler (müze/saray/cami
        ziyaret saatleri, ulaşım rehberi, acil durum bilgileri) herkes tarafından ücretsiz
        kullanılabilir. Rehber sohbeti, canlı saha durumu, ulaşım uyarıları ve kent
        etkinlikleri gibi premium özellikler için uygulama içi satın alma (In-App Purchase)
        ile abonelik gereklidir.
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Aylık plan: 99 ₺/ay</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Yıllık plan: 699 ₺/yıl (%41 tasarruf)</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Tüm satın alma işlemleri Apple App Store veya Google Play Store üzerinden
        gerçekleştirilir. Abonelikler, mevcut dönem sona ermeden en az 24 saat önce iptal
        edilmezse otomatik olarak yenilenir. İptal işlemi, cihazınızın uygulama mağazası
        ayarlarından yapılabilir. Kısmi dönem için iade yapılmamaktadır. Farklı bir cihazda
        oturum açtıysanız, mevcut aboneliğinizi "Satın Almaları Geri Yükle" seçeneği ile
        geri yükleyebilirsiniz.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>5. Kullanım Kuralları</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Uygulamayı kullanırken aşağıdaki kurallara uymayı kabul edersiniz:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Yasalara ve düzenlemelere uygun davranma</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Diğer kullanıcılara saygılı olma</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Küfür, hakaret, tehdit veya ayrımcı içerik paylaşmama</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Spam, reklam veya yanıltıcı bilgi yaymama</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Başkalarının kişisel bilgilerini izinsiz paylaşmama</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Uygulamayı kötüye kullanmama veya teknik altyapıya zarar vermeme</Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>6. Sohbet ve İçerik Moderasyonu — Sıfır Tolerans Politikası</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Pusula İstanbul, sakıncalı (objectionable) içerik ve taciz edici davranışlar için
        SIFIR TOLERANS politikası uygular. Aşağıdaki içerik türlerine kesinlikle izin verilmez:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Küfür, hakaret, tehdit, taciz içeren mesajlar</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Cinsel, müstehcen veya uygunsuz içerik</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Nefret söylemi, ayrımcılık, ırkçılık</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Spam, dolandırıcılık, yanıltıcı reklam</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Şiddet, zarar verme veya yasadışı faaliyet çağrısı</Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>• Başkalarının kişisel bilgilerini izinsiz paylaşma</Text>

      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Kullanıcıların kullanımına sunulan moderasyon araçları:
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>
        • İçerik Raporlama: Herhangi bir mesajdaki (...) butonuna dokunarak veya mesaja uzun basarak "Mesajı Raporla" seçeneğiyle bildirebilirsiniz.
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>
        • Kullanıcı Engelleme: Mesajdaki (...) butonundan veya uzun basma menüsünden "Kullanıcıyı Engelle" ile taciz eden
          kullanıcıyı engelleyebilirsiniz. Engellenen kullanıcının mesajları size artık görünmez.
      </Text>
      <Text style={[styles.madde, { color: t.textSecondary }]}>
        • Otomatik Küfür Filtresi: Sohbette küfür içeren mesajlar otomatik olarak engellenir.
      </Text>

      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Moderasyon taahhüdümüz: Raporlanan her içerik 24 saat içinde incelenir. Bu Kullanım
        Koşulları'nı ihlal eden içerikler kaldırılır ve ilgili kullanıcıların hesapları
        uyarı yapılmadan geçici veya kalıcı olarak askıya alınabilir. Ciddi ihlallerde
        hesap kalıcı olarak kapatılır ve tüm verileri silinir.
      </Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Uygunsuz içerik veya taciz bildirimi için ayrıca info@pusulaistanbul.app adresine
        yazabilirsiniz. Tüm bildirimler 24 saat içinde ele alınır.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>7. Bilgi Doğruluğu</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Uygulamadaki müze saatleri, ulaşım bilgileri, ezan vakitleri ve diğer veriler bilgilendirme
        amaçlıdır. Bu bilgilerin anlık doğruluğunu garanti etmiyoruz. Resmi kaynaklardan
        teyit etmenizi öneriyoruz.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>8. Fikri Mülkiyet</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Pusula İstanbul uygulamasının tüm içeriği, tasarımı, logosu ve yazılımı telif hakkıyla
        korunmaktadır. İzinsiz kopyalama, dağıtma veya değiştirme yasaktır.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>9. Sorumluluk Sınırı</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Uygulama "olduğu gibi" sunulmaktadır. Teknik sorunlar, kesintiler veya veri kaybından
        doğabilecek zararlardan sorumlu değiliz. Uygulamadaki bilgilerin resmi niteliği yoktur.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>10. Fesih</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Kullanım koşullarını ihlal etmeniz durumunda hesabınız bildirim yapılarak veya yapılmaksızın
        askıya alınabilir veya kapatılabilir. Hesabınızı istediğiniz zaman silme talebinde bulunabilirsiniz.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>11. Uygulanacak Hukuk</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Bu kullanım koşulları Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklarda
        İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>12. Değişiklikler</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Bu koşullar önceden bildirimde bulunularak güncellenebilir. Güncelleme sonrası
        uygulamayı kullanmaya devam etmeniz, yeni koşulları kabul ettiğiniz anlamına gelir.
      </Text>

      <Text style={[styles.altBaslik, { color: t.text }]}>13. İletişim</Text>
      <Text style={[styles.paragraf, { color: t.textSecondary }]}>
        Sorularınız için:{'\n'}
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
