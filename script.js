// Gestion des onglets
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const formContainers = document.querySelectorAll('.form-container');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetTab = this.getAttribute('data-tab');
            
            // Retirer la classe active de tous les boutons et conteneurs
            tabBtns.forEach(b => b.classList.remove('active'));
            formContainers.forEach(c => c.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            // Afficher le formulaire correspondant
            const targetForm = document.getElementById(targetTab + 'Form');
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });
    
    // Empêcher les rechargements automatiques lors de la saisie
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function(e) {
            e.stopPropagation();
        });
        
        input.addEventListener('change', function(e) {
            e.stopPropagation();
        });
        
        input.addEventListener('keydown', function(e) {
            // Empêcher la soumission du formulaire avec Enter
            if (e.key === 'Enter' && e.target.type !== 'submit') {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });
});

// Gestion du formulaire de connexion
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.querySelector('input[name="role"]:checked').value;
        
        // Validation des champs
        if (!email || !password) {
            alert('❌ Veuillez remplir tous les champs');
            return false;
        }
        
        // Tentative de connexion
        const result = authManager.login(email, password, role);
        
        if (result.success) {
            alert(`✅ Connexion réussie !\n\nBienvenue ${result.user.name}`);
            
            // Redirection vers la page par défaut du rôle
            const defaultPage = authManager.getDefaultPage(role);
            window.location.href = defaultPage;
        } else {
            alert(`❌ ${result.message}\n\nVérifiez vos identifiants et votre rôle.`);
        }
        
        return false;
    });
});

// Gestion du formulaire d'inscription
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('reg-firstName').value;
    const lastName = document.getElementById('reg-lastName').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirmPassword').value;
    const studentId = document.getElementById('reg-studentId').value;
    const role = document.querySelector('input[name="reg-role"]:checked').value;
    const terms = document.getElementById('reg-terms').checked;
    
    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
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
    
    // Simulation d'inscription
    const userData = {
        firstName,
        lastName,
        email,
        role,
        studentId: studentId || null
    };
    
    alert(`Inscription réussie !\n\nNom: ${firstName} ${lastName}\nEmail: ${email}\nRôle: ${role}\n${studentId ? `Numéro étudiant: ${studentId}` : ''}\n\nVous pouvez maintenant vous connecter.`);
    
    // Réinitialiser le formulaire
    this.reset();
    
    // Basculer vers l'onglet de connexion
    document.querySelector('[data-tab="login"]').click();
});

// Auto-remplissage pour les comptes de démonstration
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'P' && e.target.textContent.includes('@univ.fr')) {
        const text = e.target.textContent;
        const email = text.split(' / ')[0].split(': ')[1];
        const password = text.split(' / ')[1];
        const role = text.includes('Admin') ? 'admin' : text.includes('Professeur') ? 'professor' : 'student';
        
        document.getElementById('email').value = email;
        document.getElementById('password').value = password;
        document.getElementById(role).checked = true;
    }
});
