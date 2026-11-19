/* Responsive presentation for the existing teacher tools. */
(() => {
  const main = document.getElementById('main');
  const bar = document.querySelector('.topbar');
  if (!main || !bar) return;

  const compact = matchMedia('(max-width:1000px)');
  const phone = matchMedia('(max-width:700px)');
  const tools = [...bar.querySelectorAll('.edition-help,[data-action=demo],#motionToggle')];
  const anchors = tools.map(tool => {
    const anchor = document.createComment('teacher tool');
    tool.before(anchor);
    return anchor;
  });
  const options = document.createElement('details');
  options.className = 'class-options';
  const summary = document.createElement('summary');
  summary.textContent = '班级工具';
  const menu = document.createElement('div');
  menu.className = 'class-options-menu';
  options.append(summary, menu);
  function arrangeTools() {
    options.open = false;
    if (phone.matches) {
      bar.append(options);
      menu.append(...tools);
    } else {
      anchors.forEach((anchor, index) => anchor.after(tools[index]));
      options.remove();
    }
  }
  phone.addEventListener('change', arrangeTools);
  arrangeTools();
  document.addEventListener('click', event => {
    if (options.open && (!options.contains(event.target) || menu.contains(event.target))) options.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && options.open) { options.open = false; summary.focus(); }
  });

  let pane = 'roster';
  let previousRoute;
  function update(layout, selected, moveFocus) {
    pane = selected;
    layout.dataset.pane = pane;
    for (const button of layout.querySelectorAll('[data-teacher-pane]')) {
      button.setAttribute('aria-pressed', String(button.dataset.teacherPane === pane));
      if (moveFocus && button.dataset.teacherPane === pane) button.focus({preventScroll:true});
    }
  }
  function prepareViews() {
    const layout = main.querySelector('.work-layout');
    const stage = layout?.querySelector(':scope > #petStage');
    const roster = layout?.querySelector(':scope > .work-panel');
    const route = location.hash || '#homework';
    if (route !== previousRoute) pane = 'roster';
    previousRoute = route;
    if (!stage || !roster || layout.querySelector(':scope > .teacher-panes')) return;
    roster.id = 'teacherRoster';
    const group = document.createElement('div');
    group.className = 'teacher-panes';
    group.setAttribute('role','group');
    group.setAttribute('aria-label','选择工作台视图');
    const rosterButton = document.createElement('button');
    rosterButton.type = 'button'; rosterButton.dataset.teacherPane = 'roster';
    rosterButton.setAttribute('aria-controls',roster.id);
    rosterButton.textContent = '学生名单';
    const partner = document.createElement('button');
    partner.type = 'button'; partner.dataset.teacherPane = 'partner';
    partner.setAttribute('aria-controls',stage.id);
    const art = stage.querySelector('.pet-painting');
    if (art) {
      const portrait = document.createElement('img');
      portrait.src = art.getAttribute('src'); portrait.alt = ''; portrait.width = 28; portrait.height = 28;
      partner.append(portrait);
    }
    const name = stage.querySelector('.pet-name')?.textContent || '伙伴';
    partner.append(document.createTextNode('查看' + name));
    group.append(rosterButton, partner);
    layout.prepend(group);
    update(layout, pane, false);
  }
  new MutationObserver(prepareViews).observe(main, {childList:true});
  prepareViews();
  document.addEventListener('click', event => {
    const choice = event.target.closest('[data-teacher-pane]');
    if (choice) {
      update(choice.closest('.work-layout'),choice.dataset.teacherPane,true);
      return;
    }
    if (!compact.matches) return;
    const control = event.target.closest('[data-action]');
    if (!control) return;
    const action = control.dataset.action;
    if (action === 'viewStudent' || action === 'returnRoster') {
      const layout = main.querySelector('.work-layout');
      if (!layout || !layout.querySelector('#petStage')) return;
      update(layout, action === 'viewStudent' ? 'partner' : 'roster', false);
      if (action === 'viewStudent') {
        requestAnimationFrame(() => {
          const stage = main.querySelector('#petStage');
          stage?.scrollIntoView({block:'start'}); stage?.focus({preventScroll:true});
        });
      }
    }
    if (['newHomework','newExam','openCatchup'].includes(action)) pane = 'roster';
  },true);
})();