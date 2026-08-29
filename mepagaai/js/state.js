'use strict';

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  {
    id: "evt-001", code: "FIN-A3K9",
    name: "Churrasco Fim de Semana", emoji: "🍖", type: "Refeição",
    description: "Churrasco na casa do João.", date: "2025-05-30", status: "open",
    hostId: "user-002",
    participants: [
      { id: "user-002", name: "João",    isHost: true,  pix: "11999998888" },
      { id: "user-003", name: "Beatriz", isHost: false, pix: null },
      { id: "user-004", name: "Carlos",  isHost: false, pix: null },
      { id: "user-005", name: "Ana",     isHost: false, pix: null },
    ],
    expenses: [
      { id:"exp-001", desc:"Carne e temperos",  amount:220, cat:"Alimentação", paidBy:"user-002", splitEqually:true, splits:{}, photo:null, date:"2025-05-30" },
      { id:"exp-002", desc:"Bebidas e gelo",    amount:160, cat:"Alimentação", paidBy:"user-003", splitEqually:true, splits:{}, photo:null, date:"2025-05-30" },
    ],
    settled: []
  },
  {
    id: "evt-002", code: "FIN-B7M2",
    name: "Viagem Litoral — Julho", emoji: "🏖️", type: "Viagem",
    description: "Fim de semana prolongado no litoral norte.", date: "2025-07-14", status: "open",
    hostId: "user-local",
    participants: [
      { id: "user-local", name: "Você",   isHost: true,  pix: null },
      { id: "user-006",   name: "Pedro",  isHost: false, pix: null },
      { id: "user-007",   name: "Laura",  isHost: false, pix: null },
      { id: "user-008",   name: "Rafael", isHost: false, pix: null },
    ],
    expenses: [
      { id:"exp-003", desc:"Pousada 3 noites",       amount:900, cat:"Hospedagem",  paidBy:"user-local", splitEqually:true, splits:{}, photo:null, date:"2025-07-14" },
      { id:"exp-004", desc:"Combustível ida e volta", amount:300, cat:"Transporte", paidBy:"user-local", splitEqually:true, splits:{}, photo:null, date:"2025-07-15" },
    ],
    settled: []
  },
  {
    id: "evt-003", code: "FIN-C4X1",
    name: "Jantar Aniversário da Lu", emoji: "🎂", type: "Refeição",
    description: "Restaurante japonês.", date: "2025-05-19", status: "closed",
    hostId: "user-009",
    participants: [
      { id: "user-local", name: "Você",    isHost: false, pix: null },
      { id: "user-009",   name: "Beatriz", isHost: true,  pix: "beatriz@email.com" },
      { id: "user-010",   name: "Lucas",   isHost: false, pix: null },
      { id: "user-011",   name: "Camila",  isHost: false, pix: null },
    ],
    expenses: [
      { id:"exp-005", desc:"Jantar + drinks", amount:420, cat:"Alimentação", paidBy:"user-009", splitEqually:true, splits:{}, photo:null, date:"2025-05-19" },
    ],
    settled: []
  },
];

