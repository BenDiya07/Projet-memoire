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
                console.log('👤 Utilisateur chargé:', this.currentUser);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
            this.logout();
        }
    }

    // Sauvegarder l'utilisateur dans le stockage
    saveUserToStorage(user) {
        try {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUser = user;
            console.log('💾 Utilisateur sauvegardé:', user);
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
    }

    // Connexion
    login(email, password, role) {
        // Simulation de validation des identifiants
        const validCredentials = this.validateCredentials(email, password, role);
        
        if (validCredentials) {
            const user = {
                email: email,
                role: role,
                name: this.getUserNameByRole(role),
                loginTime: new Date().toISOString()
            };
            
            this.saveUserToStorage(user);
            return { success: true, user: user };
        } else {
            return { success: false, message: 'Identifiants invalides' };
        }
    }

    // Validation des identifiants
    validateCredentials(email, password, role) {
        const credentials = {
            'admin@univ.fr': { password: 'admin123', role: 'admin' },
            'prof@univ.fr': { password: 'prof123', role: 'professor' },
            'etudiant@univ.fr': { password: 'etudiant123', role: 'student' }
        };

        const userCreds = credentials[email];
        return userCreds && userCreds.password === password && userCreds.role === role;
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
        this.currentUser = null;
        console.log('👋 Utilisateur déconnecté');
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

        const userRole = this.currentUser.role;
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

        const defaultPage = this.getDefaultPage(this.currentUser.role);
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

    // Protéger la page actuelle
    protectCurrentPage() {
        const currentPage = this.getCurrentPageName();
        
        if (currentPage === 'login') {
            // Si on est sur la page de login et qu'on est déjà connecté, rediriger
            if (this.isLoggedIn()) {
                this.redirectToDefaultPage();
            }
            return;
        }

        // Vérifier l'accès à la page
        if (!this.canAccessPage(currentPage)) {
            console.log(`❌ Accès refusé à la page: ${currentPage}`);
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
        
        // Mettre à jour le nom d'utilisateur dans la navigation
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(element => {
            element.textContent = user.name;
        });

        // Mettre à jour la navigation selon le rôle
        this.updateNavigationForRole(user.role);
    }

    // Mettre à jour la navigation selon le rôle
    updateNavigationForRole(role) {
        const navMenus = document.querySelectorAll('.nav-menu');
        
        navMenus.forEach(navMenu => {
            // Supprimer tous les liens existants
            navMenu.innerHTML = '';
            
            // Ajouter les liens selon le rôle
            const links = this.getNavigationLinksForRole(role);
            links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.href;
                a.className = `nav-link ${link.active ? 'active' : ''}`;
                a.textContent = link.text;
                navMenu.appendChild(a);
            });
        });
    }

    // Obtenir les liens de navigation selon le rôle
    getNavigationLinksForRole(role) {
        const currentPage = this.getCurrentPageName();
        
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
        
        return roleLinks[role] || [];
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
        
        alert(`❌ Accès refusé\n\nEn tant que ${user.name}, vous n'avez pas l'autorisation d'accéder à la page "${pageName}".\n\nVous allez être redirigé vers votre page d'accueil.`);
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
        console.log('❌ Aucun utilisateur connecté');
        return;
    }
    
    const user = authManager.getCurrentUser();
    console.log('👤 Utilisateur connecté:', user);
    
    const permissions = {
        'admin': ['dashboard', 'gestion', 'suggestion-cours', 'emploi-temps'],
        'professor': ['gestion', 'suggestion-cours'],
        'student': ['emploi-temps']
    };
    
    console.log('🔐 Permissions pour', user.role + ':', permissions[user.role]);
    console.log('📄 Page actuelle:', authManager.getCurrentPageName());
    console.log('✅ Accès autorisé:', authManager.canAccessPage(authManager.getCurrentPageName()));
}

// Exposer la fonction de debug globalement
window.showUserPermissions = showUserPermissions;
