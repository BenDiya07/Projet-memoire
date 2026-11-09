// Emploi du temps Script - Integration API

let currentView = 'weekly';
let currentDate = new Date();
let allSchedules = [];

// Initialisation
document.addEventListener('DOMContentLoaded', async function () {
    if (typeof authManager !== 'undefined') {
        const userRole = localStorage.getItem('userRole');
        if (userRole) document.documentElement.classList.add(`role-${userRole}`);
        await loadInitialData();
        setupEventListeners();
        setupAnimations();
        updateCurrentPeriod();
    }
});

async function loadInitialData() {
    try {
        await Promise.all([loadSchedules(), loadFilters()]);
        updateViewContent();
    } catch (error) {
        console.error('Erreur initialisation:', error);
    }
}

function setupEventListeners() {
    ['professorFilter', 'roomFilter'].forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) filter.addEventListener('change', updateViewContent);
    });
    const subjectFilter = document.getElementById('subjectFilter');
    if (subjectFilter) subjectFilter.addEventListener('input', updateViewContent);
}

// ============================================
// API DATA LOADING
// ============================================

async function loadSchedules() {
    try {
        const response = await authManager.fetchWithAuth('/courses/schedule');
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            allSchedules = data.schedules;
        }
    } catch (error) {
        console.error('Erreur chargement emploi du temps:', error);
    }
}

async function loadFilters() {
    try {
        const profRes = await authManager.fetchWithAuth('/auth/users?role=professor');
        if (profRes) {
            const profData = await profRes.json();
            if (profData.success) {
                populateDropdown('professorFilter', profData.users, u => ({
                    value: u.full_name || `${u.first_name} ${u.last_name}`,
                    text: u.full_name || `${u.first_name} ${u.last_name}`
                }));
            }
        }
        const roomRes = await authManager.fetchWithAuth('/courses/rooms');
        if (roomRes) {
            const roomData = await roomRes.json();
            if (roomData.success) {
                populateDropdown('roomFilter', roomData.rooms, r => ({
                    value: r.room_number,
                    text: `Salle ${r.room_number}`
                }));
            }
        }
    } catch (error) {
        console.error('Erreur chargement filtres:', error);
    }
}

function populateDropdown(id, items, mapper) {
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
}

// ============================================
// VIEW MANAGEMENT
// ============================================

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    document.querySelectorAll('.schedule-view').forEach(v => v.classList.toggle('active', v.id === view + 'View'));
    updateCurrentPeriod();
    updateViewContent();
}

function updateViewContent() {
    const filteredSchedules = filterSchedules(allSchedules);
    switch (currentView) {
        case 'weekly': renderWeeklyView(filteredSchedules); break;
        case 'daily': renderDailyView(filteredSchedules); break;
        case 'room': renderRoomView(filteredSchedules); break;
        case 'professor': renderProfessorView(filteredSchedules); break;
    }
}

function applyFilters() {
    updateViewContent();
}

