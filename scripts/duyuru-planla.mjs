import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const line of readFileSync(resolve(KOK, '.env'), 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('='); if (i === -1) continue;
  if (!process.env[t.slice(0,i).trim()]) process.env[t.slice(0,i).trim()] = t.slice(i+1).trim();
}
const RESEND_KEY = process.env.RESEND_API_KEY, SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://rzlfghjpsximthlolfxo.supabase.co';
const SENDER='Pusula İstanbul <info@pusulaistanbul.app>', REPLYTO='info@pusulaistanbul.app';
const KONU='Pusula İstanbul artık tamamen ücretsiz';
const PLAN_UTC='2026-09-08T06:00:00.000Z';
const HTML=readFileSync(resolve(KOK,'duyuru-tamamen-ucretsiz-mail.html'),'utf8');
const METIN=readFileSync(resolve(KOK,'scripts/duyuru-metin.txt'),'utf8');
const LISTE=resolve(KOK,'duyuru-alicilar.json');
const KAYIT=resolve(KOK,'duyuru-gonderim-2026-09-08.json');
const uyu=(ms)=>new Promise(r=>setTimeout(r,ms));

async function liste() {
  if (existsSync(LISTE)) return JSON.parse(readFileSync(LISTE,'utf8'));
  const hepsi=[]; let s=1;
  while (true) {
    const r=await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${s}&per_page=1000`,{headers:{apikey:SR_KEY,Authorization:`Bearer ${SR_KEY}`}});
    const d=await r.json(); const us=d.users||[]; hepsi.push(...us);
    if (us.length<1000) break; s++;
  }
  const e=[...new Set(hepsi.filter(u=>u.email&&(u.email_confirmed_at||u.confirmed_at)).map(u=>u.email.trim().toLowerCase()))];
  writeFileSync(LISTE,JSON.stringify(e,null,2)); return e;
}
const mail=(to)=>({from:SENDER,to:[to],reply_to:REPLYTO,subject:KONU,html:HTML,text:METIN,
  scheduled_at:PLAN_UTC,headers:{'List-Unsubscribe':'<mailto:info@pusulaistanbul.app?subject=Listeden%20cikar>'}});

const komut=process.argv[2];
const basla=parseInt((process.argv.find(a=>a.startsWith('--from='))||'--from=0').split('=')[1],10);
const bitis=parseInt((process.argv.find(a=>a.startsWith('--to='))||'--to=100000').split('=')[1],10);

if (komut==='--batch') {
  const tum=await liste(); const hedef=tum.slice(basla,bitis);
  console.log(`liste ${tum.length} · ${basla}. sıradan itibaren ${hedef.length} alıcı`);
  const kayit=existsSync(KAYIT)?JSON.parse(readFileSync(KAYIT,'utf8')):{planlanan:PLAN_UTC,gonderimler:[],hatalar:[]};
  for (let i=0;i<hedef.length;i+=100) {
    const grup=hedef.slice(i,i+100);
    const r=await fetch('https://api.resend.com/emails/batch',{method:'POST',
      headers:{Authorization:`Bearer ${RESEND_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify(grup.map(mail))});
    const d=await r.json().catch(()=>({}));
    if (!r.ok) { console.log(`BATCH HATA (HTTP ${r.status}):`, JSON.stringify(d).slice(0,300)); process.exit(2); }
    (d.data||[]).forEach((x,j)=>kayit.gonderimler.push({email:grup[j],id:x.id}));
    console.log(`  grup ${i/100+1}: ${(d.data||[]).length} planlandı`);
    await uyu(600);
  }
  writeFileSync(KAYIT,JSON.stringify(kayit,null,2));
  console.log(`TOPLAM PLANLANAN: ${kayit.gonderimler.length}`);
}
