// Système d'authentification et gestion des accès

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserFromStorage();
        setTimeout(() => {
            this.setupPageProtection();
        }, 200);
    }

    // Normaliser le rôle: retourne toujours une string
    _getRole(user) {
        if (!user) return null;
        if (typeof user.role === 'string') return user.role;
        if (user.role && typeof user.role === 'object') return user.role.name;
        return null;
    }

    _getFullName(user) {
        if (!user) return 'Utilisateur';
        if (user.full_name) return user.full_name;
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
        if (user.name) return user.name;
        return user.email || 'Utilisateur';
    }

    // --- Stockage ---
    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            }
        } catch (error) {
            console.error('Erreur chargement utilisateur:', error);
            this._clearStorage();
        }
    }

    saveUserToStorage(user) {
        try {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUser = user;
        } catch (error) {
            console.error('Erreur sauvegarde utilisateur:', error);
        }
    }

    _clearStorage() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('registeredUsers');
        this.currentUser = null;
    }

    // --- Auth ---
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async fetchWithAuth(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            ...this.getAuthHeader()
        };
        const finalOptions = { ...options, headers };

        try {
            const response = await fetch(url, finalOptions);
            if (response.status === 401) {
                this.logout();
                return null;
            }
            return response;
        } catch (error) {
            console.error(`Erreur API (${url}):`, error);
            throw error;
        }
    }

    // --- Inscription ---
    async register(userData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json().catch(() => ({}));
            if (data.success) {
                return { success: true, user: data.user, message: data.message };
            }
            return { success: false, message: data.message || 'Impossible de créer le compte.' };
        } catch (error) {
            console.error('Erreur API lors de l’inscription:', error);
            return { success: false, message: 'Le serveur est indisponible. Réessayez plus tard.' };
        }
    }

    // --- Connexion ---
    async login(email, password) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.success) {
                localStorage.setItem('token', data.access_token);
                const user = data.user;
                this.saveUserToStorage(user);
                const role = this._getRole(user);
                localStorage.setItem('userRole', role);

                return { success: true, user, message: data.message };
            }
            return { success: false, message: data.message || 'Identifiants invalides.' };
        } catch (error) {
            console.error('Erreur API lors de la connexion:', error);
            return { success: false, message: 'Le serveur est indisponible. Vérifiez votre connexion puis réessayez.' };
        }
    }

    // --- Déconnexion ---
    logout() {
        this._clearStorage();
        window.location.href = 'login.html';
    }

    // --- État ---
    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserRole() {
        return this._getRole(this.currentUser);
    }

    getUserName() {
        return this._getFullName(this.currentUser);
    }

    // --- Permissions ---
    canAccessPage(pageName) {
        if (!this.isLoggedIn()) return false;
        const role = this.getUserRole();
        const permissions = {
            admin: ['dashboard', 'gestion', 'suggestion-cours', 'emploi-temps'],
            professor: ['gestion', 'suggestion-cours'],
            student: ['emploi-temps']
        };
        return permissions[role] && permissions[role].includes(pageName);
    }

    getDefaultPage(role) {
        const defaultPages = {
            admin: 'dashboard.html',
            professor: 'gestion.html',
            student: 'emploi-temps.html'
        };
        return defaultPages[role] || 'login.html';
    }

    redirectToDefaultPage() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        const role = this.getUserRole();
        window.location.href = this.getDefaultPage(role);
    }

    // --- Protection des pages ---
    setupPageProtection() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this._protectCurrentPage(), 100);
            });
        } else {
            setTimeout(() => this._protectCurrentPage(), 100);
        }
    }

    _protectCurrentPage() {
        const currentPage = this.getCurrentPageName();
        if (currentPage === 'login') {
            if (this.isLoggedIn()) this.redirectToDefaultPage();
            return;
        }
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        if (!this.canAccessPage(currentPage)) {
            alert('Accès refusé.\n\nRedirection vers votre page d\'accueil.');
            this.redirectToDefaultPage();
            return;
        }
        this._updateUIForUser();
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        const pageMapping = {
            dashboard: 'dashboard',
            gestion: 'gestion',
            'suggestion-cours': 'suggestion-cours',
            'emploi-temps': 'emploi-temps',
            login: 'login'
        };
        return pageMapping[page] || page;
    }

    _updateUIForUser() {
        if (!this.isLoggedIn()) return;
        const role = this.getUserRole();
        const name = this.getUserName();

        document.querySelectorAll('.user-info').forEach(el => {
            el.textContent = name;
        });

        const navMenus = document.querySelectorAll('.nav-menu');
        navMenus.forEach(navMenu => {
            if (navMenu.dataset.updated === 'true') return;
            navMenu.innerHTML = '';
            this._getNavigationLinksForRole(role).forEach(link => {
                const a = document.createElement('a');
                a.href = link.href;
                a.className = `nav-link ${link.active ? 'active' : ''}`;
                a.textContent = link.text;
                navMenu.appendChild(a);
            });
            navMenu.dataset.updated = 'true';
        });
    }

    _getNavigationLinksForRole(role) {
        const currentPage = this.getCurrentPageName();
        const roleLinks = {
            admin: [
                { href: 'dashboard.html', text: 'Dashboard', active: currentPage === 'dashboard' },
                { href: 'gestion.html', text: 'Gestion', active: currentPage === 'gestion' },
                { href: 'suggestion-cours.html', text: 'Suggestions', active: currentPage === 'suggestion-cours' },
                { href: 'emploi-temps.html', text: 'Emploi du temps', active: currentPage === 'emploi-temps' }
            ],
            professor: [
                { href: 'gestion.html', text: 'Gestion', active: currentPage === 'gestion' },
                { href: 'suggestion-cours.html', text: 'Suggestion de cours', active: currentPage === 'suggestion-cours' }
            ],
            student: [
                { href: 'emploi-temps.html', text: 'Mon emploi du temps', active: currentPage === 'emploi-temps' }
            ]
        };
        return roleLinks[role] || [];
    }

    // --- Interception navigation ---
    interceptNavigation() {
        document.addEventListener('click', (e) => {
            if (this.getCurrentPageName() === 'login') return;
            const link = e.target.closest('a');
            if (!link || !link.href) return;
            const pageMapping = {
                'dashboard.html': 'dashboard',
                'gestion.html': 'gestion',
                'suggestion-cours.html': 'suggestion-cours',
                'emploi-temps.html': 'emploi-temps',
                'login.html': 'login'
            };
            const fileName = link.getAttribute('href').split('/').pop();
            const pageName = pageMapping[fileName];
            if (pageName && !this.canAccessPage(pageName)) {
                e.preventDefault();
                e.stopPropagation();
                alert('Accès refusé.');
                return false;
            }
        });
    }
}

// Instance globale
const authManager = new AuthManager();

// Fonction de déconnexion globale
function logout() {
    authManager.logout();
}

// Intercepter la navigation après le chargement
window.addEventListener('load', () => {
    authManager.interceptNavigation();
});
