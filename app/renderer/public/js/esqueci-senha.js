/* ── NAVEGAÇÃO ENTRE ETAPAS ── */
function goToStep2() {
    const email = document.getElementById('email-input').value.trim();
    if (!email || !email.includes('@')) {
        shake('email-input');
        return;
    }
    document.getElementById('email-display').textContent = email;
    setStep(2);
    startTimer();
    setTimeout(() => document.querySelector('.code-digit').focus(), 300);
}

function goToStep3() {
    const digits = [...document.querySelectorAll('.code-digit')];
    const code = digits.map(d => d.value).join('');
    if (code.length < 6) {
        digits.forEach(d => shake2(d));
        return;
    }
    setStep(3);
}

function goToSuccess() {
    const pw1 = document.getElementById('pw1').value;
    const pw2 = document.getElementById('pw2').value;
    if (pw1.length < 8) { shake('pw1'); return; }
    if (pw1 !== pw2) { shake('pw2'); return; }
    // Esconde o indicador de steps no sucesso
    document.getElementById('steps-indicator').style.display = 'none';
    setStep('success');
}

function goBack(step) { setStep(step); }

function setStep(n) {
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('step-' + n).classList.add('active');
    if (n === 'success') return;
    // Atualiza dots
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById('dot-' + i);
        dot.classList.remove('active', 'done');
        if (i < n) dot.classList.add('done');
        if (i == n) dot.classList.add('active');
    }
    // Atualiza linhas
    for (let i = 1; i <= 2; i++) {
        const line = document.getElementById('line-' + i);
        line.classList.toggle('done', i < n);
    }
}

/* ── CODE INPUT: auto-avançar ── */
document.querySelectorAll('.code-digit').forEach((input, idx, all) => {
    input.addEventListener('input', e => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val.slice(-1);
        if (val && idx < all.length - 1) all[idx + 1].focus();
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !input.value && idx > 0) all[idx - 1].focus();
    });
    input.addEventListener('paste', e => {
        e.preventDefault();
        const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        [...pasted].forEach((ch, i) => { if (all[i]) all[i].value = ch; });
        if (all[Math.min(pasted.length, 5)]) all[Math.min(pasted.length, 5)].focus();
    });
});

/* ── TIMER REENVIO ── */
let timerInterval;
function startTimer() {
    clearInterval(timerInterval);
    let secs = 60;
    document.getElementById('countdown').textContent = secs;
    document.getElementById('resend-btn').style.display = 'none';
    document.getElementById('timer-text').style.display = 'inline';
    timerInterval = setInterval(() => {
        secs--;
        document.getElementById('countdown').textContent = secs;
        if (secs <= 0) {
            clearInterval(timerInterval);
            document.getElementById('resend-btn').style.display = 'inline';
            document.getElementById('timer-text').style.display = 'none';
        }
    }, 1000);
}

function restartTimer() { startTimer(); }

/* ── FORÇA DA SENHA ── */
function checkStrength() {
    const pw = document.getElementById('pw1').value;
    const segs = [document.getElementById('seg1'), document.getElementById('seg2'),
    document.getElementById('seg3'), document.getElementById('seg4')];
    const label = document.getElementById('strength-label');
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const cls = ['', 'weak', 'medium', 'medium', 'strong'];
    const texts = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
    segs.forEach((s, i) => {
        s.className = 'strength-seg';
        if (i < score) s.classList.add(cls[score]);
    });
    label.textContent = pw.length ? texts[score] : '';
    label.style.color = score === 4 ? '#52c97a' : score >= 2 ? '#e0a84c' : '#e05252';
}

/* ── TOGGLE SENHA ── */
function togglePw(id, btn) {
    const input = document.getElementById(id);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.textContent = isHidden ? '🙈' : '👁';
}

/* ── SHAKE ANIMATION ── */
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

// functions
// ── esqueci-senha.js ──
// Roda na página esqueci-senha.html

// Guarda o e-mail confirmado entre as etapas
let emailConfirmado = '';

// ── ETAPA 1: valida e-mail ──
// Sobrescreve a função goToStep2 definida no HTML
window.goToStep2 = function () {
    const email = document.getElementById('email-input').value.trim();

    if (!email || !email.includes('@')) {
        shake('email-input');
        return;
    }

    if (!window.auth.emailExiste(email)) {
        shake('email-input');
        document.getElementById('email-input').style.borderColor = '#e05252';
        setErro('erro-email', 'E-mail não encontrado. Verifique e tente novamente.');
        return;
    }

    setErro('erro-email', '');
    emailConfirmado = email;
    document.getElementById('email-display').textContent = email;
    setStep(2);
    startTimer();
    setTimeout(() => document.querySelector('.code-digit')?.focus(), 300);
};

// ── ETAPA 2: valida código (simulado) ──
window.goToStep3 = function () {
    const digits = [...document.querySelectorAll('.code-digit')];
    const code = digits.map(d => d.value).join('');

    if (code.length < 6) {
        digits.forEach(d => {
            d.style.animation = 'none';
            d.offsetHeight;
            d.style.animation = 'shakeX 0.4s ease';
        });
        return;
    }

    // Aqui você pode validar o código real quando tiver um backend
    // Por ora, qualquer código de 6 dígitos é aceito
    setStep(3);
};

// ── ETAPA 3: redefine senha ──
window.goToSuccess = function () {
    const pw1 = document.getElementById('pw1').value;
    const pw2 = document.getElementById('pw2').value;

    setErro('erro-senha', '');

    if (pw1.length < 8) {
        shake('pw1');
        setErro('erro-senha', 'A senha precisa ter no mínimo 8 caracteres.');
        return;
    }
    if (pw1 !== pw2) {
        shake('pw2');
        setErro('erro-senha', 'As senhas não coincidem.');
        return;
    }

    const res = window.auth.redefinirSenha(emailConfirmado, pw1);

    if (!res.ok) {
        setErro('erro-senha', res.erro);
        return;
    }

    document.getElementById('steps-indicator').style.display = 'none';
    setStep('success');
};

// ── HELPER de erro ──
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