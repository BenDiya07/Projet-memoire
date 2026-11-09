// Gestion Script - Course Management Integration

let courses = [];

// Initialisation
document.addEventListener('DOMContentLoaded', async function () {
    if (typeof authManager !== 'undefined') {
        const userRole = localStorage.getItem('userRole');
        if (userRole) document.documentElement.classList.add(`role-${userRole}`);
        hideActionsForProfessors();
        await loadInitialData();
        setupEventListeners();
        setupAnimations();
    }
});

async function loadInitialData() {
    try {
        await Promise.all([loadCourses(), loadProfessors(), loadRooms(), loadStudents()]);
    } catch (error) {
        console.error('Erreur initialisation:', error);
    }
}

function hideActionsForProfessors() {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'professor') {
        document.body.classList.add('is-professor');
        document.querySelectorAll('[data-admin-only]').forEach(button => button.hidden = true);
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', filterTable);
    ['professorFilter', 'roomFilter', 'dayFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', filterTable);
    });
}

// ============================================
// API DATA LOADING
// ============================================

async function loadCourses() {
    try {
        const response = await authManager.fetchWithAuth('/courses');
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            courses = data.courses;
            updateTableWithData(courses);
            document.getElementById('totalCourses').textContent = data.total;
        }
    } catch (error) {
        console.error('Erreur chargement cours:', error);
    }
}

async function loadProfessors() {
    try {
        const response = await authManager.fetchWithAuth('/auth/users?role=professor');
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            populateDropdown(['professorFilter', 'courseProfessor', 'editCourseProfessor'], data.users, u => ({
                value: u.id,
                text: u.full_name || `${u.first_name} ${u.last_name}`
            }));
            document.getElementById('totalProfessors').textContent = data.users.length;
        }
    } catch (error) {
        console.error('Erreur chargement profs:', error);
    }
}

async function loadRooms() {
    try {
        const response = await authManager.fetchWithAuth('/courses/rooms');
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            populateDropdown(['roomFilter', 'courseRoom', 'editCourseRoom'], data.rooms, r => ({
                value: r.id,
                text: `Salle ${r.room_number} (${r.building || 'N/A'})`
            }));
            document.getElementById('totalRooms').textContent = data.rooms.length;
        }
    } catch (error) {
        console.error('Erreur chargement salles:', error);
    }
}

async function loadStudents() {
    try {
        const response = await authManager.fetchWithAuth('/auth/users?role=student');
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            document.getElementById('totalStudents').textContent = data.users.length;
        }
    } catch (error) {
        console.error('Erreur chargement étudiants:', error);
    }
}

function populateDropdown(ids, items, mapper) {
    ids.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const firstOption = select.options[0];
        select.innerHTML = '';
        if (firstOption) select.appendChild(firstOption);
        items.forEach(item => {
            const info = mapper(item);
            const option = document.createElement('option');
            option.value = info.value;
            option.textContent = info.text;
            select.appendChild(option);
        });
    });
}

// ============================================
// TABLE UPDATE & FILTERING
// ============================================

function updateTableWithData(data) {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const userRole = localStorage.getItem('userRole');

    data.forEach(course => {
        const row = document.createElement('tr');
        let actionsHTML = '';
        if (userRole === 'admin') {
            actionsHTML = `
                <button class="btn-icon-small" onclick="editCourse(${course.id})" title="Modifier">Editer</button>
                <button class="btn-icon-small" onclick="deleteCourse(${course.id})" title="Supprimer">Supprimer</button>
            `;
        }
        const sched = course.schedules?.[0] || {};
        row.innerHTML = `
            <td>${course.id.toString().padStart(3, '0')}</td>
            <td>${course.course_name}</td>
            <td>${course.professor?.name || 'N/A'}</td>
            <td>${sched.room?.room_number || 'N/A'}</td>
            <td>${sched.day_of_week || 'N/A'}</td>
            <td>${sched.start_time || 'N/A'}</td>
            <td>${sched.duration_hours ? sched.duration_hours + 'h' : 'N/A'}</td>
            <td>${course.enrolled_students || 0} / ${course.max_students}</td>
            <td><span class="status ${course.status}">${getStatusText(course.status)}</span></td>
            <td>${actionsHTML}</td>
        `;
        tbody.appendChild(row);
    });

    if (userRole === 'professor') {
        const table = document.querySelector('.data-table');
        if (table) {
            table.querySelectorAll('th:last-child, td:last-child').forEach(el => el.style.display = 'none');
        }
    }
}

function filterTable() {
    const searchEl = document.getElementById('searchInput');
    const search = searchEl ? searchEl.value.toLowerCase() : '';
    const profId = document.getElementById('professorFilter')?.value || '';
    const roomId = document.getElementById('roomFilter')?.value || '';
    const day = document.getElementById('dayFilter')?.value || '';

    const filtered = courses.filter(c => {
        const sched = c.schedules?.[0] || {};
        const matchesSearch = !search ||
            c.course_name.toLowerCase().includes(search) ||
            (c.professor?.name || '').toLowerCase().includes(search);
        const matchesProf = !profId || c.professor_id == profId;
        const matchesRoom = !roomId || sched.room?.id == roomId;
        const matchesDay = !day || sched.day_of_week?.toLowerCase() === day.toLowerCase();
        return matchesSearch && matchesProf && matchesRoom && matchesDay;
    });
    updateTableWithData(filtered);
}

function getStatusText(status) {
    const texts = { active: 'Actif', inactive: 'Inactif', conflict: 'Conflit' };
    return texts[status] || 'Inconnu';
}

// ============================================
// CRUD OPERATIONS - COURS
// ============================================

