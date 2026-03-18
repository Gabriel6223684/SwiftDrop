/* ── esqueci-senha.js ── Real Email Integration */

// Guarda o e-mail confirmado entre as etapas
let emailConfirmado = '';

// ── ETAPA 1: Enviar código real ──
window.goToStep2 = async function () {
    const email = document.getElementById('email-input').value.trim();
    const erroEl = document.getElementById('erro-email');
    erroEl.style.display = 'none';

    if (!email || !email.includes('@')) {
        shake('email-input');
        erroEl.textContent = 'E-mail inválido';
        erroEl.style.display = 'block';
        return;
    }

    const exists = await window.auth.emailExists(email);
    if (!exists) {
        shake('email-input');
        erroEl.textContent = 'E-mail não cadastrado';
        erroEl.style.display = 'block';
        return;
    }

    const res = await window.auth.sendResetCode(email);
    if (!res.ok) {
        shake('email-input');
        erroEl.textContent = res.error || 'Erro ao enviar código';
        erroEl.style.display = 'block';
        return;
    }

    console.log('🔑 Debug - Código enviado:', res.code);
    emailConfirmado = email;
    document.getElementById('email-display').textContent = email;
    setStep(2);
    startTimer();
    setTimeout(() => document.querySelector('.code-digit')?.focus(), 300);
};

// ── ETAPA 2: Verificar código real ──
window.goToStep3 = async function () {
    const digits = [...document.querySelectorAll('.code-digit')];
    const code = digits.map(d => d.value).join('');

    if (code.length < 6) {
        digits.forEach(d => shake2(d));
        return;
    }

    const res = await window.auth.verifyResetCode(emailConfirmado, code);
    if (!res.ok) {
        digits.forEach(d => shake2(d));
        // Show error toast
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#e05252;color:white;padding:1rem 1.5rem;border-radius:8px;z-index:10000;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        toast.textContent = res.error;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
        return;
    }

    setStep(3);
};

// ── ETAPA 3: Redefinir senha real ──
window.goToSuccess = async function () {
    const pw1 = document.getElementById('pw1').value;
    const pw2 = document.getElementById('pw2').value;
    const erroEl = document.getElementById('erro-senha');
    erroEl.style.display = 'none';

    if (pw1.length < 8) {
        shake('pw1');
        erroEl.textContent = 'Senha mínima: 8 caracteres';
        erroEl.style.display = 'block';
        return;
    }
    if (pw1 !== pw2) {
        shake('pw2');
        erroEl.textContent = 'Senhas não coincidem';
        erroEl.style.display = 'block';
        return;
    }

    const res = await window.auth.resetPassword(emailConfirmado, pw1);
    if (!res.ok) {
        erroEl.textContent = res.error;
        erroEl.style.display = 'block';
        return;
    }

    document.getElementById('steps-indicator').style.display = 'none';
    setStep('success');
};

// ── HELPERS ──
function shake(id) {
    const el = document.getElementById(id);
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shakeX 0.4s ease';
}

function shake2(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shakeX 0.4s ease';
}

// Mantém funções originais do HTML (step nav, timer, etc.)
const originalSetStep = window.setStep;
window.setStep = originalSetStep;
