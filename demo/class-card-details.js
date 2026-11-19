(function(root){
  'use strict';
  const R=root.ClassRules;
  const blessings=Object.freeze({
    '云畦蔬圃':'愿你带着好奇与勇气，在每个平凡日子悄悄发光。',
    '万寿果林':'愿每一份认真，都在时光里长成属于你的甜。',
    '南海珍果洲':'愿你心有晴空，乘着好奇的风去发现更大的世界。',
    '苍松坚果崖':'愿你像山间青松，步履从容，也有向上的力量。',
    '云溪稻香村':'愿你的每一点坚持，都能酿成明天温柔的惊喜。',
    '天河水晶宫':'愿你眼里有星河，心中有勇气，自在追寻小小梦想。',
    '仙厨炙鲜台':'愿你心里常有暖意，把认真与热爱带进每一天。',
    '云霞甜点阁':'愿你的日子有甜有光，慢慢收藏每一次小小进步。',
    '玉露灵泉':'愿你心如清泉，始终清澈明亮，也有向前的勇气。',
    '星河山海境':'愿你怀着热爱走向山海，在广阔天地找到自己的光。'
  });
  function adoptionOverride(keep,s){
    // Older web records have no pet-bound adoption date. Use verified effort days for them.
    return keep?.adoptedForPetId===s.petId && typeof keep.adoptedOn==='string' ? keep.adoptedOn : '';
  }
  function describe(cl,s,p,issuedOn='',adoptedOnOverride){
    const today=R.today(),cutoff=issuedOn||today,adoptedOn=adoptedOnOverride===undefined?s.adoptedOn||'':adoptedOnOverride;
    let growthLine='成长故事，正在开始';
    if(!R.dateOK(cutoff)||cutoff>today)growthLine='发卡日期待核对';
    else if(adoptedOn){
      if(!R.dateOK(adoptedOn)||adoptedOn>cutoff||adoptedOn>today)growthLine='认养日期待核对';
      else{const days=Math.floor((Date.parse(cutoff+'T00:00:00Z')-Date.parse(adoptedOn+'T00:00:00Z'))/86400000)+1;growthLine='相伴 '+days+' 天，收获这份珍藏';}
    }else{
      const dates=new Set((cl.homework||[]).filter(a=>{
        const record=a.statuses?.[s.id];
        if(record?.state!=='complete'||!R.dateOK(a.date)||a.date>cutoff||a.date>today)return false;
        return !Number.isFinite(record.at)||(R.today(record.at)<=cutoff&&R.today(record.at)<=today);
      }).map(a=>a.date));
      if(dates.size)growthLine='累计 '+dates.size+' 个努力日';
    }
    return {growthLine,preference:'偏爱 · '+String(p.food||'').trim(),blessing:blessings[p.series]||'愿你带着好奇与勇气，在每个平凡日子悄悄发光。'};
  }
  root.ClassCardDetails={describe,adoptionOverride,blessings};
  if(typeof module!=='undefined')module.exports=root.ClassCardDetails;
})(typeof window!=='undefined'?window:globalThis);
