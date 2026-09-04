/**
 * Rehberlik dilleri — TUREB "Rehberler Dillere Göre" listesi (39 dil) + en sonda Türkçe (Ayşe, 4 Eyl 2026).
 * Türkçe: her rehber zaten Türkçe rehberdir ama Türk grup için ilan verilebilir; TUREB Türkçe tur tabanı uygulanır.
 * İlanlar ve profil dil tercihi (profiles.diller) bu listeden seçer.
 * Değer = görünen ad (Türkçe). Karşılaştırmalar küçük harfe çevrilerek yapılır.
 * Sıra: TUREB kayıtlı (eylemli) rehber sayısına göre çoktan aza; eşitler alfabetik.
 * Kaynak dosya: RehberlerDillereGore.xls (TUREB) — yeni dil eklenirse listeye tek satır.
 */
export const DILLER: string[] = [
  'İngilizce',    // 7437
  'Almanca',      // 1140
  'İspanyolca',   // 1042
  'Rusça',        // 897
  'Fransızca',    // 810
  'Arapça',       // 452
  'İtalyanca',    // 437
  'Japonca',      // 420
  'Portekizce',   // 396
  'Çince',        // 380
  'Endonezce',    // 247
  'Bulgarca',     // 243
  'Hollandaca',   // 169
  'Yunanca',      // 128
  'Farsça',       // 58
  'Lehçe',        // 54
  'Sırpça',       // 45
  'Korece',       // 39
  'Norveççe',     // 29
  'Hırvatça',     // 28
  'Romence',      // 26
  'İbranice',     // 22
  'Macarca',      // 22
  'İsveççe',      // 21
  'Boşnakça',     // 21
  'Makedonca',    // 10
  'Gürcüce',      // 9
  'Fince',        // 7
  'Urduca',       // 7
  'Danimarkaca',  // 6
  'Ermenice',     // 6
  'Çekçe',        // 5
  'Arnavutça',    // 2
  'Litvanca',     // 2
  'Slovakça',     // 2
  'Hintçe',       // 1
  'İzlandaca',    // 1
  'Tayca',        // 1
  'Ukraynaca',    // 1
  'Türkçe',       // en sonda — Türk grup ilanları için (TUREB listesinde yok)
];

export const DIL_KISA: Record<string, string> = {
  'İngilizce': 'EN', 'Almanca': 'DE', 'İspanyolca': 'ES', 'Rusça': 'RU', 'Fransızca': 'FR', 'Arapça': 'AR',
  'İtalyanca': 'IT', 'Japonca': 'JA', 'Portekizce': 'PT', 'Çince': 'ZH', 'Endonezce': 'ID', 'Bulgarca': 'BG',
  'Hollandaca': 'NL', 'Yunanca': 'EL', 'Farsça': 'FA', 'Lehçe': 'PL', 'Sırpça': 'SR', 'Korece': 'KO',
  'Norveççe': 'NO', 'Hırvatça': 'HR', 'Romence': 'RO', 'İbranice': 'HE', 'Macarca': 'HU', 'İsveççe': 'SV',
  'Boşnakça': 'BS', 'Makedonca': 'MK', 'Gürcüce': 'KA', 'Fince': 'FI', 'Urduca': 'UR', 'Danimarkaca': 'DA',
  'Ermenice': 'HY', 'Çekçe': 'CS', 'Arnavutça': 'SQ', 'Litvanca': 'LT', 'Slovakça': 'SK', 'Hintçe': 'HI',
  'İzlandaca': 'IS', 'Tayca': 'TH', 'Ukraynaca': 'UK', 'Türkçe': 'TR',
};

export function dilKisa(d: string): string {
  return DIL_KISA[d] ?? d.replace(/\s*\(.*\)$/, '').slice(0, 3).toLocaleUpperCase('tr');
}
