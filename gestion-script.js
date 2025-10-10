// Gestion Script

// Données simulées
let courses = [
    {
        id: 1,
        subject: 'Mathématiques',
        professor: 'Dr. Martin',
        room: 'A101',
        day: 'Lundi',
        time: '09:00',
        duration: '2h',
        students: 25,
        status: 'active'
    },
    {
        id: 2,
        subject: 'Physique',
        professor: 'Dr. Dubois',
        room: 'B205',
        day: 'Mardi',
        time: '14:00',
        duration: '1h30',
        students: 20,
        status: 'active'
    },
    {
        id: 3,
        subject: 'Informatique',
        professor: 'Dr. Leroy',
        room: 'C301',
        day: 'Mercredi',
        time: '10:30',
        duration: '2h',
        students: 30,
        status: 'conflict'
    }
];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    updateTable();
    setupEventListeners();
    hideActionsForProfessors();
});

// Masquer les actions pour les professeurs
function hideActionsForProfessors() {
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === 'professor') {
        // Masquer la colonne Actions dans le tableau
        const table = document.querySelector('.data-table');
        if (table) {
            const headerRow = table.querySelector('thead tr');
            const actionHeader = headerRow.querySelector('th:last-child');
            if (actionHeader) {
                actionHeader.style.display = 'none';
            }
            
            // Masquer les boutons d'action dans chaque ligne
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const actionCell = row.querySelector('td:last-child');
                if (actionCell) {
                    actionCell.style.display = 'none';
                }
            });
        }
        
        // Masquer les boutons d'action dans la barre d'action
        const actionBar = document.querySelector('.action-bar');
        if (actionBar) {
            const addCourseBtn = actionBar.querySelector('button[onclick*="addCourseModal"]');
            const addProfessorBtn = actionBar.querySelector('button[onclick*="addProfessorModal"]');
            const addRoomBtn = actionBar.querySelector('button[onclick*="addRoomModal"]');
            const checkConflictsBtn = actionBar.querySelector('button[onclick*="checkConflicts"]');
            
            if (addCourseBtn) addCourseBtn.style.display = 'none';
            if (addProfessorBtn) addProfessorBtn.style.display = 'none';
            if (addRoomBtn) addRoomBtn.style.display = 'none';
            if (checkConflictsBtn) checkConflictsBtn.style.display = 'none';
        }
        
        // Masquer les actions du tableau
        const tableActions = document.querySelector('.table-actions');
        if (tableActions) {
            tableActions.style.display = 'none';
        }
    }
}

// Configuration des événements
function setupEventListeners() {
    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }

    // Filtres
    const filters = ['professorFilter', 'roomFilter', 'dayFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', filterTable);
        }
    });
}

// Mise à jour du tableau
function updateTable() {
    updateTableWithData(courses);
}

// Obtenir le texte du statut
function getStatusText(status) {
    switch(status) {
        case 'active': return 'Actif';
        case 'conflict': return 'Conflit';
        case 'inactive': return 'Inactif';
        default: return 'Inconnu';
    }
}

// Filtrage du tableau
function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const professorFilter = document.getElementById('professorFilter').value;
    const roomFilter = document.getElementById('roomFilter').value;
    const dayFilter = document.getElementById('dayFilter').value;

    const filteredCourses = courses.filter(course => {
        const matchesSearch = !searchTerm || 
            course.subject.toLowerCase().includes(searchTerm) ||
            course.professor.toLowerCase().includes(searchTerm) ||
            course.room.toLowerCase().includes(searchTerm);

        const matchesProfessor = !professorFilter || course.professor === professorFilter;
        const matchesRoom = !roomFilter || course.room === roomFilter;
        const matchesDay = !dayFilter || course.day.toLowerCase() === dayFilter;

        return matchesSearch && matchesProfessor && matchesRoom && matchesDay;
    });

    updateTableWithData(filteredCourses);
}

