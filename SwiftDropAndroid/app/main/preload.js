// app/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("api", {

    register: async (username, email, password) => {
        try {
            const existsCheck = await ipcRenderer.invoke('check-user-exists', username, email);
            if (existsCheck.exists) {
                throw new Error(existsCheck.field === 'username'
                    ? 'Nome de usuário já existe'
                    : 'Email já cadastrado');
            }
            const newUser = await ipcRenderer.invoke('register-user', username, email, password);
            if (!newUser) throw new Error("Erro ao criar usuário no banco");
            const loginResult = await ipcRenderer.invoke('login', email, password);
            if (loginResult.success) return loginResult.user;
            throw new Error("Erro ao entrar automaticamente");
        } catch (err) {
            throw err;
        }
    },

    login: async (email, password) => {
        const result = await ipcRenderer.invoke('login', email, password);
        return result.success ? result.user : false;
    },

    searchUsers: async (query) => {
        return await ipcRenderer.invoke('search-users', query);
    },

    deleteUser: async (id, password) => {
        return await ipcRenderer.invoke('delete-user', id, password);
    },

    changePassword: async (id, currentPassword, newPassword) => {
        return await ipcRenderer.invoke('change-password', id, currentPassword, newPassword);
    },

    sendMessage: async (userId, receiverId, content) => {
        return await ipcRenderer.invoke('send-message', userId, receiverId, content);
    },

    getMessages: async (userId, receiverId) => {
        return await ipcRenderer.invoke('get-messages', userId, receiverId);
    },

    getConversations: async (userId) => {
        return await ipcRenderer.invoke('get-conversations', userId);
    },

});