// ── APP STATE ──────────────────────────────────────────────────────────────
const State = {
  user: null,        // { id, name, email, photo (base64), pixKeys[] }
  events: [...MOCK_EVENTS.map(e => JSON.parse(JSON.stringify(e)))],
  currentEventId: null,
  currentTab: 'despesas',

  // Persist / restore from sessionStorage
  save() {
    try { sessionStorage.setItem('mpa_state', JSON.stringify({ user: this.user, events: this.events })); } catch(e) {}
  },
  restore() {
    try {
      const raw = sessionStorage.getItem('mpa_state');
      if (!raw) return false;
      const s = JSON.parse(raw);
      this.user   = s.user;
      this.events = s.events;
      return !!this.user;
    } catch(e) { return false; }
  },

  // ── User ────────────────────────────────
  setUser(u) { this.user = u; this.save(); },
  logout()   { this.user = null; sessionStorage.clear(); },

  // ── Events ──────────────────────────────
  getEvent(id)  { return this.events.find(e => e.id === id); },
  getByCode(code) { return this.events.find(e => e.code === code.toUpperCase()); },

  addEvent(ev) {
    this.events.unshift(ev);
    this.save();
  },

  joinEvent(code) {
    const ev = this.getByCode(code);
    if (!ev) return null;
    const uid = this.user.id;
    if (!ev.participants.find(p => p.id === uid)) {
      ev.participants.push({ id: uid, name: this.user.name, isHost: false, pix: this.user.pixKeys?.[0]?.value || null });
    }
    this.save();
    return ev;
  },

  addExpense(eventId, exp) {
    const ev = this.getEvent(eventId);
    if (!ev) return;
    ev.expenses.push(exp);
    this.save();
  },

  markSettled(eventId, fromId, toId) {
    const ev = this.getEvent(eventId);
    if (!ev) return;
    ev.settled.push({ fromId, toId, ts: Date.now() });
    this.save();
  },

  closeEvent(eventId) {
    const ev = this.getEvent(eventId);
    if (ev) { ev.status = 'closed'; this.save(); }
  },

  // ── Balance calculation ─────────────────
  calcBalances(eventId) {
    const ev = this.getEvent(eventId);
    if (!ev) return [];
    const ids = ev.participants.map(p => p.id);
    const paid   = {};   // how much each person paid
    const owes   = {};   // how much each person owes in total
    ids.forEach(id => { paid[id] = 0; owes[id] = 0; });

    ev.expenses.forEach(exp => {
      paid[exp.paidBy] = (paid[exp.paidBy] || 0) + exp.amount;
      const sharers = exp.splitEqually
        ? ids
        : Object.keys(exp.splits).filter(k => exp.splits[k] > 0);
      if (exp.splitEqually) {
        const share = exp.amount / sharers.length;
        sharers.forEach(id => { owes[id] = (owes[id] || 0) + share; });
      } else {
        Object.entries(exp.splits).forEach(([id, amt]) => { owes[id] = (owes[id] || 0) + parseFloat(amt || 0); });
      }
    });

    return ids.map(id => {
      const p = ev.participants.find(x => x.id === id);
      return { id, name: p.name, isHost: p.isHost, pix: p.pix, net: Math.round((paid[id] - owes[id]) * 100) / 100 };
    });
  },

  // Simplified debt settlement
  calcSettlement(eventId) {
    const balances = this.calcBalances(eventId);
    const ev = this.getEvent(eventId);
    const settled = ev.settled || [];

    let creditors = balances.filter(b => b.net > 0.005).map(b => ({ ...b }));
    let debtors   = balances.filter(b => b.net < -0.005).map(b => ({ ...b }));
    creditors.sort((a,b) => b.net - a.net);
    debtors.sort((a,b) => a.net - b.net);

    const transfers = [];
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const credit = creditors[i].net;
      const debt   = Math.abs(debtors[j].net);
      const amt    = Math.min(credit, debt);
      if (amt > 0.005) {
        const alreadySettled = settled.some(s => s.fromId === debtors[j].id && s.toId === creditors[i].id);
        transfers.push({
          fromId: debtors[j].id, fromName: debtors[j].name,
          toId:   creditors[i].id, toName: creditors[i].name,
          toPix: creditors[i].pix,
          amount: Math.round(amt * 100) / 100,
          settled: alreadySettled
        });
      }
      creditors[i].net -= amt;
      debtors[j].net   += amt;
      if (creditors[i].net < 0.005) i++;
      if (Math.abs(debtors[j].net) < 0.005) j++;
    }
    return transfers;
  },

  userBalance(eventId) {
    const uid = this.user?.id || 'user-local';
    const b = this.calcBalances(eventId).find(b => b.id === uid);
    return b ? b.net : 0;
  },

  // ── Dashboard totals ─────────────────────
  dashboardTotals() {
    let toReceive = 0, toPay = 0;
    this.events.forEach(ev => {
      const bal = this.userBalance(ev.id);
      if (bal > 0) toReceive += bal;
      else toPay += Math.abs(bal);
    });
    return { toReceive: Math.round(toReceive*100)/100, toPay: Math.round(toPay*100)/100 };
  }
};

// ── UTILITIES ──────────────────────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(n || 0);
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return 'FIN-' + c;
}

function uid() {
  return 'u-' + Math.random().toString(36).slice(2, 9);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function fmtDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? parts[0][0] + parts[parts.length-1][0] : parts[0][0];
}

function calcNudge(cota, capacity = 1140) {
  const pct  = Math.round((cota / capacity) * 100 * 10) / 10;
  const days = Math.round(cota / (capacity / 30));
  return { pct, days };
}

function avatarHTML(name, photo, size = 'av-sm') {
  if (photo) return `<div class="avatar ${size}"><img src="${photo}" alt="${name}"></div>`;
  const colors = ['#1D9E75','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return `<div class="avatar ${size}" style="background:${bg}">${initials(name).toUpperCase()}</div>`;
}

// ── TOAST ──────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const icons = { success:'✅', error:'❌', warning:'⚠️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `${icons[type]} ${msg}`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── COPY TO CLIPBOARD ──────────────────────────────────────────────────────
function copyText(text, label = 'Copiado!') {
  navigator.clipboard.writeText(text).then(() => toast(label)).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    el.remove();
    toast(label);
  });
}
