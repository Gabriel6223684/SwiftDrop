const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('auth', {

    // ── CADASTRO ──
    cadastrar(nome, email, senha) {
        const usuarios = JSON.parse(localStorage.getItem('swiftdrop_usuarios') || '[]');
        if (usuarios.find(u => u.email === email))
            return { ok: false, erro: 'E-mail já cadastrado.' };
        usuarios.push({ nome, email, senha, foto: null });
        localStorage.setItem('swiftdrop_usuarios', JSON.stringify(usuarios));
        return { ok: true };
    },

    // ── LOGIN ──
    login(email, senha) {
        const usuarios = JSON.parse(localStorage.getItem('swiftdrop_usuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email && u.senha === senha);
        if (!usuario) return { ok: false, erro: 'E-mail ou senha incorretos.' };
        const sessao = { nome: usuario.nome, email: usuario.email, foto: usuario.foto || null };
        localStorage.setItem('swiftdrop_sessao', JSON.stringify(sessao));
        return { ok: true, usuario: sessao };
    },

    // ── LOGOUT ──
    logout() {
        localStorage.removeItem('swiftdrop_sessao');
    },

    // ── SESSÃO ──
    getSessao() {
        const s = localStorage.getItem('swiftdrop_sessao');
        return s ? JSON.parse(s) : null;
    },

    // ── ATUALIZAR PERFIL (nome + foto) ──
    atualizarPerfil(email, novoNome, novaFoto) {
        const usuarios = JSON.parse(localStorage.getItem('swiftdrop_usuarios') || '[]');
        const idx = usuarios.findIndex(u => u.email === email);
        if (idx === -1) return { ok: false, erro: 'Usuário não encontrado.' };
        if (novoNome) usuarios[idx].nome = novoNome;
        if (novaFoto !== undefined) usuarios[idx].foto = novaFoto;
        localStorage.setItem('swiftdrop_usuarios', JSON.stringify(usuarios));
        const sessao = { nome: usuarios[idx].nome, email: usuarios[idx].email, foto: usuarios[idx].foto };
        localStorage.setItem('swiftdrop_sessao', JSON.stringify(sessao));
        return { ok: true, usuario: sessao };
    },

    // ── VERIFICAR E-MAIL ──
    emailExiste(email) {
        const usuarios = JSON.parse(localStorage.getItem('swiftdrop_usuarios') || '[]');
        return !!usuarios.find(u => u.email === email);
    },

    // ── REDEFINIR SENHA ──
    redefinirSenha(email, novaSenha) {
        const usuarios = JSON.parse(localStorage.getItem('swiftdrop_usuarios') || '[]');
        const idx = usuarios.findIndex(u => u.email === email);
        if (idx === -1) return { ok: false, erro: 'E-mail não encontrado.' };
        usuarios[idx].senha = novaSenha;
        localStorage.setItem('swiftdrop_usuarios', JSON.stringify(usuarios));
        return { ok: true };
    },

    // ── SALVAR CÓDIGO DE RECUPERAÇÃO (válido 10 min) ──
    salvarCodigo(email, codigo) {
        const expira = Date.now() + 10 * 60 * 1000;
        localStorage.setItem('swiftdrop_codigo', JSON.stringify({ email, codigo, expira }));
    },

    // ── VERIFICAR CÓDIGO ──
    verificarCodigo(email, codigo) {
        const raw = localStorage.getItem('swiftdrop_codigo');
        if (!raw) return { ok: false, erro: 'Nenhum código encontrado.' };
        const dados = JSON.parse(raw);
        if (dados.email !== email) return { ok: false, erro: 'E-mail não corresponde.' };
        if (Date.now() > dados.expira) return { ok: false, erro: 'Código expirado. Solicite um novo.' };
        if (dados.codigo !== codigo) return { ok: false, erro: 'Código incorreto.' };
        localStorage.removeItem('swiftdrop_codigo');
        return { ok: true };
    }
});