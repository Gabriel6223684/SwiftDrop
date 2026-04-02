const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const { checkUserExists, registerUser, login, searchUsers, deleteUser, changePassword, sendMessage, getMessages, getConversations } = require("../database/createUser")

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  win.loadFile(path.join(__dirname, "index.html"))
}

ipcMain.handle('check-user-exists', async (event, username, email) => {
  return await checkUserExists(username, email)
})

ipcMain.handle('register-user', async (event, username, email, password) => {
  return await registerUser(username, email, password)
})

ipcMain.handle('login', async (event, email, password) => {
  return await login(email, password)
})

ipcMain.handle('search-users', async (event, query) => {
  return await searchUsers(query)
})

ipcMain.handle('delete-user', async (event, id, password) => {
  return await deleteUser(id, password)
})

ipcMain.handle('change-password', async (event, id, currentPassword, newPassword) => {
  return await changePassword(id, currentPassword, newPassword)
})

ipcMain.handle('send-message', async (event, userId, receiverId, content) => {
  return await sendMessage(userId, receiverId, content)
})

ipcMain.handle('get-messages', async (event, userId, receiverId) => {
  return await getMessages(userId, receiverId)
})

ipcMain.handle('get-conversations', async (event, userId) => {
  return await getConversations(userId)
})

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})