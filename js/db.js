/**
 * db.js — Camada de persistência — Supabase Edition
 *
 * Estratégia:
 *  1. Supabase (PostgreSQL) é o banco principal — eventos ficam na tabela `events`
 *  2. localStorage serve de cache offline e fallback imediato
 *  3. Usuários ficam só no localStorage (sem auth real — identificados por UUID gerado no cadastro)
 *
 * Tabela necessária no Supabase (ver README para SQL de criação):
 *   events (code TEXT PRIMARY KEY, data JSONB, updated_at TIMESTAMPTZ)
 *
 * ⚠️  MURILO: preencha SUPABASE_URL e SUPABASE_ANON_KEY abaixo com os seus dados.
 */

// ── SUPABASE CONFIG ────────────────────────────────────────────────────────
const SUPABASE_URL      = 'https://iomwujpefmekznrkoxum.supabase.co';      // ← substitua
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXd1anBlZm1la3pucmtveHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODYwNDUsImV4cCI6MjEwNDY2MjA0NX0.0JQ9cUSGNPtNbS3dd3U4jQiovB1PB0F7yATMAXMpTJM'; // ← substitua

// ── SUPABASE CLIENT ────────────────────────────────────────────────────────
let SB = null;        // cliente Supabase
let SB_ONLINE = false;

function initSupabase() {
  try {
    // O SDK do Supabase é carregado via CDN no index.html
    SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    SB_ONLINE = true;
    console.log('[DB] Supabase conectado');
  } catch (e) {
    console.warn('[DB] Supabase indisponível, rodando offline:', e.message);
    SB_ONLINE = false;
  }
}

// ── LOCAL STORAGE HELPERS ──────────────────────────────────────────────────
const LS = {
  get(key)        { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) { console.warn('[LS]', e); } },
  del(key)        { localStorage.removeItem(key); },
};

// ── DATABASE API ───────────────────────────────────────────────────────────
const Database = {

  // ── USUÁRIOS (apenas localStorage) ────────────────────────────────────────
  saveUser(user)  { LS.set('mpa_user', user); },
  loadUser()      { return LS.get('mpa_user'); },
  clearUser()     { LS.del('mpa_user'); },

  // ── EVENTOS ────────────────────────────────────────────────────────────────

  /** Grava evento no Supabase (upsert pelo code) e no localStorage */
  async saveEvent(event) {
    // 1. Cache local imediato — nunca falha
    LS.set('mpa_ev_' + event.code, event);

    // 2. Supabase — upsert na tabela events
    if (SB_ONLINE && SB) {
      try {
        const { error } = await SB
          .from('events')
          .upsert(
            { code: event.code, data: event, updated_at: new Date().toISOString() },
            { onConflict: 'code' }
          );
        if (error) console.warn('[DB] saveEvent Supabase error:', error.message);
      } catch (e) {
        console.warn('[DB] saveEvent falhou:', e.message);
      }
    }
  },

  /** Apenas localStorage — usado como write-ahead antes do sync remoto */
  saveEventLocal(event) {
    LS.set('mpa_ev_' + event.code, event);
  },

  /** Busca evento pelo código: tenta Supabase, cai no localStorage */
  async getEventByCode(code) {
    code = code.toUpperCase().trim();

    // 1. Tenta Supabase
    if (SB_ONLINE && SB) {
      try {
        const { data, error } = await SB
          .from('events')
          .select('data')
          .eq('code', code)
          .maybeSingle();

        if (!error && data) {
          const ev = data.data;
          LS.set('mpa_ev_' + code, ev);  // atualiza cache local
          return ev;
        }
      } catch (e) {
        console.warn('[DB] getEventByCode Supabase error:', e.message);
      }
    }

    // 2. Fallback localStorage
    return LS.get('mpa_ev_' + code);
  },

  /** Todos os eventos do usuário (varre localStorage) */
  getUserEvents(userId) {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('mpa_ev_'))
      .map(k => LS.get(k))
      .filter(ev => ev?.participants?.some(p => p.id === userId));
  },

  /**
   * Ouve mudanças em tempo real num evento via Supabase Realtime.
   * Retorna função de cancelamento (unsubscribe).
   */
  watchEvent(code, callback) {
    if (!SB_ONLINE || !SB) return () => {};

    const channel = SB
      .channel('event-' + code)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `code=eq.${code}` },
        payload => {
          const ev = payload.new?.data;
          if (ev) {
            LS.set('mpa_ev_' + code, ev);
            callback(ev);
          }
        }
      )
      .subscribe();

    // retorna função de cleanup
    return () => SB.removeChannel(channel);
  },

  /** Evento de demonstração — acessível sem Supabase configurado */
  getDemoEvents() {
    return [
      {
        id: 'evt-demo', code: 'FIN-DEMO',
        name: 'Churrasco de Demonstração', emoji: '🍖', type: 'Refeição',
        description: 'Evento de demo — entre com o código FIN-DEMO para testar!',
        date: '2025-09-01', status: 'open',
        hostId: 'demo-host',
        participants: [
          { id: 'demo-host', name: 'João (Host)', isHost: true,  pix: '11999998888' },
          { id: 'demo-p2',   name: 'Beatriz',     isHost: false, pix: null },
          { id: 'demo-p3',   name: 'Carlos',      isHost: false, pix: null },
        ],
        expenses: [
          { id:'demo-e1', desc:'Carne e carvão', amount:180, cat:'Alimentação',
            paidBy:'demo-host', splitEqually:true,
            splits:{'demo-host':60,'demo-p2':60,'demo-p3':60}, photo:null, date:'2025-09-01' },
          { id:'demo-e2', desc:'Bebidas e gelo', amount:120, cat:'Alimentação',
            paidBy:'demo-p2', splitEqually:true,
            splits:{'demo-host':40,'demo-p2':40,'demo-p3':40}, photo:null, date:'2025-09-01' },
        ],
        settled: []
      }
    ];
  }
};