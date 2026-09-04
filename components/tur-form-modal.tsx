// Eyl 2026 — Tur ekle / düzenle formu (Ajanda). ModalKapak + Takvim (geçmiş seçilebilir) + alanlar.
// Kaydet → onKaydet(payload) (ekleme ajanda.tsx, düzenleme tur/[id].tsx tarafından sağlanır).
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { uyar } from '../lib/uyari';
import { useTema } from '../hooks/use-tema';
import { cokGunlu, gunSayisi, isoToDate, type AjandaSonuc, type Tur, type TurPayload } from '../hooks/use-ajanda';
import { Font, Palette, Radius } from '../constants/theme';
import { BirincilButon, Kicker, ModalKapak } from './ui/pusula-ui';
import { Takvim, tarihUzun } from './ui/takvim';
import { SaatSecici } from './ui/saat-secici';

function saatNormalize(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]), d = Number(m[2]);
  if (h > 23 || d > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

function emailGecerli(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}

export function TurFormModal({ visible, mevcut, varsayilanTarih, onKapat, onKaydet }: {
  visible: boolean;
  mevcut?: Tur | null;                 // düzenleme
  varsayilanTarih?: string | null;     // yeni kayıtta ön-seçili tarih
  onKapat: () => void;
  onKaydet: (p: TurPayload) => Promise<AjandaSonuc>;
}) {
  const { t } = useTema();
  const [baslik, setBaslik] = useState('');
  const [tarih, setTarih] = useState<string | null>(null);
  const [cokGun, setCokGun] = useState(false);
  const [bitis, setBitis] = useState<string | null>(null);
  const [saat, setSaat] = useState('');
  const [acente, setAcente] = useState('');
  const [acenteEmail, setAcenteEmail] = useState('');
  const [grup, setGrup] = useState('');
  const [bulusma, setBulusma] = useState('');
  const [notlar, setNotlar] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setBaslik(mevcut?.baslik ?? '');
    setTarih(mevcut?.tarih ?? varsayilanTarih ?? null);
    const cg = !!mevcut && cokGunlu(mevcut);
    setCokGun(cg);
    setBitis(cg ? mevcut!.bitis_tarih : null);
    setSaat(mevcut?.saat ?? '');
    setAcente(mevcut?.acente ?? '');
    setAcenteEmail(mevcut?.acente_email ?? '');
    setGrup(mevcut?.grup ?? '');
    setBulusma(mevcut?.bulusma ?? '');
    setNotlar(mevcut?.notlar ?? '');
    setKaydediliyor(false);
  }, [visible, mevcut, varsayilanTarih]);

  const kaydet = async () => {
    if (!baslik.trim()) { uyar('Eksik', 'Tur ya da müşteri adını yazın (ör. "Klasik İstanbul — Alman grup").'); return; }
    if (!tarih) { uyar('Eksik', 'Takvimden tur tarihini seç.'); return; }
    if (cokGun && (!bitis || bitis <= tarih)) { uyar('Bitiş tarihi', 'Çok günlü tur için başlangıçtan sonraki bir bitiş günü seç.'); return; }
    const saatN = saat.trim() ? saatNormalize(saat) : null;
    if (saat.trim() && !saatN) { uyar('Saat', 'Saati SS:DD biçiminde yaz, örn. 08:30.'); return; }
    if (acenteEmail.trim() && !emailGecerli(acenteEmail)) { uyar('E-posta', 'Acente e-posta adresi geçersiz görünüyor.'); return; }
    setKaydediliyor(true);
    const r = await onKaydet({ baslik, tarih, bitis_tarih: cokGun ? bitis : null, saat: saatN, acente, acente_email: acenteEmail, grup, bulusma, notlar });
    setKaydediliyor(false);
    if (!r.ok) { uyar('Kaydedilemedi', r.hata ?? 'Bir sorun oluştu.'); return; }
    onKapat();
  };

  const inputStil = [s.input, { color: t.text, borderColor: t.kartBorder, backgroundColor: t.bgInput }];
  const kapat = () => { if (!kaydediliyor) onKapat(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={kapat}>
      <KeyboardAvoidingView behavior={undefined} /* klavye kaçınma ModalKapak içinde (4 Eyl 2026) */ style={{ flex: 1 }}>
        <ModalKapak baslik={mevcut ? 'Turu Düzenle' : 'Tur Ekle'} onKapat={kapat} altButonBaslik="İptal">
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Kicker style={s.etiket}>Tur / Müşteri adı</Kicker>
            <TextInput style={inputStil} value={baslik} onChangeText={setBaslik} placeholder="Tur / müşteri adı" placeholderTextColor={t.textMuted} maxLength={120} />

            <Kicker style={s.etiket}>{cokGun ? 'Başlangıç' : 'Tarih'}{tarih ? ` · ${tarihUzun(tarih)}` : ''}</Kicker>
            <Takvim value={tarih} onChange={(iso) => { setTarih(iso); if (bitis && bitis <= iso) setBitis(null); }} renk={Palette.safran} gecmisSecilebilir />

            <TouchableOpacity onPress={() => setCokGun(v => !v)} activeOpacity={0.8} style={[s.switchSatir, { borderColor: t.kartBorder, backgroundColor: t.bgSecondary }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.switchBaslik, { color: t.text }]}>Çok günlü tur</Text>
                <Text style={[s.switchNot, { color: t.textSecondary }]}>
                  {cokGun && tarih && bitis ? `${gunSayisi({ tarih, bitis_tarih: bitis })} gün · masraflar güne göre işlenir` : 'Örn. 12 Eylül başlar, 30 Eylül biter'}
                </Text>
              </View>
              <Switch value={cokGun} onValueChange={setCokGun} trackColor={{ true: t.primary, false: t.kartBorder }} thumbColor="#FFFFFF" />
            </TouchableOpacity>
            {cokGun ? (
              <>
                <Kicker style={s.etiket}>Bitiş{bitis ? ` · ${tarihUzun(bitis)}` : ''}</Kicker>
                <Takvim value={bitis} onChange={setBitis} renk={Palette.menekse} minDate={tarih ? isoToDate(tarih) : undefined} gecmisSecilebilir={!tarih} />
              </>
            ) : null}

            <View style={s.ikiKolon}>
              <View style={{ flex: 1 }}>
                <Kicker style={s.etiket}>Saat</Kicker>
                <SaatSecici value={saat} onChange={setSaat} />
              </View>
              <View style={{ flex: 1.6 }}>
                <Kicker style={s.etiket}>Grup</Kicker>
                <TextInput style={inputStil} value={grup} onChangeText={setGrup} placeholder="Grup" placeholderTextColor={t.textMuted} maxLength={80} />
              </View>
            </View>

            <Kicker style={s.etiket}>Buluşma yeri</Kicker>
            <TextInput style={inputStil} value={bulusma} onChangeText={setBulusma} placeholder="Buluşma yeri" placeholderTextColor={t.textMuted} maxLength={120} />

            <Kicker style={s.etiket}>Acente</Kicker>
            <TextInput style={inputStil} value={acente} onChangeText={setAcente} placeholder="Acente adı" placeholderTextColor={t.textMuted} maxLength={120} />

            <Kicker style={s.etiket}>Acente e-postası</Kicker>
            <TextInput
              style={[inputStil, acenteEmail.trim().length > 0 && !emailGecerli(acenteEmail) && { borderColor: t.durumKapali }]}
              value={acenteEmail} onChangeText={setAcenteEmail} placeholder="ornek@acente.com" placeholderTextColor={t.textMuted}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={120}
            />

            <Kicker style={s.etiket}>Notlar</Kicker>
            <TextInput
              style={[inputStil, s.cokSatir]} value={notlar} onChangeText={setNotlar}
              placeholder="Notlar" placeholderTextColor={t.textMuted} multiline textAlignVertical="top" maxLength={1000}
            />

            <BirincilButon baslik={mevcut ? 'Kaydet' : 'Tur Ekle'} onPress={kaydet} yukleniyor={kaydediliyor} style={{ marginTop: 16 }} />
          </ScrollView>
        </ModalKapak>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  etiket: { marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Font.regular, fontSize: 14 },
  cokSatir: { minHeight: 90 },
  ikiKolon: { flexDirection: 'row', gap: 10 },
  switchSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: Radius.md, borderWidth: 1 },
  switchBaslik: { fontFamily: Font.semibold, fontSize: 13 },
  switchNot: { fontFamily: Font.regular, fontSize: 11, marginTop: 2 },
  not: { fontFamily: Font.regular, fontSize: 11, marginTop: 4 },
});
