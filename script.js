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
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        // Plus besoin de récupérer le rôle - il sera détecté automatiquement !
        
        // Validation des champs
        if (!email || !password) {
            alert('⚠️ Veuillez remplir tous les champs');
            return false;
        }
        
        // Afficher un indicateur de chargement
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Connexion en cours...';
        submitBtn.disabled = true;
        
        // Tentative de connexion (async - détection automatique du rôle)
        const result = await authManager.login(email, password);
        
        // Restaurer le bouton
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (result.success) {
            // Le rôle est maintenant dans result.user.role
            const userRole = result.user.role.name || result.user.role;
            
            alert(`Connexion reussie !\n\nBienvenue ${result.user.name || result.user.full_name}\nRole: ${userRole}`);
            
            // Redirection vers la page par défaut du rôle (détecté automatiquement)
            const defaultPage = authManager.getDefaultPage(userRole);
            window.location.href = defaultPage;
        } else {
            alert(`${result.message}\n\nVerifiez vos identifiants.`);
        }
        
        return false;
    });
});

// Gestion du formulaire d'inscription
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) {
        console.error('Formulaire d\'inscription non trouvé');
        return;
    }
    
    registerForm.addEventListener('submit', async function(e) {
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
            alert('⚠️ Veuillez remplir tous les champs obligatoires');
            return;
        }
        
        if (password.length < 6) {
            alert('⚠️ Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('⚠️ Les mots de passe ne correspondent pas');
            return;
        }
        
        if (!terms) {
            alert('⚠️ Vous devez accepter les conditions d\'utilisation');
            return;
        }
        
        // Afficher un indicateur de chargement
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Inscription en cours...';
        submitBtn.disabled = true;
        
        // Inscription via API (async)
        const userData = {
            firstName,
            lastName,
            email,
            password,
            role,
            studentId: studentId || null
        };
        
        console.log('Donnees d\'inscription:', userData);
        
        try {
            const result = await authManager.register(userData);
            console.log('Resultat de l\'inscription:', result);
            
            // Restaurer le bouton
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                alert(`Inscription reussie !\n\nNom: ${firstName} ${lastName}\nEmail: ${email}\nRole: ${role}\n${studentId ? `Numero etudiant: ${studentId}` : ''}\n\nVous pouvez maintenant vous connecter.`);
                
                // Réinitialiser le formulaire
                registerForm.reset();
                
                // Basculer vers l'onglet de connexion
                document.querySelector('[data-tab="login"]').click();
            } else {
                alert(`Erreur d'inscription: ${result.message}`);
            }
        } catch (error) {
            // Restaurer le bouton
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            alert(`Erreur d'inscription: ${error.message}`);
        }
    });
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

// Fonction de test pour l'inscription
function testRegistration() {
    console.log('Test de l\'inscription...');
    console.log('AuthManager disponible:', typeof authManager);
    
    const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'test123',
        role: 'student',
        studentId: 'TEST001'
    };
    
    console.log('Données de test:', testUser);
    
    const result = authManager.register(testUser);
    console.log('Résultat du test:', result);
    
    if (result.success) {
        alert('Test d\'inscription réussi !\n\nUtilisateur créé:\n' + JSON.stringify(result.user, null, 2));
    } else {
        alert('Test d\'inscription échoué:\n' + result.message);
    }
}