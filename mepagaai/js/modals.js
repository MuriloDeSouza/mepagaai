'use strict';

// ── MODAL HELPERS ──────────────────────────────────────────────────────────
function openOverlay(id) { document.getElementById(id).classList.remove('hidden'); }
function closeOverlay(id) { document.getElementById(id).classList.add('hidden'); }

// close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('overlay')) {
    e.target.classList.add('hidden');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// MODAL 1 — CRIAR EVENTO (3 etapas)
// ══════════════════════════════════════════════════════════════════════════
const CreateEventModal = (() => {
  let step = 1;
  let data = { name:'', desc:'', type:'Refeição', date:'', participants:[], code:'' };

  const emojis = {
    'Refeição':'🍖','Viagem':'✈️','Compras':'🛒','Moradia':'🏠',
    'Evento/Festa':'🎉','Lazer':'🏖️','Saúde':'💊','Educação':'🎓','Outro':'📦'
  };

  function render() {
    const o = document.getElementById('overlay-create-event');
    o.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3>${step === 3 ? '🎉 Evento criado!' : 'Novo evento'}</h3>
          <button class="modal-close" onclick="closeOverlay('overlay-create-event')">✕</button>
        </div>
        <!-- STEPPER -->
        <div class="stepper">
          ${[1,2,3].map(n => `
            <div class="step-dot ${n < step ? 'done' : n === step ? 'active' : 'inactive'}">${n < step ? '✓' : n}</div>
            ${n < 3 ? `<div class="step-line ${n < step ? 'done' : ''}"></div>` : ''}
          `).join('')}
        </div>
        ${step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
      </div>`;
    o.classList.remove('hidden');
    bindStep();
  }

  function renderStep1() {
    const typeOpts = Object.entries(emojis).map(([k,v]) =>
      `<option value="${k}" ${data.type===k?'selected':''}>${v} ${k}</option>`).join('');
    return `
      <div class="flex flex-col gap-4">
        <div class="form-group">
          <label class="form-label">Nome do evento *</label>
          <input id="ev-name" class="input" placeholder="Ex: Churrasco do fim de semana" value="${data.name}" maxlength="60">
        </div>
        <div class="form-group">
          <label class="form-label">Descrição (opcional)</label>
          <textarea id="ev-desc" class="input textarea" placeholder="Detalhes do evento..." maxlength="200">${data.desc}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select id="ev-type" class="input select">${typeOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Data do evento</label>
          <input id="ev-date" class="input" type="date" value="${data.date}">
        </div>
        <button class="btn btn-primary btn-block" id="ev-next1">Próximo →</button>
      </div>`;
  }

  function renderStep2() {
    const me = State.user;
    const chips = data.participants.map((p,i) => `
      <div class="chip">${avatarHTML(p,null,'av-sm')} ${p}
        <span class="chip-remove" data-idx="${i}">×</span>
      </div>`).join('');
    return `
      <div class="flex flex-col gap-4">
        <div style="display:flex;align-items:center;gap:10px;background:var(--bg-card-alt);border-radius:10px;padding:10px 14px;">
          ${avatarHTML(me.name, me.photo, 'av-sm')}
          <div><div style="font-size:.85rem;font-weight:600">${me.name}</div><small>Anfitrião</small></div>
          <span class="badge badge-teal" style="margin-left:auto">Host</span>
        </div>
        <div class="form-group">
          <label class="form-label">Adicionar participante</label>
          <div style="display:flex;gap:8px">
            <input id="ev-pname" class="input" placeholder="Nome do participante" style="flex:1">
            <button class="btn btn-outline btn-sm" id="ev-add-p" style="flex-shrink:0">+ Adicionar</button>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;min-height:36px" id="ev-chips">${chips}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-ghost" id="ev-back2" style="flex:1">← Voltar</button>
          <button class="btn btn-primary" id="ev-next2" style="flex:2">Próximo →</button>
        </div>
      </div>`;
  }

  function renderStep3() {
    const me = State.user;
    if (!data.code) data.code = genCode();
    const waText = encodeURIComponent(`Olá! Criei o evento *${data.name}* no Me Paga Aí.\nUse o código *${data.code}* para participar e dividir as despesas. 🤝`);
    return `
      <div class="flex flex-col gap-4">
        <div class="card" style="background:var(--bg-card-alt)">
          <div style="font-size:.8rem;color:var(--text-light);margin-bottom:8px">RESUMO</div>
          <div style="font-weight:700;font-size:1rem">${data.name}</div>
          <div style="font-size:.82rem;color:var(--text-light);margin-top:4px">${data.type} · ${data.date ? fmtDate(data.date) : 'Data não definida'}</div>
          <div style="font-size:.82rem;margin-top:8px">${1 + data.participants.length} participante(s)</div>
        </div>
        <div class="code-box">
          <div style="font-size:.8rem;color:var(--text-light);margin-bottom:4px">CÓDIGO DO EVENTO</div>
          <div class="code-display">${data.code}</div>
          <small>Compartilhe para que outros entrem</small>
          <div style="display:flex;gap:8px;margin-top:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="copyText('${data.code}','Código copiado!')">📋 Copiar</button>
            <a class="btn btn-ghost btn-sm" href="https://wa.me/?text=${waText}" target="_blank">📱 WhatsApp</a>
          </div>
        </div>
        <button class="btn btn-primary btn-block" id="ev-confirm">✓ Criar evento</button>
      </div>`;
  }

  function bindStep() {
    if (step === 1) {
      document.getElementById('ev-next1').onclick = () => {
        const n = document.getElementById('ev-name').value.trim();
        if (!n) { toast('Informe o nome do evento','error'); return; }
        data.name = n;
        data.desc = document.getElementById('ev-desc').value.trim();
        data.type = document.getElementById('ev-type').value;
        data.date = document.getElementById('ev-date').value;
        step = 2; render();
      };
    }
    if (step === 2) {
      document.getElementById('ev-back2').onclick = () => { step=1; render(); };
      document.getElementById('ev-add-p').onclick = () => {
        const inp = document.getElementById('ev-pname');
        const v = inp.value.trim();
        if (!v) return;
        if (data.participants.includes(v)) { toast('Já adicionado','warning'); return; }
        data.participants.push(v);
        inp.value = '';
        render();
      };
      document.querySelectorAll('.chip-remove').forEach(x => {
        x.onclick = () => { data.participants.splice(parseInt(x.dataset.idx),1); render(); };
      });
      document.getElementById('ev-next2').onclick = () => { step=3; render(); };
    }
    if (step === 3) {
      document.getElementById('ev-confirm').onclick = () => {
        const me = State.user;
        const ev = {
          id: uid(), code: data.code,
          name: data.name, desc: data.desc,
          emoji: { 'Refeição':'🍖','Viagem':'✈️','Compras':'🛒','Moradia':'🏠','Evento/Festa':'🎉','Lazer':'🏖️','Saúde':'💊','Educação':'🎓','Outro':'📦' }[data.type] || '📦',
          type: data.type, date: data.date, status:'open',
          hostId: me.id,
          participants: [
            { id:me.id, name:me.name, isHost:true, pix: me.pixKeys?.[0]?.value || null },
            ...data.participants.map((n,i) => ({ id:'p-'+i+'-'+Date.now(), name:n, isHost:false, pix:null }))
          ],
          expenses:[], settled:[]
        };
        State.addEvent(ev);
        closeOverlay('overlay-create-event');
        toast('Evento criado com sucesso! 🎉');
        data = { name:'', desc:'', type:'Refeição', date:'', participants:[], code:'' };
        step = 1;
        // navigate to event
        setTimeout(() => { State.currentEventId = ev.id; Router.go('/evento/' + ev.id); }, 400);
      };
    }
  }

  return {
    open() { step=1; data={name:'',desc:'',type:'Refeição',date:'',participants:[],code:''}; render(); }
  };
})();

// ══════════════════════════════════════════════════════════════════════════
// MODAL 2 — ADICIONAR DESPESA
// ══════════════════════════════════════════════════════════════════════════
const AddExpenseModal = (() => {
  let eventId = null;
  let photoB64 = null;

  function open(evId) {
    eventId = evId;
    photoB64 = null;
    const ev = State.getEvent(evId);
    const partOpts = ev.participants.map(p =>
      `<option value="${p.id}" ${p.id === (State.user?.id||'user-local') ? 'selected':''}>${p.name}</option>`
    ).join('');
    const catOpts = ['Alimentação','Transporte','Hospedagem','Ingresso','Lazer','Saúde','Outro']
      .map(c => `<option>${c}</option>`).join('');

    document.getElementById('overlay-add-expense').innerHTML = `
      <div class="modal" role="dialog">
        <div class="modal-header">
          <h3>Adicionar despesa</h3>
          <button class="modal-close" onclick="closeOverlay('overlay-add-expense')">✕</button>
        </div>
        <div class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Descrição *</label>
            <input id="exp-desc" class="input" placeholder="Ex: Pizza, gasolina, hotel...">
          </div>
          <div class="form-group">
            <label class="form-label">Valor total (R$) *</label>
            <input id="exp-amt" class="input" type="number" step="0.01" min="0.01" placeholder="0,00">
          </div>
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select id="exp-cat" class="input select">${catOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Pago por</label>
            <select id="exp-paid" class="input select">${partOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Foto / Comprovante (opcional)</label>
            <div class="upload-area" id="exp-upload-area" onclick="document.getElementById('exp-photo').click()">
              📷 Toque para adicionar foto
              <input type="file" id="exp-photo" accept="image/*" style="display:none">
            </div>
          </div>
          <div class="form-group">
            <div class="toggle-wrap">
              <label class="form-label" style="margin:0">Dividir igualmente</label>
              <label class="toggle"><input type="checkbox" id="exp-equal" checked><span class="toggle-slider"></span></label>
            </div>
          </div>
          <div id="exp-equal-info" style="background:var(--bg-card-alt);border-radius:10px;padding:12px;font-size:.85rem;color:var(--text-light);text-align:center">
            Cada um pagará <strong id="exp-per-person" style="color:var(--teal)">R$ 0,00</strong> (${ev.participants.length} participantes)
          </div>
          <div id="exp-custom-split" class="hidden">
            <div id="exp-splits-list"></div>
            <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-top:6px;padding:6px 0">
              <span>Soma:</span><span id="exp-split-total" style="font-weight:700">R$ 0,00</span>
            </div>
            <div id="exp-split-warn" class="hidden" style="background:var(--red-lt);border-radius:8px;padding:8px;font-size:.8rem;color:var(--red);text-align:center;margin-top:6px">
              A soma não bate com o valor total
            </div>
          </div>
          <button class="btn btn-primary btn-block" id="exp-save">Salvar despesa</button>
        </div>
      </div>`;

    openOverlay('overlay-add-expense');

    // Photo upload
    document.getElementById('exp-photo').onchange = function() {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        photoB64 = e.target.result;
        document.getElementById('exp-upload-area').innerHTML = `<img src="${photoB64}" style="width:100%;border-radius:8px;max-height:140px;object-fit:cover">`;
        document.getElementById('exp-upload-area').classList.add('has-image');
      };
      reader.readAsDataURL(file);
    };

    // Split toggle
    document.getElementById('exp-equal').onchange = function() {
      document.getElementById('exp-equal-info').classList.toggle('hidden', !this.checked);
      document.getElementById('exp-custom-split').classList.toggle('hidden', this.checked);
      if (!this.checked) renderCustomSplits();
    };

    // Amount change → recalc
    document.getElementById('exp-amt').oninput = () => {
      const amt = parseFloat(document.getElementById('exp-amt').value) || 0;
      const n = ev.participants.length;
      document.getElementById('exp-per-person').textContent = fmt(amt/n);
      if (!document.getElementById('exp-equal').checked) renderCustomSplits();
    };

    // Save
    document.getElementById('exp-save').onclick = saveExpense;
  }

  function renderCustomSplits() {
    const ev = State.getEvent(eventId);
    const amt = parseFloat(document.getElementById('exp-amt').value) || 0;
    const share = amt / ev.participants.length;
    const list = document.getElementById('exp-splits-list');
    list.innerHTML = ev.participants.map(p => `
      <div class="split-person">
        ${avatarHTML(p.name, null, 'av-sm')}
        <span class="split-name">${p.name}</span>
        <input class="split-input" type="number" step="0.01" min="0" data-id="${p.id}" value="${share.toFixed(2)}">
      </div>`).join('');
    list.querySelectorAll('.split-input').forEach(inp => {
      inp.oninput = () => {
        const sum = [...list.querySelectorAll('.split-input')].reduce((a,x) => a + (parseFloat(x.value)||0), 0);
        document.getElementById('exp-split-total').textContent = fmt(sum);
        const diff = Math.abs(sum - amt);
        document.getElementById('exp-split-warn').classList.toggle('hidden', diff < 0.02);
      };
    });
  }

  function saveExpense() {
    const desc = document.getElementById('exp-desc').value.trim();
    const amt  = parseFloat(document.getElementById('exp-amt').value);
    if (!desc) { toast('Informe a descrição','error'); return; }
    if (!amt || amt <= 0) { toast('Informe um valor válido','error'); return; }

    const ev = State.getEvent(eventId);
    const isEqual = document.getElementById('exp-equal').checked;
    let splits = {};
    if (!isEqual) {
      document.querySelectorAll('.split-input').forEach(inp => {
        splits[inp.dataset.id] = parseFloat(inp.value) || 0;
      });
      const sum = Object.values(splits).reduce((a,b) => a+b, 0);
      if (Math.abs(sum - amt) > 0.02) { toast('A soma das cotas não bate com o total','error'); return; }
    }

    const exp = {
      id: 'exp-'+Date.now(),
      desc, amount: amt,
      cat: document.getElementById('exp-cat').value,
      paidBy: document.getElementById('exp-paid').value,
      splitEqually: isEqual,
      splits,
      photo: photoB64,
      date: new Date().toISOString().slice(0,10)
    };

    State.addExpense(eventId, exp);
    closeOverlay('overlay-add-expense');
    toast('Despesa adicionada! 💰');

    // Nudge
    const uid2 = State.user?.id || 'user-local';
    const n = ev.participants.length;
    const myCota = isEqual ? amt/n : (splits[uid2] || 0);
    if (myCota > 0) {
      const { pct, days } = calcNudge(myCota);
      showNudge(myCota, pct, days);
    }

    // Refresh event page
    if (window.EventPage && State.currentEventId === eventId) {
      EventPage.renderExpenses();
      EventPage.renderSaldos();
    }
  }

  function showNudge(cota, pct, days) {
    const banner = document.getElementById('nudge-banner');
    if (!banner) return;
    banner.querySelector('.nudge-text').innerHTML =
      `⚠️ Sua cota nesta despesa é <strong>${fmt(cota)}</strong>. Isso representa <strong>${pct}%</strong> da capacidade de poupança estimada e atrasaria uma meta de R$ 10.000 em aproximadamente <strong>${days} dia(s)</strong>.`;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 10000);
  }

  return { open };
})();

// ══════════════════════════════════════════════════════════════════════════
// MODAL 3 — PIX / QR CODE
// ══════════════════════════════════════════════════════════════════════════
function openPixModal(toName, pixKey, amount) {
  const o = document.getElementById('overlay-pix');
  const qrData = pixKey ? `PIX:${pixKey}:${amount.toFixed(2)}` : `Transferir ${fmt(amount)} para ${toName}`;
  o.innerHTML = `
    <div class="modal rounded" style="max-width:380px;margin:auto">
      <div class="modal-header">
        <h3>💳 Cobrar via PIX</h3>
        <button class="modal-close" onclick="closeOverlay('overlay-pix')">✕</button>
      </div>
      <div class="flex flex-col gap-4">
        <div class="pix-box">
          <div style="font-size:.82rem;color:var(--text-light);margin-bottom:8px">Pagar para <strong style="color:var(--white)">${toName}</strong></div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--teal);margin:8px 0">${fmt(amount)}</div>
          ${pixKey ? `
            <div style="font-size:.78rem;color:var(--text-light)">Chave PIX:</div>
            <div class="pix-key-display">${pixKey}</div>
            <button class="btn btn-ghost btn-sm" onclick="copyText('${pixKey}','Chave copiada!')">📋 Copiar chave</button>
          ` : `<div style="font-size:.82rem;color:var(--text-light)">${toName} ainda não cadastrou uma chave PIX</div>`}
        </div>
        <!-- QR Code via API pública -->
        <div style="text-align:center;background:white;border-radius:12px;padding:16px">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}" 
               alt="QR Code" style="width:180px;height:180px" onerror="this.style.display='none'">
          <div style="font-size:.72rem;color:#666;margin-top:6px">QR Code PIX (simulado)</div>
        </div>
        <button class="btn btn-primary btn-block" onclick="closeOverlay('overlay-pix')">✓ Fechar</button>
      </div>
    </div>`;
  o.classList.remove('hidden');
}

// ══════════════════════════════════════════════════════════════════════════
// MODAL 4 — ENTRAR COM CÓDIGO
// ══════════════════════════════════════════════════════════════════════════
function openJoinModal(onSuccess) {
  const o = document.getElementById('overlay-join');
  o.innerHTML = `
    <div class="modal rounded" style="max-width:360px;margin:auto">
      <div class="modal-header">
        <h3>Entrar com código</h3>
        <button class="modal-close" onclick="closeOverlay('overlay-join')">✕</button>
      </div>
      <div class="flex flex-col gap-4">
        <div class="form-group">
          <label class="form-label">Código do evento</label>
          <input id="join-code" class="input" placeholder="FIN-XXXX" maxlength="8"
            style="text-transform:uppercase;letter-spacing:4px;font-size:1.2rem;font-weight:700;text-align:center">
        </div>
        <button class="btn btn-primary btn-block" id="join-btn">Entrar no evento</button>
      </div>
    </div>`;
  o.classList.remove('hidden');

  document.getElementById('join-code').oninput = function() {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g,'');
  };

  document.getElementById('join-btn').onclick = () => {
    const code = document.getElementById('join-code').value.trim();
    if (!code) { toast('Digite o código','error'); return; }
    if (!State.user) {
      closeOverlay('overlay-join');
      sessionStorage.setItem('pending_code', code);
      Router.go('/onboarding');
      return;
    }
    const ev = State.joinEvent(code);
    if (!ev) { toast('Código não encontrado','error'); return; }
    closeOverlay('overlay-join');
    toast(`Você entrou em "${ev.name}" 🎉`);
    if (onSuccess) onSuccess(ev);
    else { State.currentEventId = ev.id; Router.go('/evento/' + ev.id); }
  };
}
