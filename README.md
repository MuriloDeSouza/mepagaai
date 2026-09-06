# 🤝 Me Paga Aí v2 — Finspace

Aplicativo de divisão de contas com banco de dados real.  
**TCC Engenharia de Computação · Inteli 2025 · Murilo Prianti**

**[👉 Abrir o app](https://SEU-USUARIO.github.io/mepagaai/)**

---

## ✨ O que há de novo na v2

| Funcionalidade | v1 | v2 |
|---|---|---|
| Persistência de dados | SessionStorage (apaga ao fechar) | **Firebase Realtime DB + localStorage** |
| Entrar por código | ❌ com bugs | ✅ funciona entre dispositivos diferentes |
| Múltiplos usuários simultâneos | ❌ | ✅ atualização em tempo real |
| Design | CSS customizado | **Bootstrap 5 responsivo** |
| Dados de demo | Hardcoded | Código **FIN-DEMO** disponível para qualquer um |

---

## 🚀 Como publicar (GitHub Pages)

### 1 — Criar repositório

Acesse [github.com/new](https://github.com/new):
- Nome: `mepagaai`
- Visibilidade: **Public**
- Clique em **Create repository**

### 2 — Fazer upload dos arquivos

**Via interface web (mais fácil):**
1. No repositório criado, clique em **"uploading an existing file"**
2. Extraia o `.zip` baixado e arraste **todos os arquivos e pastas**:
   ```
   index.html
   README.md
   js/db.js
   js/app.js
   ```
3. Clique em **Commit changes**

**Via Git (terminal):**
```bash
cd mepagaai-v2
git init
git add .
git commit -m "feat: Me Paga Aí v2 - Firebase + Bootstrap"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/mepagaai.git
git push -u origin main
```

### 3 — Ativar GitHub Pages

1. No repositório: **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)` → **Save**
4. Aguarde ~2 minutos

Seu app estará em: `https://SEU-USUARIO.github.io/mepagaai/`

---

## 🔥 Configurar Firebase (banco de dados real — GRÁTIS)

Sem Firebase, o app funciona com localStorage (dados ficam no dispositivo de cada usuário). **Com Firebase, qualquer pessoa com o código do evento consegue entrar de qualquer dispositivo.**

### Passo 1 — Criar conta e projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"**
3. Nome: `mepagaai` → Continuar → (desativar Google Analytics se quiser) → Criar projeto

### Passo 2 — Criar banco de dados

1. No menu lateral: **Realtime Database** → **Criar banco de dados**
2. Localização: `us-central1` (ou qualquer uma)
3. Modo inicial: **Modo de teste** → Ativar

> ⚠️ O modo de teste expira em 30 dias. Para produção, configure as regras abaixo.

**Regras recomendadas** (vá em Realtime Database → Regras):
```json
{
  "rules": {
    "events": {
      "$code": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

### Passo 3 — Pegar as credenciais

1. No menu lateral: **Configurações do projeto** (ícone de engrenagem)
2. Role até **Seus apps** → clique em **</>** (Web)
3. Registre o app com o nome `mepagaai`
4. Copie o objeto `firebaseConfig`

### Passo 4 — Colar no código

Abra `js/db.js` e substitua o bloco `FIREBASE_CONFIG`:

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",          // ← cole aqui
  authDomain:        "mepagaai.firebaseapp.com",
  databaseURL:       "https://mepagaai-default-rtdb.firebaseio.com",
  projectId:         "mepagaai",
  storageBucket:     "mepagaai.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc123"
};
```

### Passo 5 — Republicar no GitHub

```bash
git add js/db.js
git commit -m "config: Firebase credentials"
git push
```

GitHub Pages vai republicar automaticamente em ~1 minuto.

---

## 🧪 Testar o código de entrada

Após publicar, para testar que o código funciona entre dispositivos:

1. No **Celular A**: crie uma conta → crie um evento → copie o código (ex: `FIN-XY7Z`)
2. No **Celular B** (ou aba anônima): acesse o app → "Entrar com código" → digite `FIN-XY7Z`
3. O Celular B entra no evento e pode adicionar despesas
4. O Celular A vê as despesas atualizarem em tempo real

**Código de demonstração disponível para qualquer um:** `FIN-DEMO`

---

## 📱 Fluxo de teste de usabilidade (TCC)

Para os participantes da pesquisa, peça que façam:

1. Acessar o link do GitHub Pages
2. Criar uma conta (nome, e-mail, foto opcional)
3. Cadastrar uma chave PIX (ou pular)
4. **Opção A:** Criar um evento e compartilhar o código com outro participante
5. **Opção B:** Entrar no evento de demonstração com o código `FIN-DEMO`
6. Adicionar uma despesa com foto de um comprovante
7. Ver a aba "Saldos" e identificar quem deve quanto
8. Tentar cobrar alguém via PIX (QR Code)
9. Encerrar o evento (se for anfitrião)

**Observe para o TCC:** onde o usuário hesita, onde clica errado, onde pede ajuda — isso compõe a Seção 6 (Análise e Discussão de Resultados).

---

## 🗂️ Estrutura do projeto

```
mepagaai/
├── index.html      ← App completo (SPA com Bootstrap 5)
├── README.md       ← Este arquivo
└── js/
    ├── db.js       ← Firebase + localStorage (banco de dados)
    └── app.js      ← Estado global, cálculos, utilitários
```

---

## 📚 Teoria aplicada na prática

| Conceito | Autor | Onde aparece no app |
|---|---|---|
| Sistema 1 & 2 | Kahneman (2011) | Nudge de impacto ao adicionar despesa |
| Contabilidade Mental | Thaler (2008) | Aba Saldos — visão unificada |
| Aversão à Perda | Kahneman & Tversky | Módulo PIX como mediador neutro |
| Desconto Hiperbólico | Laibson (1997) | Nudge mostra dias de atraso na meta |
| Nudge / Arquitetura de Escolhas | Thaler & Sunstein (2008) | Banner de impacto financeiro |

---

## 📄 Licença

MIT — Uso livre para fins acadêmicos e pessoais.
