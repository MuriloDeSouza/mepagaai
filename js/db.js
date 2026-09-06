/**
 * db.js — Camada de persistência
 * Usa Firebase Realtime Database (gratuito) + localStorage como cache local.
 * Eventos ficam em /events/{code} — qualquer pessoa com o código acessa.
 * Usuários ficam em localStorage (sem login real, identificados por UUID).
 */

// ── FIREBASE CONFIG ────────────────────────────────────────────────────────
// ⚠️  MURILO: substitua pelos seus dados do Firebase Console
//    (Instruções no README — é gratuito e leva 3 minutos)
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDEMO_SUBSTITUA_PELA_SUA_KEY",
  authDomain:        "mepagaai-demo.firebaseapp.com",
  databaseURL:       "https://mepagaai-demo-default-rtdb.firebaseio.com",
  projectId:         "mepagaai-demo",
  storageBucket:     "mepagaai-demo.appspot.com",
  messagingSenderId: "000000000000",
  appId:             "1:000000000000:web:demo0000000000000000"
};

// ── FIREBASE INIT ──────────────────────────────────────────────────────────
let DB = null;          // Firebase DB reference
let FB_ONLINE = false;  // whether Firebase is reachable

function initFirebase() {
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    DB = firebase.database();
    FB_ONLINE = true;
    console.log('[DB] Firebase connected');
  } catch(e) {
    console.warn('[DB] Firebase unavailable, running offline:', e.message);
    FB_ONLINE = false;
  }
}

// ── LOCAL STORAGE HELPERS ──────────────────────────────────────────────────
const LS = {
  get(key)        { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) { console.warn('[LS] write failed:', e); } },
  del(key)        { localStorage.removeItem(key); },
};

// ── DATABASE API ───────────────────────────────────────────────────────────
const Database = {

  // ── USERS (local only — no sensitive data, just nickname + UUID) ──────────
  saveUser(user) {
    LS.set('mpa_user', user);
  },

  loadUser() {
    return LS.get('mpa_user');
  },

  clearUser() {
    LS.del('mpa_user');
  },

  // ── EVENTS ────────────────────────────────────────────────────────────────

  /** Salva evento no Firebase (chave = code) e no localStorage */
  async saveEvent(event) {
    LS.set('mpa_ev_' + event.code, event);
    if (FB_ONLINE && DB) {
      try {
        await DB.ref('events/' + event.code).set(event);
      } catch(e) {
        console.warn('[DB] saveEvent offline:', e.message);
      }
    }
  },

  /** Busca evento pelo código: tenta Firebase, cai no localStorage */
  async getEventByCode(code) {
    code = code.toUpperCase().trim();
    // 1. Tenta Firebase
    if (FB_ONLINE && DB) {
      try {
        const snap = await DB.ref('events/' + code).once('value');
        if (snap.exists()) {
          const ev = snap.val();
          LS.set('mpa_ev_' + code, ev); // atualiza cache
          return ev;
        }
      } catch(e) {
        console.warn('[DB] getEventByCode Firebase error:', e.message);
      }
    }
    // 2. localStorage fallback
    return LS.get('mpa_ev_' + code);
  },

  /** Retorna todos os eventos que o usuário participa (do localStorage) */
  getUserEvents(userId) {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('mpa_ev_'));
    return keys.map(k => LS.get(k)).filter(ev => ev &&
      ev.participants && ev.participants.some(p => p.id === userId)
    );
  },

  /** Ouve mudanças em tempo real num evento (Firebase only) */
  watchEvent(code, callback) {
    if (!FB_ONLINE || !DB) return () => {};
    const ref = DB.ref('events/' + code);
    ref.on('value', snap => {
      if (snap.exists()) {
        const ev = snap.val();
        LS.set('mpa_ev_' + code, ev);
        callback(ev);
      }
    });
    return () => ref.off(); // unsubscribe fn
  },

  /** Demo events — carregados apenas se Firebase não estiver configurado */
  getDemoEvents() {
    return [
      {
        id: "evt-001", code: "FIN-DEMO",
        name: "Churrasco Fim de Semana", emoji: "🍖", type: "Refeição",
        description: "Evento de demonstração — qualquer um pode entrar!", date: "2025-08-15", status: "open",
        hostId: "demo-host",
        participants: [
          { id:"demo-host", name:"João (Host)", isHost:true,  pix:"11999998888" },
          { id:"demo-p2",   name:"Beatriz",     isHost:false, pix:null },
          { id:"demo-p3",   name:"Carlos",      isHost:false, pix:null },
        ],
        expenses: [
          { id:"demo-exp1", desc:"Carne e carvão", amount:180, cat:"Alimentação", paidBy:"demo-host", splitEqually:true, splits:{}, photo:null, date:"2025-08-15" },
          { id:"demo-exp2", desc:"Bebidas",        amount:120, cat:"Alimentação", paidBy:"demo-p2",   splitEqually:true, splits:{}, photo:null, date:"2025-08-15" },
        ],
        settled:[]
      }
    ];
  }
};
