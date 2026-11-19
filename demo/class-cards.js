(()=>{'use strict';
const script=document.currentScript;
if(script?.id==='localPrintScript' && script!==document.getElementById('localPrintScript'))return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id),main=$('sheets'),button=$('printButton'),picker=$('printStudent'),info=$('printInfo');
let generation=0,objectUrl=null,zoom=1,x=0,y=0;
let layoutFrame=0,observer=null,disposed=false;
function fitCardText(){
 const card=main.querySelector('.print-card');
 const fields=card.querySelectorAll('[data-card-fit]');
 function fit(){
  for(const el of fields){
   let size=Number(el.dataset.cardFit);
   const min=Number(el.dataset.cardMin);
   el.style.fontSize=size+'pt';
   while(size>min && (el.scrollWidth>el.clientWidth+1 || el.scrollHeight>el.clientHeight+1)){
    size=Math.max(min,size-.25);
    el.style.fontSize=size+'pt';
   }
  }
 }
 delete card.dataset.longDetails;
 fit();
 if(Array.from(card.querySelectorAll('.card-detail')).some(el=>el.scrollWidth>el.clientWidth+1)){
  card.dataset.longDetails='true';
  fit();
 }
 const twoLines=Array.from(card.querySelectorAll('.card-column h2')).some(el=>{
  const range=document.createRange();range.selectNodeContents(el);
  const tops=Array.from(range.getClientRects()).filter(r=>r.width&&r.height).map(r=>Math.round(r.top));
  return new Set(tops).size>1;
 });
 card.dataset.titleLines=twoLines?'2':'1';
}
function layoutCard(){
 const sheet=main.querySelector('.sheet');
 if(disposed || !sheet || !main.isConnected)return;
 const style=getComputedStyle(main);
 const width=main.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
 const scale=Math.max(.1,Math.min(1,width/384));
 sheet.style.setProperty('--card-scale',String(scale));
 sheet.style.width=(384*scale)+'px';
 sheet.style.height=(576*scale)+'px';
 fitCardText();
}
function queueLayout(){
 cancelAnimationFrame(layoutFrame);
 if(!disposed)layoutFrame=requestAnimationFrame(layoutCard);
}
function monitorLayout(){
 window.addEventListener('resize',queueLayout);
 if(window.ResizeObserver){observer=new ResizeObserver(queueLayout);observer.observe(main);}
}
function cleanup(){
 disposed=true;generation++;cancelAnimationFrame(layoutFrame);observer?.disconnect();
 window.removeEventListener('resize',queueLayout);
 release();
}
const themes=['original','starlight','sunshine','dawn','night','blossom'];
function quality(img){
 const dpi=Math.round(Math.max(img.naturalWidth,img.naturalHeight)/(272/72)/zoom);
 $('printQuality').textContent=img.naturalWidth+' × '+img.naturalHeight+' 像素 · 按卡片约 96 mm 画幅估算 '+dpi+' dpi。'+(dpi>=280?'适合精细打印。':dpi>=180?'适合日常彩印；精细收藏建议使用约 1200 × 1200 像素或更大的原图。':'当前画面适合远看；近看精细收藏建议使用约 1200 × 1200 像素或更大的原图。放大不会增加细节。');
}
function compose(){
 zoom=Number($('artZoom').value)/100;x=Number($('artX').value);y=Number($('artY').value);
 $('zoomValue').textContent=Math.round(zoom*100)+'%';
 $('artX').disabled=$('artY').disabled=zoom===1;
 const img=main.querySelector('img');if(!img)return;
 const limit=(zoom-1)*50;
 img.style.transform='translate('+(x/100*limit)+'%, '+(y/100*limit)+'%) scale('+zoom+')';
 if(img.naturalWidth)quality(img);
}
function reset(){zoom=1;x=y=0;$('artZoom').value='100';$('artX').value=$('artY').value='0';compose();}
function release(){if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}}
try{
 const overlay=!!main.closest('#localPrintView');
 const data=overlay?window.ClassroomPrintData:JSON.parse(sessionStorage.getItem('classroom-print'));
 if(!data||!Array.isArray(data.cards)||!data.cards.length||data.cards.length>10)throw Error('请从班级的“期末卡片”页面打开打印预览。');
 for(const c of data.cards)if(typeof c.img!=='string'||!/^images_evo\/[\w\u3400-\u9fff_]+\.webp$/.test(c.img))throw Error('请返回期末卡片，重新打开新版打印预览。');
 picker.innerHTML=data.cards.map((c,i)=>'<option value="'+i+'">'+esc(c.number)+' · '+esc(c.student)+' · '+esc(c.pet)+'</option>').join('');
 picker.value=String(Number.isInteger(data.selectedIndex)&&data.selectedIndex>=0&&data.selectedIndex<data.cards.length?data.selectedIndex:0);picker.disabled=false;
 async function ready(pass){
  try{await Promise.all([main.querySelector('img').decode(),document.fonts.ready]);if(pass!==generation||disposed)return;compose();layoutCard();button.disabled=false;button.textContent='只打印这张卡';}
  catch{if(pass!==generation)return;info.textContent='原画未能加载，请恢复完整原画或刷新后重试。';button.textContent='等待原画加载';}
 }
 async function render(){
  const pass=++generation,c=data.cards[Number(picker.value)];release();
  button.disabled=true;button.textContent='加载原画中…';$('printArtwork').value='';$('artworkStatus').textContent='替换图片只用于当前预览，不上传，也不改变班级宠物。';
  info.innerHTML=esc(data.className)+' · 本次只打印 '+esc(c.student)+' 的 1 张珍藏卡'+(data.demo?' <span class="demo-print">· 虚构示例</span>':'');
  const pet=(window.PET_DATA?.pets||[]).find(p=>p.id===c.petId||p.name===c.pet),growthLine=c.growthLine||'成长故事，正在开始',preference=c.preference||(pet?.food?'偏爱 · '+pet.food:''),blessing=c.note||c.blessing||window.ClassCardDetails?.blessings[c.series]||'愿你心有微光，勇敢向前。';
  main.innerHTML='<section class="sheet" aria-label="'+esc(c.student)+'的单张6英寸竖版珍藏卡"><article class="print-card" data-theme="'+(themes.includes(c.theme)?c.theme:'original')+'"><header class="card-header"><span class="garden-name">班级仙宠园</span><span class="card-seal">学期荣誉伙伴</span></header><figure class="card-art"><img src="'+esc(c.img)+'" alt="'+esc(c.pet)+'的天庭终极原画" width="1024" height="1024"></figure><section class="card-columns" aria-label="学生与宠物介绍"><div class="card-column card-student"><h2 data-card-fit="12" data-card-min="8"><span class="owner-name">'+esc(c.student)+'</span></h2><p class="card-detail card-class" data-card-fit="8.2" data-card-min="6.5">'+esc(data.className)+'</p><p class="card-detail card-term" data-card-fit="7.2" data-card-min="6.5">'+esc(data.term)+'</p><p class="card-story-line card-growth" data-card-fit="8.5" data-card-min="6.5">'+esc(growthLine)+'</p></div><div class="card-column card-pet"><h2 data-card-fit="14" data-card-min="10">'+esc(c.nickname||c.pet)+'</h2><p class="card-detail card-species" data-card-fit="8.2" data-card-min="6.5">'+esc((c.nickname?c.pet+' · ':'')+c.species)+'</p><p class="card-detail card-series" data-card-fit="7.2" data-card-min="6.5">'+esc(c.series)+'</p><p class="card-story-line card-preference" data-card-fit="8.5" data-card-min="6.5">'+esc(preference)+'</p></div></section><div class="card-blessing-block"><p class="card-blessing" data-card-fit="8.5" data-card-min="7">'+esc(blessing)+'</p></div><footer class="card-footer"><p class="issuance">'+(data.demo?'虚构示例':'')+(c.issuedOn?(data.demo?' · ':'')+esc(c.issuedOn):'')+'</p></footer></article></section>';
  reset();await ready(pass);
 }
 picker.addEventListener('change',render);
 for(const id of ['artZoom','artX','artY'])$(id).addEventListener('input',compose);
 $('resetComposition').addEventListener('click',render);
 $('printArtwork').addEventListener('change',async()=>{
  const file=$('printArtwork').files[0];if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>25*1024*1024){$('artworkStatus').textContent='请选择 25 MB 以内的 PNG、JPEG 或 WebP 图片。';$('printArtwork').value='';return;}
  const pass=++generation,url=URL.createObjectURL(file);button.disabled=true;button.textContent='检查图片中…';
  try{const probe=new Image();probe.src=url;await probe.decode();if(pass!==generation){URL.revokeObjectURL(url);return;}
   if(probe.naturalWidth<256||probe.naturalHeight<256)throw Error('图片太小，请选择至少 256 × 256 像素的原图。');
   if(probe.naturalWidth*probe.naturalHeight>64000000)throw Error('图片尺寸过大，请选择 6400 万像素以内的原图。');
   release();objectUrl=url;main.querySelector('img').src=url;reset();$('artworkStatus').textContent='已使用本地图片“'+file.name+'”。请确认是该学生认养的同一只宠物。';await ready(pass);
  }catch(e){URL.revokeObjectURL(url);if(pass!==generation)return;$('artworkStatus').textContent=e.message.startsWith('图片')?e.message:'图片无法读取，请换一张图片。';await ready(pass);}
 });
 button.addEventListener('click',()=>{if(!button.disabled)window.print();});
 monitorLayout();
 if(overlay){window.ClassroomLocal.cardCleanup=cleanup;}
 else{
  window.addEventListener('pagehide',()=>{generation++;release();});
  window.addEventListener('pageshow',event=>{if(event.persisted)render();});
 }
 render();
}catch(e){main.innerHTML='<p class="error">'+esc(e.message)+'</p>';info.textContent='暂时没有可打印的卡片。';document.querySelector('.composition-editor').hidden=true;}
})();
