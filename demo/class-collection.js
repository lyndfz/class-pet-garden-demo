(function (root) {
  'use strict';
  const rules = root.ClassRules;
  const designs = [
    {id:'meet', title:'初次相遇', form:'egg', rule:'确认认养伙伴后解锁', caption:'从一枚小小仙蛋，开始我们的故事。', paper:'#fff9f0', ink:'#673e32', accent:'#ad644c', line:'#dfb899'},
    {id:'grow', title:'第一次进阶', form:'mortal', rule:'在同一轮成长中达到 25 点', caption:'你的每一次认真，都长成了我的模样。', paper:'#f1f5ff', ink:'#2d406d', accent:'#566eb2', line:'#abb9d7'},
    {id:'term', title:'期末纪念', form:'official', rule:'班级期末登记后，纪念每一位伙伴', caption:'把这个学期的点点星光，送给一路相伴的你。', paper:'#f9f4ff', ink:'#513663', accent:'#865d99', line:'#c9aacf'}
  ];
  function eventDay(at) {
    return Number.isFinite(at) && Math.abs(at + 28800000) < 8640000000000000 ? rules.today(at) : '';
  }
  function milestones(cl, s, today = rules.today()) {
    const known = rules.dateOK(s.adoptedOn) ? s.adoptedOn : '';
    if (s.petConfirmed === false || known > today) return [null,null,null];
    const records = [], evidence = [];
    function record(item, growth) {
      const day = eventDay(item.at);
      if (!day || day > today || (known && day < known) || (item.petId != null && item.petId !== s.petId)) return;
      evidence.push(day);
      records.push({day, at:item.at, cycle:item.cycle || 0, growth});
    }
    for (const task of cl.homework) {
      const status = task.statuses[s.id];
      if (status && status.state === 'complete') record(status, task.growth);
      if (status && status.state === 'missing' && rules.dateOK(status.since)) evidence.push(status.since);
    }
    for (const exam of cl.exams) {
      if (exam.awards[s.id]) record(exam.awards[s.id], exam.awards[s.id].growth);
      if (Number.isInteger(exam.ranks[s.id]) && rules.dateOK(exam.date)) evidence.push(exam.date);
    }
    let evolved = null;
    const cycles = new Map();
    for (const entry of records.sort((a,b) => a.at - b.at)) {
      const sum = (cycles.get(entry.cycle) || 0) + entry.growth;
      cycles.set(entry.cycle, sum);
      if (sum >= 25) { evolved = {date:entry.day}; break; }
    }
    const eligibleFinals = cl.exams.filter(exam => {
      if (exam.kind !== 'final' || !rules.dateOK(exam.date) || exam.date > today) return false;
      const registered = Object.values(exam.ranks).some(n => Number.isInteger(n) && n > 0) || Object.values(exam.awards).some(a => a && eventDay(a.at) && eventDay(a.at) <= today);
      return registered && (known ? known <= exam.date : evidence.some(day => day <= exam.date));
    }).sort((a,b) => a.date.localeCompare(b.date));
    return [{date:known}, evolved, eligibleFinals.length ? {date:eligibleFinals[0].date} : null];
  }
  function escape(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  let cards = [], fileSource = null;
  function panel(cl, s, pet, image) {
    const earned = milestones(cl,s);
    cards = designs.map((d,i) => {
      const item = earned[i];
      const details=item && root.ClassCardDetails.describe(cl,s,pet,item.date);
      if (details && d.id==='meet' && !item.date) details.growthLine='认养日期待补记';
      return {design:d, item, student:s.name, pet:pet.name, number:pet.id, group:cl.name, full:image(s.petId,d.form), thumb:image(s.petId,d.form,true), details};
    });
    return '<section class="pet-memory" aria-label="免费成长纪念卡"><header><h2>成长纪念卡</h2><span>已收藏 '+earned.filter(Boolean).length+' / 3</span></header><p>点击已点亮的卡面，免费保存属于自己的电子纪念卡。</p><div class="pet-memory-tiles">'+cards.map(({design:d,item,thumb},i) => '<button type="button" class="pet-memory-tile pet-memory-'+d.id+'" data-memory-card="'+i+'" '+(item ? '' : 'disabled')+'><img src="'+escape(thumb)+'" alt="" loading="lazy"><span><strong>'+d.title+'</strong><small>'+(item ? (item.date || '已认养')+' · 查看卡面' : d.rule)+'</small></span></button>').join('')+'</div></section>';
  }
  async function art(card) {
    let src = card.full;
    if (root.location.protocol === 'file:') {
      const id = String(card.number).padStart(3,'0');
      if (!fileSource || fileSource.id !== id) {
        root.ClassCollectionFileArt = null;
        const script = document.createElement('script');
        script.src = 'memory-art/'+id+'.js';
        const loaded = new Promise((resolve,reject) => { script.onload=resolve; script.onerror=reject; });
        document.head.appendChild(script);
        try { await loaded; fileSource = {id, forms:root.ClassCollectionFileArt}; }
        finally { script.remove(); }
      }
      src = fileSource.forms[card.design.form];
    }
    const img = new Image();
    return new Promise((resolve,reject) => { img.onload=()=>resolve(img); img.onerror=reject; img.src=src; });
  }
  function lines(ctx, text, width) {
    const result = []; let row = '';
    for (const ch of Array.from(text)) {
      if (row && ctx.measureText(row+ch).width > width) { result.push(row); row=''; }
      row += ch;
    }
    if (row) result.push(row);
    return result;
  }
  const sans = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
  const serif = '"STKaiti", "KaiTi", "Noto Serif CJK SC", serif';
  function lettering(ctx,text,x,y,width,size,options={}) {
    const weight=options.weight || 500, font=options.font || sans, limit=options.rows || 1;
    let rows;
    do {
      ctx.font=weight+' '+size+'px '+font;
      rows=lines(ctx,text,width);
      if (rows.length<=limit || size<=13) break;
      size--;
    } while (size>0);
    ctx.textAlign=options.align || 'center'; ctx.fillStyle=options.color;
    rows.forEach((line,i)=>ctx.fillText(line,x,y+i*(size+4)));
  }
  function star(ctx,x,y,r) {
    ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x+r*.17,y-r*.16,x+r,y);ctx.quadraticCurveTo(x+r*.17,y+r*.16,x,y+r);ctx.quadraticCurveTo(x-r*.17,y+r*.16,x-r,y);ctx.quadraticCurveTo(x-r*.17,y-r*.16,x,y-r);ctx.fill();
  }
  function draw(canvas, card, img) {
    const c=canvas.getContext('2d'), d=card.design, center=420;
    canvas.width=840; canvas.height=1260; c.fillStyle=d.paper; c.fillRect(0,0,840,1260);
    c.lineWidth=2; c.strokeStyle=d.line; c.strokeRect(21,21,798,1218);
    lettering(c,'班 级 仙 宠 园',center,86,500,23,{color:d.accent});
    lettering(c,d.title,center,169,640,66,{color:d.ink,weight:700,font:serif});
    c.fillStyle=d.accent; star(c,106,139,9); star(c,734,139,9);
    const frame=736, x=52, y=209;
    c.strokeStyle=d.line; c.strokeRect(x-6,y-6,frame+12,frame+12);
    const scale=Math.min(frame/img.naturalWidth,frame/img.naturalHeight);
    c.drawImage(img,x+(frame-img.naturalWidth*scale)/2,y+(frame-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);
    lettering(c,'伙伴主人',62,997,332,22,{color:d.accent,align:'left'});
    lettering(c,card.student,62,1048,332,43,{color:d.ink,weight:700,align:'left',rows:2});
    lettering(c,card.group,62,1120,332,23,{color:d.ink,align:'left',rows:2});
    c.strokeStyle=d.line; c.beginPath(); c.moveTo(420,979);c.lineTo(420,1144);c.stroke();
    lettering(c,card.item.date ? card.item.date.replace(/-/g,' · ') : '已认养',452,997,326,22,{color:d.accent,align:'left'});
    lettering(c,card.pet,452,1048,326,43,{color:d.ink,weight:700,align:'left'});
    lettering(c,card.details.preference,452,1091,326,23,{color:d.ink,align:'left'});
    lettering(c,card.details.growthLine,452,1125,326,22,{color:d.ink,align:'left'});
    c.fillStyle=d.accent; star(c,center,1168,7);
    lettering(c,card.details.blessing,center,1210,712,26,{color:d.ink,font:serif});
  }
  let dialog = null;
  function closePreview() { if (!dialog) return false; dialog.close(); return true; }
  async function preview(trigger, card) {
    if (dialog || !card || !card.item) return;
    const node=document.createElement('dialog'); dialog=node; node.className='pet-memory-preview';node.setAttribute('aria-labelledby','pet-memory-title');
    node.innerHTML='<div class="pet-memory-preview-grid"><div class="pet-memory-sheet"><canvas role="img"></canvas></div><div class="pet-memory-tools"><h2 id="pet-memory-title"></h2><p class="pet-memory-caption"></p><p class="pet-memory-status" role="status">正在绘制纪念卡…</p><button type="button" data-memory-save disabled>保存电子卡</button><button type="button" class="secondary" data-memory-close>返回成长册</button></div></div>';
    const canvas=node.querySelector('canvas'), save=node.querySelector('[data-memory-save]'), msg=node.querySelector('[role=status]'), back=node.querySelector('[data-memory-close]');
    node.querySelector('h2').textContent=card.design.title;node.querySelector('.pet-memory-caption').textContent=card.design.caption;canvas.setAttribute('aria-label',card.student+'与'+card.pet+'的'+card.design.title+'纪念卡。'+card.details.blessing);
    function saved(e) {save.disabled=false;msg.textContent=e.detail && e.detail.message || (e.detail && e.detail.ok ? '电子卡已保存。' : '已取消保存，可再次选择。');}
    root.addEventListener('classpetmemorysaved',saved);
    node.addEventListener('close',()=>{root.removeEventListener('classpetmemorysaved',saved);node.remove();dialog=null;if(trigger.isConnected) trigger.focus();},{once:true});
    document.body.appendChild(node);node.showModal();back.focus();back.onclick=closePreview;
    let png='';
    try { const img=await art(card); if(!node.open)return;draw(canvas,card,img);png=canvas.toDataURL('image/png');msg.textContent='免费保存 · 电子纪念卡';save.disabled=false; }
    catch(err) { if(node.open)msg.textContent='卡面图片未能载入。请返回成长册，重新打开。'; }
    save.onclick=()=>{
      try {
        if(root.AndroidNative && typeof root.AndroidNative.saveMemoryCardPng==='function') {
          save.disabled=true;
          const opened=root.AndroidNative.saveMemoryCardPng(png);
          msg.textContent=opened ? '请在系统窗口选择保存位置。' : '保存窗口未打开，可重新尝试。';
          if(!opened)save.disabled=false;
        } else {
          const link=document.createElement('a');link.href=png;link.download='班级仙宠园_'+card.design.title+'.png';node.appendChild(link);link.click();link.remove();msg.textContent='已开始下载电子卡。';
        }
      } catch(err) { save.disabled=false;msg.textContent='保存未完成，请再试一次。'; }
    };
  }
  root.ClassCollection={milestones,panel,closePreview};
  if (typeof document !== 'undefined') document.addEventListener('click',e=>{const b=e.target.closest('[data-memory-card]');if(b && !b.disabled)preview(b,cards[Number(b.dataset.memoryCard)]);});
})(typeof window==='undefined'?globalThis:window);
