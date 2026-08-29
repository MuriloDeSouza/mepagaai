'use strict';

// ══════════════════════════════════════════════════════════════════════════
// PAGE: LANDING
// ══════════════════════════════════════════════════════════════════════════
function renderLanding() {
  Pages.show('landing');
}

// ══════════════════════════════════════════════════════════════════════════
// PAGE: ONBOARDING (3 steps)
// ══════════════════════════════════════════════════════════════════════════
const OnboardingPage = (() => {
  let step = 1;
  let draft = { name:'', email:'', photo: null, pixKeys:[], defaultPix: null };

  function render() {
    Pages.show('onboarding');
    const wrap = document.getElementById('onboarding-inner');
    // stepper
    wrap.querySelector('#ob-stepper').innerHTML = [1,2,3].map(n => `
      <div class="step-dot ${n < step ? 'done' : n === step ? 'active' : 'inactive'}">${n < step ? '✓' : n}</div>
      ${n < 3 ? `<div class="step-line ${n < step ? 'done' : ''}"></div>` : ''}
    `).join('');
    ['ob-s1','ob-s2','ob-s3'].forEach((id,i) => {
      document.getElementById(id).classList.toggle('active', i+1 === step);
    });
    if (step === 3) renderStep3Final();
    bindStep();
  }

  function bindStep() {
    if (step === 1) {
      const ni = document.getElementById('ob-name');
      const ei = document.getElementById('ob-email');
      if (draft.name) ni.value = draft.name;
      if (draft.email) ei.value = draft.email;

      document.getElementById('ob-photo-area').onclick = () => document.getElementById('ob-photo-input').click();
      document.getElementById('ob-photo-input').onchange = function() {
        const file = this.files[0]; if (!file) return;
        const r = new FileReader();
        r.onload = e => {
          draft.photo = e.target.result;
          const area = document.getElementById('ob-photo-area');
          area.innerHTML = `<img src="${draft.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        };
        r.readAsDataURL(file);
      };

      document.getElementById('ob-next1').onclick = () => {
        draft.name  = document.getElementById('ob-name').value.trim();
        draft.email = document.getElementById('ob-email').value.trim();
        if (!draft.name)  { toast('Informe seu nome','error'); return; }
        if (!draft.email || !draft.email.includes('@')) { toast('Informe um e-mail válido','error'); return; }
        step = 2; render();
      };
    }

    if (step === 2) {
      renderPixList();
      document.getElementById('ob-back2').onclick  = () => { step=1; render(); };
      document.getElementById('ob-skip2').onclick  = () => { step=3; render(); };
      document.getElementById('ob-next2').onclick  = () => { step=3; render(); };
      document.getElementById('ob-add-pix').onclick = addPix;
    }

    if (step === 3) {
      document.getElementById('ob-finish').onclick = finish;
      document.getElementById('ob-create-ev')?.addEventListener('click', () => {
        setTimeout(() => CreateEventModal.open(), 200);
      });
    }
  }

  function renderPixList() {
    const list = document.getElementById('ob-pix-list');
    list.innerHTML = draft.pixKeys.map((k,i) => `
      <div class="pix-key-item">
        <div>
          <div style="font-size:.78rem;color:var(--text-light)">${k.type.toUpperCase()}</div>
          <div style="font-size:.88rem;font-weight:600">${k.value}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${draft.defaultPix === i
            ? '<span class="badge badge-teal">Padrão</span>'
            : `<button class="btn btn-ghost btn-sm" onclick="OnboardingPage_setDefault(${i})">★</button>`}
          <button class="pix-remove" onclick="OnboardingPage_removePix(${i})">✕</button>
        </div>
      </div>`).join('') || '<div style="font-size:.82rem;color:var(--text-light);text-align:center;padding:12px">Nenhuma chave cadastrada</div>';
  }

  function addPix() {
    const type  = document.getElementById('ob-pix-type').value;
    const value = document.getElementById('ob-pix-value').value.trim();
    if (!value) { toast('Informe o valor da chave','error'); return; }
    draft.pixKeys.push({ type, value });
    if (draft.defaultPix === null) draft.defaultPix = 0;
    document.getElementById('ob-pix-value').value = '';
    renderPixList();
  }

  function renderStep3Final() {
    const pending = sessionStorage.getItem('pending_code');
    let extra = '';
    if (pending) {
      const ev = State.getByCode(pending);
      if (ev) extra = `
        <div class="card" style="background:var(--bg-card-alt);border:1px solid var(--teal);margin-bottom:12px">
          <div style="font-size:.8rem;color:var(--teal);margin-bottom:4px">CONVITE PENDENTE</div>
          <div style="font-weight:700">${ev.name}</div>
          <div style="font-size:.8rem;color:var(--text-light)">${ev.type} · ${ev.participants.length} participantes</div>
        </div>`;
    }
    document.getElementById('ob-s3-content').innerHTML = `
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:3rem;margin-bottom:8px" class="check-anim">✅</div>
        <h3 style="font-size:1.3rem;margin-bottom:4px">Bem-vindo(a), ${draft.name.split(' ')[0]}!</h3>
        <p style="color:var(--text-light);font-size:.9rem">Seu perfil está criado.</p>
      </div>
      ${extra}
      ${pending ? `<button class="btn btn-primary btn-block" id="ob-join-ev" style="margin-bottom:10px">Entrar no evento →</button>` : ''}
      <button class="btn btn-primary btn-block" id="ob-create-ev" ${pending?'style="background:var(--bg-card-alt)"':''}>
        ${pending ? 'Criar novo evento' : '🎉 Criar meu primeiro evento'}
      </button>
      <button class="btn btn-ghost btn-block" id="ob-finish" style="margin-top:8px">Ver demo com dados de exemplo →</button>`;

    document.getElementById('ob-join-ev')?.addEventListener('click', () => {
      const ev = State.joinEvent(pending);
      sessionStorage.removeItem('pending_code');
      if (ev) { State.currentEventId = ev.id; finish(); setTimeout(() => Router.go('/evento/'+ev.id), 100); }
    });
    document.getElementById('ob-create-ev')?.addEventListener('click', () => {
      finish(); setTimeout(() => CreateEventModal.open(), 300);
    });
  }

  function finish() {
    const user = {
      id: 'user-local',
      name: draft.name, email: draft.email, photo: draft.photo,
      pixKeys: draft.pixKeys, defaultPix: draft.defaultPix
    };
    State.setUser(user);
    // patch user-local in mock events
    State.events.forEach(ev => {
      ev.participants.forEach(p => {
        if (p.id === 'user-local') { p.name = user.name; p.pix = user.pixKeys?.[0]?.value || null; }
      });
    });
    State.save();
    toast(`Bem-vindo(a), ${user.name.split(' ')[0]}! 👋`);
    Router.go('/home');
  }

  // exposed for inline handlers
  window.OnboardingPage_setDefault = (i) => { draft.defaultPix = i; renderPixList(); };
  window.OnboardingPage_removePix  = (i) => { draft.pixKeys.splice(i,1); if (draft.defaultPix >= draft.pixKeys.length) draft.defaultPix = draft.pixKeys.length-1; renderPixList(); };

  return { render };
})();

// ══════════════════════════════════════════════════════════════════════════
// PAGE: HOME / DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function renderHome() {
  Pages.show('home');
  const user = State.user;
  if (!user) return;

  // greeting
  document.getElementById('home-greeting').textContent = `${greeting()}, ${user.name.split(' ')[0]}.`;

  // totals
  const { toReceive, toPay } = State.dashboardTotals();
  const net = toReceive - toPay;
  document.getElementById('home-receive').textContent = fmt(toReceive);
  document.getElementById('home-pay').textContent = fmt(toPay);
  document.getElementById('home-net').textContent = fmt(Math.abs(net));
  document.getElementById('home-net').className = 'stat-value ' + (net >= 0 ? 'text-teal' : 'text-red');

  // pending count
  const pendingEvs = State.events.filter(ev => State.userBalance(ev.id) < -0.005);
  document.getElementById('home-subtitle').textContent =
    pendingEvs.length > 0 ? `Você tem ${pendingEvs.length} pendência(s) em aberto.` : 'Você está quite em todos os eventos! ✓';

  // avatar
  const avEl = document.getElementById('home-avatar');
  avEl.innerHTML = avatarHTML(user.name, user.photo, 'av-md');

  // recent events (last 3)
  const recents = [...State.events].slice(0,3);
  const recentEl = document.getElementById('home-events');
  recentEl.innerHTML = recents.length ? recents.map(ev => {
    const bal = State.userBalance(ev.id);
    const isHost = ev.hostId === user.id;
    return `
      <div class="event-card" onclick="State.currentEventId='${ev.id}';Router.go('/evento/${ev.id}')">
        <div class="ec-top">
          <div>
            <div class="ec-emoji">${ev.emoji}</div>
          </div>
          <div style="flex:1;margin-left:10px">
            <div class="ec-name">${ev.name}</div>
            <div class="ec-meta">👥 ${ev.participants.length} · 📅 ${fmtDate(ev.date)}</div>
          </div>
          <span class="badge ${isHost ? 'badge-teal' : 'badge-gray'}">${isHost ? 'Anfitrião' : 'Convidado'}</span>
        </div>
        <div class="ec-bottom">
          <div>
            <div class="ec-total-label">Total</div>
            <div class="ec-total-value">${fmt(ev.expenses.reduce((a,e)=>a+e.amount,0))}</div>
          </div>
          <div>
            <div class="ec-balance-label" style="color:${bal >= 0 ? 'var(--teal)':'var(--red)'}">${bal >= 0 ? 'A receber' : 'Você deve'}</div>
            <div class="ec-balance-value" style="color:${bal >= 0 ? 'var(--teal)':'var(--red)'}">${fmt(Math.abs(bal))}</div>
          </div>
        </div>
      </div>`;
  }).join('') : '<div class="empty-state"><div class="empty-icon">🤝</div><p>Nenhum evento ainda</p></div>';

  // urgencies
  const urgEl = document.getElementById('home-urgent');
  const urgents = State.events.filter(ev => State.userBalance(ev.id) < -0.005 && ev.status === 'open');
  urgEl.innerHTML = urgents.length ? urgents.map(ev => {
    const bal = Math.abs(State.userBalance(ev.id));
    const creditor = State.calcSettlement(ev.id)[0];
    return `
      <div class="nudge-banner" style="cursor:pointer" onclick="State.currentEventId='${ev.id}';Router.go('/evento/${ev.id}')">
        <div style="flex:1">
          <div class="nudge-text"><strong>${fmt(bal)}</strong> a pagar${creditor ? ` para <strong>${creditor.toName}</strong>` : ''} em <em>${ev.name}</em></div>
        </div>
        <span style="color:var(--amber);font-size:.82rem;font-weight:700">Ver →</span>
      </div>`;
  }).join('') : '';
}

// ══════════════════════════════════════════════════════════════════════════
// PAGE: EVENTOS (list)
// ══════════════════════════════════════════════════════════════════════════
function renderEventos(filter = 'all') {
  Pages.show('eventos');
  const user = State.user;
  let evs = State.events;
  if (filter === 'open')   evs = evs.filter(e => e.status === 'open');
  if (filter === 'closed') evs = evs.filter(e => e.status === 'closed');
  if (filter === 'host')   evs = evs.filter(e => e.hostId === user?.id);
  if (filter === 'guest')  evs = evs.filter(e => e.hostId !== user?.id);

  document.getElementById('eventos-list').innerHTML = evs.length ? evs.map(ev => {
    const bal = State.userBalance(ev.id);
    const total = ev.expenses.reduce((a,e)=>a+e.amount,0);
    const isHost = ev.hostId === user?.id;
    return `
      <div class="event-card" onclick="State.currentEventId='${ev.id}';Router.go('/evento/${ev.id}')">
        <div class="ec-top">
          <div class="ec-emoji">${ev.emoji}</div>
          <div style="flex:1;margin-left:10px">
            <div class="ec-name">${ev.name}</div>
            <div class="ec-meta">👥 ${ev.participants.length} · 📅 ${fmtDate(ev.date)}</div>
            <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">
              <span class="badge badge-gray">${ev.type}</span>
              ${ev.status === 'closed' ? '<span class="badge badge-red">Encerrado</span>' : '<span class="badge badge-teal">Aberto</span>'}
              <span class="badge ${isHost?'badge-teal':'badge-gray'}">${isHost?'Anfitrião':'Convidado'}</span>
            </div>
          </div>
        </div>
        <div class="ec-bottom">
          <div><div class="ec-total-label">Total</div><div class="ec-total-value">${fmt(total)}</div></div>
          <div>
            <div class="ec-balance-label" style="color:${bal>=0?'var(--teal)':'var(--red)'}">${bal>=0?'A receber':'Você deve'}</div>
            <div class="ec-balance-value" style="color:${bal>=0?'var(--teal)':'var(--red)'}">${fmt(Math.abs(bal))}</div>
          </div>
        </div>
      </div>`;
  }).join('')
  : '<div class="empty-state"><div class="empty-icon">🗂️</div><p>Nenhum evento encontrado</p><button class="btn btn-outline btn-sm" onclick="CreateEventModal.open()">+ Criar evento</button></div>';

  // filter chips
  document.querySelectorAll('#eventos-filters .filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === filter);
    chip.onclick = () => renderEventos(chip.dataset.filter);
  });
}

// ══════════════════════════════════════════════════════════════════════════
// PAGE: EVENTO INTERNO
// ══════════════════════════════════════════════════════════════════════════
const EventPage = (() => {
  let activeTab = 'despesas';

  function render(evId) {
    State.currentEventId = evId;
    const ev = State.getEvent(evId);
    if (!ev) { Router.go('/eventos'); return; }
    Pages.show('evento');

    const user = State.user;
    const isHost = ev.hostId === user?.id;
    const bal = State.userBalance(evId);

    // header
    document.getElementById('ev-title').textContent = ev.emoji + ' ' + ev.name;
    document.getElementById('ev-status-badge').innerHTML =
      ev.status === 'open' ? '<span class="badge badge-teal">Aberto</span>' : '<span class="badge badge-red">Encerrado</span>';

    // sub-header metrics
    document.getElementById('ev-total').textContent = fmt(ev.expenses.reduce((a,e)=>a+e.amount,0));
    const balEl = document.getElementById('ev-mybal');
    if (Math.abs(bal) < 0.01) {
      balEl.innerHTML = '<span style="color:var(--teal)">Você está quite ✓</span>';
    } else if (bal > 0) {
      balEl.innerHTML = `<span style="color:var(--teal)">A receber: ${fmt(bal)}</span>`;
    } else {
      balEl.innerHTML = `<span style="color:var(--red)">Você deve: ${fmt(Math.abs(bal))}</span>`;
    }

    // progress
    const balances = State.calcBalances(evId);
    const quite = balances.filter(b => Math.abs(b.net) < 0.01).length;
    const pct = Math.round((quite / balances.length) * 100);
    document.getElementById('ev-progress-fill').style.width = pct + '%';
    document.getElementById('ev-progress-label').textContent = `${quite} de ${balances.length} participantes quites`;

    // close button
    const closeBtn = document.getElementById('ev-close-btn');
    closeBtn.style.display = (isHost && ev.status === 'open') ? 'block' : 'none';
    closeBtn.onclick = () => confirmClose(evId);

    // code
    document.getElementById('ev-code-display').textContent = ev.code;

    // FAB
    const fab = document.getElementById('fab-add-expense');
    fab.style.display = ev.status === 'open' ? 'flex' : 'none';
    fab.onclick = () => AddExpenseModal.open(evId);

    // tabs
    document.querySelectorAll('.ev-tab').forEach(t => {
      t.onclick = () => {
        activeTab = t.dataset.tab;
        document.querySelectorAll('.ev-tab').forEach(x => x.classList.toggle('active', x.dataset.tab === activeTab));
        document.querySelectorAll('.ev-tab-pane').forEach(x => x.classList.toggle('active', x.dataset.pane === activeTab));
        if (activeTab === 'despesas')     renderExpenses();
        else if (activeTab === 'saldos') renderSaldos();
        else                             renderParticipants();
      };
      t.classList.toggle('active', t.dataset.tab === activeTab);
    });
    document.querySelectorAll('.ev-tab-pane').forEach(x => x.classList.toggle('active', x.dataset.pane === activeTab));

    renderExpenses();
    renderSaldos();
    renderParticipants();
  }

  function renderExpenses() {
    const ev = State.getEvent(State.currentEventId);
    if (!ev) return;
    const container = document.getElementById('ev-expenses-list');
    if (!ev.expenses.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🧾</div><p>Nenhuma despesa ainda</p></div>';
      return;
    }
    const uid2 = State.user?.id || 'user-local';
    container.innerHTML = [...ev.expenses].reverse().map(exp => {
      const payer = ev.participants.find(p => p.id === exp.paidBy);
      const myCota = exp.splitEqually
        ? exp.amount / ev.participants.length
        : (exp.splits?.[uid2] || 0);
      return `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;gap:10px;align-items:flex-start">
            ${exp.photo ? `<img src="${exp.photo}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0">` 
              : `<div style="width:52px;height:52px;background:var(--bg-card-alt);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">${catEmoji(exp.cat)}</div>`}
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:.95rem">${exp.desc}</div>
              <div style="font-size:.78rem;color:var(--text-light);margin-top:2px">Pago por <strong style="color:var(--white)">${payer?.name || '?'}</strong> · ${fmtDate(exp.date)}</div>
              <span class="badge badge-gray" style="margin-top:4px;font-size:.68rem">${exp.cat}</span>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-weight:700;font-size:1rem">${fmt(exp.amount)}</div>
              <div style="font-size:.72rem;color:${myCota>0?'var(--amber)':'var(--text-light)'};margin-top:2px">Sua cota: ${fmt(myCota)}</div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderSaldos() {
    const ev = State.getEvent(State.currentEventId);
    if (!ev) return;
    const uid2 = State.user?.id || 'user-local';
    const balances = State.calcBalances(State.currentEventId);
    const myBal = balances.find(b => b.id === uid2);
    const transfers = State.calcSettlement(State.currentEventId);

    // my balance card
    const myBalEl = document.getElementById('ev-mybal-card');
    if (myBal) {
      if (Math.abs(myBal.net) < 0.01) {
        myBalEl.style.background = '#1d9e7518'; myBalEl.style.border = '1px solid var(--teal)';
        myBalEl.innerHTML = '<div style="font-weight:700;color:var(--teal)">✓ Você está quite neste evento!</div>';
      } else if (myBal.net > 0) {
        myBalEl.style.background = '#1d9e7518'; myBalEl.style.border = '1px solid var(--teal)';
        const creditors = transfers.filter(t => t.toId === uid2 && !t.settled);
        myBalEl.innerHTML = `<div style="font-size:.8rem;color:var(--teal);margin-bottom:4px">A RECEBER</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--teal)">${fmt(myBal.net)}</div>
          ${creditors.length ? `<button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="openPixModal('${creditors[0].fromName}',null,${creditors[0].amount})">💳 Cobrar via PIX</button>` : ''}`;
      } else {
        myBalEl.style.background = '#ef444418'; myBalEl.style.border = '1px solid var(--red)';
        const debt = transfers.find(t => t.fromId === uid2 && !t.settled);
        myBalEl.innerHTML = `<div style="font-size:.8rem;color:var(--red);margin-bottom:4px">VOCÊ DEVE</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--red)">${fmt(Math.abs(myBal.net))}</div>
          ${debt ? `<div style="font-size:.82rem;margin-top:4px">para <strong>${debt.toName}</strong></div>
            <button class="btn btn-danger btn-sm" style="margin-top:8px" onclick="openPixModal('${debt.toName}','${debt.toPix||''}',${debt.amount})">Pagar agora via PIX</button>` : ''}`;
      }
    }

    // all balances
    document.getElementById('ev-balances-list').innerHTML = balances.map(b => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-dark)">
        ${avatarHTML(b.name, null, 'av-sm')}
        <div style="flex:1">
          <div style="font-size:.88rem;font-weight:600">${b.name} ${b.isHost ? '<span class="badge badge-teal" style="font-size:.6rem">Host</span>' : ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;color:${Math.abs(b.net)<0.01?'var(--teal)':b.net>0?'var(--teal)':'var(--red)'};font-size:.95rem">
            ${Math.abs(b.net) < 0.01 ? 'Quite ✓' : (b.net > 0 ? '+' : '') + fmt(b.net)}
          </div>
        </div>
      </div>`).join('');

    // settlements
    const settEl = document.getElementById('ev-settlements');
    const pending = transfers.filter(t => !t.settled);
    if (!pending.length) {
      settEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--teal);font-weight:600">✓ Todos os saldos estão zerados!</div>';
    } else {
      settEl.innerHTML = pending.map(t => `
        <div class="settlement-item">
          ${avatarHTML(t.fromName, null, 'av-sm')}
          <div style="flex:1;min-width:0">
            <div style="font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.fromName} → ${t.toName}</div>
            <div class="settlement-amount">${fmt(t.amount)}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
            <button class="btn btn-outline btn-sm" onclick="openPixModal('${t.toName}','${t.toPix||''}',${t.amount})">💳 PIX</button>
            <button class="btn btn-ghost btn-sm" onclick="markSettled('${State.currentEventId}','${t.fromId}','${t.toId}')">✓ Pago</button>
          </div>
        </div>`).join('');
    }
  }

  function renderParticipants() {
    const ev = State.getEvent(State.currentEventId);
    if (!ev) return;
    const user = State.user;
    const isHost = ev.hostId === user?.id;
    const balances = State.calcBalances(State.currentEventId);

    document.getElementById('ev-participants-list').innerHTML = ev.participants.map(p => {
      const b = balances.find(x => x.id === p.id);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--border-dark)">
          ${avatarHTML(p.name, null, 'av-md')}
          <div style="flex:1">
            <div style="font-weight:600;font-size:.95rem">${p.name}</div>
            <span class="badge ${p.isHost?'badge-teal':'badge-gray'}" style="font-size:.65rem;margin-top:2px">${p.isHost?'Anfitrião':'Convidado'}</span>
          </div>
          <div style="text-align:right">
            <div style="font-size:.8rem;color:var(--text-light);margin-bottom:2px">Saldo</div>
            <div style="font-weight:700;color:${!b||Math.abs(b.net)<0.01?'var(--teal)':b.net>0?'var(--teal)':'var(--red)'}">
              ${!b || Math.abs(b.net)<0.01 ? 'Quite' : fmt(b.net)}
            </div>
          </div>
        </div>`;
    }).join('');

    // invite code
    const waText = encodeURIComponent(`Olá! Entrei no evento *${ev.name}* no Me Paga Aí.\nUse o código *${ev.code}* para participar! 🤝`);
    document.getElementById('ev-invite-code').textContent = ev.code;
    document.getElementById('ev-copy-code').onclick = () => copyText(ev.code, 'Código copiado!');
    document.getElementById('ev-wa-code').href = `https://wa.me/?text=${waText}`;
  }

  function confirmClose(evId) {
    const ev = State.getEvent(evId);
    if (confirm(`Encerrar "${ev.name}"?\n\nNenhuma nova despesa poderá ser adicionada após o encerramento.`)) {
      State.closeEvent(evId);
      toast('Evento encerrado 🔒');
      render(evId);
    }
  }

  return { render, renderExpenses, renderSaldos };
})();

// ══════════════════════════════════════════════════════════════════════════
// PAGE: PERFIL
// ══════════════════════════════════════════════════════════════════════════
function renderPerfil() {
  Pages.show('perfil');
  const user = State.user;
  if (!user) return;

  document.getElementById('perfil-avatar').innerHTML = avatarHTML(user.name, user.photo, 'av-xl');
  document.getElementById('perfil-name').textContent  = user.name;
  document.getElementById('perfil-email').textContent = user.email;

  const pixEl = document.getElementById('perfil-pix-list');
  pixEl.innerHTML = user.pixKeys?.map((k,i) => `
    <div class="pix-key-item">
      <div>
        <div style="font-size:.72rem;color:var(--text-light)">${k.type.toUpperCase()}</div>
        <div style="font-size:.9rem;font-weight:600">${k.value}</div>
      </div>
      ${user.defaultPix === i ? '<span class="badge badge-teal">Padrão</span>' : ''}
    </div>`).join('') || '<div style="font-size:.82rem;color:var(--text-light)">Nenhuma chave cadastrada</div>';

  const statsEl = document.getElementById('perfil-events');
  const host  = State.events.filter(e => e.hostId === user.id).length;
  const guest = State.events.filter(e => e.hostId !== user.id && e.participants.some(p => p.id === user.id)).length;
  statsEl.innerHTML = `
    <div style="display:flex;gap:16px">
      <div class="stat-card"><div class="stat-value text-teal">${host}</div><div class="stat-label">Como anfitrião</div></div>
      <div class="stat-card"><div class="stat-value text-blue">${guest}</div><div class="stat-label">Como convidado</div></div>
      <div class="stat-card"><div class="stat-value">${host+guest}</div><div class="stat-label">Total</div></div>
    </div>`;
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function catEmoji(cat) {
  const m = { 'Alimentação':'🍕','Transporte':'🚗','Hospedagem':'🏨','Ingresso':'🎟️','Lazer':'🎮','Saúde':'💊','Outro':'📦' };
  return m[cat] || '📦';
}

function markSettled(eventId, fromId, toId) {
  State.markSettled(eventId, fromId, toId);
  toast('Pagamento confirmado ✓');
  EventPage.renderSaldos();
}
