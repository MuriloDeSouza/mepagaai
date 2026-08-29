# 🤝 Me Paga Aí — Finspace

Aplicativo de divisão de contas inteligente. Parte do TCC de Engenharia de Computação — Inteli 2025.

**Autor:** Murilo Prianti  
**Orientação:** Instituto de Tecnologia e Liderança — Inteli

---

## 🚀 Acesso rápido

**[👉 Abrir o app (GitHub Pages)](https://SEU-USUARIO.github.io/mepagaai/)**

---

## 📱 Funcionalidades

- ✅ Cadastro de perfil com foto e chaves PIX
- ✅ Criar eventos com código de convite (FIN-XXXX)
- ✅ Entrar em eventos com código
- ✅ Adicionar despesas com foto e divisão personalizada
- ✅ Algoritmo de simplificação de dívidas (Settlement)
- ✅ Geração de QR Code para cobrança via PIX
- ✅ Nudge de impacto financeiro integrado
- ✅ Encerramento de evento com resumo exportável para WhatsApp
- ✅ Funciona 100% sem backend — ideal para testes de usabilidade

---

## 🗂️ Estrutura do projeto

```
mepagaai/
├── index.html          ← App completo (shell + todas as páginas)
├── css/
│   └── style.css       ← Design system Finspace
├── js/
│   ├── state.js        ← Estado global + dados mockados + utilitários
│   ├── router.js       ← Roteamento via hash (#/rota)
│   ├── modals.js       ← Modais: criar evento, adicionar despesa, PIX, código
│   └── pages.js        ← Renderizadores de cada página
└── README.md
```

---

## 🛠️ Como rodar localmente

**Opção 1 — Abrir direto:**
Basta abrir o arquivo `index.html` no navegador. Não precisa de servidor.

**Opção 2 — Com servidor local (recomendado):**
```bash
# Python 3
python -m http.server 3000

# Node.js
npx serve .
```
Depois acesse `http://localhost:3000`

---

## 🌐 Como publicar no GitHub Pages

### Passo 1 — Criar repositório
1. Acesse [github.com/new](https://github.com/new)
2. Nome: `mepagaai` (ou qualquer nome)
3. Deixe **Public**
4. Clique em **Create repository**

### Passo 2 — Fazer upload dos arquivos
**Via interface web (mais fácil):**
1. No repositório criado, clique em **uploading an existing file**
2. Arraste a pasta `mepagaai/` inteira
3. Clique em **Commit changes**

**Via Git (terminal):**
```bash
cd mepagaai
git init
git add .
git commit -m "feat: Me Paga Aí v1.0 - MVP completo"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/mepagaai.git
git push -u origin main
```

### Passo 3 — Ativar GitHub Pages
1. No repositório, clique em **Settings**
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione: `Deploy from a branch`
4. Em **Branch**, selecione: `main` / `/ (root)`
5. Clique em **Save**
6. Aguarde ~2 minutos

### Passo 4 — Acessar o app
Seu app estará disponível em:
```
https://SEU-USUARIO.github.io/mepagaai/
```

---

## 🧪 Fluxo de teste de usabilidade

Para os testes do TCC, peça ao participante:

1. Acessar o link do GitHub Pages
2. Criar uma conta (nome + e-mail + foto opcional)
3. Cadastrar uma chave PIX (ou pular)
4. Criar um evento chamado "Teste de Usabilidade" com 3 participantes fictícios
5. Copiar o código gerado (ex: FIN-A3K9)
6. Adicionar 2 despesas com valores diferentes
7. Verificar a aba "Saldos" e identificar quem deve pagar quem
8. Tentar cobrar um participante via PIX
9. Encerrar o evento e exportar o resumo para WhatsApp

**Observe:** onde o usuário hesita, onde clica errado, o que não entende sem instrução.

---

## 📚 Referências teóricas

| Conceito | Autor | Implementação |
|---|---|---|
| Sistema 1 & 2 | Kahneman (2011) | Nudge de impacto — ativa deliberação antes da decisão |
| Contabilidade Mental | Thaler (2008) | Hub de saldos — unifica "contas mentais" separadas |
| Aversão à Perda | Kahneman & Tversky | Módulo PIX — neutraliza o atrito da cobrança direta |
| Desconto Hiperbólico | Laibson (1997) | Nudge mostra custo futuro de decisões presentes |

---

## 📄 Licença

MIT — uso livre para fins acadêmicos.
