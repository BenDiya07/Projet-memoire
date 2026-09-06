/**
 * Configuration globale de l'application
 */
const CONFIG = {
    // URL de l'API Backend (Flask tourne sur le port 5001 pour éviter le conflit avec Live Server 5500)
    API_BASE_URL: 'http://localhost:5001/api',
    
    // Version de l'application
    VERSION: '1.0.0'
};

// Empêcher la modification de la configuration
Object.freeze(CONFIG);
