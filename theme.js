// Système de gestion des thèmes et mode sombre
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.currentRole = null;
        this.init();
    }

    // Initialisation
    init() {
        // Appliquer le thème immédiatement pour éviter le flash
        this.applyThemeImmediately();
        this.loadThemeFromStorage();
        this.setupThemeToggle();
        this.applyTheme();
        this.setupRoleTheme();
    }

    // Charger le thème depuis le stockage
    loadThemeFromStorage() {
        try {
            const savedTheme = localStorage.getItem('theme');
            const savedRole = localStorage.getItem('userRole');
            
            if (savedTheme) {
                this.currentTheme = savedTheme;
            }
            
            if (savedRole) {
                this.currentRole = savedRole;
            }
        } catch (error) {
            console.error(' Erreur lors du chargement du thème:', error);
        }
    }

    // Sauvegarder le thème
    saveThemeToStorage() {
        try {
            localStorage.setItem('theme', this.currentTheme);
            localStorage.setItem('userRole', this.currentRole);
        } catch (error) {
            console.error(' Erreur lors de la sauvegarde du thème:', error);
        }
    }

    // Configurer le bouton de basculement de thème
    setupThemeToggle() {
        // Créer le bouton de basculement si il n'existe pas
        this.createThemeToggleButton();
        
        // Écouter les clics sur le bouton
        document.addEventListener('click', (e) => {
            if (e.target.matches('.theme-toggle') || e.target.closest('.theme-toggle') ||
                e.target.matches('.theme-toggle-login') || e.target.closest('.theme-toggle-login')) {
                this.toggleTheme();
            }
        });
    }

    // Créer le bouton de basculement de thème
    createThemeToggleButton() {
        // Vérifier si le bouton existe déjà
        if (document.querySelector('.theme-toggle')) return;

        // Trouver la barre de navigation
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        // Créer le bouton
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = `
            <span class="theme-icon"></span>
            <span class="theme-text">Mode sombre</span>
        `;
        themeToggle.title = 'Basculer entre mode clair et sombre';

        // Ajouter le bouton à la navigation
        const navUser = navbar.querySelector('.nav-user');
        if (navUser) {
            navUser.insertBefore(themeToggle, navUser.firstChild);
        }
    }

    // Basculer entre les thèmes
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveThemeToStorage();
        
        // Animation de transition
        this.animateThemeTransition();
    }

    // Appliquer le thème immédiatement (sans attendre le DOM)
    applyThemeImmediately() {
        const root = document.documentElement;
        const body = document.body;
        
        // Récupérer le thème sauvegardé
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedRole = localStorage.getItem('userRole');
        
        // Appliquer immédiatement les classes
        root.classList.add(`theme-${savedTheme}`);
        body.classList.add(`theme-${savedTheme}`);
        
        if (savedRole) {
            root.classList.add(`role-${savedRole}`);
            body.classList.add(`role-${savedRole}`);
        }
        
        // Mettre à jour les variables CSS immédiatement
        this.applyRoleColors(savedRole || 'student');
    }

    // Appliquer le thème
    applyTheme() {
        const root = document.documentElement;
        const body = document.body;
        
        // Supprimer les anciennes classes de thème
        root.classList.remove('theme-light', 'theme-dark');
        body.classList.remove('theme-light', 'theme-dark');
        
        // Ajouter la nouvelle classe de thème
        root.classList.add(`theme-${this.currentTheme}`);
        body.classList.add(`theme-${this.currentTheme}`);
        
        // Mettre à jour le bouton de basculement
        this.updateThemeToggleButton();
        
        // Appliquer le thème par rôle si applicable
        if (this.currentRole) {
            this.applyRoleTheme(this.currentRole);
        }
        
        // Forcer le re-rendu des éléments
        this.forceRerender();
    }

    // Mettre à jour le bouton de basculement
    updateThemeToggleButton() {
        // Bouton principal (dans les pages avec navigation)
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.theme-icon');
            const text = themeToggle.querySelector('.theme-text');
            
            if (this.currentTheme === 'dark') {
                
                text.textContent = 'Mode clair';
            } else {
               
                text.textContent = 'Mode sombre';
            }
        }

        // Bouton de la page de login
        const themeToggleLogin = document.querySelector('.theme-toggle-login');
        if (themeToggleLogin) {
            const iconLogin = themeToggleLogin.querySelector('.theme-icon-login');
            const textLogin = themeToggleLogin.querySelector('.theme-text-login');
            
            if (this.currentTheme === 'dark') {
                
                textLogin.textContent = 'Mode clair';
            } else {
                
                textLogin.textContent = 'Mode sombre';
            }
        }
    }

    // Configurer le thème par rôle
    setupRoleTheme() {
        // Écouter les changements d'utilisateur
        if (typeof authManager !== 'undefined') {
            const user = authManager.getCurrentUser();
            if (user) {
                this.setRoleTheme(user.role);
            }
        }
    }

    // Appliquer le thème par rôle
    setRoleTheme(role) {
        this.currentRole = role;
        this.applyRoleTheme(role);
        this.saveThemeToStorage();
    }

    // Appliquer le thème spécifique au rôle
    applyRoleTheme(role) {
        const root = document.documentElement;
        const body = document.body;
        
        // Supprimer les anciennes classes de rôle
        root.classList.remove('role-admin', 'role-professor', 'role-student');
        body.classList.remove('role-admin', 'role-professor', 'role-student');
        
        // Ajouter la nouvelle classe de rôle
        root.classList.add(`role-${role}`);
        body.classList.add(`role-${role}`);
        
        // Appliquer les couleurs spécifiques au rôle
        this.applyRoleColors(role);
    }

    // Appliquer les couleurs par rôle
    applyRoleColors(role) {
        const root = document.documentElement;
        
        const roleColors = {
            'admin': {
                primary: '#dc2626',
                secondary: '#6b7280',
                accent: '#f59e0b'
            },
            'professor': {
                primary: '#2563eb',
                secondary: '#6b7280',
                accent: '#06b6d4'
            },
            'student': {
                primary: '#16a34a',
                secondary: '#6b7280',
                accent: '#22c55e'
            }
        };
        
        const colors = roleColors[role] || roleColors['student'];
        
        // Appliquer les variables CSS
        root.style.setProperty('--role-primary', colors.primary);
        root.style.setProperty('--role-secondary', colors.secondary);
        root.style.setProperty('--role-accent', colors.accent);
    }

    // Animation de transition entre thèmes
    animateThemeTransition() {
        const root = document.documentElement;
        root.style.transition = 'all 0.3s ease-in-out';
        
        setTimeout(() => {
            root.style.transition = '';
        }, 300);
    }

    // Obtenir le thème actuel
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Obtenir le rôle actuel
    getCurrentRole() {
        return this.currentRole;
    }

    // Forcer un thème spécifique
    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.currentTheme = theme;
            this.applyTheme();
            this.saveThemeToStorage();
        }
    }

    // Forcer un rôle spécifique
    setRole(role) {
        if (['admin', 'professor', 'student'].includes(role)) {
            this.setRoleTheme(role);
        }
    }

    // Forcer le re-rendu des éléments
    forceRerender() {
        // Déclencher un événement personnalisé pour notifier les composants
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: this.currentTheme,
                role: this.currentRole
            }
        });
        document.dispatchEvent(event);
        
        // Forcer le re-rendu des graphiques si Chart.js est disponible
        if (typeof Chart !== 'undefined') {
            Chart.helpers.each(Chart.instances, function(chart) {
                chart.update();
            });
        }
        
        // Forcer le re-rendu des calendriers si ils existent
        const calendars = document.querySelectorAll('.calendar');
        calendars.forEach(calendar => {
            if (calendar.style) {
                calendar.style.display = 'none';
                calendar.offsetHeight; // Force reflow
                calendar.style.display = '';
            }
        });
    }
}

// Instance globale
const themeManager = new ThemeManager();

// Fonction globale pour basculer le thème
function toggleTheme() {
    themeManager.toggleTheme();
}

// Fonction globale pour définir le thème
function setTheme(theme) {
    themeManager.setTheme(theme);
}

// Synchronisation avec le système d'authentification
if (typeof authManager !== 'undefined') {
    // Écouter les changements d'utilisateur
    const originalLogin = authManager.login;
    authManager.login = function(email, password, role) {
        const result = originalLogin.call(this, email, password, role);
        if (result.success) {
            themeManager.setRoleTheme(role);
        }
        return result;
    };
    
    // Écouter les déconnexions
    const originalLogout = authManager.logout;
    authManager.logout = function() {
        themeManager.setRoleTheme('student'); // Rôle par défaut
        originalLogout.call(this);
    };
}
