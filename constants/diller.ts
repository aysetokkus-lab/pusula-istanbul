/**
 * Rehberlik dilleri — TÜREB çalışma kartı dilleri + Türkiye'de rehberlik yapılan diğer diller.
 * İlanlar ve profil dil tercihi (profiles.diller) bu listeden seçer.
 * Değer = görünen ad (Türkçe). Karşılaştırmalar küçük harfe çevrilerek yapılır.
 * Sıra: en yaygın diller önce (TÜREB 2019 dağılımı), sonra alfabetik.
 */
export const DILLER: string[] = [
  // En yaygın (TÜREB sıralaması)
  'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 'Rusça', 'İtalyanca', 'Arapça', 'Farsça',
  'Japonca', 'Çince', 'Korece', 'Portekizce', 'Yunanca', 'Hollandaca (Flamanca)',
  // Avrupa
  'Arnavutça', 'Belarusça', 'Boşnakça', 'Bulgarca', 'Çekçe', 'Danimarkaca', 'Estonca', 'Fince',
  'Hırvatça', 'İrlandaca', 'İsveççe', 'İzlandaca', 'Katalanca', 'Karadağca', 'Lehçe', 'Letonca',
  'Litvanca', 'Lüksemburgca', 'Macarca', 'Makedonca', 'Maltaca', 'Norveççe', 'Romence', 'Sırpça',
  'Slovakça', 'Slovence', 'Ukraynaca',
  // Kafkasya / Orta Asya / Türk dilleri
  'Azerice', 'Ermenice', 'Gürcüce', 'Kazakça', 'Kırgızca', 'Özbekçe', 'Tatarca', 'Türkmence', 'Uygurca',
  // Orta Doğu / Asya
  'İbranice', 'Kürtçe', 'Peştuca', 'Urduca', 'Hintçe', 'Bengalce', 'Tamilce', 'Nepalce', 'Sinhalaca',
  'Tayca', 'Vietnamca', 'Endonezce', 'Malayca', 'Tagalogca (Filipince)', 'Moğolca', 'Kantonca', 'Tayvanca',
  // Afrika
  'Svahili', 'Amharca', 'Hausa', 'Yoruba', 'Afrikaans',
  // Diğer
  'Türk İşaret Dili', 'Latince', 'Esperanto', 'Türkçe',
];

export const DIL_KISA: Record<string, string> = {
  'İngilizce': 'EN', 'Almanca': 'DE', 'Fransızca': 'FR', 'İspanyolca': 'ES', 'Rusça': 'RU', 'İtalyanca': 'IT',
  'Arapça': 'AR', 'Farsça': 'FA', 'Japonca': 'JA', 'Çince': 'ZH', 'Korece': 'KO', 'Portekizce': 'PT',
  'Yunanca': 'EL', 'Hollandaca (Flamanca)': 'NL', 'Lehçe': 'PL', 'Ukraynaca': 'UK', 'Türkçe': 'TR',
  'Bulgarca': 'BG', 'Romence': 'RO', 'Macarca': 'HU', 'Çekçe': 'CS', 'Slovakça': 'SK', 'Sırpça': 'SR',
  'Hırvatça': 'HR', 'Boşnakça': 'BS', 'İbranice': 'HE', 'Hintçe': 'HI', 'Urduca': 'UR', 'Endonezce': 'ID',
  'Tayca': 'TH', 'Vietnamca': 'VI', 'Fince': 'FI', 'İsveççe': 'SV', 'Norveççe': 'NO', 'Danimarkaca': 'DA',
  'Azerice': 'AZ', 'Kazakça': 'KK', 'Gürcüce': 'KA', 'Ermenice': 'HY', 'Katalanca': 'CA', 'Slovence': 'SL',
  'Türk İşaret Dili': 'TİD',
};

export function dilKisa(d: string): string {
  return DIL_KISA[d] ?? d.replace(/\s*\(.*\)$/, '').slice(0, 3).toLocaleUpperCase('tr');
}
