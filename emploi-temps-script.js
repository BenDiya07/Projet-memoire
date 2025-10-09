// Emploi du temps Script

let currentView = 'weekly';
let currentDate = new Date();

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeSchedule();
    setupEventListeners();
});

// Configuration des événements
function setupEventListeners() {
    // Filtres
    const filters = ['professorFilter', 'roomFilter', 'subjectFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
}

// Initialisation du planning
function initializeSchedule() {
    updateCurrentPeriod();
    generateScheduleData();
}

// Changer de vue
function switchView(view) {
    currentView = view;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Afficher la vue correspondante
    document.querySelectorAll('.schedule-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(view + 'View').classList.add('active');
    
    // Mettre à jour le contenu selon la vue
    updateViewContent();
}

// Mettre à jour le contenu selon la vue
function updateViewContent() {
    switch(currentView) {
        case 'weekly':
            updateWeeklyView();
            break;
        case 'daily':
            updateDailyView();
            break;
        case 'room':
            updateRoomView();
            break;
        case 'professor':
            updateProfessorView();
            break;
    }
}

// Vue hebdomadaire
function updateWeeklyView() {
    // Le contenu est déjà dans le HTML, on peut ajouter des interactions
    const courseSlots = document.querySelectorAll('.course-slot');
    courseSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            const courseTitle = this.querySelector('.course-title').textContent;
            alert(`Détails du cours : ${courseTitle}\n\nCliquez sur "Modifier" dans la page Gestion pour plus d'options.`);
        });
    });
}

// Vue journalière
function updateDailyView() {
    const dailyDate = document.getElementById('dailyDate');
    if (dailyDate) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dailyDate.textContent = currentDate.toLocaleDateString('fr-FR', options);
    }
}

// Vue par salle
function updateRoomView() {
    // Le contenu est déjà dans le HTML
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        card.addEventListener('click', function() {
            const roomName = this.querySelector('h4').textContent;
            alert(`Détails de la salle : ${roomName}\n\nCliquez sur "Gestion" pour modifier les informations de la salle.`);
        });
    });
}

// Vue par professeur
function updateProfessorView() {
    // Le contenu est déjà dans le HTML
    const professorCards = document.querySelectorAll('.professor-card');
    professorCards.forEach(card => {
        card.addEventListener('click', function() {
            const professorName = this.querySelector('h4').textContent;
            alert(`Détails du professeur : ${professorName}\n\nCliquez sur "Gestion" pour modifier les informations du professeur.`);
        });
    });
}

// Navigation temporelle
function previousPeriod() {
    if (currentView === 'weekly') {
        currentDate.setDate(currentDate.getDate() - 7);
    } else if (currentView === 'daily') {
        currentDate.setDate(currentDate.getDate() - 1);
    }
    updateCurrentPeriod();
    updateViewContent();
}

function nextPeriod() {
    if (currentView === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
    } else if (currentView === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
    }
    updateCurrentPeriod();
    updateViewContent();
}

function goToToday() {
    currentDate = new Date();
    updateCurrentPeriod();
    updateViewContent();
}

// Mettre à jour la période affichée
function updateCurrentPeriod() {
    const currentPeriodElement = document.getElementById('currentPeriod');
    if (!currentPeriodElement) return;

    if (currentView === 'weekly') {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        currentPeriodElement.textContent = `Semaine du ${startOfWeek.toLocaleDateString('fr-FR', options)}`;
    } else if (currentView === 'daily') {
        const options = { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        };
        currentPeriodElement.textContent = currentDate.toLocaleDateString('fr-FR', options);
    }
}

// Générer des données de planning (simulation)
function generateScheduleData() {
    // Cette fonction pourrait générer des données dynamiques
    // Pour l'instant, on utilise les données statiques du HTML
}

// Appliquer les filtres
function applyFilters() {
    const professorFilter = document.getElementById('professorFilter').value;
    const roomFilter = document.getElementById('roomFilter').value;
    const subjectFilter = document.getElementById('subjectFilter').value;

    // Filtrer les éléments selon les critères
    const courseSlots = document.querySelectorAll('.course-slot');
    courseSlots.forEach(slot => {
        let show = true;
        
        if (professorFilter) {
            const professor = slot.querySelector('.course-details').textContent;
            if (!professor.includes(professorFilter)) {
                show = false;
            }
        }
        
        if (roomFilter && show) {
            const room = slot.querySelector('.course-details').textContent;
            if (!room.includes(roomFilter)) {
                show = false;
            }
        }
        
        if (subjectFilter && show) {
            const subject = slot.querySelector('.course-title').textContent.toLowerCase();
            if (!subject.includes(subjectFilter.toLowerCase())) {
                show = false;
            }
        }
        
        slot.style.display = show ? 'block' : 'none';
    });

    alert(' Filtres appliqués !');
}

// Actions d'impression et d'export
function printSchedule() {
    window.print();
}

function exportSchedule() {
    alert(' Export en PDF en cours...\n\nLe fichier sera téléchargé dans quelques instants.');
    
    // Simulation d'export
    setTimeout(() => {
        alert(' Export terminé ! Le fichier PDF a été téléchargé.');
    }, 2000);
}

function shareSchedule() {
    const shareData = {
        title: 'Emploi du temps - Université',
        text: 'Consultez l\'emploi du temps de l\'université',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData);
    } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API Share
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert(' Lien copié dans le presse-papiers !');
        }).catch(() => {
            alert(' Impossible de copier le lien. Veuillez le copier manuellement :\n' + url);
        });
    }
}

// La fonction logout est maintenant gérée par auth.js

// La gestion des accès est maintenant centralisée dans auth.js

// Animation d'entrée
document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.schedule-view, .view-controls, .schedule-filters');
    
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Gestion des conflits visuels
function highlightConflicts() {
    const conflictElements = document.querySelectorAll('.conflict, .conflict-indicator');
    conflictElements.forEach(element => {
        element.style.animation = 'pulse 2s infinite';
    });
}

// CSS pour l'animation de pulsation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Démarrer l'animation des conflits
setTimeout(highlightConflicts, 1000);

// Mise à jour automatique de l'heure
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR');
    
    // Mettre à jour l'heure dans l'interface si nécessaire
    const timeElements = document.querySelectorAll('.current-time');
    timeElements.forEach(element => {
        element.textContent = timeString;
    });
}

// Mettre à jour l'heure toutes les minutes
setInterval(updateTime, 60000);
updateTime(); // Mise à jour immédiate
