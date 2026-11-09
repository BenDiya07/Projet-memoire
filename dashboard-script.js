// Dashboard Script - Integration API

document.addEventListener('DOMContentLoaded', function () {
    initializeCharts();
    initializeCalendar();
    if (typeof authManager !== 'undefined') {
        loadSuggestions();
        fetchDashboardStats();
    }
});

// ============================================
// CHARTS
// ============================================

let coursesChart = null;
let dashboardStats = null;

function initializeCharts() {
    const ctx = document.getElementById('coursesChart');
    if (!ctx) return;
    if (typeof Chart === 'undefined') {
        ctx.parentElement.textContent = 'Le graphique est indisponible. Vérifiez votre connexion Internet.';
        return;
    }

    coursesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
            datasets: [{
                label: 'Nombre de cours',
                data: [0, 0, 0, 0, 0],
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
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
                x: { grid: { display: false } }
            }
        }
    });

    // Charger les stats du graphique depuis l'API
    fetchScheduleStats();
}

async function fetchScheduleStats() {
    try {
        const response = await authManager.fetchWithAuth('/stats/schedule');
        if (!response) return;
        const data = await response.json();
        if (data.success && coursesChart) {
            coursesChart.data.datasets[0].data = data.schedule_stats.counts;
            coursesChart.update();
        }
    } catch (error) {
        console.error('Erreur stats emploi du temps:', error);
    }
}

// ============================================
// STATISTIQUES DASHBOARD
// ============================================

async function fetchDashboardStats() {
    try {
        const response = await authManager.fetchWithAuth('/stats');
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            updateDashboardWidgets(data.stats);
        }
    } catch (error) {
        console.error('Erreur stats dashboard:', error);
    }

    try {
        const response = await authManager.fetchWithAuth('/stats/room-occupation');
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            updateRoomOccupation(data.room_occupation);
        }
    } catch (error) {
        console.error('Erreur occupation salles:', error);
    }
}

function updateDashboardWidgets(stats) {
    dashboardStats = stats;
    const widgetValues = document.querySelectorAll('.metric-value');
    const values = [
        stats.total_courses || 0,
        stats.total_conflicts || 0,
        stats.pending_suggestions || 0,
        stats.total_students || 0
    ];
    widgetValues.forEach((el, i) => {
        if (values[i] !== undefined) el.textContent = values[i];
    });
    const conflictLabel = document.querySelector('.metric-change');
    if (conflictLabel) {
        const hasConflicts = (stats.total_conflicts || 0) > 0;
        conflictLabel.textContent = hasConflicts ? 'Nécessite votre attention' : 'Aucun conflit détecté';
        conflictLabel.classList.toggle('negative', hasConflicts);
    }

    // Mettre a jour les badges de suggestions
    const pendingBadge = document.querySelector('.stat-badge.pending');
    const approvedBadge = document.querySelector('.stat-badge.approved');
    const rejectedBadge = document.querySelector('.stat-badge.rejected');
    if (pendingBadge) pendingBadge.textContent = `${stats.pending_suggestions || 0} en attente`;
    if (approvedBadge) approvedBadge.textContent = `${stats.approved_suggestions || 0} approuvees`;
    if (rejectedBadge) rejectedBadge.textContent = `${stats.rejected_suggestions || 0} rejetees`;
}

function updateRoomOccupation(data) {
    const gaugeText = document.querySelector('.gauge-text');
    const gaugeFill = document.querySelector('.gauge-fill');
    if (gaugeText) gaugeText.textContent = `${data.rate}%`;
    if (gaugeFill) gaugeFill.style.setProperty('--percentage', `${data.rate}%`);
}

// ============================================
// CALENDRIER
// ============================================

let calendarDate = new Date();

function initializeCalendar() {
    updateCalendar();
}

function updateCalendar() {
    const monthNames = [
        'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
    ];
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
    }
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    calendarGrid.innerHTML = '';
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day calendar-weekday';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        dayElement.textContent = dayDate.getDate();
        if (dayDate.getMonth() !== calendarDate.getMonth()) dayElement.classList.add('other-month');
        const today = new Date();
        if (dayDate.toDateString() === today.toDateString()) dayElement.classList.add('today');
        calendarGrid.appendChild(dayElement);
    }
}

function previousMonth() {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    updateCalendar();
}

function nextMonth() {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    updateCalendar();
}

// ============================================
// ACTIONS RAPIDES
// ============================================

