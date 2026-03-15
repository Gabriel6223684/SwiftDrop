// ── index.js ──
// Lógica da página principal (home)

let novaFotoBase64 = undefined;

window.addEventListener('DOMContentLoaded', () => {
    atualizarHeader();

    // Fecha dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('user-menu');
        if (menu && !menu.contains(e.target)) {
            document.getElementById('dropdown')?.classList.remove('open');
        }
    });
});

// ── HEADER ──
function atualizarHeader() {
    const sessao = window.auth.getSessao();
    const btnLogin = document.getElementById('btn-login-header');
    const userMenu = document.getElementById('user-menu');
    const heroCta = document.getElementById('hero-cta');

    if (sessao) {
        btnLogin.style.display = 'none';
        userMenu.style.display = 'block';
        renderizarAvatar(sessao, document.getElementById('header-avatar'));
        document.getElementById('header-nome').textContent = sessao.nome.split(' ')[0];
        if (heroCta) { heroCta.textContent = 'Acompanhar entregas'; heroCta.href = '#'; }
    } else {
        btnLogin.style.display = 'block';
        userMenu.style.display = 'none';
        if (heroCta) { heroCta.textContent = 'Começar agora'; heroCta.href = 'pages/login.html'; }
    }
}

function renderizarAvatar(sessao, container) {
    if (!container) return;
    container.innerHTML = '';
    if (sessao.foto) {
        const img = document.createElement('img');
        img.src = sessao.foto;
        img.alt = sessao.nome;
        container.appendChild(img);
    } else {
        container.textContent = sessao.nome.charAt(0).toUpperCase();
    }
}

// ── DROPDOWN ──
function toggleDropdown() {
    document.getElementById('dropdown').classList.toggle('open');
}

// ── LOGOUT ──
function fazerLogout() {
    window.auth.logout();
    atualizarHeader();
    document.getElementById('dropdown').classList.remove('open');
}

// ── MODAL ABRIR ──
function abrirModal() {
    const sessao = window.auth.getSessao();
    if (!sessao) return;
    novaFotoBase64 = undefined;

    document.getElementById('modal-nome').value = sessao.nome;
    document.getElementById('modal-email').value = sessao.email;
    document.getElementById('modal-erro').style.display = 'none';
    document.getElementById('modal-sucesso').style.display = 'none';

    // Preview da foto
    const preview = document.getElementById('foto-preview');
    preview.innerHTML = '<span id="foto-inicial"></span><div class="foto-overlay">📷</div>';
    if (sessao.foto) {
        const img = document.createElement('img');
        img.src = sessao.foto;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
        preview.insertBefore(img, preview.firstChild);
    } else {
        document.getElementById('foto-inicial').textContent = sessao.nome.charAt(0).toUpperCase();
    }

    document.getElementById('dropdown').classList.remove('open');
    document.getElementById('modal-overlay').classList.add('open');
}

// ── MODAL FECHAR ──
function fecharModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.getElementById('foto-input').value = '';
    novaFotoBase64 = undefined;
}

function fecharModalFora(event) {
    if (event.target === document.getElementById('modal-overlay')) fecharModal();
}

// ── FOTO ──
function carregarFoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        novaFotoBase64 = e.target.result;
        const preview = document.getElementById('foto-preview');
        preview.innerHTML = '<div class="foto-overlay">📷</div>';
        const img = document.createElement('img');
        img.src = novaFotoBase64;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;inset:0;';
        preview.insertBefore(img, preview.firstChild);
    };
    reader.readAsDataURL(file);
}

// ── SALVAR PERFIL ──
function salvarPerfil() {
    const sessao = window.auth.getSessao();
    if (!sessao) return;
    const novoNome = document.getElementById('modal-nome').value.trim();
    const erroEl = document.getElementById('modal-erro');
    const sucessoEl = document.getElementById('modal-sucesso');
    erroEl.style.display = sucessoEl.style.display = 'none';

    if (!novoNome) {
        erroEl.textContent = 'O nome não pode estar vazio.';
        erroEl.style.display = 'block';
        const el = document.getElementById('modal-nome');
        el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'shakeX 0.4s ease';
        return;
    }

    const fotoFinal = novaFotoBase64 !== undefined ? novaFotoBase64 : sessao.foto;
    const res = window.auth.atualizarPerfil(sessao.email, novoNome, fotoFinal);

    if (!res.ok) { erroEl.textContent = res.erro; erroEl.style.display = 'block'; return; }

    sucessoEl.style.display = 'block';
    atualizarHeader();
    setTimeout(() => fecharModal(), 1200);
}