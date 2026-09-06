// Suggestion de cours Script - Integration API

let suggestions = [];

// Initialisation
document.addEventListener('DOMContentLoaded', async function () {
    if (typeof authManager !== 'undefined') {
        const userRole = localStorage.getItem('userRole');
        document.documentElement.className = `role-${userRole}`;
        setupEventListeners();
        updatePreview();
        await loadInitialData();
        checkDraft();
    }
});

async function loadInitialData() {
    try {
        await loadSuggestions();
    } catch (error) {
        console.error('Erreur initialisation:', error);
    }
}

function setupEventListeners() {
    const form = document.getElementById('suggestionForm');
    if (form) form.addEventListener('submit', handleSubmit);

    const inputs = document.querySelectorAll('#suggestionForm input, #suggestionForm select, #suggestionForm textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });
}

// ============================================
// API DATA LOADING
// ============================================

async function loadSuggestions() {
    try {
        const response = await authManager.fetchWithAuth('/suggestions');
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            suggestions = data.suggestions;
            updateHistory();
        }
    } catch (error) {
        console.error('Erreur chargement suggestions:', error);
    }
}

// ============================================
// FORM HANDLING
// ============================================

async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const equipment = Array.from(
        e.target.querySelectorAll('input[name="equipment"]:checked')
    ).map(checkbox => checkbox.value);
    const suggestionData = {
        course_name: formData.get('course_name') || 'Nouveau Cours',
        course_code: formData.get('course_code') || 'SUG-' + Date.now().toString().slice(-4),
        preferred_day: formData.get('preferredDay'),
        preferred_time: formData.get('preferredTime'),
        duration: parseFloat(formData.get('duration')),
        frequency: formData.get('frequency'),
        room_type: formData.get('roomType'),
        capacity: parseInt(formData.get('capacity')),
        justification: formData.get('justification'),
        target_audience: formData.get('targetAudience'),
        equipment
    };

    if (!validateForm(suggestionData)) return;

    const loadingBtn = e.target.querySelector('button[type="submit"]');
    const originalText = loadingBtn.textContent;
    loadingBtn.textContent = 'Envoi en cours...';
    loadingBtn.disabled = true;

    try {
        const res = await authManager.fetchWithAuth('/suggestions', {
            method: 'POST',
            body: JSON.stringify(suggestionData)
        });
        const result = await res.json();
        if (result.success) {
            alert('Suggestion envoyee avec succes !');
            e.target.reset();
            localStorage.removeItem('suggestionDraft');
            updatePreview();
            await loadSuggestions();
        } else {
            alert('Erreur: ' + result.message);
        }
    } catch (error) {
        console.error('Erreur soumission:', error);
        alert('Erreur reseau. Veuillez reessayer.');
    } finally {
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
    }
}

function validateForm(data) {
    const required = ['preferred_day', 'preferred_time', 'duration', 'frequency', 'room_type', 'justification'];
    for (let field of required) {
        if (!data[field]) {
            alert(`Le champ "${getFieldLabel(field)}" est obligatoire.`);
            return false;
        }
    }
    return true;
}

function getFieldLabel(field) {
    const labels = {
        preferred_day: 'Jour prefere',
        preferred_time: 'Heure preferee',
        duration: 'Duree',
        frequency: 'Frequence',
        room_type: 'Type de salle',
        justification: 'Justification'
    };
    return labels[field] || field;
}

// ============================================
// HISTORY & UI
// ============================================

