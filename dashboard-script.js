// Dashboard Script

// Initialisation du graphique en barres
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    initializeCalendar();
    loadSuggestions(); // Charger les suggestions depuis le stockage
});

// Graphique des cours par jour
function initializeCharts() {
    const ctx = document.getElementById('coursesChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
            datasets: [{
                label: 'Nombre de cours',
                data: [25, 18, 22, 20, 15],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(102, 126, 234, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(102, 126, 234, 1)'
                ],
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Calendrier
let currentDate = new Date();

function initializeCalendar() {
    updateCalendar();
}

function updateCalendar() {
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    // Noms des jours
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    calendarGrid.innerHTML = '';

    // En-têtes des jours
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day';
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.background = '#e9ecef';
        calendarGrid.appendChild(dayHeader);
    });

    // Premier jour du mois
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Générer les jours du calendrier
    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        
        dayElement.textContent = dayDate.getDate();
        
        // Marquer le jour actuel
        const today = new Date();
        if (dayDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Marquer les jours avec des cours (simulation)
        const hasCourses = Math.random() > 0.7;
        if (hasCourses && dayDate.getMonth() === currentDate.getMonth()) {
            dayElement.classList.add('has-courses');
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
}

// Actions rapides
function generateReport() {
    alert('Génération du rapport en cours...\n\nLe rapport sera disponible dans quelques instants.');
}

function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        window.location.href = 'login.html';
    }
}

// Animation des widgets
document.addEventListener('DOMContentLoaded', function() {
    const widgets = document.querySelectorAll('.widget');
    
    widgets.forEach((widget, index) => {
        widget.style.opacity = '0';
        widget.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            widget.style.transition = 'all 0.5s ease';
            widget.style.opacity = '1';
            widget.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Mise à jour en temps réel des métriques (simulation)
function updateMetrics() {
    const metrics = document.querySelectorAll('.metric-value');
    
    metrics.forEach(metric => {
        const currentValue = parseInt(metric.textContent);
        const change = Math.floor(Math.random() * 5) - 2; // -2 à +2
        const newValue = Math.max(0, currentValue + change);
        
        if (newValue !== currentValue) {
            metric.textContent = newValue;
            metric.style.color = change > 0 ? '#28a745' : change < 0 ? '#dc3545' : '#667eea';
            
            setTimeout(() => {
                metric.style.color = '#667eea';
            }, 1000);
        }
    });
}

// Mise à jour périodique des métriques
setInterval(updateMetrics, 30000); // Toutes les 30 secondes

// Gestion des suggestions de cours
let suggestions = [];

// Charger les suggestions depuis le stockage
function loadSuggestions() {
    try {
        const storedSuggestions = JSON.parse(localStorage.getItem('allSuggestions') || '[]');
        suggestions = storedSuggestions;
        console.log('📋 Suggestions chargées:', suggestions);
        updateSuggestionsDisplay();
    } catch (error) {
        console.error('❌ Erreur lors du chargement des suggestions:', error);
        // Suggestions par défaut en cas d'erreur
        suggestions = [
            {
                id: 1,
                name: 'Mathématiques Avancées',
                professor: 'Dr. Martin',
                code: 'MATH-301',
                status: 'pending',
                date: '15 Janvier 2024'
            },
            {
                id: 2,
                name: 'Physique Quantique',
                professor: 'Dr. Dubois',
                code: 'PHYS-401',
                status: 'pending',
                date: '12 Janvier 2024'
            },
            {
                id: 3,
                name: 'Algorithmes Avancés',
                professor: 'Dr. Leroy',
                code: 'INFO-302',
                status: 'pending',
                date: '10 Janvier 2024'
            }
        ];
    }
}

// Mettre à jour l'affichage des suggestions
function updateSuggestionsDisplay() {
    const suggestionsList = document.querySelector('.suggestions-list');
    if (!suggestionsList) return;

    // Filtrer les suggestions en attente
    const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
    
    if (pendingSuggestions.length === 0) {
        suggestionsList.innerHTML = `
            <div class="no-suggestions">
                <p>🎉 Aucune suggestion en attente !</p>
                <p>Toutes les suggestions ont été traitées.</p>
            </div>
        `;
        return;
    }

    // Générer le HTML pour chaque suggestion
    suggestionsList.innerHTML = pendingSuggestions.map(suggestion => `
        <div class="suggestion-card pending">
            <div class="suggestion-header">
                <h4>${suggestion.name}</h4>
                <span class="suggestion-status pending">En attente</span>
            </div>
            <div class="suggestion-details">
                <p><strong>Professeur:</strong> ${suggestion.professor || 'Non spécifié'}</p>
                <p><strong>Code:</strong> ${suggestion.code}</p>
                <p><strong>Planning proposé:</strong> ${suggestion.day} ${suggestion.time} (${suggestion.duration}h, ${suggestion.frequency})</p>
                <p><strong>Salle:</strong> ${suggestion.roomType}, ${suggestion.capacity} places</p>
                <p><strong>Date de suggestion:</strong> ${suggestion.date}</p>
            </div>
            <div class="suggestion-justification">
                <p><strong>Justification:</strong> ${suggestion.justification}</p>
            </div>
            <div class="suggestion-actions">
                <button class="btn-success" onclick="approveSuggestion(${suggestion.id})">
                    <span class="btn-icon">✅</span>
                    Approuver
                </button>
                <button class="btn-danger" onclick="rejectSuggestion(${suggestion.id})">
                    <span class="btn-icon">❌</span>
                    Rejeter
                </button>
                <button class="btn-secondary" onclick="viewSuggestionDetails(${suggestion.id})">
                    <span class="btn-icon">👁️</span>
                    Voir détails
                </button>
            </div>
        </div>
    `).join('');
}

// Approuver une suggestion
function approveSuggestion(id) {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) return;

    if (confirm(`Êtes-vous sûr de vouloir approuver la suggestion "${suggestion.name}" ?\n\nCette action ajoutera le cours au planning.`)) {
        // Simulation de l'approbation
        const loadingBtn = event.target;
        const originalText = loadingBtn.textContent;
        loadingBtn.textContent = 'Approbation...';
        loadingBtn.disabled = true;

        setTimeout(() => {
            suggestion.status = 'approved';
            suggestion.approvedDate = new Date().toISOString();
            suggestion.approvedBy = 'Admin';
            
            // Sauvegarder les changements
            saveSuggestionsToStorage();
            updateSuggestionCard(id);
            updateStats();
            
            // Restaurer le bouton
            loadingBtn.textContent = originalText;
            loadingBtn.disabled = false;
            
            alert(`✅ Suggestion "${suggestion.name}" approuvée avec succès !\n\nLe cours a été ajouté au planning et le professeur a été notifié.`);
        }, 1500);
    }
}

// Rejeter une suggestion
function rejectSuggestion(id) {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) return;

    const reason = prompt(`Pourquoi rejetez-vous la suggestion "${suggestion.name}" ?\n\nVeuillez indiquer la raison du rejet :`);
    
    if (reason && reason.trim() !== '') {
        // Simulation du rejet
        const loadingBtn = event.target;
        const originalText = loadingBtn.textContent;
        loadingBtn.textContent = 'Rejet...';
        loadingBtn.disabled = true;

        setTimeout(() => {
            suggestion.status = 'rejected';
            suggestion.rejectionReason = reason;
            suggestion.rejectedDate = new Date().toISOString();
            suggestion.rejectedBy = 'Admin';
            
            // Sauvegarder les changements
            saveSuggestionsToStorage();
            updateSuggestionCard(id);
            updateStats();
            
            // Restaurer le bouton
            loadingBtn.textContent = originalText;
            loadingBtn.disabled = false;
            
            alert(`❌ Suggestion "${suggestion.name}" rejetée.\n\nRaison : ${reason}\n\nLe professeur a été notifié du rejet.`);
        }, 1500);
    }
}

// Voir les détails d'une suggestion
function viewSuggestionDetails(id) {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) return;

    let details = `📋 Détails de la suggestion :\n\n`;
    details += `Nom : ${suggestion.name}\n`;
    details += `Professeur : ${suggestion.professor}\n`;
    details += `Code : ${suggestion.code}\n`;
    details += `Statut : ${getStatusText(suggestion.status)}\n`;
    details += `Date : ${suggestion.date}\n\n`;
    
    if (suggestion.rejectionReason) {
        details += `Raison du rejet : ${suggestion.rejectionReason}\n\n`;
    }
    
    details += `Cette fonctionnalité sera étendue pour afficher tous les détails complets de la suggestion.`;

    alert(details);
}

// Mettre à jour l'affichage d'une carte de suggestion
function updateSuggestionCard(id) {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) return;

    const card = document.querySelector(`[onclick*="approveSuggestion(${id})"]`).closest('.suggestion-card');
    if (!card) return;

    // Mettre à jour le statut
    const statusElement = card.querySelector('.suggestion-status');
    if (statusElement) {
        statusElement.textContent = getStatusText(suggestion.status);
        statusElement.className = `suggestion-status ${suggestion.status}`;
    }

    // Mettre à jour la classe de la carte
    card.className = `suggestion-card ${suggestion.status}`;

    // Mettre à jour les boutons
    const actionsDiv = card.querySelector('.suggestion-actions');
    if (actionsDiv) {
        if (suggestion.status === 'approved') {
            actionsDiv.innerHTML = `
                <button class="btn-success" disabled>
                    <span class="btn-icon">✅</span>
                    Approuvé
                </button>
                <button class="btn-secondary" onclick="viewSuggestionDetails(${id})">
                    <span class="btn-icon">👁️</span>
                    Voir détails
                </button>
            `;
        } else if (suggestion.status === 'rejected') {
            actionsDiv.innerHTML = `
                <button class="btn-danger" disabled>
                    <span class="btn-icon">❌</span>
                    Rejeté
                </button>
                <button class="btn-secondary" onclick="viewSuggestionDetails(${id})">
                    <span class="btn-icon">👁️</span>
                    Voir détails
                </button>
            `;
        }
    }
}

// Mettre à jour les statistiques
function updateStats() {
    const pendingCount = suggestions.filter(s => s.status === 'pending').length;
    const approvedCount = suggestions.filter(s => s.status === 'approved').length;
    const rejectedCount = suggestions.filter(s => s.status === 'rejected').length;

    const pendingBadge = document.querySelector('.stat-badge.pending');
    const approvedBadge = document.querySelector('.stat-badge.approved');
    const rejectedBadge = document.querySelector('.stat-badge.rejected');

    if (pendingBadge) pendingBadge.textContent = `${pendingCount} en attente`;
    if (approvedBadge) approvedBadge.textContent = `${approvedCount} approuvées`;
    if (rejectedBadge) rejectedBadge.textContent = `${rejectedCount} rejetées`;
}

// Obtenir le texte du statut
function getStatusText(status) {
    switch(status) {
        case 'pending': return 'En attente';
        case 'approved': return 'Approuvé';
        case 'rejected': return 'Rejeté';
        default: return 'Inconnu';
    }
}

// Sauvegarder les suggestions dans le stockage
function saveSuggestionsToStorage() {
    try {
        localStorage.setItem('allSuggestions', JSON.stringify(suggestions));
        console.log('💾 Suggestions sauvegardées:', suggestions.length);
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
}

// Animation d'entrée pour les suggestions
document.addEventListener('DOMContentLoaded', function() {
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    
    suggestionCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 1000 + (index * 200)); // Délai après les autres éléments
    });
});
