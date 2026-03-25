const appEl = document.getElementById("app")
const API = 'http://192.168.2.28:3000/api'

let currentUser = null
let conversations = []
let activeChat = null
let pollingInterval = null

// ─── API HELPER ───────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
  return data
}

// ─── AUTH ────────────────────────────────────────────────────
function checkAuth() {
  const stored = localStorage.getItem("user")
  if (stored) {
    currentUser = JSON.parse(stored)
    renderHome()
  } else {
    renderLogin()
  }
}

// ─── HELPERS ─────────────────────────────────────────────────
function getInitials(name = "") {
  return name.slice(0, 2).toUpperCase() || "??"
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ─── LOGIN ───────────────────────────────────────────────────
function renderLogin() {
  stopPolling()
  appEl.innerHTML = `
    <div class="auth-screen">
      <div class="auth-box">
        <h2>Bem-vindo 👋</h2>
        <p class="subtitle">Entre na sua conta para continuar</p>
        <div id="msg"></div>
        <input id="email" type="email" placeholder="Email" autocomplete="off">
        <input id="password" type="password" placeholder="Senha">
        <button class="auth-btn" onclick="login()">Entrar</button>
        <div class="switch" onclick="renderRegister()">
          Não tem conta? <strong>Criar agora</strong>
        </div>
      </div>
    </div>
  `
}

// ─── REGISTER ────────────────────────────────────────────────
function renderRegister() {
  appEl.innerHTML = `
    <div class="auth-screen">
      <div class="auth-box">
        <h2>Criar conta</h2>
        <p class="subtitle">Junte-se ao SwiftDrop</p>
        <div id="msg"></div>
        <input id="username" placeholder="Nome de usuário">
        <input id="email" type="email" placeholder="Email">
        <input id="password" type="password" placeholder="Senha">
        <button class="auth-btn" onclick="register()">Cadastrar</button>
        <div class="switch" onclick="renderLogin()">
          Já tem conta? <strong>Entrar</strong>
        </div>
      </div>
    </div>
  `
}

// ─── HOME ─────────────────────────────────────────────────────
async function renderHome() {
  stopPolling()
  const user = currentUser
  const initials = getInitials(user?.username || user?.email)

  try {
    const dbConvs = await api('GET', `/conversations/${user.id}`)
    conversations = dbConvs.map(c => ({
      id: c.other_id,
      username: c.username,
      email: c.email,
      lastMsg: c.last_msg || '',
      time: formatTime(c.time),
    }))
  } catch (e) {
    conversations = []
  }

  appEl.innerHTML = `
    <div class="app-layout">
      <div class="sidebar">
        <div class="sidebar-header">
          <span class="logo">⚡ SwiftDrop</span>
          <div class="avatar" title="${user?.username}">${initials}</div>
        </div>

        <div class="search-bar" onclick="renderSearch()">
          <span>🔍</span>
          <span>Pesquisar usuários...</span>
        </div>

        <div class="chat-list" id="chat-list">
          ${renderChatList()}
        </div>

        <div class="sidebar-footer">
          <div class="avatar" style="width:32px;height:32px;font-size:12px">${initials}</div>
          <div class="user-info">
            <div class="username">${user?.username || user?.email}</div>
            <div class="status">● online</div>
          </div>
          <button class="icon-btn" onclick="renderChangePassword()" title="Trocar senha">🔑</button>
          <button class="icon-btn" onclick="confirmDeleteAccount()" title="Excluir conta">🗑️</button>
          <button class="icon-btn" onclick="logout()" title="Sair">🚪</button>
        </div>
      </div>

      <div class="main-content" id="main-content">
        ${renderEmptyState()}
      </div>
    </div>
  `

  if (activeChat) openChat(activeChat)
}

function renderChatList() {
  if (conversations.length === 0) {
    return `
      <div class="chat-list-empty">
        <div class="icon">💬</div>
        <p>Nenhuma conversa ainda</p>
        <p>Pesquise usuários para começar</p>
      </div>
    `
  }
  return conversations.map(c => `
    <div class="chat-item ${activeChat === c.id ? 'active' : ''}" onclick="openChat(${c.id})">
      <div class="avatar">${getInitials(c.username || c.email)}</div>
      <div class="chat-item-info">
        <div class="chat-item-top">
          <span class="chat-item-name">${c.username || c.email}</span>
          <span class="chat-item-time">${c.time || ''}</span>
        </div>
        <div class="chat-item-preview">${c.lastMsg || 'Iniciar conversa'}</div>
      </div>
    </div>
  `).join('')
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="big-icon">⚡</div>
      <h3>SwiftDrop</h3>
      <p>Selecione uma conversa ou pesquise um usuário</p>
    </div>
  `
}

// ─── OPEN CHAT ────────────────────────────────────────────────
async function openChat(receiverId) {
  activeChat = receiverId
  stopPolling()

  const conv = conversations.find(c => c.id === receiverId)
  const name = conv?.username || conv?.email || 'Usuário'

  const main = document.getElementById('main-content')
  if (!main) return

  main.innerHTML = `
    <div class="chat-header">
      <div class="avatar" style="width:38px;height:38px;font-size:14px">${getInitials(name)}</div>
      <div>
        <div class="name">${name}</div>
        <div class="online">● online</div>
      </div>
    </div>
    <div class="messages-area" id="messages-area">
      <div style="text-align:center;color:var(--text3);font-size:13px;padding:20px">Carregando...</div>
    </div>
    <div class="message-input-bar">
      <input id="msg-input" placeholder="Mensagem..." onkeydown="if(event.key==='Enter') sendMsg(${receiverId})">
      <button class="send-btn" onclick="sendMsg(${receiverId})">➤</button>
    </div>
  `

  await loadMessages(receiverId)
  pollingInterval = setInterval(() => loadMessages(receiverId), 3000)
}

// ─── LOAD MESSAGES ────────────────────────────────────────────
async function loadMessages(receiverId) {
  try {
    const msgs = await api('GET', `/messages/${currentUser.id}/${receiverId}`)
    const area = document.getElementById('messages-area')
    if (!area) return

    const wasAtBottom = area.scrollHeight - area.scrollTop <= area.clientHeight + 50

    area.innerHTML = msgs.length === 0
      ? '<div style="text-align:center;color:var(--text3);font-size:13px;padding:40px">Início da conversa</div>'
      : msgs.map(m => `
          <div class="bubble ${m.user_id === currentUser.id ? 'me' : 'them'}">
            ${m.content}
            <span style="font-size:10px;opacity:0.5;display:block;text-align:right;margin-top:4px">
              ${formatTime(m.created_at)}
            </span>
          </div>
        `).join('')

    if (wasAtBottom) area.scrollTop = area.scrollHeight
  } catch (e) {
    console.error("Erro ao carregar mensagens:", e)
  }
}

// ─── SEND MESSAGE ─────────────────────────────────────────────
async function sendMsg(receiverId) {
  const input = document.getElementById('msg-input')
  const text = input?.value.trim()
  if (!text) return
  input.value = ''

  try {
    await api('POST', '/messages', { userId: currentUser.id, receiverId, content: text })

    const conv = conversations.find(c => c.id === receiverId)
    if (conv) {
      conv.lastMsg = text
      conv.time = formatTime(new Date())
    } else {
      conversations.unshift({ id: receiverId, lastMsg: text, time: formatTime(new Date()) })
    }

    const chatList = document.getElementById('chat-list')
    if (chatList) chatList.innerHTML = renderChatList()

    await loadMessages(receiverId)
  } catch (e) {
    console.error("Erro ao enviar mensagem:", e)
  }
}

// ─── POLLING ──────────────────────────────────────────────────
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

// ─── ADD CONVERSATION ─────────────────────────────────────────
function addConversation(user) {
  const exists = conversations.find(c => c.id === user.id)
  if (!exists) {
    conversations.unshift({ id: user.id, username: user.username, email: user.email, lastMsg: '', time: '' })
  }
  renderHome().then(() => openChat(user.id))
}

// ─── SEARCH ───────────────────────────────────────────────────
function renderSearch() {
  const main = document.getElementById('main-content')
  if (!main) return

  main.innerHTML = `
    <div class="search-page">
      <div class="search-page-header">
        <button class="icon-btn" onclick="renderHome()">←</button>
        <h3>Pesquisar usuários</h3>
      </div>
      <div class="search-page-input-wrap">
        <input id="searchInput" placeholder="Digite um nome ou email..." oninput="searchUser()" autofocus>
      </div>
      <div id="results"></div>
    </div>
  `
  document.getElementById('searchInput')?.focus()
}

async function searchUser() {
  const value = document.getElementById("searchInput")?.value.trim()
  const results = document.getElementById("results")
  if (!results) return

  if (value.length < 2) { results.innerHTML = ''; return }

  results.innerHTML = '<div style="padding:20px;color:var(--text3);font-size:13px">⏳ Buscando...</div>'

  try {
    const users = await api('GET', `/users/search?q=${encodeURIComponent(value)}`)
    results.innerHTML = ''

    if (users.length === 0) {
      results.innerHTML = '<div style="padding:20px;color:var(--text3);font-size:13px">Nenhum usuário encontrado</div>'
      return
    }

    users.forEach(u => {
      if (u.id === currentUser.id) return
      results.innerHTML += `
        <div class="user-result" onclick='addConversation(${JSON.stringify(u)})'>
          <div class="avatar">${getInitials(u.username || u.email)}</div>
          <div class="info">
            <div class="uname">${u.username || 'Sem nome'}</div>
            <div class="uemail">${u.email}</div>
          </div>
        </div>
      `
    })
  } catch {
    results.innerHTML = '<div class="msg error" style="margin:16px">Erro na busca</div>'
  }
}

// ─── LOGIN FUNC ───────────────────────────────────────────────
async function login() {
  const email = document.getElementById("email")?.value.trim()
  const password = document.getElementById("password")?.value
  const msg = document.getElementById("msg")

  if (!email || !password)
    return msg.innerHTML = `<div class="msg error">Preencha todos os campos</div>`

  msg.innerHTML = '<div style="color:var(--text2);font-size:13px">⏳ Entrando...</div>'

  try {
    const user = await api('POST', '/login', { email, password })
    currentUser = user
    localStorage.setItem("user", JSON.stringify(user))
    renderHome()
  } catch (e) {
    msg.innerHTML = `<div class="msg error">${e.message}</div>`
  }
}

// ─── REGISTER FUNC ───────────────────────────────────────────
async function register() {
  const msg = document.getElementById("msg")
  const username = document.getElementById("username")?.value.trim()
  const email = document.getElementById("email")?.value.trim()
  const password = document.getElementById("password")?.value

  if (!username || !email || !password)
    return msg.innerHTML = `<div class="msg error">Preencha todos os campos</div>`

  msg.innerHTML = '<div style="color:var(--text2);font-size:13px">⏳ Criando conta...</div>'

  try {
    const user = await api('POST', '/register', { username, email, password })
    currentUser = user
    localStorage.setItem("user", JSON.stringify(user))
    renderHome()
  } catch (e) {
    msg.innerHTML = `<div class="msg error">${e.message}</div>`
  }
}

// ─── CHANGE PASSWORD ──────────────────────────────────────────
function renderChangePassword() {
  const main = document.getElementById('main-content')
  if (!main) return

  main.innerHTML = `
    <div class="search-page">
      <div class="search-page-header">
        <button class="icon-btn" onclick="renderHome()">←</button>
        <h3>Trocar senha</h3>
      </div>
      <div style="padding: 24px; max-width: 400px;">
        <div id="msg-pwd"></div>
        <input id="current-pwd" type="password" placeholder="Senha atual">
        <input id="new-pwd" type="password" placeholder="Nova senha (mín. 6 caracteres)">
        <input id="confirm-pwd" type="password" placeholder="Confirmar nova senha">
        <button class="auth-btn" onclick="changePassword()">Salvar nova senha</button>
      </div>
    </div>
  `
}

async function changePassword() {
  const current = document.getElementById('current-pwd')?.value
  const newPwd = document.getElementById('new-pwd')?.value
  const confirm = document.getElementById('confirm-pwd')?.value
  const msg = document.getElementById('msg-pwd')

  if (!current || !newPwd || !confirm)
    return msg.innerHTML = `<div class="msg error">Preencha todos os campos</div>`

  if (newPwd !== confirm)
    return msg.innerHTML = `<div class="msg error">As senhas não coincidem</div>`

  msg.innerHTML = '<div style="color:var(--text2);font-size:13px">⏳ Salvando...</div>'

  try {
    await api('PUT', `/user/${currentUser.id}/password`, { currentPassword: current, newPassword: newPwd })
    msg.innerHTML = `<div class="msg success">Senha alterada com sucesso!</div>`
    setTimeout(() => renderHome(), 1500)
  } catch (e) {
    msg.innerHTML = `<div class="msg error">${e.message}</div>`
  }
}

// ─── DELETE ACCOUNT ───────────────────────────────────────────
async function confirmDeleteAccount() {
  const password = prompt("Digite sua senha para confirmar a exclusão da conta:")
  if (!password) return

  try {
    await api('DELETE', `/user/${currentUser.id}`, { password })
    alert("Conta excluída com sucesso.")
    logout()
  } catch (e) {
    alert("Erro: " + e.message)
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────
function logout() {
  stopPolling()
  localStorage.removeItem("user")
  currentUser = null
  conversations = []
  activeChat = null
  renderLogin()
}

// ─── START ────────────────────────────────────────────────────
checkAuth()