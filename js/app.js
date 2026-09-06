'use strict';

// ── APP STATE ──────────────────────────────────────────────────────────────
const App = {
  user: null,
  events: [],          // eventos em memória (cache)
  currentEvent: null,
  _watchers: {},       // Firebase realtime watchers

  // ── Inicializar ──────────────────────────────────────────────────────────
  async init() {
    initFirebase();
    this.user = Database.loadUser();
    if (this.user) {
      this.events = Database.getUserEvents(this.user.id);
      // Injeta demo event se Firebase não configurado
      if (!FB_ONLINE) {
        const demo = Database.getDemoEvents()[0];
        if (!this.events.find(e => e.code === demo.code)) this.events.unshift(demo);
      }
    }
  },

  // ── Usuário ──────────────────────────────────────────────────────────────
  register(data) {
    this.user = {
      id:        'usr-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
      name:      data.name,
      email:     data.email,
      photo:     data.photo || null,
      pixKeys:   data.pixKeys || [],
      createdAt: new Date().toISOString()
    };
    Database.saveUser(this.user);
    return this.user;
  },

  logout() {
    this._stopAllWatchers();
    Database.clearUser();
    this.user = null;
    this.events = [];
    this.currentEvent = null;
  },

  // ── Eventos ──────────────────────────────────────────────────────────────
  async createEvent(data) {
    const code = this._genCode();
    const ev = {
      id:           'ev-' + Date.now(),
      code,
      name:         data.name,
      description:  data.description || '',
      emoji:        this._typeEmoji(data.type),
      type:         data.type,
      date:         data.date || new Date().toISOString().slice(0,10),
      status:       'open',
      hostId:       this.user.id,
      participants: [
        { id: this.user.id, name: this.user.name, isHost: true,
          pix: this.user.pixKeys[0]?.value || null },
        ...( data.extraParticipants || [] )
      ],
      expenses: [],
      settled: [],
      createdAt: new Date().toISOString()
    };
    await Database.saveEvent(ev);
    this.events.unshift(ev);
    this._watchEvent(ev.code);
    return ev;
  },

  async joinByCode(code) {
    const ev = await Database.getEventByCode(code);
    if (!ev) return null;
    // add user if not already in
    const already = ev.participants.find(p => p.id === this.user.id);
    if (!already) {
      ev.participants.push({
        id:     this.user.id,
        name:   this.user.name,
        isHost: false,
        pix:    this.user.pixKeys[0]?.value || null
      });
      await Database.saveEvent(ev);
    }
    // merge into local list
    const idx = this.events.findIndex(e => e.code === ev.code);
    if (idx >= 0) this.events[idx] = ev; else this.events.unshift(ev);
    this._watchEvent(ev.code);
    return ev;
  },

  async addExpense(eventCode, expData) {
    const ev = this.events.find(e => e.code === eventCode);
    if (!ev) return;
    const exp = {
      id:          'exp-' + Date.now(),
      desc:        expData.desc,
      amount:      expData.amount,
      cat:         expData.cat,
      paidBy:      expData.paidBy,
      splitEqually:expData.splitEqually,
      splits:      expData.splits || {},
      photo:       expData.photo || null,
      date:        new Date().toISOString().slice(0,10),
      addedBy:     this.user.id
    };
    ev.expenses.push(exp);
    await Database.saveEvent(ev);
    return exp;
  },

  async markSettled(eventCode, fromId, toId) {
    const ev = this.events.find(e => e.code === eventCode);
    if (!ev) return;
    ev.settled.push({ fromId, toId, ts: Date.now() });
    await Database.saveEvent(ev);
  },

  async closeEvent(eventCode) {
    const ev = this.events.find(e => e.code === eventCode);
    if (!ev) return;
    ev.status = 'closed';
    await Database.saveEvent(ev);
  },

  // ── Cálculos ─────────────────────────────────────────────────────────────
  calcBalances(ev) {
    const ids = ev.participants.map(p => p.id);
    const paid = {}, owes = {};
    ids.forEach(id => { paid[id] = 0; owes[id] = 0; });

    ev.expenses.forEach(exp => {
      paid[exp.paidBy] = (paid[exp.paidBy] || 0) + exp.amount;
      if (exp.splitEqually) {
        const share = exp.amount / ids.length;
        ids.forEach(id => { owes[id] = (owes[id] || 0) + share; });
      } else {
        Object.entries(exp.splits || {}).forEach(([id, amt]) => {
          owes[id] = (owes[id] || 0) + parseFloat(amt || 0);
        });
      }
    });

    return ids.map(id => {
      const p = ev.participants.find(x => x.id === id);
      return {
        id, name: p.name, isHost: p.isHost, pix: p.pix,
        net: Math.round((paid[id] - owes[id]) * 100) / 100,
        totalPaid: Math.round(paid[id] * 100) / 100
      };
    });
  },

  calcSettlement(ev) {
    const balances = this.calcBalances(ev);
    let creditors = balances.filter(b => b.net >  0.005).map(b => ({...b}));
    let debtors   = balances.filter(b => b.net < -0.005).map(b => ({...b}));
    creditors.sort((a,b) => b.net - a.net);
    debtors.sort((a,b) => a.net - b.net);

    const transfers = [];
    let i=0, j=0;
    while (i < creditors.length && j < debtors.length) {
      const amt = Math.min(creditors[i].net, Math.abs(debtors[j].net));
      if (amt > 0.005) {
        const isSettled = (ev.settled||[]).some(
          s => s.fromId === debtors[j].id && s.toId === creditors[i].id
        );
        transfers.push({
          fromId:   debtors[j].id,   fromName: debtors[j].name,
          toId:     creditors[i].id, toName:   creditors[i].name,
          toPix:    creditors[i].pix,
          amount:   Math.round(amt * 100) / 100,
          settled:  isSettled
        });
      }
      creditors[i].net -= amt;
      debtors[j].net   += amt;
      if (creditors[i].net < 0.005) i++;
      if (Math.abs(debtors[j].net) < 0.005) j++;
    }
    return transfers;
  },

  myBalance(ev) {
    if (!this.user) return 0;
    const b = this.calcBalances(ev).find(b => b.id === this.user.id);
    return b ? b.net : 0;
  },

  dashTotals() {
    let toReceive = 0, toPay = 0;
    this.events.forEach(ev => {
      const b = this.myBalance(ev);
      if (b > 0.005)  toReceive += b;
      else if (b < -0.005) toPay += Math.abs(b);
    });
    return {
      toReceive: Math.round(toReceive*100)/100,
      toPay:     Math.round(toPay*100)/100
    };
  },

  // ── Realtime watcher ─────────────────────────────────────────────────────
  _watchEvent(code) {
    if (this._watchers[code]) return;
    const unsub = Database.watchEvent(code, (ev) => {
      const idx = this.events.findIndex(e => e.code === code);
      if (idx >= 0) this.events[idx] = ev; else this.events.unshift(ev);
      if (this.currentEvent?.code === code) {
        this.currentEvent = ev;
        document.dispatchEvent(new CustomEvent('eventUpdated', { detail: ev }));
      }
    });
    this._watchers[code] = unsub;
  },

  _stopAllWatchers() {
    Object.values(this._watchers).forEach(fn => { try { fn(); } catch {} });
    this._watchers = {};
  },

  // ── Helpers ──────────────────────────────────────────────────────────────
  _genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i=0; i<4; i++) c += chars[Math.floor(Math.random()*chars.length)];
    return 'FIN-' + c;
  },

  _typeEmoji(type) {
    const m = { 'Refeição':'🍖','Viagem':'✈️','Compras':'🛒','Moradia':'🏠',
                'Festa':'🎉','Lazer':'🏖️','Saúde':'💊','Educação':'🎓','Outro':'📦' };
    return m[type] || '📦';
  }
};

