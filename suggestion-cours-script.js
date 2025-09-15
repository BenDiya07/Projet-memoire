// Suggestion de cours Script

// Données simulées pour l'historique
let suggestions = [
    {
        id: 1,
        name: 'Mathématiques Avancées',
        code: 'MATH-301',
        status: 'pending',
        date: '15 Janvier 2024'
    },
    {
        id: 2,
        name: 'Physique Quantique',
        code: 'PHYS-401',
        status: 'approved',
        date: '10 Janvier 2024'
    },
    {
        id: 3,
        name: 'Algorithmes Avancés',
        code: 'INFO-302',
        status: 'rejected',
        date: '5 Janvier 2024'
    }
];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updatePreview();
});

// Configuration des événements
function setupEventListeners() {
    const form = document.getElementById('suggestionForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Mise à jour de l'aperçu en temps réel
    const inputs = document.querySelectorAll('#suggestionForm input, #suggestionForm select, #suggestionForm textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });
}

// Gestion de la soumission du formulaire
function handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const suggestionData = {
        courseName: formData.get('courseName'),
        courseCode: formData.get('courseCode'),
        courseDescription: formData.get('courseDescription'),
        preferredDay: formData.get('preferredDay'),
        preferredTime: formData.get('preferredTime'),
        duration: formData.get('duration'),
        frequency: formData.get('frequency'),
        roomType: formData.get('roomType'),
        capacity: formData.get('capacity'),
        equipment: formData.getAll('equipment'),
        justification: formData.get('justification'),
        targetAudience: formData.get('targetAudience')
    };

    // Debug: Afficher les données récupérées
    console.log('Données du formulaire:', suggestionData);
    
    // Validation
    if (!validateForm(suggestionData)) {
        return;
    }

    // Simulation de l'envoi
    const loadingBtn = e.target.querySelector('button[type="submit"]');
    const originalText = loadingBtn.textContent;
    loadingBtn.textContent = 'Envoi en cours...';
    loadingBtn.disabled = true;

    setTimeout(() => {
        // Créer la nouvelle suggestion avec tous les détails
        const newSuggestion = {
            id: Date.now(), // ID unique basé sur le timestamp
            name: suggestionData.courseName,
            code: suggestionData.courseCode,
            description: suggestionData.courseDescription,
            professor: 'Dr. Martin', // Simulé - en réalité viendrait de la session
            day: suggestionData.preferredDay,
            time: suggestionData.preferredTime,
            duration: suggestionData.duration,
            frequency: suggestionData.frequency,
            roomType: suggestionData.roomType,
            capacity: suggestionData.capacity,
            equipment: suggestionData.equipment,
            justification: suggestionData.justification,
            targetAudience: suggestionData.targetAudience,
            status: 'pending',
            date: new Date().toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            timestamp: new Date().toISOString()
        };
        
        // Sauvegarder dans localStorage (simulation d'envoi vers serveur)
        saveSuggestionToServer(newSuggestion);
        
        // Ajouter à l'historique local
        suggestions.unshift(newSuggestion);
        updateHistory();
        
        // Réinitialiser le formulaire
        e.target.reset();
        updatePreview();
        
        // Restaurer le bouton
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
        
        // Message de succès avec détails
        alert(`✅ Suggestion envoyée avec succès !\n\n📋 Détails :\n• Nom: ${newSuggestion.name}\n• Code: ${newSuggestion.code}\n• ID: ${newSuggestion.id}\n\nVotre demande sera examinée par l'administration et vous recevrez une réponse dans les plus brefs délais.`);
        
    }, 2000);
}

// Validation du formulaire
function validateForm(data) {
    console.log('Validation des données:', data);
    
    const requiredFields = ['courseName', 'courseCode', 'preferredDay', 'preferredTime', 'duration', 'frequency', 'roomType', 'justification'];
    
    for (let field of requiredFields) {
        console.log(`Validation du champ ${field}:`, data[field]);
        if (!data[field] || data[field].trim() === '') {
            alert(`❌ Le champ "${getFieldLabel(field)}" est obligatoire.`);
            const element = document.getElementById(field);
            if (element) {
                element.focus();
                element.style.borderColor = '#dc3545';
                setTimeout(() => {
                    element.style.borderColor = '#e9ecef';
                }, 3000);
            }
            return false;
        }
    }
    
    // Validation spécifique
    if (data.courseCode && !/^[A-Z]{2,4}-\d{3}$/.test(data.courseCode)) {
        alert('❌ Le code du cours doit être au format "MATIERE-XXX" (ex: MATH-301)');
        document.getElementById('courseCode').focus();
        return false;
    }
    
    return true;
}

// Obtenir le label d'un champ
function getFieldLabel(fieldName) {
    const labels = {
        'courseName': 'Nom du cours',
        'courseCode': 'Code du cours',
        'courseDescription': 'Description du cours',
        'preferredDay': 'Jour préféré',
        'preferredTime': 'Heure préférée',
        'duration': 'Durée',
        'frequency': 'Fréquence',
        'roomType': 'Type de salle',
        'capacity': 'Capacité',
        'justification': 'Justification',
        'targetAudience': 'Public cible'
    };
    return labels[fieldName] || fieldName;
}

// Mise à jour de l'aperçu
function updatePreview() {
    const previewContent = document.getElementById('previewContent');
    if (!previewContent) return;

    const formData = new FormData(document.getElementById('suggestionForm'));
    const data = Object.fromEntries(formData.entries());
    
    // Vérifier si au moins un champ est rempli
    const hasData = Object.values(data).some(value => value && value.trim() !== '');
    
    if (!hasData) {
        previewContent.innerHTML = '<p class="preview-placeholder">Remplissez le formulaire pour voir l\'aperçu...</p>';
        return;
    }

    let previewHTML = '<div class="preview-suggestion">';
    
    if (data.courseName) {
        previewHTML += `<h4>📚 ${data.courseName}</h4>`;
    }
    
    if (data.courseCode) {
        previewHTML += `<p><strong>Code:</strong> ${data.courseCode}</p>`;
    }
    
    if (data.courseDescription) {
        previewHTML += `<p><strong>Description:</strong> ${data.courseDescription}</p>`;
    }
    
    if (data.preferredDay || data.preferredTime || data.duration) {
        previewHTML += '<p><strong>Planning proposé:</strong></p><ul>';
        if (data.preferredDay) previewHTML += `<li>Jour: ${data.preferredDay}</li>`;
        if (data.preferredTime) previewHTML += `<li>Heure: ${data.preferredTime}</li>`;
        if (data.duration) previewHTML += `<li>Durée: ${data.duration}h</li>`;
        if (data.frequency) previewHTML += `<li>Fréquence: ${data.frequency}</li>`;
        previewHTML += '</ul>';
    }
    
    if (data.roomType || data.capacity) {
        previewHTML += '<p><strong>Préférences de salle:</strong></p><ul>';
        if (data.roomType) previewHTML += `<li>Type: ${data.roomType}</li>`;
        if (data.capacity) previewHTML += `<li>Capacité: ${data.capacity} étudiants</li>`;
        previewHTML += '</ul>';
    }
    
    if (data.justification) {
        previewHTML += `<p><strong>Justification:</strong> ${data.justification}</p>`;
    }
    
    if (data.targetAudience) {
        previewHTML += `<p><strong>Public cible:</strong> ${data.targetAudience}</p>`;
    }
    
    previewHTML += '</div>';
    previewContent.innerHTML = previewHTML;
}

// Réinitialiser le formulaire
function resetForm() {
    if (confirm('Êtes-vous sûr de vouloir effacer tous les champs ?')) {
        document.getElementById('suggestionForm').reset();
        updatePreview();
    }
}

// Sauvegarder en brouillon
function saveDraft() {
    const formData = new FormData(document.getElementById('suggestionForm'));
    const data = Object.fromEntries(formData.entries());
    
    // Vérifier s'il y a des données à sauvegarder
    const hasData = Object.values(data).some(value => value && value.trim() !== '');
    
    if (!hasData) {
        alert('❌ Aucune donnée à sauvegarder. Remplissez d\'abord le formulaire.');
        return;
    }
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('suggestionDraft', JSON.stringify(data));
    alert('✅ Brouillon sauvegardé !');
}

// Charger le brouillon
function loadDraft() {
    const draft = localStorage.getItem('suggestionDraft');
    if (draft) {
        const data = JSON.parse(draft);
        
        // Remplir le formulaire
        Object.keys(data).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = data[key].includes(element.value);
                } else {
                    element.value = data[key];
                }
            }
        });
        
        updatePreview();
        alert('✅ Brouillon chargé !');
    } else {
        alert('❌ Aucun brouillon trouvé.');
    }
}

