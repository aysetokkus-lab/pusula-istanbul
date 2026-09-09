// Abonelik iptal hatırlatması — gerçek mağaza abonelerine (8 Eyl 2026 09:30)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const line of readFileSync(resolve(KOK,'.env'),'utf8').split('\n')) {
  const t=line.trim(); if(!t||t.startsWith('#'))continue; const i=t.indexOf('='); if(i===-1)continue;
  if(!process.env[t.slice(0,i).trim()]) process.env[t.slice(0,i).trim()]=t.slice(i+1).trim();
}
const KEY=process.env.RESEND_API_KEY;
const HTML=readFileSync(resolve(KOK,'abonelik-iptal-hatirlatma.html'),'utf8');
const METIN=`Merhaba,

Pusula İstanbul artık tamamen ücretsiz; premium üyelik kaldırıldı, uygulamadaki bütün özellikler herkese açık.

Bir konuyu hatırlatmak istiyoruz. Google Play üzerinden alınan abonelikleri biz kapattık. Ancak App Store abonelikleri, mağaza kuralları gereği yalnızca kendi Apple hesabınızdan iptal edilebiliyor - biz sizin adınıza iptal edemiyoruz. iPhone veya iPad'inizden abone olduysanız, iptal etmediğiniz sürece abonelik yenilenir ve ücret alınmaya devam eder.

İPTAL (iPhone / iPad):
Ayarlar > en üstte adınız > Abonelikler > Pusula İstanbul > Aboneliği İptal Et

İptal ettiğinizde uygulamayı aynı şekilde kullanmaya devam edersiniz. Hiçbir özelliğiniz kapanmaz - hepsi zaten ücretsiz.

Takıldığınız bir yer olursa yazın: info@pusulaistanbul.app

İyi turlar,
Pusula İstanbul
pusulaistanbul.app`;
const PLAN='2026-09-08T06:30:00.000Z';   // 8 Eylül 09:30 İstanbul
const alicilar=JSON.parse(readFileSync(resolve(KOK,'abonelik-hatirlatma-alicilar.json'),'utf8'));
const mail=(to)=>({from:'Pusula İstanbul <info@pusulaistanbul.app>',to:[to],reply_to:'info@pusulaistanbul.app',
  subject:'Aboneliğinizi iptal etmeyi unutmayın',html:HTML,text:METIN,scheduled_at:PLAN,
  headers:{'List-Unsubscribe':'<mailto:info@pusulaistanbul.app?subject=Listeden%20cikar>'}});
const kayit={planlanan:PLAN,gonderimler:[]};
for(let i=0;i<alicilar.length;i+=100){
  const grup=alicilar.slice(i,i+100);
  const r=await fetch('https://api.resend.com/emails/batch',{method:'POST',
    headers:{Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:JSON.stringify(grup.map(mail))});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){console.log('HATA',r.status,JSON.stringify(d).slice(0,300));process.exit(2);}
  (d.data||[]).forEach((x,j)=>kayit.gonderimler.push({email:grup[j],id:x.id}));
}
writeFileSync(resolve(KOK,'abonelik-hatirlatma-gonderim.json'),JSON.stringify(kayit,null,2));
console.log(`PLANLANDI: ${kayit.gonderimler.length} kişi · ${PLAN}`);
