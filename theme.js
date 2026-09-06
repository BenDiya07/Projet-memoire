// Système de gestion des thèmes et mode sombre

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.currentRole = null;
        this.init();
    }

    init() {
        this.loadThemeFromStorage();
        this.setupThemeToggle();
        this.applyTheme();
    }

    loadThemeFromStorage() {
        try {
            const savedTheme = localStorage.getItem('theme');
            const savedRole = localStorage.getItem('userRole');
            if (savedTheme) this.currentTheme = savedTheme;
            if (savedRole) this.currentRole = savedRole;
        } catch (error) {
            console.error('Erreur chargement thème:', error);
        }
    }

    saveThemeToStorage() {
        try {
            localStorage.setItem('theme', this.currentTheme);
            if (this.currentRole) localStorage.setItem('userRole', this.currentRole);
        } catch (error) {
            console.error('Erreur sauvegarde thème:', error);
        }
    }

    setupThemeToggle() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.theme-toggle') || e.target.closest('.theme-toggle') ||
                e.target.matches('.theme-toggle-login') || e.target.closest('.theme-toggle-login')) {
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveThemeToStorage();
        this.animateThemeTransition();
    }

    applyTheme() {
        const root = document.documentElement;
        const body = document.body;
        root.classList.remove('theme-light', 'theme-dark');
        body.classList.remove('theme-light', 'theme-dark');
        root.classList.add(`theme-${this.currentTheme}`);
        body.classList.add(`theme-${this.currentTheme}`);
        this.updateThemeToggleButton();
        if (this.currentRole) this.applyRoleTheme(this.currentRole);
    }

    updateThemeToggleButton() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            const text = themeToggle.querySelector('.theme-text');
            if (text) text.textContent = this.currentTheme === 'dark' ? 'Mode clair' : 'Mode sombre';
        }
        const themeToggleLogin = document.querySelector('.theme-toggle-login');
        if (themeToggleLogin) {
            const textLogin = themeToggleLogin.querySelector('.theme-text-login');
            if (textLogin) textLogin.textContent = this.currentTheme === 'dark' ? 'Mode clair' : 'Mode sombre';
        }
    }

    setRoleTheme(role) {
        this.currentRole = role;
        this.applyRoleTheme(role);
        this.saveThemeToStorage();
    }

    applyRoleTheme(role) {
        const root = document.documentElement;
        const body = document.body;
        root.classList.remove('role-admin', 'role-professor', 'role-student');
        body.classList.remove('role-admin', 'role-professor', 'role-student');
        root.classList.add(`role-${role}`);
        body.classList.add(`role-${role}`);
        this.applyRoleColors(role);
    }

    applyRoleColors(role) {
        const root = document.documentElement;
        const roleColors = {
            admin: { primary: '#dc2626', secondary: '#6b7280', accent: '#f59e0b' },
            professor: { primary: '#2563eb', secondary: '#6b7280', accent: '#06b6d4' },
            student: { primary: '#16a34a', secondary: '#6b7280', accent: '#22c55e' }
        };
        const colors = roleColors[role] || roleColors.student;
        root.style.setProperty('--role-primary', colors.primary);
        root.style.setProperty('--role-secondary', colors.secondary);
        root.style.setProperty('--role-accent', colors.accent);
    }

    animateThemeTransition() {
        const root = document.documentElement;
        root.style.transition = 'all 0.3s ease-in-out';
        setTimeout(() => { root.style.transition = ''; }, 300);
    }

    getCurrentTheme() { return this.currentTheme; }
    getCurrentRole() { return this.currentRole; }

    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.currentTheme = theme;
            this.applyTheme();
            this.saveThemeToStorage();
        }
    }

    setRole(role) {
        if (['admin', 'professor', 'student'].includes(role)) {
            this.setRoleTheme(role);
        }
    }

    forceRerender() {
        const event = new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme, role: this.currentRole }
        });
        document.dispatchEvent(event);

        if (typeof Chart !== 'undefined' && typeof Chart.instances === 'object') {
            Object.values(Chart.instances).forEach(chart => {
                if (chart && typeof chart.update === 'function') chart.update();
            });
        }
    }
}

// Instance globale
const themeManager = new ThemeManager();

function toggleTheme() {
    themeManager.toggleTheme();
}

function setTheme(theme) {
    themeManager.setTheme(theme);
}