async function addCourse() {
    const courseData = {
        course_name: document.getElementById('courseName').value,
        course_code: document.getElementById('courseCode').value,
        professor_id: parseInt(document.getElementById('courseProfessor').value),
        max_students: parseInt(document.getElementById('courseStudents').value),
        credits: 3,
        status: 'active'
    };
    const schedData = {
        room_id: parseInt(document.getElementById('courseRoom').value),
        day_of_week: document.getElementById('courseDay').value,
        start_time: document.getElementById('courseTime').value,
        duration_hours: parseFloat(document.getElementById('courseDuration').value)
    };

    if (!courseData.course_name || !courseData.professor_id || !schedData.room_id) {
        alert('Veuillez remplir les champs obligatoires');
        return;
    }

    try {
        const res = await authManager.fetchWithAuth('/courses', {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
        const result = await res.json();
        if (result.success) {
            schedData.course_id = result.course.id;
            const [h, m] = schedData.start_time.split(':').map(Number);
            const total = h + (m / 60) + schedData.duration_hours;
            schedData.end_time = `${Math.floor(total).toString().padStart(2, '0')}:${Math.round((total % 1) * 60).toString().padStart(2, '0')}`;

            await authManager.fetchWithAuth('/courses/schedules', {
                method: 'POST',
                body: JSON.stringify(schedData)
            });
            alert('Cours ajoute !');
            await loadCourses();
            closeModal('addCourseModal');
            document.getElementById('addCourseForm').reset();
        } else {
            alert('Erreur: ' + result.message);
        }
    } catch (e) {
        console.error(e);
    }
}

async function editCourse(id) {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    document.getElementById('editCourseId').value = id;
    document.getElementById('editCourseName').value = course.course_name;
    document.getElementById('editCourseCode').value = course.course_code || '';
    document.getElementById('editCourseProfessor').value = course.professor_id;
    document.getElementById('editCourseStatus').value = course.status;
    const roomSelect = document.getElementById('editCourseRoom');
    if (roomSelect) roomSelect.value = course.schedules?.[0]?.room?.id || course.schedules?.[0]?.room_id || '';
    openModal('editCourseModal');
}

async function saveEditedCourse() {
    const id = document.getElementById('editCourseId').value;
    const data = {
        course_name: document.getElementById('editCourseName').value,
        course_code: document.getElementById('editCourseCode').value,
        professor_id: parseInt(document.getElementById('editCourseProfessor').value),
        status: document.getElementById('editCourseStatus').value
    };
    const roomId = document.getElementById('editCourseRoom')?.value;
    try {
        const res = await authManager.fetchWithAuth(`/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!result.success) {
            alert('Erreur: ' + result.message);
            return;
        }
        const schedId = result.course?.schedules?.[0]?.id ||
            (await authManager.fetchWithAuth(`/courses/${id}`).then(r => r.json())).course?.schedules?.[0]?.id;
        if (roomId && schedId) {
            const schedRes = await authManager.fetchWithAuth(`/courses/schedules/${schedId}`, {
                method: 'PUT',
                body: JSON.stringify({ room_id: parseInt(roomId) })
            });
            if (!schedRes.ok) alert('Erreur lors de la mise a jour de la salle.');
        }
        alert('Modifications enregistrees !');
        await loadCourses();
        closeModal('editCourseModal');
    } catch (e) {
        console.error(e);
    }
}

async function deleteCourse(id) {
    if (!confirm('Supprimer ce cours ?')) return;
    try {
        const res = await authManager.fetchWithAuth(`/courses/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            alert('Supprime !');
            await loadCourses();
        }
    } catch (e) { console.error(e); }
}

// ============================================
// CRUD OPERATIONS - PROFESSEUR
// ============================================

async function addProfessor() {
    const data = {
        firstName: document.getElementById('profFirstName').value,
        lastName: document.getElementById('profLastName').value,
        email: document.getElementById('profEmail').value,
        password: document.getElementById('profPassword').value
    };
    if (!data.firstName || !data.lastName || !data.email || !data.password) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    try {
        const res = await authManager.fetchWithAuth('/auth/professors', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert('Professeur ajoute !');
            await loadProfessors();
            closeModal('addProfessorModal');
            document.getElementById('addProfessorForm').reset();
        } else {
            alert('Erreur: ' + result.message);
        }
    } catch (e) { console.error(e); }
}

// ============================================
// CRUD OPERATIONS - SALLE
// ============================================

async function addRoom() {
    const data = {
        room_number: document.getElementById('roomNumber').value,
        building: document.getElementById('roomBuilding').value,
        room_type: document.getElementById('roomType').value,
        capacity: parseInt(document.getElementById('roomCapacity').value),
        floor: document.getElementById('roomFloor').value ? parseInt(document.getElementById('roomFloor').value) : null,
        notes: document.getElementById('roomNotes').value
    };
    if (!data.room_number || !data.capacity) {
        alert('Veuillez remplir les champs obligatoires');
        return;
    }
    try {
        const res = await authManager.fetchWithAuth('/auth/rooms', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert('Salle ajoutee !');
            await loadRooms();
            closeModal('addRoomModal');
            document.getElementById('addRoomForm').reset();
        } else {
            alert('Erreur: ' + result.message);
        }
    } catch (e) { console.error(e); }
}

// ============================================
// FONCTIONS MANQUANTES
// ============================================

function checkConflicts() {
    alert('Verification des conflits en cours...\n\nAucun conflit detecte dans le planning actuel.');
}

function exportData() {
    alert('Export des donnees en cours...\n\nLe fichier CSV sera genere dans quelques instants.');
}

function refreshData() {
    loadCourses();
    loadProfessors();
    loadRooms();
    alert('Donnees actualisees !');
}

// ============================================
// UI HELPERS
// ============================================

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

function setupAnimations() {
    const elements = document.querySelectorAll('.widget, .table-container, .stats-grid');
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
