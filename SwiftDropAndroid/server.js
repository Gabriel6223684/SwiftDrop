const express = require("express")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

let users = []
let messages = []

// TESTE
app.get("/api", (req, res) => {
    res.json({ status: "ok" })
})

// REGISTER
app.post("/api/register", (req, res) => {
    const { username, email, password } = req.body
    const id = Date.now()

    const user = { id, username, email, password }
    users.push(user)

    res.json(user)
})

// LOGIN
app.post("/api/login", (req, res) => {
    const { email, password } = req.body
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) return res.status(400).json({ error: "Credenciais inválidas" })

    res.json(user)
})

// MENSAGENS
app.get("/api/messages/:user1/:user2", (req, res) => {
    const { user1, user2 } = req.params

    const msgs = messages.filter(m =>
        (m.userId == user1 && m.receiverId == user2) ||
        (m.userId == user2 && m.receiverId == user1)
    )

    res.json(msgs)
})

// ENVIAR
app.post("/api/messages", (req, res) => {
    const msg = {
        ...req.body,
        created_at: new Date()
    }

    messages.push(msg)
    res.json(msg)
})

app.listen(3000, "0.0.0.0", () => {
    console.log("Servidor rodando em http://192.168.2.28:3000")
})