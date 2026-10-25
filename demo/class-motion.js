(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const preferenceKey='tianting-classroom-motion';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let enabled=true;
try{enabled=localStorage.getItem(preferenceKey)!=='off';}catch{}
const actors=new Map();
const heart='<path d="M12 20S3 14.5 3 8.6C3 4.3 8.5 2.5 12 7c3.5-4.5 9-2.7 9 1.6C21 14.5 12 20 12 20Z"/>';
const star='<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>';
const bowl='<path d="M3 10h18c-1 7-4 10-9 10S4 17 3 10ZM8 4v3m4-4v4m4-3v3"/>';
function symbol(shape,cls=''){return '<svg class="'+cls+'" viewBox="0 0 24 24" aria-hidden="true">'+shape+'</svg>';}
function face(mood){
 const sad=mood==='hungry'||mood==='reset',delighted=mood==='feed'||mood==='evolve'||mood==='gift',shy=mood==='stroke';
 return '<svg viewBox="0 0 80 84" aria-hidden="true"><circle class="expression-paper" cx="37" cy="36" r="31"/><circle class="expression-paper" cx="61" cy="68" r="6"/><circle class="expression-paper" cx="72" cy="77" r="3"/><g class="pet-blush"><ellipse cx="17" cy="44" rx="7" ry="4"/><ellipse cx="57" cy="44" rx="7" ry="4"/></g>'+(sad?'<path class="face-line" d="m17 23 10-3m20 0 10 3"/>':'')+'<g class="pet-eyes">'+(delighted?'<path class="face-line" d="M19 34q5-7 10 0m16 0q5-7 10 0"/>':shy?'<path class="face-line" d="M19 32q5 7 10 0m16 0q5 7 10 0"/>':'<ellipse class="eye-fill" cx="24" cy="33" rx="4.5" ry="6"/><ellipse class="eye-fill" cx="50" cy="33" rx="4.5" ry="6"/><circle class="eye-shine" cx="25.5" cy="31" r="1.5"/><circle class="eye-shine" cx="51.5" cy="31" r="1.5"/>')+'</g>'+(sad?'<path class="face-line" d="M29 51q8-8 16 0"/><path class="pet-tear" d="M58 39q-9 12 0 13q9-1 0-13Z"/>':delighted?'<path class="pet-smile" d="M28 46h18q-9 16-18 0Z"/>':'<path class="face-line" d="M29 47q8 9 16 0"/>')+'</svg>';
}
const moodLabel={happy:'开心眨眼的小表情',hopeful:'期待陪伴的小表情',egg:'期待长大的小表情',hungry:'委屈落泪的小表情',reset:'等待重新成长的小表情'};
function art({img,alt,studentId,form,state,compact=false,evolution=form}){
 const mood=state.hungry?(state.reset?'reset':'hungry'):form==='egg'?'egg':state.feeds?'happy':'hopeful';
 const message=state.hungry?(state.reset?'我回到仙蛋了，补齐作业再出发吧。':'等你补齐作业，一起吃饭。'):state.feeds?'你的认真我都记得，一起继续长大吧。':'我在这里，等你的第一份努力。';
 const title=state.hungry?(state.reset?'等待重新出发':'肚子空空，等你来喂'):form==='egg'?'小小仙蛋，正在长大':'把今天的认真，慢慢珍藏';
 const expression='<span class="pet-expression" role="img" aria-label="'+moodLabel[mood]+'">'+face(mood)+'</span>';
 return '<div class="pet-canvas'+(compact?' reward-portrait':'')+'" data-pet-actor="'+esc(studentId)+'" data-pet-form="'+esc(form)+'" data-pet-mood="'+mood+'">'+ClassSurprises.frame('<div class="pet-art-window"><img class="pet-painting" src="'+esc(img)+'" alt="'+esc(alt)+'" width="'+(compact?88:1024)+'" height="'+(compact?88:1024)+'"><div class="pet-sparks" aria-hidden="true">'+symbol(star,'pet-spark spark-one')+symbol(heart,'pet-spark spark-two')+'</div><div class="pet-action-trail" aria-hidden="true"></div></div>',evolution)+(compact?expression:'<div class="pet-response">'+expression+'<div class="pet-response-copy"><strong class="pet-mood-title">'+(state.hungry?symbol(bowl,'icon'):'')+title+'</strong><div class="pet-bubble pet-message" aria-live="polite">'+message+'</div></div></div>')+'</div>';
}
function updatePreference(){
 document.body.classList.toggle('pet-motion-enabled',enabled&&!reduced.matches&&!document.hidden);
 const button=document.getElementById('motionToggle');
 if(button){button.disabled=reduced.matches;button.setAttribute('aria-pressed',String(enabled&&!reduced.matches));button.textContent=reduced.matches?'静态模式':enabled?'暂停动效':'开启动效';button.title=reduced.matches?'遵循系统的减少动态效果设置':'控制宠物动作和动态表情';}
}
const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
 for(const entry of entries)entry.target.classList.toggle('motion-visible',entry.isIntersecting);
},{threshold:.05}):null;
function sync(){
 for(const [actor,control] of actors)if(!actor.isConnected){clearTimeout(control.timer);observer?.unobserve(actor);actors.delete(actor);}
 for(const actor of document.querySelectorAll('[data-pet-actor]'))if(!actors.has(actor)){actors.set(actor,{timer:null});if(observer)observer.observe(actor);else actor.classList.add('motion-visible');}
 updatePreference();
}
function toggle(){
 if(reduced.matches)return;
 enabled=!enabled;try{localStorage.setItem(preferenceKey,enabled?'on':'off');}catch{}
 updatePreference();
}
function resetReaction(actor){
 delete actor.dataset.petReaction;
 const expression=actor.querySelector('.pet-expression');
 expression.innerHTML=face(actor.dataset.petMood);expression.setAttribute('aria-label',moodLabel[actor.dataset.petMood]);
 actor.querySelector('.pet-action-trail').innerHTML='';
 const bubble=actor.closest('.stage')?.querySelector('.pet-message');
 if(bubble?.dataset.defaultText)bubble.textContent=bubble.dataset.defaultText;
}
function react(actor,kind){
 if(!actor?.isConnected)return false;
 const control=actors.get(actor);if(!control)return false;
 clearTimeout(control.timer);
 const waiting=['hungry','reset'].includes(actor.dataset.petMood);
 const reaction=waiting&&kind==='feed'?'comfort':kind;
 const bubble=actor.closest('.stage')?.querySelector('.pet-message');
 if(bubble&&!bubble.dataset.defaultText)bubble.dataset.defaultText=bubble.textContent;
 const messages=waiting?{stroke:'收到你的摸摸啦，等作业补齐再一起吃饭。',comfort:'谢谢这一口，还有作业等着补齐哦。',gift:'礼包收好啦，等作业补齐就能继续成长。',evolve:'新形态记住啦，先补齐作业再一起出发。'}:{stroke:'嘿嘿，收到你的摸摸啦。',feed:'啊呜，吃饱啦！谢谢你的认真。',gift:'哇，我也有专属小礼物啦！',evolve:'看，我又长大一点啦！'};
 if(!waiting&&kind==='stroke'){const lines=['嘿嘿，收到你的摸摸啦。','手心暖暖的，今天也喜欢和你在一起。','偷偷靠近一点，我们是好伙伴呀。','伸个懒腰，陪你休息一小会儿。'];messages.stroke=lines[(control.strokes||0)%lines.length];control.strokes=(control.strokes||0)+1;}
 if(bubble)bubble.textContent=messages[reaction]||messages.stroke;
 actor.dataset.petReaction=reaction;
 const expression=actor.querySelector('.pet-expression');
 expression.innerHTML=face(waiting?actor.dataset.petMood:reaction);
 expression.setAttribute('aria-label',waiting?moodLabel[actor.dataset.petMood]:reaction==='stroke'?'害羞开心的小表情':'开心笑脸');
 const shape=kind==='feed'?bowl:kind==='stroke'?heart:star;
 actor.querySelector('.pet-action-trail').innerHTML=[0,1,2].map(i=>symbol(shape,'trail-piece trail-'+i)).join('');
 // Rapid repeated actions restart a single bounded response, never accumulate particles.
 if(enabled&&!reduced.matches)for(const animation of actor.getAnimations({subtree:true}))if(animation.effect?.getTiming().iterations!==Infinity)animation.currentTime=0;
 control.timer=setTimeout(()=>{
  if(!actor.isConnected)return;
  resetReaction(actor);
 },3200);
 return true;
}
function stroke(studentId){const actor=[...actors.keys()].find(a=>a.dataset.petActor===studentId&&a.closest('.stage'));return react(actor,'stroke');}
function reward({ids,upgraded,kind}){
 sync();
 for(const actor of actors.keys())if(ids.includes(actor.dataset.petActor))react(actor,upgraded.includes(actor.dataset.petActor)?'evolve':kind);
}
document.addEventListener('visibilitychange',updatePreference);
reduced.addEventListener('change',updatePreference);
window.addEventListener('pagehide',()=>{observer?.disconnect();for(const [actor,control] of actors){clearTimeout(control.timer);resetReaction(actor);}actors.clear();});
window.addEventListener('pageshow',sync);
window.ClassMotion={art,sync,toggle,stroke,reward};
updatePreference();
})();
