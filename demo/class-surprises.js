(()=>{'use strict';
const R=ClassRules;
function frame(content,form){
 return ['star','cloud'].includes(form)?'<div class="evolution-art" data-evolution="'+form+'"><img class="evolution-mantle" src="art-surprises/'+form+'-mantle-v2.webp" alt="" aria-hidden="true" width="1254" height="1254"><div class="evolution-core">'+content+'</div></div>':content;
}
// The atlas is displayed through measured viewports, so tassels and ribbon tips remain whole.
const keepsakeArtIds=['feather','bookmark','lamp','moon','boat','chime','letter','seed','ribbon','medal','book','night'];
function keepsakeArt(item){
 const i=keepsakeArtIds.indexOf(item.id);if(i<0)return '';
 const row=Math.floor(i/4),top=[0,372,700][row],height=[372,328,386][row];
 return '<svg class="keepsake-art" viewBox="'+((i%4)*362)+' '+top+' 362 '+height+'" aria-hidden="true" focusable="false"><image href="art-surprises/keepsakes-atlas-v2.webp" width="1448" height="1086"/></svg>';
}
function create({image,icon,esc,by}){
 function portrait(s,e,thumb=false){
  return frame('<img class="surprise-painting" src="'+image(s.petId,e.base,thumb)+'" alt="'+esc(by[s.petId].name+' · '+e.name)+'" width="384" height="384" loading="lazy">',e.id);
 }
 function shortcut(cl,s){
  const b=R.surprises(cl,s);
  return '<button class="surprise-shortcut secondary" data-action="openSurprises" data-sid="'+s.id+'">'+icon('gift')+'<span>伙伴的小惊喜<small>'+(b.ready.length?b.ready.length+' 只宝匣等你打开':b.next?'再努力 '+b.remaining+' 个检查日，发现新宝匣':'12 件小心意，已经陪你集齐')+'</small></span>'+icon('arrow')+'</button>';
 }
 function advanced(cl,s){
  const e=R.evolution(cl,s),p=by[s.petId];
  return '<section class="advanced-journey"><div class="surprise-section-heading"><div><h2>仙官之后，再长大一点</h2><p>星光与祥云，是认真同行的礼物。</p></div><span>进阶装扮</span></div><ol class="advanced-forms">'+e.stages.map(f=>'<li class="'+(f.unlocked?'unlocked':'locked')+(e.id===f.id?' current':'')+'"><div class="advanced-preview">'+frame('<img class="surprise-painting" src="'+image(s.petId,'official',true)+'" alt="'+esc(p.name+'的'+f.name+'装扮预览')+'" width="384" height="384" loading="lazy">',f.id)+'</div><div><h3>'+f.name+'</h3><p>'+ (e.id===f.id?'正在陪伴你':f.unlocked?(e.base==='official'?'已经走过这一站':'已解锁 · 本轮长成仙官后穿上'):'仙官旅程 '+f.days+' 个努力日解锁')+'</p><small>'+(f.unlocked?'这份成长已经记在旅程里':e.base==='official'?'还差 '+Math.max(0,f.days-e.days)+' 个努力日':'先长成仙官，再开启这段旅程')+'</small></div></li>').join('')+'</ol><p class="growth-rule">保留伙伴的完整原画，长出新的星冠、祥云与飘带装扮。首次长成仙官后的次日起，每个已完成作业的检查日记 1 天。回蛋后保留旅程，本轮重新长成仙官才会再穿上。</p>'+shortcut(cl,s)+'</section>';
 }
 function hub(cl,s){
  if(!s)return '<div class="blank-note">先添加学生，让每一位伙伴都有自己的小收藏。</div>';
  const p=by[s.petId],b=R.surprises(cl,s),notes=R.petNotes(cl,s),next=b.ready[0],all=b.collected.length===12;
  return '<section class="surprise-hub"><div class="treasure-hero"><div class="treasure-visual"><img src="art-surprises/treasure-box.webp" alt="系着蝴蝶结的云朵宝匣" width="1254" height="1254"><span>'+b.collected.length+' / 12 件小收藏</span></div><div class="treasure-copy"><h2>'+(next?'<span>有一只宝匣，</span><span>想送给你</span>':all?'一盒心意，都被珍藏啦':'把认真，装进小宝匣')+'</h2><p>'+(next?'每个努力的日子都算数。打开看看，今天藏着哪一件小礼物？':all?'每一件小物都有一段一起努力的故事。还有伙伴来信与新的成长旅程，慢慢翻看吧。':'已经在 '+b.days+' 个不同检查日完成作业。再留下 '+b.remaining+' 天努力，伙伴就会带来下一只宝匣。')+'</p>'+(next?'<button class="treasure-open" data-action="openTreasure" data-sid="'+s.id+'" data-slot="'+next.slot+'">'+icon('gift')+'打开这只宝匣'+(b.ready.length>1?' · 共 '+b.ready.length+' 只':'')+'</button>':'<a class="button secondary" href="#homework">回到作业喂养</a>')+'<p class="treasure-caption">首个作业检查日解锁，累计到 3、6、9…天时继续解锁。一天多份作业只记一次。</p></div></div><div id="surpriseReveal" class="surprise-reveal" role="status" tabindex="-1" hidden></div><section class="keepsake-collection"><div class="surprise-section-heading"><div><h2>我们的宝物架</h2><p>打开过的小礼物，都好好放在这里。</p></div><span>'+b.collected.length+' / 12</span></div><ol class="keepsake-grid">'+b.slots.map(x=>x.earned&&x.opened?'<li class="keepsake-item collected" data-keepsake="'+x.item.id+'">'+keepsakeArt(x.item)+'<h3>'+x.item.name+'</h3><p>'+x.item.line+'</p><small>第 '+x.target+' 个努力日的心意</small></li>':'<li class="keepsake-item waiting"><span class="keepsake-icon">'+icon(x.earned?'gift':'lock')+'</span><h3>'+ (x.earned?'宝匣已到达':'未拆封的小心意')+'</h3><p>'+(x.earned?'在上方打开宝匣，发现伙伴的礼物。':'累计 '+x.target+' 个作业检查日后见。')+'</p></li>').join('')+'</ol><p class="growth-rule">小礼物只用于收藏，不另加成长或名次。改记作业会重新核对资格，恢复完成后仍是原来的礼物；退回仙蛋不会抹去已确认的努力。</p></section><section class="pet-letters"><div class="surprise-section-heading"><div><h2>伙伴寄来的小纸条</h2><p>'+esc(p.name)+'想和你说的话。</p></div><span>'+notes.filter(n=>n.earned).length+' / '+notes.length+' 封</span></div><div class="pet-letter-list">'+notes.filter(n=>n.earned).reverse().map(n=>'<details class="pet-letter"><summary><span>'+icon('card')+n.title+'</span><span class="letter-arrow" aria-hidden="true">'+icon('arrow')+'</span></summary><div><p>'+esc(s.name)+'，</p><p>'+esc(n.text)+'</p><p class="letter-sign">喜欢'+esc(p.food)+'的'+esc(p.name)+'</p></div></details>').join('')+'</div><p class="growth-rule">继续完成作业、补交或获得老师表扬，还会收到新的伙伴来信。</p></section></section>';
 }
 function reveal(item,s){
  return '<span class="reveal-symbol">'+keepsakeArt(item)+'</span><div><h2>'+esc(item.name)+'</h2><p>'+esc(item.line)+'</p><small>已经放进'+esc(s.name)+'的宝物架</small></div>';
 }
 return {portrait,shortcut,advanced,hub,reveal};
}
window.ClassSurprises={frame,create};
})();