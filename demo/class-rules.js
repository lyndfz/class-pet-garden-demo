(function(root){
  'use strict';
  const STATES=['pending','complete','missing','excused'];
  const defaults={feedGrowth:3,giftGrowth:15,giftStars:3,hungryDays:3,skipDates:[]};
  function today(now=Date.now()){return new Date(now+8*3600000).toISOString().slice(0,10);}
  function dateOK(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
  function text(s,max=80){if(typeof s!=='string'||s.trim().length>max)throw Error('文字格式不正确或过长');return s.trim();}
  function id(s){if(typeof s!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(s)||['__proto__','constructor','prototype'].includes(s))throw Error('记录编号不正确');return s;}
  function num(v,min,max){if(!Number.isFinite(v)||v<min||v>max)throw Error('数值超出允许范围');return v;}
  function integer(v,min,max){num(v,min,max);if(!Number.isInteger(v))throw Error('请填写整数');return v;}
  function uid(){return 'r_'+crypto.randomUUID().replace(/-/g,'');}
  function fresh(){return {version:1,classes:[],selectedClass:null};}
  function normalize(input){
    if(!input||input.version!==1||!Array.isArray(input.classes)||input.classes.length>10)throw Error('这不是有效的班级备份');
    const db=structuredClone(input),classIds=new Set();
    for(const c of db.classes){id(c.id);if(classIds.has(c.id))throw Error('班级编号重复');classIds.add(c.id);c.name=text(c.name,40);if(!c.name)throw Error('请填写班级名称');c.term=text(c.term,40);c.teacher=text(c.teacher||'',30);c.settings={...defaults,...c.settings};integer(c.settings.feedGrowth,1,20);integer(c.settings.giftGrowth,1,100);integer(c.settings.giftStars,1,20);integer(c.settings.hungryDays,1,30);
      if(!Array.isArray(c.settings.skipDates)||c.settings.skipDates.length>500||c.settings.skipDates.some(d=>!dateOK(d)))throw Error('不计时日期格式不正确');
      if(!Array.isArray(c.students)||c.students.length>100||!Array.isArray(c.homework)||c.homework.length>500||!Array.isArray(c.exams)||c.exams.length>80)throw Error('班级记录数量超出范围');
      const students=new Set(),numbers=new Set();
      for(const s of c.students){id(s.id);if(students.has(s.id))throw Error('学生编号重复');students.add(s.id);s.number=text(s.number,12);s.name=text(s.name,30);if(!s.name||!s.number||numbers.has(s.number))throw Error('姓名、学号不能为空，学号不能重复');numbers.add(s.number);integer(s.petId,1,100);s.cycle=integer(s.cycle||0,0,10000);s.resets=integer(s.resets||0,0,10000);s.archived=!!s.archived;s.openedGifts=s.openedGifts??[];if(!Array.isArray(s.openedGifts)||s.openedGifts.length>12||new Set(s.openedGifts).size!==s.openedGifts.length)throw Error('宝匣记录不正确');for(const slot of s.openedGifts)integer(slot,0,11);s.appearance=s.appearance||'original';if(!Object.hasOwn(themeNames,s.appearance))throw Error('纪念外观不正确');s.resetFor=s.resetFor?text(s.resetFor,80):null;s.resetDate=s.resetDate||null;if(s.resetDate&&!dateOK(s.resetDate))throw Error('回蛋日期不正确');}

      c.praises=c.praises||[];if(!Array.isArray(c.praises)||c.praises.length>1000)throw Error('表扬记录数量不正确');const praiseIds=new Set(),praiseDays=new Set();for(const p of c.praises){id(p.id);const key=p.sid+'|'+p.kind+'|'+p.date;if(praiseIds.has(p.id)||praiseDays.has(key)||!students.has(p.sid)||!Object.hasOwn(praiseKinds,p.kind)||!dateOK(p.date))throw Error('表扬记录不正确');praiseIds.add(p.id);praiseDays.add(key);p.note=text(p.note||'',80);integer(p.petId,1,100);num(p.at,0,9e15);}
      const homeworkIds=new Set();
      for(const a of c.homework){id(a.id);if(homeworkIds.has(a.id))throw Error('作业编号重复');homeworkIds.add(a.id);a.title=text(a.title,80);a.requirement=text(a.requirement||'',240);if(!a.title||!dateOK(a.date))throw Error('作业名称或日期不正确');integer(a.growth,1,20);if(!Array.isArray(a.roster)||new Set(a.roster).size!==a.roster.length||a.roster.some(x=>!students.has(x)))throw Error('作业名单不正确');
        if(!a.statuses||typeof a.statuses!=='object'||Array.isArray(a.statuses))throw Error('作业状态不正确');for(const [sid,v] of Object.entries(a.statuses)){if(!a.roster.includes(sid)||!STATES.includes(v.state))throw Error('作业状态不正确');if(v.state==='missing'&&!dateOK(v.since))throw Error('饥饿开始日期不正确');if(v.state==='complete'){integer(v.cycle,0,10000);num(v.at,0,9e15);if(v.makeup!==undefined&&typeof v.makeup!=='boolean')throw Error('补交记录格式不正确');}}
      }
      const exams=new Set();
      for(const e of c.exams){id(e.id);if(exams.has(e.id))throw Error('考试编号重复');exams.add(e.id);e.title=text(e.title,80);if(!e.title||!dateOK(e.date)||!['regular','final'].includes(e.kind))throw Error('考试记录不正确');e.criterion=text(e.criterion||'',160);e.awards=e.awards||{};e.ranks=e.ranks||{};if(Array.isArray(e.awards)||Array.isArray(e.ranks))throw Error('考试名单不正确');
        for(const [sid,g] of Object.entries(e.awards)){if(!students.has(sid))throw Error('礼包学生不存在');integer(g.growth,1,100);integer(g.stars,1,20);integer(g.cycle,0,10000);integer(g.petId,1,100);num(g.at,0,9e15);}validateRanks(c,e.ranks);e.keepsakes=e.keepsakes||{};if(typeof e.keepsakes!=='object'||Array.isArray(e.keepsakes)||Object.keys(e.keepsakes).length>100)throw Error('卡片寄语不正确');for(const [sid,k] of Object.entries(e.keepsakes)){if(!students.has(sid)||!k||typeof k!=='object'||Array.isArray(k))throw Error('卡片学生不存在');k.note=text(k.note||'',60);k.nickname=text(k.nickname||'',16);k.date=k.date||'';if(k.date&&!dateOK(k.date))throw Error('颁发日期不正确');}
      }
      c.events=Array.isArray(c.events)?c.events.slice(0,60):[];for(const l of c.events){l.text=text(l.text,240);num(l.at,0,9e15);}
    }
    if(db.selectedClass&&!classIds.has(db.selectedClass))db.selectedClass=db.classes[0]?.id||null;
    return db;
  }
  function active(c){return c.students.filter(s=>!s.archived);}
  function businessDays(from,to,skip=[]){if(!dateOK(from)||!dateOK(to)||to<=from)return 0;let t=Date.parse(from+'T12:00:00Z')+86400000,end=Date.parse(to+'T12:00:00Z'),n=0,days=0;const ignored=new Set(skip);while(t<=end&&days++<36500){const d=new Date(t),key=d.toISOString().slice(0,10);if(d.getUTCDay()!==0&&d.getUTCDay()!==6&&!ignored.has(key))n++;t+=86400000;}return n;}
  function missing(c,s){return c.homework.filter(a=>a.statuses[s.id]?.state==='missing').map(a=>({id:a.id,since:a.statuses[s.id].since,title:a.title})).sort((a,b)=>a.since.localeCompare(b.since));}
  function log(c,message,now=Date.now()){c.events.unshift({text:message,at:now});c.events=c.events.slice(0,60);}
  function reconcile(db,now=Date.now()){
    let changes=0;const day=today(now);
    for(const c of db.classes)for(const s of active(c)){const list=missing(c,s);if(!list.length){if(s.resetFor){s.resetFor=null;changes++;}continue;}const elapsed=businessDays(list[0].since,day,c.settings.skipDates);if(elapsed>=c.settings.hungryDays&&!s.resetFor){s.cycle++;s.resets++;s.resetFor=list[0].id;s.resetDate=day;log(c,`${s.name}的仙宠持续等待补交，已回到仙蛋。`,now);changes++;}}
    return changes;
  }
  function petState(c,s,now=Date.now()){
    const list=missing(c,s);let growth=0,feeds=0,allGrowth=0,stars=0,gifts=0;
    for(const a of c.homework){const r=a.statuses[s.id];if(r?.state==='complete'){feeds++;allGrowth+=a.growth;if(r.cycle===s.cycle)growth+=a.growth;}}
    for(const e of c.exams){const g=e.awards[s.id];if(g){gifts++;stars+=g.stars;allGrowth+=g.growth;if(g.cycle===s.cycle)growth+=g.growth;}}
    const elapsed=list.length?businessDays(list[0].since,today(now),c.settings.skipDates):0;
    return {growth:s.resetFor&&list.length?0:Math.min(100,growth),totalGrowth:allGrowth,feeds,stars,gifts,missing:list,elapsed,hungry:list.length>0,reset:!!s.resetFor,remaining:Math.max(0,c.settings.hungryDays-elapsed),hunger:list.length?20:feeds?100:65};
  }
  function form(g){return g>=100?'official':g>=65?'child':g>=25?'mortal':'egg';}
  const labels={egg:'仙蛋',mortal:'凡间',child:'仙童',official:'仙官'};
  const milestones=[{form:'egg',growth:0},{form:'mortal',growth:25},{form:'child',growth:65},{form:'official',growth:100}];
  function growthGoal(c,s,now=Date.now()){
    const state=petState(c,s,now),next=milestones.find(m=>m.growth>state.growth);
    return next?{...next,remaining:next.growth-state.growth,feeds:Math.ceil((next.growth-state.growth)/c.settings.feedGrowth)}:null;
  }
  function effort(c,s){
    const completed=c.homework.filter(a=>a.statuses[s.id]?.state==='complete'),dates=new Set(completed.map(a=>a.date));
    const feeds=completed.length,days=dates.size,makeups=completed.filter(a=>a.statuses[s.id].makeup).length,gifts=c.exams.filter(e=>e.awards[s.id]).length;
    const badges=[
      {id:'first',name:'第一口美食',rule:'完成 1 份作业',value:feeds,target:1,icon:'food'},
      {id:'days',name:'五日认真',rule:'在 5 个不同检查日完成作业',value:days,target:5,icon:'leaf'},
      {id:'steady',name:'十次坚持',rule:'累计完成 10 份作业',value:feeds,target:10,icon:'star'},
      {id:'comeback',name:'再出发',rule:'完成 1 次待补交作业',value:makeups,target:1,icon:'check'},
      {id:'exam',name:'荣誉伙伴',rule:'获得 1 份老师发放的考试礼包',value:gifts,target:1,icon:'gift'},
      {id:'companion',name:'长久陪伴',rule:'累计完成 30 份作业',value:feeds,target:30,icon:'people'}
    ].map(b=>({...b,earned:b.value>=b.target}));
    return {feeds,days,makeups,gifts,badges,earned:badges.filter(b=>b.earned).length};
  }
  function careQueue(c,now=Date.now()){
    return active(c).map(student=>({student,state:petState(c,student,now)})).filter(x=>x.state.hungry)
      .sort((a,b)=>Number(b.state.reset)-Number(a.state.reset)||b.state.elapsed-a.state.elapsed||a.student.number.localeCompare(b.student.number,'zh-CN',{numeric:true}));
  }
  function weekEffort(c,s,now=Date.now()){
    const current=today(now),stamp=Date.parse(current+'T12:00:00Z'),offset=(new Date(stamp).getUTCDay()+6)%7,start=stamp-offset*86400000;
    const days=Array.from({length:7},(_,i)=>{
      const date=new Date(start+i*86400000).toISOString().slice(0,10),future=date>current;
      const assignments=c.homework.filter(a=>a.date===date&&a.roster.includes(s.id));
      const feeds=future?0:assignments.filter(a=>a.statuses[s.id]?.state==='complete').length;
      const missing=future?0:assignments.filter(a=>a.statuses[s.id]?.state==='missing').length;
      const pending=future?0:assignments.filter(a=>!a.statuses[s.id]||a.statuses[s.id].state==='pending').length;
      const excused=future?0:assignments.filter(a=>a.statuses[s.id]?.state==='excused').length;
      return {date,label:['一','二','三','四','五','六','日'][i],today:date===current,future,rest:i>=5||c.settings.skipDates.includes(date),feeds,missing,pending,excused,assigned:assignments.length};
    });
    return {days,feeds:days.reduce((n,d)=>n+d.feeds,0),effortDays:days.filter(d=>d.feeds>0).length};
  }
  function effortGoal(c,s){
    const progress=effort(c,s);
    if(missing(c,s).length){const comeback=progress.badges.find(b=>b.id==='comeback');if(!comeback.earned)return {...comeback,remaining:1,unit:'份待补交作业'};}
    const candidates=progress.badges.filter(b=>['first','days','steady','companion'].includes(b.id)&&!b.earned);
    candidates.sort((a,b)=>(a.target-a.value)-(b.target-b.value)||a.target-b.target);
    const goal=candidates[0];
    return goal?{...goal,remaining:goal.target-goal.value,unit:goal.id==='days'?'个不同检查日':'份合格作业'}:null;
  }

  const praiseKinds={progress:'进步明显',correction:'认真订正',reading:'阅读坚持',kindness:'主动帮助'};
  const journeyMilestones=[
    {days:5,name:'晨光启程',theme:'dawn'},
    {days:15,name:'星夜同行',theme:'night'},
    {days:30,name:'花间约定',theme:'blossom'},
    {days:60,name:'学期知己',theme:null}
  ];
  const themeNames={original:'原画',starlight:'星光礼赞',sunshine:'暖阳礼赞',dawn:'晨光启程',night:'星夜同行',blossom:'花间约定'};
  function journey(c,s,now=Date.now()){
    const events=[];
    for(const a of c.homework){const v=a.statuses[s.id];if(v?.state==='complete')events.push({id:a.id,at:v.at,cycle:v.cycle,growth:a.growth});}
    for(const e of c.exams){const g=e.awards[s.id];if(g)events.push({id:e.id,at:g.at,cycle:g.cycle,growth:g.growth});}
    events.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
    const sums=new Map();let startedAt=null;
    for(const e of events){sums.set(e.cycle,(sums.get(e.cycle)||0)+e.growth);if(sums.get(e.cycle)>=100){startedAt=e.at;break;}}
    const startDate=startedAt===null?null:today(startedAt),day=today(now);
    const dates=new Set(startDate?c.homework.filter(a=>{const v=a.statuses[s.id];return v?.state==='complete'&&v.at>=startedAt&&a.date>startDate&&a.date<=day;}).map(a=>a.date):[]);
    const days=dates.size,chapters=journeyMilestones.map(m=>({...m,unlocked:startedAt!==null&&days>=m.days}));
    const next=startedAt===null?null:chapters.find(m=>!m.unlocked)||{days:(Math.floor((days-60)/20)+1)*20+60,name:'下一枚陪伴纪念印',theme:null};
    return {startedAt,startDate,days,chapters,next,remaining:next?next.days-days:null,seals:days<60?0:1+Math.floor((days-60)/20)};
  }
  function appearances(c,s){
    const gifts=c.exams.filter(e=>e.awards[s.id]).length,j=journey(c,s);
    return Object.entries(themeNames).map(([id,name])=>({id,name,unlocked:id==='original'||id==='starlight'&&gifts>=1||id==='sunshine'&&gifts>=3||j.chapters.some(m=>m.theme===id&&m.unlocked),
      rule:id==='original'?'一直可用':id==='starlight'?'获得 1 份考试礼包':id==='sunshine'?'获得 3 份考试礼包':j.chapters.find(m=>m.theme===id)?.days+' 个仙官旅程努力日'}));
  }
  function appearance(c,s){return appearances(c,s).find(t=>t.id===s.appearance&&t.unlocked)?.id||'original';}
  function setAppearance(c,sid,theme){const s=active(c).find(s=>s.id===sid);if(!s)throw Error('学生不存在');if(!appearances(c,s).some(t=>t.id===theme&&t.unlocked))throw Error('这份纪念外观还未解锁');s.appearance=theme;}
  function praise(c,sid,{kind,note='',date=today()},now=Date.now()){
    const s=active(c).find(s=>s.id===sid);if(!s)throw Error('学生不存在');
    if(!Object.hasOwn(praiseKinds,kind)||!dateOK(date)||date>today(now))throw Error('请选择有效的表扬类型和日期');
    note=text(note,80);c.praises=c.praises||[];
    if(c.praises.some(p=>p.sid===sid&&p.kind===kind&&p.date===date))return null;
    if(c.praises.length>=1000)throw Error('本学期表扬记录已满，请先备份并建立新学期班级');
    const record={id:uid(),sid,petId:s.petId,kind,note,date,at:now};c.praises.unshift(record);
    log(c,`${s.name}获得“${praiseKinds[kind]}”表扬。`,now);return record;
  }
  function removePraise(c,pid){const before=(c.praises||[]).length;c.praises=(c.praises||[]).filter(p=>p.id!==pid);return before!==c.praises.length;}
  function keepsake(c,eid,sid,values){
    const e=c.exams.find(e=>e.id===eid&&e.kind==='final');
    if(!e||!winners(c,e).some(s=>s.id===sid))throw Error('请先确认这位学生的正式前 10 名资格');
    const note=text(values.note||'',60),nickname=text(values.nickname||'',16),date=values.date||'';
    if(date&&!dateOK(date))throw Error('颁发日期不正确');
    e.keepsakes=e.keepsakes||{};e.keepsakes[sid]={note,nickname,date};
  }


  const advancedForms=[{id:'star',name:'星辉仙灵',days:5},{id:'cloud',name:'云游仙君',days:15}];
  function evolution(c,s,now=Date.now()){
    const state=petState(c,s,now),base=form(state.growth),j=journey(c,s,now);
    const stages=advancedForms.map((f,i)=>({...f,rank:4+i,unlocked:j.startedAt!==null&&j.days>=f.days}));
    const current=state.growth>=100?[...stages].reverse().find(f=>f.unlocked):null;
    return {id:current?.id||base,name:current?.name||labels[base],rank:current?.rank??milestones.findIndex(m=>m.form===base),base,days:j.days,stages,next:stages.find(f=>!f.unlocked)||null};
  }
  const keepsakeItems=[
    {id:'feather',name:'晨光羽毛',icon:'leaf',line:'把一束晨光留给认真出发的你。'},
    {id:'bookmark',name:'云朵书签',icon:'card',line:'翻开下一页，我还会陪着你。'},
    {id:'lamp',name:'星星灯',icon:'star',line:'小小的坚持，也会发光。'},
    {id:'moon',name:'月牙糖',icon:'heart',line:'今天的认真，值得一点甜。'},
    {id:'boat',name:'小纸船',icon:'arrow',line:'我们慢慢走，也能走到很远。'},
    {id:'chime',name:'愿望风铃',icon:'gift',line:'叮铃，把下一次期待挂在风里。'},
    {id:'letter',name:'花瓣信封',icon:'card',line:'把今天的小进步，写进信封里。'},
    {id:'seed',name:'仙园种子',icon:'leaf',line:'每一次努力，都像给种子浇水。'},
    {id:'ribbon',name:'彩虹丝带',icon:'heart',line:'给我们的故事系上漂亮的蝴蝶结。'},
    {id:'medal',name:'勇气勋章',icon:'star',line:'再试一次的勇气，也很了不起。'},
    {id:'book',name:'伙伴故事书',icon:'card',line:'你和我的故事，还会有下一章。'},
    {id:'night',name:'晚安月',icon:'star',line:'认真过后，也记得好好休息。'}
  ];
  function surprises(c,s,now=Date.now()){
    const dates=new Set(c.homework.filter(a=>{const v=a.statuses[s.id];return v?.state==='complete'&&v.at<=now&&a.date<=today(now);}).map(a=>a.date));
    let seed=0;for(const ch of s.id)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
    const opened=new Set(s.openedGifts||[]),days=dates.size;
    const slots=keepsakeItems.map((_,slot)=>{const target=slot===0?1:slot*3;return {slot,target,earned:days>=target,opened:opened.has(slot),item:keepsakeItems[(seed%12+slot*5)%12]};});
    const earned=slots.filter(x=>x.earned),ready=earned.filter(x=>!x.opened),collected=earned.filter(x=>x.opened),next=slots.find(x=>!x.earned);
    return {days,slots,ready,collected,next,remaining:next?next.target-days:0};
  }
  function openSurprise(c,sid,slot,now=Date.now()){
    integer(slot,0,keepsakeItems.length-1);const s=active(c).find(x=>x.id===sid);if(!s)throw Error('学生不存在');
    const prize=surprises(c,s,now).slots[slot];if(!prize.earned)throw Error('这只宝匣还在等待下一份努力');
    s.openedGifts=s.openedGifts||[];if(s.openedGifts.includes(slot))return null;
    s.openedGifts.push(slot);return prize.item;
  }
  function petNotes(c,s,now=Date.now()){
    const box=surprises(c,s,now),e=effort(c,s),grown=evolution(c,s,now);
    return [
      {id:'hello',title:'初次见面',earned:true,text:'我是你的伙伴。第一口喜欢的美食，等老师确认作业后一起分享。'},
      {id:'first',title:'记得第一口美食',earned:box.days>=1,text:'啊呜，今天吃得好开心！谢谢你认真完成作业，我们的故事开始啦。'},
      {id:'three',title:'藏了一点小心意',earned:box.days>=3,text:'我把一路遇到的小东西收进宝匣。每一个努力的日子，都有被记住。'},
      {id:'return',title:'再试一次也很棒',earned:e.makeups>0,text:'这份作业终于补齐啦。愿意回来再试一次，也是一种很棒的勇气。'},
      {id:'praise',title:'听见老师表扬你',earned:(c.praises||[]).some(p=>p.sid===s.id&&p.date<=today(now)),text:'刚刚听见老师说起你的进步，我也悄悄挺起了胸膛。好想和你一起记住这一刻。'},
      {id:'grown',title:'长大的约定',earned:journey(c,s,now).startedAt!==null,text:'从小小仙蛋到仙官，每一步都有你的认真。后面还有星辉和祥云，等我们慢慢遇见。'},
      {id:'star',title:'一起收集星光',earned:grown.stages[0].unlocked,text:'看，星光落在我们的新装扮上啦！明天也一起留下一个认真又开心的日子。'},
      {id:'cloud',title:'云端的来信',earned:grown.stages[1].unlocked,text:'我们已经走了这么远。今天先看看云、歇一歇，新的故事可以慢慢来。'}
    ];
  }

  function createClass(db,{name,term,teacher}){const c={id:uid(),name:text(name,40),term:text(term,40),teacher:text(teacher||'',30),settings:structuredClone(defaults),students:[],homework:[],exams:[],events:[],praises:[]};if(!c.name)throw Error('请填写班级名称');if(db.classes.length>=10)throw Error('最多管理10个班级');db.classes.push(c);db.selectedClass=c.id;return c;}
  function parseRoster(raw){const lines=raw.trim().split(/\r?\n/).filter(x=>x.trim());if(!lines.length)throw Error('请粘贴学生名单');if(lines.length>100)throw Error('每个班级最多100位学生');const used=new Set();return lines.map((line,i)=>{const parts=line.trim().split(/[\t,， ]+/);const number=parts.length>1?parts.shift():String(i+1).padStart(2,'0'),name=parts.join(' ');if(!name||used.has(number))throw Error('请检查姓名与重复学号');used.add(number);return {number:text(number,12),name:text(name,30)};});}
  function addStudents(c,list){const used=new Set(c.students.map(s=>s.number));if(c.students.length+list.length>100)throw Error('每个班级最多100位学生');for(const s of list){if(used.has(s.number))throw Error('学号 '+s.number+' 已存在');used.add(s.number);}for(const [i,s] of list.entries())c.students.push({id:uid(),number:s.number,name:s.name,petId:(c.students.length%100)+1,cycle:0,resets:0,resetFor:null,resetDate:null,archived:false,appearance:'original',openedGifts:[]});}
  function createHomework(c,{title,date,requirement},now=Date.now()){if(!title.trim()||!dateOK(date)||date>today(now))throw Error('填写作业名称和不晚于今天的日期');if(!active(c).length)throw Error('先添加学生名单');const a={id:uid(),title:text(title,80),date,requirement:text(requirement||'',240),growth:c.settings.feedGrowth,roster:active(c).map(s=>s.id),statuses:{}};c.homework.unshift(a);return a;}
  function mark(c,aid,sids,state,now=Date.now()){
    if(!STATES.includes(state))throw Error('状态不正确');const a=c.homework.find(a=>a.id===aid);if(!a)throw Error('先选择一份作业');let count=0;
    for(const sid of new Set(sids)){const s=c.students.find(s=>s.id===sid&&!s.archived);if(!s||!a.roster.includes(sid))throw Error('学生不在这份作业名单中');const old=a.statuses[sid];if(old?.state===state)continue;
      a.statuses[sid]=state==='complete'?{state,cycle:s.cycle,at:now,makeup:old?.state==='missing'}:state==='missing'?{state,since:a.date,at:now}:{state,at:now};count++;
    }if(count)log(c,`${a.title}：${count}位学生${{complete:'完成并喂食',missing:'待补交',pending:'改为待检查',excused:'无需提交'}[state]}。`,now);return count;
  }
  function createExam(c,{title,date,kind,criterion}){if(!title.trim()||!dateOK(date))throw Error('请填写考试名称和日期');const e={id:uid(),title:text(title,80),date,kind,criterion:text(criterion||'',160),awards:{},ranks:{},keepsakes:{}};c.exams.unshift(e);return e;}
  function award(c,eid,sids,now=Date.now()){const e=c.exams.find(x=>x.id===eid);if(!e)throw Error('先建立考试记录');if(e.date>today(now))throw Error('考试日期尚未到达');let count=0;for(const sid of new Set(sids)){const s=c.students.find(s=>s.id===sid&&!s.archived);if(!s)throw Error('学生不存在');if(e.awards[sid])continue;e.awards[sid]={growth:c.settings.giftGrowth,stars:c.settings.giftStars,cycle:s.cycle,petId:s.petId,at:now};count++;}if(count)log(c,`${e.title}：老师为${count}位学生发放了专属礼包。`,now);return count;}
  function validateRanks(c,ranks){const used=new Set();for(const [sid,r] of Object.entries(ranks)){if(!c.students.some(s=>s.id===sid))throw Error('名次对应的学生不存在');integer(r,1,c.students.length);if(used.has(r))throw Error('名次 '+r+' 重复，请按正式名次核对');used.add(r);}}
  function setRanks(c,eid,ranks){const e=c.exams.find(x=>x.id===eid&&x.kind==='final');if(!e)throw Error('先选择期末考试');validateRanks(c,ranks);e.ranks=structuredClone(ranks);}
  function winners(c,e){if(!e||e.kind!=='final')return [];return active(c).filter(s=>e.ranks[s.id]>=1&&e.ranks[s.id]<=10).sort((a,b)=>e.ranks[a.id]-e.ranks[b.id]);}
  root.ClassRules={fresh,normalize,today,dateOK,uid,defaults,active,businessDays,missing,reconcile,petState,form,labels,milestones,growthGoal,effort,careQueue,weekEffort,effortGoal,createClass,parseRoster,addStudents,createHomework,mark,createExam,award,setRanks,winners,log,praiseKinds,themeNames,journey,journeyMilestones,appearances,appearance,setAppearance,praise,removePraise,keepsake,advancedForms,evolution,keepsakeItems,surprises,openSurprise,petNotes};
  if(typeof module!=='undefined')module.exports=root.ClassRules;
})(typeof window!=='undefined'?window:globalThis);
