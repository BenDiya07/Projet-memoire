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

    // Empêcher Enter dans les inputs (sauf submit et textarea)
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => e.stopPropagation());
        input.addEventListener('change', (e) => e.stopPropagation());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.type !== 'submit' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });
});

// Formulaire de connexion
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('Veuillez remplir tous les champs');
            return false;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Connexion en cours...';
        submitBtn.disabled = true;

        const result = await authManager.login(email, password);

        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (result.success) {
            const userRole = authManager.getUserRole();
            const userName = authManager.getUserName();
            alert(`Connexion reussie !\n\nBienvenue ${userName}\nRole: ${userRole}`);
            window.location.href = authManager.getDefaultPage(userRole);
        } else {
            alert(`${result.message}\n\nVerifiez vos identifiants.`);
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
        const role = document.querySelector('input[name="reg-role"]:checked').value;
        const terms = document.getElementById('reg-terms').checked;

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }
        if (password.length < 6) {
            alert('Le mot de passe doit contenir au moins 6 caracteres');
            return;
        }
        if (password !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }
        if (!terms) {
            alert('Vous devez accepter les conditions d\'utilisation');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Inscription en cours...';
        submitBtn.disabled = true;

        const userData = { firstName, lastName, email, password, role, studentId: studentId || null };

        try {
            const result = await authManager.register(userData);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (result.success) {
                alert(`Inscription reussie !\n\nNom: ${firstName} ${lastName}\nEmail: ${email}\nRole: ${role}\n${studentId ? `Numero etudiant: ${studentId}` : ''}\n\nVous pouvez maintenant vous connecter.`);
                registerForm.reset();
                document.querySelector('[data-tab="login"]').click();
            } else {
                alert(`Erreur d'inscription: ${result.message}`);
            }
        } catch (error) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            alert(`Erreur d'inscription: ${error.message}`);
        }
    });
});

// Auto-remplissage pour les comptes de démonstration
document.addEventListener('click', function (e) {
    if (e.target.tagName === 'P' && e.target.textContent.includes('@univ.fr')) {
        const text = e.target.textContent;
        const email = text.split(' / ')[0].split(': ')[1];
        const password = text.split(' / ')[1];
        const isAdmin = text.includes('Admin');
        const isProf = text.includes('Professeur');

        document.getElementById('email').value = email;
        document.getElementById('password').value = password;

        if (isAdmin) {
            const radio = document.getElementById('reg-admin');
            if (radio) radio.checked = true;
        } else if (isProf) {
            const radio = document.getElementById('reg-professor');
            if (radio) radio.checked = true;
        } else {
            const radio = document.getElementById('reg-student');
            if (radio) radio.checked = true;
        }
    }
});

// Test d'inscription (pour debug)
async function testRegistration() {
    const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'test123',
        role: 'student',
        studentId: 'TEST001'
    };
    const result = await authManager.register(testUser);
    if (result.success) {
        alert('Test reussi !\nUtilisateur cree.');
    } else {
        alert('Test echoue: ' + result.message);
    }
}