function generateReport() {
    if (!dashboardStats) {
        showNotification('Les statistiques ne sont pas encore disponibles.', 'error');
        return;
    }
    const rows = [
        ['Indicateur', 'Valeur'],
        ['Cours', dashboardStats.total_courses || 0],
        ['Conflits non résolus', dashboardStats.total_conflicts || 0],
        ['Suggestions en attente', dashboardStats.pending_suggestions || 0],
        ['Suggestions approuvées', dashboardStats.approved_suggestions || 0],
        ['Suggestions rejetées', dashboardStats.rejected_suggestions || 0],
        ['Étudiants inscrits', dashboardStats.total_students || 0]
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-cours-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// ============================================
// GESTION DES SUGGESTIONS
// ============================================

let suggestions = [];

async function loadSuggestions() {
    try {
        const response = await authManager.fetchWithAuth('/suggestions');
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            suggestions = data.suggestions;
            updateSuggestionsDisplay();
        }
    } catch (error) {
        console.error('Erreur chargement suggestions:', error);
    }
}

function updateSuggestionsDisplay() {
    const suggestionsList = document.querySelector('.suggestions-list');
    if (!suggestionsList) return;

    const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
    if (pendingSuggestions.length === 0) {
        suggestionsList.innerHTML = `
            <div class="no-suggestions">
                <p>Aucune suggestion en attente !</p>
                <p>Toutes les suggestions ont ete traitees.</p>
            </div>
        `;
        return;
    }

    suggestionsList.innerHTML = pendingSuggestions.map(s => `
        <div class="suggestion-card pending">
            <div class="suggestion-header">
                <h4>${s.course_name || s.name || 'Nouveau Cours'}</h4>
                <span class="suggestion-status pending">En attente</span>
            </div>
            <div class="suggestion-details">
                <p><strong>Professeur:</strong> ${s.professor || 'Non specifie'}</p>
                <p><strong>Code:</strong> ${s.course_code || s.code || 'N/A'}</p>
                <p><strong>Planning propose:</strong> ${s.preferred_day || s.day || 'N/A'} ${s.preferred_time || s.time || 'N/A'} (${s.duration_hours || s.duration || 'N/A'}h, ${s.frequency || 'N/A'})</p>
                <p><strong>Salle:</strong> ${s.room_type || 'N/A'}, ${s.required_capacity || s.capacity || 'N/A'} places</p>
                <p><strong>Date:</strong> ${s.date || (s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : 'N/A')}</p>
            </div>
            <div class="suggestion-justification">
                <p><strong>Justification:</strong> ${s.justification || 'Non specifiee'}</p>
            </div>
            <div class="suggestion-actions">
                <button class="btn-success" onclick="approveSuggestion(${s.id})">Approuver</button>
                <button class="btn-danger" onclick="rejectSuggestion(${s.id})">Rejeter</button>
                <button class="btn-secondary" onclick="viewSuggestionDetails(${s.id})">Voir details</button>
            </div>
        </div>
    `).join('');
}

async function approveSuggestion(id) {
    if (!confirm('Approuver cette suggestion ?')) return;
    try {
        const response = await authManager.fetchWithAuth(`/suggestions/${id}/approve`, { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            await loadSuggestions();
            showNotification('Suggestion approuvee avec succes', 'success');
        } else {
            showNotification('Erreur: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Erreur approbation:', error);
        showNotification('Une erreur est survenue', 'error');
    }
}

async function rejectSuggestion(id) {
    const reason = prompt('Raison du rejet :');
    if (reason === null) return;
    if (!reason.trim()) {
        alert('Une raison est obligatoire.');
        return;
    }
    try {
        const response = await authManager.fetchWithAuth(`/suggestions/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        const data = await response.json();
        if (data.success) {
            await loadSuggestions();
            showNotification('Suggestion rejetee', 'info');
        } else {
            showNotification('Erreur: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Erreur rejet:', error);
        showNotification('Une erreur est survenue', 'error');
    }
}

function viewSuggestionDetails(id) {
    const s = suggestions.find(s => s.id === id);
    if (!s) return;
    let details = `Details de la suggestion :\n\n`;
    details += `Nom : ${s.course_name || s.name}\n`;
    details += `Professeur : ${s.professor || 'N/A'}\n`;
    details += `Code : ${s.course_code || s.code || 'N/A'}\n`;
    details += `Statut : ${getStatusText(s.status)}\n`;
    details += `Date : ${s.date || (s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : 'N/A')}\n`;
    if (s.rejection_reason) details += `\nRaison du rejet : ${s.rejection_reason}\n`;
    alert(details);
}

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:10px 20px;color:white;border-radius:5px;z-index:1000;';
    toast.style.background = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function getStatusText(status) {
    const texts = { pending: 'En attente', approved: 'Approuve', rejected: 'Rejete' };
    return texts[status] || 'Inconnu';
}

// Animation widgets
document.addEventListener('DOMContentLoaded', function () {
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
