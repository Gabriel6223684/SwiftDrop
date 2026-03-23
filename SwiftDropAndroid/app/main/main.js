// app/main/main.js — servidor Express
const express = require('express')
const cors = require('cors')
const path = require('path')
const {
  checkUserExists, registerUser, login, searchUsers,
  deleteUser, changePassword, sendMessage, getMessages, getConversations
} = require('../database/createUser')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// Serve o frontend estático
app.use(express.static(path.join(__dirname, '../../app/public')))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// ─── AUTH ────────────────────────────────────────────────────

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const existsCheck = await checkUserExists(username, email)
    if (existsCheck.exists) {
      return res.status(400).json({
        error: existsCheck.field === 'username'
          ? 'Nome de usuário já existe'
          : 'Email já cadastrado'
      })
    }
    const newUser = await registerUser(username, email, password)
    const loginResult = await login(email, password)
    if (loginResult.success) return res.json(loginResult.user)
    res.status(500).json({ error: 'Erro ao entrar automaticamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await login(email, password)
    if (result.success) return res.json(result.user)
    res.status(401).json({ error: result.message })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/user/:id', async (req, res) => {
  try {
    const { password } = req.body
    await deleteUser(req.params.id, password)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/user/:id/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    await changePassword(req.params.id, currentPassword, newPassword)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ─── USERS ───────────────────────────────────────────────────

app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query
    const users = await searchUsers(q)
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── MESSAGES ────────────────────────────────────────────────

app.post('/api/messages', async (req, res) => {
  try {
    const { userId, receiverId, content } = req.body
    const msg = await sendMessage(userId, receiverId, content)
    res.json(msg)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/messages/:userId/:receiverId', async (req, res) => {
  try {
    const { userId, receiverId } = req.params
    const msgs = await getMessages(userId, receiverId)
    res.json(msgs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const convs = await getConversations(req.params.userId)
    res.json(convs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── START ───────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`SwiftDrop backend rodando em http://localhost:${PORT}`)
})