// Mise à jour du tableau avec des données spécifiques
function updateTableWithData(data) {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const userRole = localStorage.getItem('userRole');

    data.forEach(course => {
        const row = document.createElement('tr');
        
        // Actions selon le rôle
        let actionsHTML = '';
        if (userRole === 'admin') {
            actionsHTML = `
                <button class="btn-icon-small" onclick="editCourse(${course.id})" title="Modifier">✏️</button>
                <button class="btn-icon-small" onclick="deleteCourse(${course.id})" title="Supprimer">🗑️</button>
            `;
        }
        
        row.innerHTML = `
            <td>${course.id.toString().padStart(3, '0')}</td>
            <td>${course.subject}</td>
            <td>${course.professor}</td>
            <td>${course.room}</td>
            <td>${course.day}</td>
            <td>${course.time}</td>
            <td>${course.duration}</td>
            <td>${course.students}</td>
            <td><span class="status ${course.status}">${getStatusText(course.status)}</span></td>
            <td>${actionsHTML}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Masquer la colonne Actions si c'est un professeur
    if (userRole === 'professor') {
        const table = document.querySelector('.data-table');
        if (table) {
            const headerRow = table.querySelector('thead tr');
            const actionHeader = headerRow.querySelector('th:last-child');
            if (actionHeader) {
                actionHeader.style.display = 'none';
            }
            
            // Masquer les cellules d'action dans chaque ligne
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const actionCell = row.querySelector('td:last-child');
                if (actionCell) {
                    actionCell.style.display = 'none';
                }
            });
        }
    }
}

// Gestion des modals
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Fermer les modals en cliquant à l'extérieur
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Ajouter un cours
function addCourse() {
    const form = document.getElementById('addCourseForm');
    if (!form) return;

    const formData = new FormData(form);
    const newCourse = {
        id: courses.length + 1,
        subject: document.getElementById('courseName').value,
        professor: document.getElementById('courseProfessor').value,
        room: document.getElementById('courseRoom').value,
        day: document.getElementById('courseDay').value,
        time: document.getElementById('courseTime').value,
        duration: document.getElementById('courseDuration').value + 'h',
        students: parseInt(document.getElementById('courseStudents').value),
        status: 'active'
    };

    // Validation
    if (!newCourse.subject || !newCourse.professor || !newCourse.room || 
        !newCourse.day || !newCourse.time || !newCourse.duration || !newCourse.students) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    // Vérifier les conflits
    const hasConflict = checkForConflicts(newCourse);
    if (hasConflict) {
        newCourse.status = 'conflict';
        alert(' Conflit détecté ! Le cours a été ajouté mais nécessite une attention particulière.');
    }

    courses.push(newCourse);
    updateTable();
    closeModal('addCourseModal');
    form.reset();
    
    alert(' Cours ajouté avec succès !');
}

// Vérifier les conflits
function checkForConflicts(newCourse) {
    return courses.some(course => 
        course.room === newCourse.room && 
        course.day === newCourse.day && 
        course.time === newCourse.time &&
        course.id !== newCourse.id
    );
}

// Vérifier tous les conflits
function checkConflicts() {
    const conflicts = [];
    
    courses.forEach(course => {
        const hasConflict = courses.some(otherCourse => 
            otherCourse.id !== course.id &&
            otherCourse.room === course.room &&
            otherCourse.day === course.day &&
            otherCourse.time === course.time
        );
        
        if (hasConflict) {
            conflicts.push(course);
            course.status = 'conflict';
        } else if (course.status === 'conflict') {
            course.status = 'active';
        }
    });

    updateTable();
    
    if (conflicts.length > 0) {
        alert(` ${conflicts.length} conflit(s) détecté(s) :\n\n${conflicts.map(c => `- ${c.subject} (${c.room}, ${c.day} ${c.time})`).join('\n')}`);
    } else {
        alert(' Aucun conflit détecté !');
    }
}

// Modifier un cours
function editCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const newSubject = prompt('Nouveau nom du cours:', course.subject);
    if (newSubject && newSubject !== course.subject) {
        course.subject = newSubject;
        updateTable();
        alert(' Cours modifié avec succès !');
    }
}

// Supprimer un cours
function deleteCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer le cours "${course.subject}" ?`)) {
        courses = courses.filter(c => c.id !== courseId);
        updateTable();
        alert(' Cours supprimé avec succès !');
    }
}

// Exporter les données
function exportData() {
    const dataStr = JSON.stringify(courses, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cours_data.json';
    link.click();
    URL.revokeObjectURL(url);
}

// Actualiser les données
function refreshData() {
    // Simulation d'une actualisation
    const loadingBtn = event.target;
    const originalText = loadingBtn.textContent;
    loadingBtn.textContent = ' Actualisation...';
    loadingBtn.disabled = true;

    setTimeout(() => {
        updateTable();
        loadingBtn.textContent = originalText;
        loadingBtn.disabled = false;
        alert(' Données actualisées !');
    }, 1000);
}

// La fonction logout est maintenant gérée par auth.js

// Animation d'entrée pour les éléments
document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.widget, .table-container, .stats-grid');
    
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