// Mettre à jour l'historique
function updateHistory() {
    const historyContent = document.querySelector('.history-content');
    if (!historyContent) return;

    historyContent.innerHTML = '';
    
    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
            <div class="suggestion-info">
                <h4>${suggestion.name}</h4>
                <p><strong>Code:</strong> ${suggestion.code} | <strong>Statut:</strong> <span class="status ${suggestion.status}">${getStatusText(suggestion.status)}</span></p>
                <p><strong>Date:</strong> ${suggestion.date}</p>
            </div>
            <div class="suggestion-actions">
                <button class="btn-icon-small" onclick="viewSuggestion(${suggestion.id})" title="Voir">👁️</button>
                <button class="btn-icon-small" onclick="editSuggestion(${suggestion.id})" title="Modifier">✏️</button>
            </div>
        `;
        historyContent.appendChild(suggestionItem);
    });
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

// Voir une suggestion
function viewSuggestion(id) {
    const suggestion = suggestions.find(s => s.id === id);
    if (suggestion) {
        alert(`📋 Détails de la suggestion:\n\nNom: ${suggestion.name}\nCode: ${suggestion.code}\nStatut: ${getStatusText(suggestion.status)}\nDate: ${suggestion.date}\n\nCette fonctionnalité sera étendue pour afficher tous les détails.`);
    }
}

// Modifier une suggestion
function editSuggestion(id) {
    const suggestion = suggestions.find(s => s.id === id);
    if (suggestion) {
        if (suggestion.status === 'pending') {
            alert('✏️ Modification de la suggestion en cours de développement...');
        } else {
            alert('❌ Impossible de modifier une suggestion déjà traitée.');
        }
    }
}

// Actualiser l'historique
function refreshHistory() {
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.textContent = '🔄 Actualisation...';
    loadingBtn.disabled = true;

    setTimeout(() => {
        updateHistory();
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
        alert('✅ Historique actualisé !');
    }, 1000);
}

// Déconnexion
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        window.location.href = 'login.html';
    }
}

// Animation d'entrée
document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.suggestion-form, .suggestion-preview, .suggestions-history');
    
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

// Sauvegarder une suggestion (simulation d'envoi vers serveur)
function saveSuggestionToServer(suggestion) {
    try {
        // Récupérer les suggestions existantes
        const existingSuggestions = JSON.parse(localStorage.getItem('allSuggestions') || '[]');
        
        // Ajouter la nouvelle suggestion
        existingSuggestions.push(suggestion);
        
        // Sauvegarder dans localStorage
        localStorage.setItem('allSuggestions', JSON.stringify(existingSuggestions));
        
        // Log pour debug
        console.log('💾 Suggestion sauvegardée:', suggestion);
        console.log('📊 Total des suggestions:', existingSuggestions.length);
        
        // Simuler l'envoi vers un serveur (dans un vrai projet, ceci serait une requête HTTP)
        console.log('🌐 Simulation d\'envoi vers le serveur...');
        console.log('📤 Données envoyées:', JSON.stringify(suggestion, null, 2));
        
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        return false;
    }
}

// Récupérer toutes les suggestions (pour l'admin)
function getAllSuggestions() {
    try {
        const suggestions = JSON.parse(localStorage.getItem('allSuggestions') || '[]');
        console.log('📋 Toutes les suggestions récupérées:', suggestions);
        return suggestions;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération:', error);
        return [];
    }
}

// Charger le brouillon au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const draft = localStorage.getItem('suggestionDraft');
    if (draft) {
        if (confirm('📝 Un brouillon a été trouvé. Voulez-vous le charger ?')) {
            loadDraft();
        }
    }
    
    // Afficher le nombre total de suggestions
    const allSuggestions = getAllSuggestions();
    console.log(`📊 Total des suggestions dans le système: ${allSuggestions.length}`);
});
