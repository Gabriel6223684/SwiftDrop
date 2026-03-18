import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("auth", {
    async register(username, email, password) {
        return ipcRenderer.invoke('auth:register', { username, email, password });
    },

    async login(email, password) {
        const res = await ipcRenderer.invoke('auth:login', { email, password });
        if (res.ok) {
            localStorage.setItem("swiftdrop_session", JSON.stringify(res.user));
        }
        return res;
    },

    logout() {
        localStorage.removeItem("swiftdrop_session");
    },

    getSession() {
        const s = localStorage.getItem("swiftdrop_session");
        return s ? JSON.parse(s) : null;
    },

    async emailExists(email) {
        const res = await ipcRenderer.invoke('auth:emailExists', { email });
        return res.exists;
    },

    async sendResetCode(email) {
        return ipcRenderer.invoke('auth:sendResetCode', { email });
    },

    async verifyResetCode(email, code) {
        return ipcRenderer.invoke('auth:verifyResetCode', { email, code });
    },

    async resetPassword(email, newPassword) {
        const res = await ipcRenderer.invoke('auth:resetPassword', { email, newPassword });
        return res;
    },

    async updateProfile(email, newUsername, newPhoto) {
        // TODO: implement via DB
        const session = this.getSession();
        if (session && session.email === email) {
            localStorage.setItem("swiftdrop_session", JSON.stringify({
                ...session,
                username: newUsername || session.username,
                photo: newPhoto !== undefined ? newPhoto : session.photo
            }));
            return { ok: true };
        }
        return { ok: false, error: 'Sessão inválida' };
    }
})

contextBridge.exposeInMainWorld("notifications", {
    create(payload) {
        return ipcRenderer.invoke("notifications:create", payload)
    },

    list() {
        return ipcRenderer.invoke("notifications:list")
    },

    markAsRead(id) {
        return ipcRenderer.invoke("notifications:mark-as-read", id)
    },

    markAllAsRead() {
        return ipcRenderer.invoke("notifications:mark-all-as-read")
    },

    remove(id) {
        return ipcRenderer.invoke("notifications:remove", id)
    },

    clear() {
        return ipcRenderer.invoke("notifications:clear")
    },

    onUpdated(callback) {
        const listener = (_, payload) => callback(payload)
        ipcRenderer.on("notifications:updated", listener)
        return () => ipcRenderer.removeListener("notifications:updated", listener)
    },

    onNativeClick(callback) {
        const listener = (_, payload) => callback(payload)
        ipcRenderer.on("notifications:native-click", listener)
        return () => ipcRenderer.removeListener("notifications:native-click", listener)
    }
})
