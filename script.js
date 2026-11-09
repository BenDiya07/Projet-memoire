// Gestion des onglets
document.addEventListener('DOMContentLoaded', function () {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const formContainers = document.querySelectorAll('.form-container');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const targetTab = this.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            formContainers.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const targetForm = document.getElementById(targetTab + 'Form');
            if (targetForm) targetForm.classList.add('active');
        });
    });

});

// Formulaire de connexion
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('input', () => {
        const feedback = document.getElementById('loginFeedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'form-feedback';
        }
    });

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const feedback = document.getElementById('loginFeedback');

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Connexion en cours...';
        submitBtn.disabled = true;

        try {
            const result = await authManager.login(email, password);
            if (result.success) {
                window.location.href = authManager.getDefaultPage(authManager.getUserRole());
            } else if (feedback) {
                feedback.textContent = result.message;
                feedback.className = 'form-feedback error';
            }
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
        return false;
    });
});

// Formulaire d'inscription
document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const firstName = document.getElementById('reg-firstName').value;
        const lastName = document.getElementById('reg-lastName').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirmPassword').value;
        const studentId = document.getElementById('reg-studentId').value;
        const confirmedInfo = document.getElementById('reg-confirmInfo').checked;
        const feedback = document.getElementById('registerFeedback');

        if (password.length < 6) {
            feedback.textContent = 'Le mot de passe doit contenir au moins 6 caractères.';
            feedback.className = 'form-feedback error';
            return;
        }
        if (password !== confirmPassword) {
            feedback.textContent = 'Les mots de passe ne correspondent pas.';
            feedback.className = 'form-feedback error';
            return;
        }
        if (!confirmedInfo) {
            feedback.textContent = 'Veuillez confirmer l’exactitude des informations.';
            feedback.className = 'form-feedback error';
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Inscription en cours...';
        submitBtn.disabled = true;

        const userData = { firstName, lastName, email, password, studentId: studentId || null };

        try {
            const result = await authManager.register(userData);
            if (result.success) {
                feedback.textContent = 'Inscription réussie. Vous pouvez maintenant vous connecter.';
                feedback.className = 'form-feedback success';
                registerForm.reset();
                document.querySelector('[data-tab="login"]').click();
            } else {
                feedback.textContent = result.message;
                feedback.className = 'form-feedback error';
            }
        } catch (error) {
            console.error('Erreur d’inscription:', error);
            feedback.textContent = 'Une erreur est survenue. Veuillez réessayer.';
            feedback.className = 'form-feedback error';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

// Auto-remplissage pour les comptes de démonstration
document.addEventListener('click', function (e) {
    const account = e.target.closest('[data-demo-email]');
    if (!account) return;
    document.getElementById('email').value = account.dataset.demoEmail;
    document.getElementById('password').value = account.dataset.demoPassword;
    document.getElementById('loginFeedback').textContent = '';
    document.querySelector('[data-tab="login"]').click();
});
