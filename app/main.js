import { app, BrowserWindow, ipcMain, Notification } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from 'dotenv';
import {
    createUser,
    verifyUser,
    updateUserPassword,
    createResetCode,
    verifyResetCode,
    findUserByEmail
} from './database/auth.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null
let nextNotificationId = 1
const notificationStore = []

function createNotification({
    title,
    body,
    type = "info",
    persistent = true,
    silent = false,
    data = {}
} = {}) {
    if (!title || !body) {
        return { ok: false, error: "Título e corpo são obrigatórios." }
    }

    const notificationItem = {
        id: nextNotificationId++,
        title,
        body,
        type,
        persistent,
        silent,
        data,
        read: false,
        createdAt: new Date().toISOString()
    }

    if (persistent) {
        notificationStore.unshift(notificationItem)
    }

    if (Notification.isSupported()) {
        const nativeNotification = new Notification({
            title,
            body,
            silent
        })

        nativeNotification.on("click", () => {
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore()
                mainWindow.focus()
                mainWindow.webContents.send("notifications:native-click", notificationItem)
            }
        })

        nativeNotification.show()
    }

    broadcastNotificationState()

    return { ok: true, notification: notificationItem }
}

function serializeNotificationState() {
    return {
        items: notificationStore,
        unreadCount: notificationStore.filter((item) => !item.read).length
    }
}

function broadcastNotificationState() {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.webContents.send("notifications:updated", serializeNotificationState())
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload/preload.js")
        }
    })

    mainWindow.loadFile(path.join(__dirname, "renderer/main/index.html"))

    mainWindow.on("closed", () => {
        mainWindow = null
    })

    mainWindow.webContents.once("did-finish-load", () => {
        createNotification({
            title: "SwiftDrop iniciado",
            body: "O sistema de notificações está ativo e pronto para uso.",
            type: "success"
        })
    })
}

ipcMain.handle("notifications:create", (_, payload) => {
    return createNotification(payload)
})

ipcMain.handle("notifications:list", () => {
    return serializeNotificationState()
})

ipcMain.handle("notifications:mark-as-read", (_, id) => {
    const notification = notificationStore.find((item) => item.id === id)
    if (!notification) {
        return { ok: false, error: "Notificação não encontrada." }
    }

    notification.read = true
    broadcastNotificationState()

    return { ok: true, notification }
})

ipcMain.handle("notifications:mark-all-as-read", () => {
    notificationStore.forEach((item) => {
        item.read = true
    })

    broadcastNotificationState()

    return { ok: true }
})

ipcMain.handle("notifications:remove", (_, id) => {
    const index = notificationStore.findIndex((item) => item.id === id)
    if (index === -1) {
        return { ok: false, error: "Notificação não encontrada." }
    }

    const [removed] = notificationStore.splice(index, 1)
    broadcastNotificationState()

    return { ok: true, notification: removed }
})

ipcMain.handle("notifications:clear", () => {
    notificationStore.length = 0
    broadcastNotificationState()

    return { ok: true }
})

// ── AUTH IPC ──
ipcMain.handle('auth:register', async (_, { username, email, password }) => {
    return await createUser(username, email, password);
});

ipcMain.handle('auth:login', async (_, { email, password }) => {
    return await verifyUser(email, password);
});

ipcMain.handle('auth:emailExists', async (_, { email }) => {
    const user = await findUserByEmail(email);
    return { exists: !!user };
});

ipcMain.handle('auth:sendResetCode', async (_, { email }) => {
    const user = await findUserByEmail(email);

    if (!user) {
        return { ok: false, error: 'E-mail não encontrado' };
    }

    const codeRes = await createResetCode(email);

    if (!codeRes.ok) {
        return codeRes;
    }

    // 🚨 SIMULA envio (por enquanto)
    console.log(`Código de recuperação para ${email}: ${codeRes.code}`);

    return { ok: true };
});

ipcMain.handle('auth:verifyResetCode', async (_, { email, code }) => {
    return await verifyResetCode(email, code);
});

ipcMain.handle('auth:resetPassword', async (_, { email, password }) => {
    return await updateUserPassword(email, password);
});

app.whenReady().then(createWindow)
