/* يجمع اللقطات في صفحات مقارنة: الحالي | المنقّح. الإخراج: OUT/sheet_*.png و gallery.html */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const fs=require('fs');
const B=process.env.BEFORE||'/tmp/ui/before',A=process.env.AFTER||'/tmp/ui/after',O=process.env.OUT||'/tmp/ui/sheets';fs.mkdirSync(O,{recursive:true});
const NAMES={'1home':'الشاشة الرئيسية','2bLevels':'المستويات التسعة (الحالي مقفلة / المنقّح مفتوحة)','2words':'مدخل الكلمات والدروس الثلاثة','3lesson3':'رئيسية الدرس الثالث','4build':'أبني الكلمة — بداية','5build_placed':'أبني الكلمة — بعد وضع حرف','6letters_run':'نشاط الحروف (حرف «أَ»)'};
const SETS=[
 ['phone390','جوال ٣٩٠×٨٤٤',['m390'],['1home','2words','2bLevels','3lesson3','4build'],320],
 ['phone360','جوال ٣٦٠×٦٤٠',['m360'],['1home','2words','4build','6letters_run'],300],
 ['tablet','تابلت ٨٢٠×١١٨٠',['tablet'],['1home','2words','2bLevels','4build'],330],
 ['desktop','كمبيوتر ١٣٦٦×٧٦٨',['desktop'],['1home','2words','2bLevels','4build'],440],
 ['board','سبورة ١٩٢٠×١٠٨٠',['board'],['1home','2words','2bLevels','4build'],440]];
const src=(vp,n,m)=>m==='off'?`${B}/${vp}_${n}.png`:`${A}/${vp}_${m}_${n}.png`;
const img=f=>fs.existsSync(f)?'data:image/png;base64,'+fs.readFileSync(f).toString('base64'):'';
(async()=>{const br=await chromium.launch();let gal='';
for(const [id,title,[vp],rows,w] of SETS){
 let h=`<html dir="rtl"><meta charset="utf-8"><body style="margin:0;padding:20px;background:#eceff4;font-family:system-ui,'Noto Sans Arabic',sans-serif;color:#1b2347"><h2 style="margin:0 0 14px">${title}</h2><table style="border-collapse:separate;border-spacing:14px 10px"><tr><th></th>${[['off','الحالي (main)'],['v2','المنقّح']].map(x=>`<th style="font-size:20px;padding:6px">${x[1]}</th>`).join('')}</tr>`;
 for(const n of rows){h+=`<tr><td style="font-weight:800;width:120px;vertical-align:top;padding-top:10px">${NAMES[n]}</td>${['off','v2'].map(m=>{const d=img(src(vp,n,m));return `<td style="vertical-align:top;background:#fff;border:2px solid #cfd6e4;border-radius:10px;padding:6px">${d?`<img src="${d}" style="width:${w}px;display:block">`:'—'}</td>`}).join('')}</tr>`}
 h+='</table></body></html>';fs.writeFileSync(`${O}/${id}.html`,h);
 const p=await br.newPage({viewport:{width:200,height:200}});await p.setContent(h);await p.waitForTimeout(500);await p.screenshot({path:`${O}/sheet_${id}.png`,fullPage:true});await p.close()}
await br.close()})();
