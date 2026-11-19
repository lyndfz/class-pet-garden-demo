(() => {
  'use strict';
  const soundKey = 'classpet-reward-sound';
  const soundButton = document.getElementById('rewardSoundToggle');
  let soundOn = true;
  try { soundOn = localStorage.getItem(soundKey) !== 'off'; } catch (_) {}

  // Three short pentatonic cues. Times and note lengths are in seconds.
  const cues = {
    level: [[0, 293.66, .25], [.12, 440, .27], [.26, 587.33, .31], [.44, 739.99, .46], [.61, 880, .70]],
    gift:  [[0, 392, .12], [.13, 392, .14], [.29, 523.25, .27], [.43, 659.25, .49], [.52, 783.99, .52]],
    card:  [[0, 329.63, .44], [.03, 493.88, .45], [.28, 659.25, .42], [.52, 830.61, .65]]
  };
  let context = null;
  let unlocking = null;
  let activeScore = null;
  let generation = 0;
  let ribbon = null;
  let timer = 0;

  function updateButton() {
    if (!soundButton) return;
    soundButton.textContent = soundOn ? '音效开' : '音效关';
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.title = soundOn ? '关闭课堂庆祝音效' : '开启课堂庆祝音效';
  }
  // Unlock inside the teacher's gesture. Saving an award may finish after it.
  function unlock(event) {
    if (!event.isTrusted || !soundOn || document.hidden) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      if (!context || context.state === 'closed') context = new Audio();
      if (context.state === 'suspended' && !unlocking) {
        unlocking = context.resume().then(() => { unlocking = null; }, () => { unlocking = null; });
      }
    } catch (_) {}
  }
  function stopScore() {
    if (!activeScore) return;
    const old = activeScore;
    activeScore = null;
    const now = context.currentTime;
    old.bus.gain.cancelScheduledValues(now);
    old.bus.gain.setTargetAtTime(0, now, .008);
    for (const note of old.voices) {
      try { note.stop(now + .04); } catch (_) {}
    }
  }
  function playCue(kind) {
    if (!context || context.state !== 'running' || !soundOn || document.hidden) return;
    const bus = context.createGain();
    bus.gain.value = .42;
    bus.connect(context.destination);
    const score = {bus, voices: new Set()};
    activeScore = score;
    const start = context.currentTime + .014;
    function voice(freq, when, duration, peak, wave) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.value = freq;
      envelope.gain.setValueAtTime(.0001, when);
      envelope.gain.exponentialRampToValueAtTime(peak, when + .015);
      envelope.gain.exponentialRampToValueAtTime(.0001, when + duration);
      oscillator.connect(envelope);
      envelope.connect(bus);
      score.voices.add(oscillator);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        score.voices.delete(oscillator);
        if (!score.voices.size) {
          bus.disconnect();
          if (score === activeScore) activeScore = null;
        }
      };
      oscillator.start(when);
      oscillator.stop(when + duration + .015);
    }
    for (const [offset, frequency, duration] of cues[kind]) {
      voice(frequency, start + offset, duration, .24, kind === 'gift' ? 'triangle' : 'sine');
      voice(2 * frequency, start + offset, duration * .55, .048, 'sine');
    }
  }
  function clear() {
    generation++;
    clearTimeout(timer);
    if (ribbon) ribbon.remove();
    ribbon = null;
    stopScore();
  }
  function node(tag, className) {
    const el = document.createElement(tag);
    el.className = 'celebrate-' + className;
    return el;
  }
  const stars = [[4,35,5],[9,72,7],[20,14,8],[32,88,5],[41,19,5],[55,80,6],[72,17,7],[81,72,5],[90,38,8],[96,66,4]];
  function show(event) {
    if (!event || !Object.prototype.hasOwnProperty.call(cues,event.kind) || document.hidden) return;
    clear();
    const version = generation;
    const kind = event.kind;
    const rewardTitles = {exam:'礼包送达', treasure:'宝匣开启', badge:'徽章点亮'};
    const title = kind === 'level' ? '形态进阶' : kind === 'card' ? '荣誉卡解锁' : rewardTitles[event.rewardType] || '获得奖励';
    const count = Math.max(1, Math.floor(Number(event.count) || 1));
    const name = String(event.name || '仙宠伙伴');
    const stage = String(event.stage || (kind === 'level' ? '新形态' : kind === 'card' ? '期末珍藏卡' : '专属奖励'));
    const caption = kind === 'level'
      ? (count === 1 ? name : name + ' 等 ' + count + ' 位伙伴进阶')
      : (count === 1 ? name : count + ' 位伙伴') + ' · ' + stage;
    const box = node('aside', 'ribbon');
    box.dataset.kind = kind;
    // The teacher's original success message and undo control stay interactive.
    box.setAttribute('aria-hidden','true');
    const sky = node('span','sky');
    for (const [left, top, size] of stars) {
      const star = node('i','star');
      star.style.left = left + '%';
      star.style.top = top + '%';
      star.style.width = star.style.height = size + 'px';
      star.style.animationDelay = (left % 4) * .075 + 's';
      sky.appendChild(star);
    }
    const seal = node('span','seal');
    const art = node('span','portrait');
    const symbol = node('span','symbol');
    symbol.textContent = kind === 'card' ? '✧' : kind === 'gift' ? '✿' : '✦';
    art.appendChild(symbol);
    if (event.art) {
      const img = document.createElement('img');
      img.alt = '';
      img.addEventListener('error', () => img.remove(), {once:true});
      img.src = event.art;
      art.appendChild(img);
      if (event.evolution === 'star' || event.evolution === 'cloud') {
        art.dataset.evolution = event.evolution;
      }
    }
    seal.append(art, node('i','orbit'), node('i','badge'));
    const copy = node('span','copy');
    const heading = node('strong','heading');
    if (kind === 'level') {
      const kicker = node('span','kicker');
      kicker.textContent = title;
      copy.appendChild(kicker);
    }
    heading.textContent = kind === 'level' ? stage : title;
    const detail = node('span','detail');
    detail.textContent = caption;
    copy.append(heading, detail);
    box.append(sky, seal, copy);
    // Modal dialogs and fullscreen containers render above ordinary body content.
    const dialogs = document.querySelectorAll('dialog[open]');
    const host = document.fullscreenElement || dialogs[dialogs.length - 1] || document.body;
    host.appendChild(box);
    ribbon = box;
    const started = performance.now();
    function sound() {
      if (version !== generation || performance.now() - started > 650) return;
      try { playCue(kind); } catch (_) {}
    }
    if (unlocking) unlocking.then(sound);
    else sound();
    timer = window.setTimeout(() => { if (generation === version) clear(); }, 2450);
  }
  if (soundButton) {
    updateButton();
    soundButton.addEventListener('click', event => {
      soundOn = !soundOn;
      try { localStorage.setItem(soundKey, soundOn ? 'on' : 'off'); } catch (_) {}
      if (soundOn) unlock(event);
      else stopScore();
      updateButton();
    });
  }
  document.addEventListener('pointerup', unlock, true);
  document.addEventListener('keydown', unlock, true);
  document.addEventListener('click', unlock, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  window.addEventListener('beforeprint', clear);
  window.addEventListener('pagehide', clear);
  window.addEventListener('hashchange', clear);
  window.ClassPetCelebrate = {show, clear};
})();