function updateHistory() {
    const container = document.querySelector('.history-content');
    if (!container) return;
    container.innerHTML = '';

    if (suggestions.length === 0) {
        container.innerHTML = '<div class="no-data">Aucune suggestion trouvee.</div>';
        return;
    }

    suggestions.forEach(s => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
            <div class="suggestion-info">
                <h4>${s.course_name || 'Nouveau Cours'}</h4>
                <p><strong>Statut:</strong> <span class="status ${s.status}">${getStatusText(s.status)}</span></p>
                <p><strong>Date:</strong> ${new Date(s.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div class="suggestion-actions">
                <button class="btn-icon-small" onclick="viewSuggestion(${s.id})" title="Voir">Details</button>
                ${s.status === 'pending' ? `<button class="btn-icon-small" onclick="editSuggestion(${s.id})" title="Modifier">Editer</button>` : ''}
            </div>
        `;
        container.appendChild(item);
    });
}

function refreshHistory() {
    loadSuggestions();
}

function getStatusText(status) {
    const texts = { pending: 'En attente', approved: 'Approuve', rejected: 'Rejete' };
    return texts[status] || 'Inconnu';
}

async function viewSuggestion(id) {
    try {
        const res = await authManager.fetchWithAuth(`/suggestions/${id}`);
        const data = await res.json();
        if (data.success) {
            const s = data.suggestion;
            let details = `Details de la suggestion :\n\n`;
            details += `Cours: ${s.course_name}\n`;
            details += `Statut: ${getStatusText(s.status)}\n`;
            details += `Jour: ${s.preferred_day}\n`;
            details += `Heure: ${s.preferred_time}\n`;
            details += `Duree: ${s.duration_hours}h\n`;
            details += `Salle: ${s.room_type} (Capacite: ${s.required_capacity})\n`;
            details += `Justification: ${s.justification}`;
            if (s.rejection_reason) details += `\n\nRaison du rejet: ${s.rejection_reason}`;
            alert(details);
        }
    } catch (e) {
        console.error(e);
    }
}

function editSuggestion(id) {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) {
        alert('Suggestion introuvable.');
        return;
    }
    if (suggestion.status !== 'pending') {
        alert('Seules les suggestions en attente peuvent etre modifiees.');
        return;
    }

    const form = document.getElementById('suggestionForm');
    if (!form) return;

    const setVal = (fieldId, value) => {
        const el = document.getElementById(fieldId);
        if (el && value) el.value = value;
    };

    setVal('preferredDay', suggestion.preferred_day);
    setVal('preferredTime', suggestion.preferred_time);
    setVal('duration', suggestion.duration_hours);
    setVal('frequency', suggestion.frequency);
    setVal('roomType', suggestion.room_type);
    setVal('capacity', suggestion.required_capacity);
    setVal('justification', suggestion.justification);
    setVal('targetAudience', suggestion.target_audience);

    updatePreview();
    form.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// PREVIEW & DRAFTS
// ============================================

function updatePreview() {
    const previewContent = document.getElementById('previewContent');
    const form = document.getElementById('suggestionForm');
    if (!previewContent || !form) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const hasData = Object.values(data).some(v => v && v.trim() !== '');
    if (!hasData) {
        previewContent.innerHTML = '<p class="preview-placeholder">Remplissez le formulaire pour voir l\'apercu...</p>';
        return;
    }

    previewContent.innerHTML = `
        <div class="preview-suggestion">
            <p><strong>Planning propose:</strong></p>
            <ul>
                ${data.preferredDay ? `<li>Jour: ${data.preferredDay}</li>` : ''}
                ${data.preferredTime ? `<li>Heure: ${data.preferredTime}</li>` : ''}
                ${data.duration ? `<li>Duree: ${data.duration}h</li>` : ''}
                ${data.frequency ? `<li>Frequence: ${data.frequency}</li>` : ''}
            </ul>
            <p><strong>Salle:</strong> ${data.roomType || 'N/A'} (Capacite: ${data.capacity || 'N/A'} etudiants)</p>
            <p><strong>Cible:</strong> ${data.targetAudience || 'N/A'}</p>
        </div>
    `;
}

function saveDraft() {
    const form = document.getElementById('suggestionForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    localStorage.setItem('suggestionDraft', JSON.stringify(data));
    alert('Brouillon sauvegarde !');
}

function loadDraft() {
    const draft = localStorage.getItem('suggestionDraft');
    if (draft) {
        const data = JSON.parse(draft);
        Object.keys(data).forEach(key => {
            const el = document.getElementById(key);
            if (el) el.value = data[key];
        });
        updatePreview();
    }
}

function checkDraft() {
    if (localStorage.getItem('suggestionDraft')) {
        if (confirm('Un brouillon a ete trouve. Voulez-vous le charger ?')) {
            loadDraft();
        }
    }
}

function resetForm() {
    if (confirm('Effacer le formulaire ?')) {
        document.getElementById('suggestionForm').reset();
        updatePreview();
    }
}

function setupAnimations() {
    const elements = document.querySelectorAll('.suggestion-form, .suggestion-preview, .suggestions-history');
    elements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.5s ease';
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, i * 100);
    });
}