function filterSchedules(schedules) {
    const profFilter = document.getElementById('professorFilter')?.value || '';
    const roomFilter = document.getElementById('roomFilter')?.value || '';
    const subFilter = (document.getElementById('subjectFilter')?.value || '').toLowerCase();

    return schedules.filter(s => {
        const profName = s.course?.professor?.name || '';
        const matchesProf = !profFilter || profName === profFilter;
        const matchesRoom = !roomFilter || s.room?.room_number === roomFilter;
        const matchesSub = !subFilter || (s.course?.course_name || '').toLowerCase().includes(subFilter);
        return matchesProf && matchesRoom && matchesSub;
    });
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function renderWeeklyView(schedules) {
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
    days.forEach(day => {
        const container = document.getElementById(`day-${day}`);
        if (container) container.innerHTML = '';
    });

    schedules.forEach(s => {
        const day = (s.day_of_week || '').toLowerCase();
        const container = document.getElementById(`day-${day}`);
        if (!container) return;

        const slot = document.createElement('div');
        slot.className = 'course-slot';
        if (s.course?.status === 'conflict') slot.classList.add('conflict');

        const startRow = timeToGridRow(s.start_time);
        const endRow = timeToGridRow(s.end_time);
        slot.style.gridRow = `${startRow} / ${endRow}`;

        slot.innerHTML = `
            <div class="course-title">${s.course?.course_name || 'N/A'}</div>
            <div class="course-details">${s.course?.professor?.name || 'N/A'} - ${s.room?.room_number || 'N/A'}</div>
            <div class="course-time">${s.start_time}-${s.end_time}</div>
        `;
        slot.onclick = () => alert(
            `Cours: ${s.course?.course_name}\nProfesseur: ${s.course?.professor?.name}\nSalle: ${s.room?.room_number}\nCapacite: ${s.room?.capacity}`
        );
        container.appendChild(slot);
    });
}

function renderDailyView(schedules) {
    const container = document.getElementById('dailyTimeline');
    if (!container) return;
    container.innerHTML = '';

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDayName = dayNames[currentDate.getDay()];
    const dateHeading = document.getElementById('dailyDate');
    if (dateHeading) {
        dateHeading.textContent = currentDate.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }
    const daySchedules = schedules
        .filter(s => (s.day_of_week || '').toLowerCase() === currentDayName.toLowerCase())
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    const statItems = document.querySelectorAll('.daily-stats .stat');
    const roomCount = new Set(daySchedules.map(s => s.room?.room_number).filter(Boolean)).size;
    const totalMinutes = daySchedules.reduce((total, schedule) => {
        const toMinutes = value => {
            const [hours, minutes] = (value || '').split(':').map(Number);
            return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : 0;
        };
        return total + Math.max(0, toMinutes(schedule.end_time) - toMinutes(schedule.start_time));
    }, 0);
    const duration = `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 ? String(totalMinutes % 60).padStart(2, '0') : ''}`;
    if (statItems[0]) statItems[0].textContent = `${daySchedules.length} cours`;
    if (statItems[1]) statItems[1].textContent = `${duration} de cours`;
    if (statItems[2]) statItems[2].textContent = `${roomCount} salle${roomCount > 1 ? 's' : ''} utilisée${roomCount > 1 ? 's' : ''}`;

    if (daySchedules.length === 0) {
        container.innerHTML = '<div class="no-data">Aucun cours prevu pour ce jour.</div>';
        return;
    }

    daySchedules.forEach(s => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-time">${s.start_time} - ${s.end_time}</div>
            <div class="timeline-content">
                <div class="timeline-title">${s.course?.course_name}</div>
                <div class="timeline-details">${s.course?.professor?.name || 'N/A'} - Salle ${s.room?.room_number || 'N/A'} - ${s.course?.enrolled_students || 0} etudiants</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderRoomView(schedules) {
    const container = document.getElementById('roomViewContainer');
    if (!container) return;
    container.innerHTML = '';

    const rooms = {};
    schedules.forEach(s => {
        const rName = s.room?.room_number || 'Inconnue';
        if (!rooms[rName]) rooms[rName] = { info: s.room, schedules: [] };
        rooms[rName].schedules.push(s);
    });

    Object.values(rooms).forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div class="room-header">
                <h4>Salle ${room.info?.room_number}</h4>
                <span class="room-status ${room.info?.is_available ? 'available' : 'occupied'}">
                    ${room.info?.is_available ? 'Disponible' : 'Occupee'}
                </span>
            </div>
            <div class="room-schedule">
                ${room.schedules.map(s => `
                    <div class="room-slot occupied">
                        <span class="time">${s.day_of_week} ${s.start_time}-${s.end_time}</span>
                        <span class="course">${s.course?.course_name} - ${s.course?.professor?.name || 'N/A'}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });
}

function renderProfessorView(schedules) {
    const container = document.getElementById('professorViewContainer');
    if (!container) return;
    container.innerHTML = '';

    const profs = {};
    schedules.forEach(s => {
        const pName = s.course?.professor?.name || 'Inconnu';
        if (!profs[pName]) profs[pName] = [];
        profs[pName].push(s);
    });

    Object.entries(profs).forEach(([name, profSchedules]) => {
        const card = document.createElement('div');
        card.className = 'professor-card';
        card.innerHTML = `
            <div class="professor-header">
                <h4>${name}</h4>
                <span class="professor-status active">Actif</span>
            </div>
            <div class="professor-schedule">
                ${profSchedules.map(s => `
                    <div class="prof-slot">
                        <span class="day">${s.day_of_week}</span>
                        <span class="time">${s.start_time}-${s.end_time}</span>
                        <span class="course">${s.course?.course_name} - ${s.room?.room_number || 'N/A'}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });
}

// ============================================
// HELPERS
// ============================================

function timeToGridRow(timeStr) {
    if (!timeStr) return 1;
    const [h, m] = timeStr.split(':').map(Number);
    return (h - 8) * 2 + 1 + (m >= 30 ? 1 : 0);
}

function updateCurrentPeriod() {
    const el = document.getElementById('currentPeriod');
    if (!el) return;
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    if (currentView !== 'daily') {
        const start = new Date(currentDate);
        const weekday = currentDate.getDay() || 7;
        start.setDate(currentDate.getDate() - weekday + 1);
        el.textContent = `Semaine du ${start.toLocaleDateString('fr-FR', options)}`;
    } else {
        el.textContent = currentDate.toLocaleDateString('fr-FR', { ...options, weekday: 'long' });
    }
}

function previousPeriod() {
    currentDate.setDate(currentDate.getDate() - (currentView === 'weekly' ? 7 : 1));
    updateCurrentPeriod();
    updateViewContent();
}

function nextPeriod() {
    currentDate.setDate(currentDate.getDate() + (currentView === 'weekly' ? 7 : 1));
    updateCurrentPeriod();
    updateViewContent();
}

function goToToday() {
    currentDate = new Date();
    updateCurrentPeriod();
    updateViewContent();
}

function setupAnimations() {
    const elements = document.querySelectorAll('.schedule-view, .view-controls, .schedule-filters');
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

function printSchedule() { window.print(); }
function exportSchedule() { window.print(); }

async function shareSchedule() {
    const title = document.title;
    const text = `Mon emploi du temps — ${document.getElementById('currentPeriod')?.textContent || ''}`;
    const shareData = { title, text, url: window.location.href };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return;
        }
        if (!navigator.clipboard) {
            throw new Error('Le partage et la copie ne sont pas disponibles dans ce navigateur.');
        }
        await navigator.clipboard.writeText(`${text}\n${shareData.url}`);
        showScheduleNotice('Lien de partage copié.');
    } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Erreur de partage:', error);
        showScheduleNotice(error.message || 'Impossible de partager cet emploi du temps.', true);
    }
}

function showScheduleNotice(message, isError = false) {
    let notice = document.getElementById('scheduleNotice');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'scheduleNotice';
        notice.className = 'schedule-notice';
        notice.setAttribute('role', 'status');
        document.body.appendChild(notice);
    }
    notice.textContent = message;
    notice.classList.toggle('error', isError);
    notice.classList.add('visible');
    window.setTimeout(() => notice.classList.remove('visible'), 3500);
}
