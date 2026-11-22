
const dialog=document.getElementById('preview');
document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{
 const src=button.dataset.preview,title=button.dataset.title;
 document.getElementById('sheet-title').textContent=title;
 const im=document.getElementById('sheet-image');im.src=src;im.alt=title;
 document.getElementById('sheet-download').href=src;
 dialog.showModal();dialog.scrollTop=0;
}));
document.getElementById('close')?.addEventListener('click',()=>dialog.close());
const search=document.getElementById('sheet-search'),cards=[...document.querySelectorAll('[data-search]')],status=document.getElementById('search-count');
const norm=s=>s.toLocaleLowerCase('uk').replace(/[’‘ʼ`]/g,"'").replace(/\s+/g,' ').trim();
search?.addEventListener('input',()=>{const q=norm(search.value);let n=0;cards.forEach(card=>{card.hidden=!norm(card.dataset.search).includes(q);if(!card.hidden)n++});status.textContent=n?'Знайдено: '+n:'За цим запитом матеріалів немає.'});
const zipButton=document.getElementById('download-all'),progress=document.getElementById('download-status');
function crc32(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++)c=crcTable[(c^bytes[i])&255]^(c>>>8);return(c^0xffffffff)>>>0}
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function header(length){const bytes=new Uint8Array(length);return[bytes,new DataView(bytes.buffer)]}
function buildZip(entries){const files=[],central=[];let offset=0,centralLength=0;const encoder=new TextEncoder();
 for(const entry of entries){const name=encoder.encode(entry.name),bytes=entry.bytes,crc=crc32(bytes);const[h,v]=header(30+name.length);
 v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(12,0x21,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);h.set(name,30);
 files.push(h,bytes);const[c,d]=header(46+name.length);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x0800,true);d.setUint16(14,0x21,true);d.setUint32(16,crc,true);d.setUint32(20,bytes.length,true);d.setUint32(24,bytes.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);c.set(name,46);central.push(c);centralLength+=c.length;offset+=h.length+bytes.length;
 }const[e,v]=header(22);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,centralLength,true);v.setUint32(16,offset,true);return new Blob([...files,...central,e],{type:'application/zip'})}
zipButton?.addEventListener('click',async()=>{zipButton.disabled=true;let entries=[];let url;
 try{const links=[...document.querySelectorAll('a[data-original]')];for(let i=0;i<links.length;i++){progress.textContent='Готуємо архів: '+(i+1)+' із '+links.length+'. Зачекайте…';const response=await fetch(links[i].href);if(!response.ok)throw Error('HTTP '+response.status);entries.push({name:links[i].dataset.archiveName,bytes:new Uint8Array(await response.arrayBuffer())})}
 const blob=buildZip(entries);url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=zipButton.dataset.zipName;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);progress.textContent='Архів готовий. Перевірте завантаження у браузері.';
 }catch(error){if(url)URL.revokeObjectURL(url);progress.textContent='Не вдалося підготувати архів. Перевірте інтернет і повторіть спробу або завантажте аркуші окремо.'}finally{entries=[];zipButton.disabled=false}
});
