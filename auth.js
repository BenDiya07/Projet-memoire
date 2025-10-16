// Système d'authentification et gestion des accès
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    // Initialisation
    init() {
        this.loadUserFromStorage();
        
        // Délai pour éviter les conflits avec les événements de saisie
        setTimeout(() => {
            this.setupPageProtection();
            this.interceptNavigation();
        }, 200);
    }

    // Charger l'utilisateur depuis le stockage
    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log(' Utilisateur chargé:', this.currentUser);
            }
        } catch (error) {
            console.error(' Erreur lors du chargement de l\'utilisateur:', error);
            this.logout();
        }
    }

    // Sauvegarder l'utilisateur dans le stockage
    saveUserToStorage(user) {
        try {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUser = user;
            console.log(' Utilisateur sauvegardé:', user);
        } catch (error) {
            console.error(' Erreur lors de la sauvegarde:', error);
        }
    }

    // Inscription - Utilise l'API backend
    async register(userData) {
        try {
            // Appel API au backend pour l'inscription
            const response = await fetch('http://localhost:5001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('Inscription reussie via API:', data.user);
                
                return {
                    success: true,
                    user: data.user,
                    message: data.message || 'Inscription réussie'
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Erreur lors de l\'inscription'
                };
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            
            // Fallback: inscription locale si le backend n'est pas disponible
            return this.registerFallback(userData);
        }
    }
    
    // Fallback local si le backend n'est pas disponible
    registerFallback(userData) {
        try {
            // Vérifier si l'utilisateur existe déjà
            const existingUsers = this.getRegisteredUsers();
            const userExists = existingUsers.some(user => user.email === userData.email);
            
            if (userExists) {
                return {
                    success: false,
                    message: 'Un compte avec cet email existe déjà'
                };
            }
            
            // Créer le nouvel utilisateur
            const newUser = {
                id: Date.now(),
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: userData.password,
                role: userData.role,
                studentId: userData.studentId || null,
                registeredAt: new Date().toISOString(),
                isActive: true
            };
            
            // Sauvegarder l'utilisateur localement
            existingUsers.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
            
            return {
                success: true,
                user: newUser,
                message: 'Inscription réussie (mode local)'
            };
        } catch (error) {
            console.error('Erreur lors de l\'inscription locale:', error);
            return {
                success: false,
                message: 'Erreur lors de l\'inscription'
            };
        }
    }

    // Obtenir les utilisateurs enregistrés
    getRegisteredUsers() {
        try {
            const users = localStorage.getItem('registeredUsers');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
            return [];
        }
    }

    // Connexion - Détection automatique du rôle
    async login(email, password) {
        try {
            // Appel API au backend sur le port 5001
            const response = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                    // Plus besoin d'envoyer le rôle !
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Stocker le token JWT
                localStorage.setItem('token', data.access_token);
                
                // Stocker les informations utilisateur
                const user = data.user;
                this.saveUserToStorage(user);
                
                // Stocker le rôle (détecté automatiquement par le backend)
                localStorage.setItem('userRole', user.role.name);
                
                console.log('Connexion reussie en tant que:', user.role.name);
                
                return {
                    success: true,
                    user: user,
                    message: data.message
                };
            } else {
                return {
                    success: false,
                    message: data.message
                };
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            
            // Fallback: Utiliser la détection locale si le backend n'est pas disponible
            return this.loginFallback(email, password);
        }
    }
    
    // Fallback local si le backend n'est pas disponible
    loginFallback(email, password) {
        // Vérifier les utilisateurs enregistrés localement
        const registeredUsers = this.getRegisteredUsers();
        const user = registeredUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
            const loginUser = {
                id: user.id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: user.role,
                loginTime: new Date().toISOString()
            };
            
            this.saveUserToStorage(loginUser);
            localStorage.setItem('userRole', user.role);
            
            return {
                success: true,
                user: loginUser,
                message: 'Connexion réussie (mode local)'
            };
        }
        
        // Vérifier les comptes de démonstration
        const demoUser = this.validateCredentialsAutoDetect(email, password);
        
        if (demoUser) {
            const user = {
                email: email,
                role: demoUser.role,
                name: this.getUserNameByRole(demoUser.role),
                loginTime: new Date().toISOString()
            };
            
            this.saveUserToStorage(user);
            localStorage.setItem('userRole', demoUser.role);
            
            return { 
                success: true, 
                user: user,
                message: 'Connexion réussie (mode démo)'
            };
        }
        
        return { 
            success: false, 
            message: 'Identifiants invalides' 
        };
    }

    // Validation des identifiants avec détection automatique du rôle
    validateCredentialsAutoDetect(email, password) {
        const credentials = {
            'admin@univ.fr': { password: 'admin123', role: 'admin' },
            'prof@univ.fr': { password: 'prof123', role: 'professor' },
            'etudiant@univ.fr': { password: 'etudiant123', role: 'student' }
        };

        const userCreds = credentials[email];
        // Retourne l'objet utilisateur avec le rôle si les credentials sont valides
        if (userCreds && userCreds.password === password) {
            return { role: userCreds.role };
        }
        return null;
    }
    
    // Ancienne méthode gardée pour compatibilité
    validateCredentials(email, password, role) {
        const userCreds = this.validateCredentialsAutoDetect(email, password);
        return userCreds && userCreds.role === role;
    }

    // Obtenir le nom d'utilisateur par rôle
    getUserNameByRole(role) {
        const names = {
            'admin': 'Administrateur',
            'professor': 'Professeur',
            'student': 'Étudiant'
        };
        return names[role] || 'Utilisateur';
    }

    // Déconnexion
    logout() {
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('login_redirect');
        this.currentUser = null;
        console.log(' Utilisateur déconnecté');
        window.location.href = 'login.html';
    }

    // Vérifier si l'utilisateur est connecté
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // Vérifier les permissions d'accès à une page
    canAccessPage(pageName) {
        if (!this.isLoggedIn()) {
            return false;
        }

        const permissions = {
            'admin': ['dashboard', 'gestion', 'suggestion-cours', 'emploi-temps'],
            'professor': ['gestion', 'suggestion-cours'],
            'student': ['emploi-temps']
        };

        // Gérer le cas où role est un objet ou une chaîne
        const userRole = typeof this.currentUser.role === 'object' 
            ? this.currentUser.role.name 
            : this.currentUser.role;
        return permissions[userRole] && permissions[userRole].includes(pageName);
    }

    // Obtenir la page par défaut pour un rôle
    getDefaultPage(role) {
        const defaultPages = {
            'admin': 'dashboard.html',
            'professor': 'gestion.html',
            'student': 'emploi-temps.html'
        };
        return defaultPages[role] || 'login.html';
    }

    // Rediriger vers la page appropriée
    redirectToDefaultPage() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        // Gérer le cas où role est un objet ou une chaîne
        const userRole = typeof this.currentUser.role === 'object' 
            ? this.currentUser.role.name 
            : this.currentUser.role;
        const defaultPage = this.getDefaultPage(userRole);
        window.location.href = defaultPage;
    }

    // Protection des pages
    setupPageProtection() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // Délai pour éviter les conflits avec les événements de saisie
                setTimeout(() => this.protectCurrentPage(), 100);
            });
        } else {
            // Délai pour éviter les conflits avec les événements de saisie
            setTimeout(() => this.protectCurrentPage(), 100);
        }
    }

    // Vérifier et rediriger si nécessaire
    checkAndRedirect() {
        const currentPage = this.getCurrentPageName();
        
        // Ne pas vérifier sur la page de login
        if (currentPage === 'login') {
            return;
        }
        
        // Vérifier si l'utilisateur est connecté
        if (!this.isLoggedIn()) {
            console.log(' Utilisateur non connecté, redirection vers login');
            window.location.href = 'login.html';
            return;
        }
        
        // Vérifier les permissions d'accès
        if (!this.canAccessPage(currentPage)) {
            console.log(` Accès refusé à la page: ${currentPage}`);
            this.redirectToDefaultPage();
            return;
        }
        
        // Mettre à jour l'interface utilisateur
        this.updateUIForUser();
    }

    // Protéger la page actuelle
    protectCurrentPage() {
        const currentPage = this.getCurrentPageName();
        
        if (currentPage === 'login') {
            // Si on est sur la page de login et qu'on est déjà connecté, rediriger
            if (this.isLoggedIn()) {
                // Eviter la boucle infinie
                const redirected = sessionStorage.getItem('login_redirect');
                if (!redirected) {
                    sessionStorage.setItem('login_redirect', 'true');
                    this.redirectToDefaultPage();
                }
            }
            return;
        }

        // Vérifier l'accès à la page
        if (!this.canAccessPage(currentPage)) {
            console.log(` Accès refusé à la page: ${currentPage}`);
            this.redirectToDefaultPage();
            return;
        }

        // Mettre à jour l'interface utilisateur
        this.updateUIForUser();
    }

    // Obtenir le nom de la page actuelle
    getCurrentPageName() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        
        // Mapping des noms de fichiers vers les noms de pages
        const pageMapping = {
            'dashboard': 'dashboard',
            'gestion': 'gestion',
            'suggestion-cours': 'suggestion-cours',
            'emploi-temps': 'emploi-temps',
            'login': 'login'
        };
        
        return pageMapping[page] || page;
    }

    // Mettre à jour l'interface utilisateur selon l'utilisateur
    updateUIForUser() {
        if (!this.isLoggedIn()) return;

        const user = this.getCurrentUser();
        
        // Utiliser full_name ou name selon ce qui est disponible
        const userName = user.full_name || user.name || user.email;
        
        // Mettre à jour le nom d'utilisateur dans la navigation
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(element => {
            element.textContent = userName;
        });

        // Réinitialiser la navigation avant de la mettre à jour
        this.resetNavigation();
        
        // Mettre à jour la navigation selon le rôle
        this.updateNavigationForRole(user.role);
    }

    // Réinitialiser la navigation
    resetNavigation() {
        const navMenus = document.querySelectorAll('.nav-menu');
        navMenus.forEach(navMenu => {
            navMenu.dataset.updated = 'false';
        });
    }

    // Mettre à jour la navigation selon le rôle
    updateNavigationForRole(role) {
        const navMenus = document.querySelectorAll('.nav-menu');
        
        // Gérer le cas où role est un objet ou une chaîne
        const roleName = typeof role === 'object' ? role.name : role;
        
        navMenus.forEach(navMenu => {
            // Vérifier si la navigation a déjà été mise à jour
            if (navMenu.dataset.updated === 'true') {
                return;
            }
            
            // Supprimer tous les liens existants
            navMenu.innerHTML = '';
            
            // Ajouter les liens selon le rôle
            const links = this.getNavigationLinksForRole(roleName);
            links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.href;
                a.className = `nav-link ${link.active ? 'active' : ''}`;
                a.textContent = link.text;
                navMenu.appendChild(a);
            });
            
            // Marquer comme mis à jour
            navMenu.dataset.updated = 'true';
        });
    }

    // Obtenir les liens de navigation selon le rôle
    getNavigationLinksForRole(role) {
        const currentPage = this.getCurrentPageName();
        
        // Gérer le cas où role est un objet ou une chaîne
        const roleName = typeof role === 'object' ? role.name : role;
        
        const roleLinks = {
            'admin': [
                { href: 'dashboard.html', text: 'Dashboard', active: currentPage === 'dashboard' },
                { href: 'gestion.html', text: 'Gestion', active: currentPage === 'gestion' },
                { href: 'suggestion-cours.html', text: 'Suggestions', active: currentPage === 'suggestion-cours' },
                { href: 'emploi-temps.html', text: 'Emploi du temps', active: currentPage === 'emploi-temps' }
            ],
            'professor': [
                { href: 'gestion.html', text: 'Gestion', active: currentPage === 'gestion' },
                { href: 'suggestion-cours.html', text: 'Suggestion de cours', active: currentPage === 'suggestion-cours' }
            ],
            'student': [
                { href: 'emploi-temps.html', text: 'Mon emploi du temps', active: currentPage === 'emploi-temps' }
            ]
        };
        
        return roleLinks[roleName] || [];
    }

    // Vérifier et rediriger si nécessaire
    checkAndRedirect() {
        const currentPage = this.getCurrentPageName();
        
        // Ne pas vérifier sur la page de login
        if (currentPage === 'login') {
            return;
        }
        
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        if (!this.canAccessPage(currentPage)) {
            this.showAccessDeniedMessage();
            this.redirectToDefaultPage();
        }
    }

    // Afficher un message d'accès refusé
    showAccessDeniedMessage() {
        const user = this.getCurrentUser();
        const currentPage = this.getCurrentPageName();
        
        const pageNames = {
            'dashboard': 'Dashboard',
            'gestion': 'Gestion',
            'suggestion-cours': 'Suggestion de cours',
            'emploi-temps': 'Emploi du temps'
        };
        
        const pageName = pageNames[currentPage] || currentPage;
        
        // Utiliser full_name ou name selon ce qui est disponible
        const userName = user.full_name || user.name || user.email;
        
        alert(` Accès refusé\n\nEn tant que ${userName}, vous n'avez pas l'autorisation d'accéder à la page "${pageName}".\n\nVous allez être redirigé vers votre page d'accueil.`);
    }

    // Intercepter les clics sur les liens de navigation
    interceptNavigation() {
        document.addEventListener('click', (e) => {
            const currentPage = this.getCurrentPageName();
            
            // Ne pas intercepter sur la page de login
            if (currentPage === 'login') {
                return;
            }
            
            const link = e.target.closest('a');
            if (!link || !link.href) return;
            
            // Vérifier si c'est un lien interne
            if (link.href.includes(window.location.origin) || link.href.startsWith('./') || link.href.startsWith('../')) {
                const href = link.getAttribute('href');
                const pageName = this.getPageNameFromHref(href);
                
                if (pageName && !this.canAccessPage(pageName)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showAccessDeniedMessage();
                    return false;
                }
            }
        });
    }

    // Obtenir le nom de page depuis un href
    getPageNameFromHref(href) {
        const pageMapping = {
            'dashboard.html': 'dashboard',
            'gestion.html': 'gestion',
            'suggestion-cours.html': 'suggestion-cours',
            'emploi-temps.html': 'emploi-temps',
            'login.html': 'login'
        };
        
        const fileName = href.split('/').pop();
        return pageMapping[fileName];
    }
}

