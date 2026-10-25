
(()=>{'use strict';
const R=ClassRules;
function create({image,icon,esc,by}){
 const story=(p,index)=>[
  `${p.name}带着最喜欢的${p.food}，踏上了${p.series}的小路。每一个认真完成的日子，都在身后留下一枚闪亮的脚印。`,
  `夜色落在${p.series}。${p.name}把一路收集的微光装进小灯，约好明天继续同行。走得慢一点，也能走得很远。`,
  `${p.name}在花间挂起一张小笺，画着${p.food}和你们一起走过的路。小小的坚持，已经长成了一段故事。`,
  `回望${p.series}的来路，${p.name}把这一程珍藏起来。新的故事还会继续，今天留下的认真也一直在。`
 ][index];
 function panel(cl,s){
  const j=R.journey(cl,s),p=by[s.petId];
  return `<section class="long-journey"><h2>仙官之后，故事继续</h2><p>${j.startedAt===null?'首次长成仙官后，新的作业检查日会点亮旅程，解锁故事和纪念外观。':`从 ${j.startDate} 起，又留下 ${j.days} 个努力日。${j.next? '再积累 '+j.remaining+' 天，点亮“'+j.next.name+'”。':''}`}</p>${j.startedAt!==null?`<div class="journey-progress" role="progressbar" aria-label="仙官旅程努力日" aria-valuenow="${j.days}" aria-valuemin="0" aria-valuemax="${j.next.days}"><span style="width:${Math.min(100,j.days/j.next.days*100)}%"></span></div>`:''}<ol class="chapter-list">${j.chapters.map((m,i)=>`<li class="${m.unlocked?'chapter-open':'chapter-locked'}"><span class="chapter-symbol">${icon(m.unlocked?'check':'lock')}</span><div><strong>${m.name}</strong><span>${m.days} 个努力日${m.unlocked?' · 已点亮':''}</span>${m.unlocked?`<details><summary>读这一段伙伴故事</summary><p>${esc(story(p,i))}</p></details>`:''}</div></li>`).join('')}</ol>${j.seals?`<p class="journey-seals">已留下 ${j.seals} 枚陪伴纪念印 · 之后每 20 个努力日再留下一枚。</p>`:''}<p class="growth-rule">首次长成仙官后的次日起，按作业检查日期计数，同一天只记 1 次。礼包不抵天数；回蛋保留这段旅程，老师改记作业时同步核对。</p><button class="secondary" data-action="openHonors" data-sid="${s.id}">选择纪念外观与老师表扬</button></section>`;
 }
 function praises(cl,s,editable=false){
  const list=(cl.praises||[]).filter(p=>p.sid===s.id);
  return `<section class="praise-records"><h2>老师看见的进步</h2>${list.length?`<ul>${list.slice(0,12).map(p=>`<li><div><strong>${esc(R.praiseKinds[p.kind])}</strong><time datetime="${p.date}">${p.date}</time>${p.note?`<p>${esc(p.note)}</p>`:''}</div><div class="praise-actions"><button class="quiet small" data-action="presentPraise" data-pid="${p.id}" data-sid="${s.id}">大屏表扬</button>${editable?`<button class="quiet small" data-action="removePraise" data-pid="${p.id}">撤销这次表扬</button>`:''}</div></li>`).join('')}</ul>${list.length>12?'<p class="growth-rule">显示最近 12 次表扬，完整记录保存在班级备份中。</p>':''}`:'<p>老师可以记录一次具体进步，让每一种认真都被看见。</p>'}</section>`;
 }
 function hub(cl,s){
  if(!s)return '<div class="blank-note">先添加学生，再给伙伴留下表扬与纪念。</div>';
  const p=by[s.petId],chosen=R.appearance(cl,s),themes=R.appearances(cl,s);
  return `<section class="honors-content"><div class="honors-intro"><img src="${image(p.id,R.form(R.petState(cl,s).growth),true)}" alt="" width="88" height="88"><div><h2>${esc(s.name)}和${esc(p.name)}</h2><p>每一种认真，都有值得纪念的时刻。</p><button class="quiet small" data-action="presentPet" data-sid="${s.id}">${icon('star')}伙伴大屏亮相</button></div></div><form id="praiseForm" class="form-panel"><h2>记录一次具体表扬</h2><input type="hidden" name="sid" value="${s.id}"><div class="form-grid"><label>这次表扬<select name="kind">${Object.entries(R.praiseKinds).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>发生日期<input name="date" type="date" value="${R.today()}" max="${R.today()}" required></label><label class="full">老师看见了什么<input name="note" maxlength="80" placeholder="例如：这周开始主动订正错题了（选填）"></label></div><p class="growth-rule">由老师确认，记入成长册。同一天同类表扬只记一次；不增加成长、星星或期末名次。</p><div class="actions"><button type="submit">保存这次表扬</button></div></form><section class="appearance-section"><h2>伙伴的纪念外观</h2><p>获得礼包或走过长期旅程后，选择一份喜欢的配色。原画保持完整。</p><div class="appearance-options">${themes.map(t=>`<button class="appearance-option ${chosen===t.id?'chosen':''}" data-action="chooseAppearance" data-sid="${s.id}" data-theme="${t.id}" aria-pressed="${chosen===t.id}" ${t.unlocked?'':'disabled'}><span class="appearance-swatch" data-appearance="${t.id}" aria-hidden="true"></span><strong>${esc(t.name)}</strong><small>${t.unlocked?(chosen===t.id?'正在使用':'已解锁 · 点选使用'):esc(t.rule)}</small></button>`).join('')}</div><p class="growth-rule">第一份考试礼包解锁“星光礼赞”，三份解锁“暖阳礼赞”。仙官旅程还能解锁另外三种外观。</p></section>${praises(cl,s,true)}</section>`;
 }
 function presentation(cl,s,record=null){
  const p=by[s.petId],state=R.petState(cl,s),theme=R.appearance(cl,s);
  return `<div class="presentation-inner" data-appearance="${theme}"><div class="presentation-art">${ClassSurprises.frame('<img src="'+image(p.id,R.form(state.growth))+'" alt="'+esc(p.name)+'的'+R.evolution(cl,s).name+'形态">',R.evolution(cl,s).id)}</div><div class="presentation-copy"><h1>${esc(s.name)}</h1><h2>${record?esc(R.praiseKinds[record.kind]):'和我的伙伴，一起长大'}</h2><p class="presentation-note">${record?esc(record.note||'这份认真，老师看见了。'):(state.feeds?`已经一起完成 ${state.feeds} 份作业，每一份努力都留下了足迹。`:'新的陪伴，从今天开始。')}</p><p class="presentation-pet">${esc(p.name)} · ${R.evolution(cl,s).name} · ${esc(p.series)}</p><p class="presentation-class">${esc(cl.name)}${record?' · '+record.date:''}</p></div></div>`;
 }
 return {panel,praises,hub,presentation};
}
window.ClassJourney={create};
})();