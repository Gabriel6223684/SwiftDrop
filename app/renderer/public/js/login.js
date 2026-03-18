// ── login.js ──

// switchTab global (chamado via onclick no HTML)
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'cadastro'));
    });
    document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + tab).classList.add('active');
    // Limpa erros ao trocar de aba
    document.getElementById('erro-login').style.display = 'none';
    document.getElementById('erro-cadastro').style.display = 'none';
}

window.addEventListener('DOMContentLoaded', async () => {

    // Se já tem sessão, vai direto ao home
    if (window.auth.getSession()) {
        location.href = '../main/index.html';
        return;
    }

    // ── HELPERS ──
    function setErro(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = msg;
        el.style.display = msg ? 'block' : 'none';
    }

    function shake(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shakeX 0.4s ease';
    }

    // ── LOGIN ──
    document.getElementById('btn-login')?.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const senha = document.getElementById('login-senha').value;
        setErro('erro-login', '');

        if (!email) { shake('login-email'); setErro('erro-login', 'Digite seu e-mail.'); return; }
        if (!senha) { shake('login-senha'); setErro('erro-login', 'Digite sua senha.'); return; }

        const res = await window.auth.login(email, senha);
        if (!res.ok) { shake('login-email'); shake('login-senha'); setErro('erro-login', res.erro); return; }

        location.href = '../main/index.html';
    });

    // ── CADASTRO ──
    document.getElementById('btn-cadastro')?.addEventListener('click', async () => {
        const nome = document.getElementById('cadastro-nome').value.trim();
        const email = document.getElementById('cadastro-email').value.trim();
        const senha = document.getElementById('cadastro-senha').value;
        setErro('erro-cadastro', '');

        if (!nome) { shake('cadastro-nome'); setErro('erro-cadastro', 'Digite seu nome.'); return; }
        if (!email) { shake('cadastro-email'); setErro('erro-cadastro', 'Digite seu e-mail.'); return; }
        if (!email.includes('@')) { shake('cadastro-email'); setErro('erro-cadastro', 'E-mail inválido.'); return; }
        if (senha.length < 8) { shake('cadastro-senha'); setErro('erro-cadastro', 'A senha precisa ter no mínimo 8 caracteres.'); return; }

        const res = await window.auth.register(nome, email, senha);
        if (!res.ok) { shake('cadastro-email'); setErro('erro-cadastro', res.erro); return; }

        // Login automático após cadastro
        await window.auth.login(email, senha);
        location.href = '../main/index.html';
    });

    // ── Enter para submeter ──
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const loginAtivo = document.getElementById('panel-login')?.classList.contains('active');
        document.getElementById(loginAtivo ? 'btn-login' : 'btn-cadastro')?.click();
    });
});