// Instance globale
const authManager = new AuthManager();

// Fonction de déconnexion globale
function logout() {
    authManager.logout();
}

// Gérer les changements de page
window.addEventListener('beforeunload', () => {
    // Réinitialiser la navigation avant de quitter la page
    authManager.resetNavigation();
});

// Gérer le chargement de la page
window.addEventListener('load', () => {
    // Vérifier et rediriger si nécessaire après le chargement complet
    setTimeout(() => {
        authManager.checkAndRedirect();
    }, 200);
});

// Vérification périodique de l'accès (seulement si pas sur la page de login)
setInterval(() => {
    const currentPage = authManager.getCurrentPageName();
    if (currentPage !== 'login') {
        authManager.checkAndRedirect();
    }
}, 5000); // Vérifier toutes les 5 secondes

// Fonction de debug pour afficher les permissions
function showUserPermissions() {
    if (!authManager.isLoggedIn()) {
        console.log(' Aucun utilisateur connecté');
        return;
    }
    
    const user = authManager.getCurrentUser();
    console.log(' Utilisateur connecté:', user);
    
    const permissions = {
        'admin': ['dashboard', 'gestion', 'suggestion-cours', 'emploi-temps'],
        'professor': ['gestion', 'suggestion-cours'],
        'student': ['emploi-temps']
    };
    
    // Gérer le cas où role est un objet ou une chaîne
    const userRole = typeof user.role === 'object' ? user.role.name : user.role;
    console.log(' Permissions pour', userRole + ':', permissions[userRole]);
    console.log(' Page actuelle:', authManager.getCurrentPageName());
    console.log(' Accès autorisé:', authManager.canAccessPage(authManager.getCurrentPageName()));
}

// Exposer la fonction de debug globalement
window.showUserPermissions = showUserPermissions;
