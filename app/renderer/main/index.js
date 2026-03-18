// ── index.js ──
// Lógica da página principal (home)

let novaFotoBase64 = undefined;

// ── NOTIFICATIONS ──
let currentNotificationState = { items: [], unreadCount: 0 };
let notificationPanelOpen = false;

const NOTIFICATION_ICONS = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
};

const NOTIFICATION_COLORS = {
    info: '#7ab8ff',
    success: '#52c97a',
    warning: '#e0a84c',
    error: '#e05252'
};

window.addEventListener('DOMContentLoaded', async () => {
    atualizarHeader();

    // Initialize notifications
    await initNotifications();

    // Fecha dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('user-menu');
        if (menu && !menu.contains(e.target)) {
            document.getElementById('dropdown')?.classList.remove('open');
        }

        // Fecha notification panel
        if (!e.target.closest('#notification-center')) {
            closeNotificationPanel();
        }
    });
});

// ── HEADER ──
function atualizarHeader() {
    const sessao = window.auth.getSession();
    const btnLogin = document.getElementById('btn-login-header');
    const userMenu = document.getElementById('user-menu');
    const heroCta = document.getElementById('hero-cta');

    if (sessao) {
        btnLogin.style.display = 'none';
        userMenu.style.display = 'block';
        renderizarAvatar(sessao, document.getElementById('header-avatar'));
        document.getElementById('header-nome').textContent = (sessao.username || sessao.nome || sessao.email).split(' ')[0];
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

// ── NOTIFICATIONS INIT ──
async function initNotifications() {
    // Listen for updates
    window.notifications.onUpdated((state) => {
        currentNotificationState = state;
        updateNotificationBadge();
        if (notificationPanelOpen) {
            renderNotifications();
        }
    });

    // Handle native notification clicks
    window.notifications.onNativeClick((notification) => {
        showToast(`Clicou na notificação: ${notification.title}`, 'info');
        // Focus window handled by main process
    });

    // Initial fetch
    const state = await window.notifications.list();
    currentNotificationState = state;
    updateNotificationBadge();
}

// ── NOTIFICATION UI ──
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const count = document.getElementById('notification-center');

    if (currentNotificationState.unreadCount > 0) {
        badge.textContent = currentNotificationState.unreadCount > 99 ? '99+' : currentNotificationState.unreadCount;
        badge.classList.add('show');
    } else {
        badge.classList.remove('show');
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notification-panel');
    const center = document.getElementById('notification-center');

    notificationPanelOpen = !notificationPanelOpen;

    if (notificationPanelOpen) {
        panel.classList.add('open');
        renderNotifications();
        center.classList.add('active'); // Optional highlight
    } else {
        closeNotificationPanel();
    }
}

function closeNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    const center = document.getElementById('notification-center');

    panel.classList.remove('open');
    notificationPanelOpen = false;
    center.classList.remove('active');
}

// ── RENDER ──
async function renderNotifications() {
    const list = document.getElementById('notification-list');

    if (currentNotificationState.items.length === 0) {
        list.innerHTML = '<div class="notification-empty">Nenhuma notificação por enquanto.</div>';
        return;
    }

    list.innerHTML = currentNotificationState.items.map(item => `
        <div class="notification-item ${item.read ? '' : 'unread'}" data-id="${item.id}">
            <div class="notification-icon ${item.type}" style="background: ${NOTIFICATION_COLORS[item.type] || '#7ab8ff'}20;">
                ${NOTIFICATION_ICONS[item.type] || 'ℹ️'}
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(item.title)}</div>
                <div class="notification-body">${escapeHtml(item.body)}</div>
                <div class="notification-meta">${formatTime(item.createdAt)}</div>
            </div>
            <div class="notification-item-actions">
                <button class="notification-mini-btn" onclick="markNotificationAsRead(${item.id})" title="Marcar como lida">✓</button>
                <button class="notification-mini-btn" onclick="removeNotification(${item.id})" title="Remover">×</button>
            </div>
        </div>
    `).join('');
}

// ── ACTIONS ──
async function markNotificationAsRead(id) {
    await window.notifications.markAsRead(id);
    renderNotifications();
}

async function markAllNotificationsAsRead() {
    await window.notifications.markAllAsRead();
    renderNotifications();
}

async function removeNotification(id) {
    await window.notifications.remove(id);
    renderNotifications();
}

async function clearNotifications() {
    await window.notifications.clear();
    renderNotifications();
}

function demoNotification() {
    window.notifications.create({
        title: 'Teste de Notificação',
        body: 'Sistema funcionando perfeitamente! 🔔',
        type: 'success',
        persistent: true
    });
}

// ── TOAST ──
function showToast(message, type = 'info') {
    const stack = document.getElementById('notification-toast-stack');
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.innerHTML = `
        <div class="notification-toast-header">
            <span class="notification-toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <button class="notification-toast-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="notification-toast-body">${escapeHtml(message)}</div>
    `;

    stack.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'none';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-12px)';
            setTimeout(() => toast.remove(), 200);
        }
    }, 5000);
}

// ── UTILS ──
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes

    if (diff < 1) return 'Agora';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
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
    const sessao = window.auth.getSession();
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
    closeNotificationPanel(); // Close notifications if open
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
    const sessao = window.auth.getSession();
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