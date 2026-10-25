(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id),main=$('sheets'),button=$('printButton'),picker=$('printStudent'),info=$('printInfo');
let generation=0,objectUrl=null,zoom=1,x=0,y=0;
const themes=['original','starlight','sunshine','dawn','night','blossom'];
function quality(img){
 const dpi=Math.round(Math.max(img.naturalWidth,img.naturalHeight)/(190/25.4)/zoom);
 $('printQuality').textContent=img.naturalWidth+' × '+img.naturalHeight+' 像素 · 按本卡 190 mm 画面估算 '+dpi+' dpi。'+(dpi>=280?'适合精细打印。':dpi>=180?'适合日常彩印；精细收藏建议使用约 2250 × 2250 像素或更大的原图。':'当前画面适合远看；近看精细收藏建议使用约 2250 × 2250 像素或更大的原图。放大不会增加细节。');
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
 const data=window.ClassroomPrintData;
 if(!data||!Array.isArray(data.cards)||!data.cards.length||data.cards.length>10)throw Error('请从班级的“期末卡片”页面打开打印预览。');
 for(const c of data.cards)if(typeof c.img!=='string'||!/^images_evo\/[\w\u3400-\u9fff_]+\.webp$/.test(c.img))throw Error('请返回期末卡片，重新打开新版打印预览。');
 picker.innerHTML=data.cards.map((c,i)=>'<option value="'+i+'">'+esc(c.number)+' · '+esc(c.student)+' · '+esc(c.pet)+'</option>').join('');
 picker.value=String(Number.isInteger(data.selectedIndex)&&data.selectedIndex>=0&&data.selectedIndex<data.cards.length?data.selectedIndex:0);picker.disabled=false;
 async function ready(pass){
  try{await Promise.all([main.querySelector('img').decode(),document.fonts.ready]);if(pass!==generation)return;compose();button.disabled=false;button.textContent='只打印这张卡';}
  catch{if(pass!==generation)return;info.textContent='原画未能加载，请恢复完整原画或刷新后重试。';button.textContent='等待原画加载';}
 }
 async function render(){
  const pass=++generation,c=data.cards[Number(picker.value)];release();
  button.disabled=true;button.textContent='加载原画中…';$('printArtwork').value='';$('artworkStatus').textContent='替换图片只用于当前预览，不上传，也不改变班级宠物。';
  info.innerHTML=esc(data.className)+' · 本次只打印 '+esc(c.student)+' 的 1 张珍藏卡'+(data.demo?' <span class="demo-print">· 虚构示例</span>':'');
  main.innerHTML='<section class="sheet" aria-label="'+esc(c.student)+'的单张A4珍藏卡"><article class="print-card" data-theme="'+(themes.includes(c.theme)?c.theme:'original')+'"><header class="card-header"><span class="garden-name">班级仙宠园</span><span class="card-seal">学期荣誉伙伴</span></header><figure class="card-art"><img src="'+esc(c.img)+'" alt="'+esc(c.pet)+'的天庭终极原画" width="1024" height="1024"></figure><div class="card-identity"><h2>'+esc(c.nickname||c.pet)+'</h2><p class="realm">'+esc(c.nickname?c.pet+' · '+c.series:c.series+' · '+c.species)+' · 天庭珍藏</p><p class="owner"><span class="owner-name">'+esc(c.student)+'</span><span class="owner-label">的专属伙伴</span></p><p class="term"><span>'+esc(data.className)+'</span><span>'+esc(data.term)+'</span></p></div><footer class="card-footer"><p class="dedication">'+esc(c.note||'每一份认真，都有仙缘相伴。')+'</p><p class="issuance">'+(data.demo?'虚构示例卡片':'一学期的努力 · 一生的珍藏')+(c.issuedOn?' · '+esc(c.issuedOn):'')+'</p></footer></article></section>';
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
 window.ClassroomLocal.cardCleanup=release;render();
}catch(e){main.innerHTML='<p class="error">'+esc(e.message)+'</p>';info.textContent='暂时没有可打印的卡片。';document.querySelector('.composition-editor').hidden=true;}
})();