// ── GLOBAL UTILS ───────────────────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n||0);
}

function fmtDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${day}/${m}`;
}

function fmtDateLong(d) {
  if (!d) return '';
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  } catch { return d; }
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function initials(name) {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length > 1 ? p[0][0]+p[p.length-1][0] : p[0][0];
}

function avatarHTML(name, photo, size=40) {
  const colors = ['#1D9E75','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4'];
  const bg = colors[(name||'?').charCodeAt(0) % colors.length];
  const style = `width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*0.38)}px;color:#fff;background:${bg};overflow:hidden;`;
  if (photo) return `<div style="${style}"><img src="${photo}" style="width:100%;height:100%;object-fit:cover"></div>`;
  return `<div style="${style}">${initials(name||'?').toUpperCase()}</div>`;
}

function toast(msg, type='success') {
  const colors = { success:'#1D9E75', error:'#EF4444', warning:'#F59E0B' };
  const icons  = { success:'✅', error:'❌', warning:'⚠️' };
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:9999;
    background:${colors[type]};color:#fff;padding:10px 20px;border-radius:10px;font-size:.85rem;
    font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.3);animation:fadeIn .2s;white-space:nowrap;max-width:90vw`;
  t.innerHTML = `${icons[type]} ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function copyText(text, label='Copiado!') {
  navigator.clipboard?.writeText(text).then(()=>toast(label)).catch(()=>{
    const el = document.createElement('textarea');
    el.value = text; document.body.appendChild(el); el.select();
    document.execCommand('copy'); el.remove(); toast(label);
  });
}

function nudgeCalc(cota, cap=1140) {
  return {
    pct:  Math.round(cota/cap*100*10)/10,
    days: Math.round(cota/(cap/30))
  };
}

function catEmoji(cat) {
  const m={'Alimentação':'🍕','Transporte':'🚗','Hospedagem':'🏨',
           'Ingresso':'🎟️','Lazer':'🎮','Saúde':'💊','Outro':'📦'};
  return m[cat]||'📦';
}
