import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  DoorOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import {
  api,
  ApiError,
  clearSession,
  getSession,
  saveSession,
  type Course,
  type DashboardStats,
  type Professor,
  type Role,
  type Schedule,
  type Suggestion,
  type User,
} from './api'
import './App.css'

type Notice = { kind: 'success' | 'error' | 'info'; text: string }

const demoAccounts = [
  { role: 'Administrateur', email: 'admin@univ.fr', password: 'password123', initials: 'AD', color: 'violet' },
  { role: 'Professeur', email: 'prof@univ.fr', password: 'password123', initials: 'PR', color: 'blue' },
  { role: 'Étudiant', email: 'etudiant@univ.fr', password: 'password123', initials: 'ET', color: 'green' },
]

function App() {
  const [user, setUser] = useState<User | null>(getSession())
  const [notice, setNotice] = useState<Notice | null>(null)

  const notify = useCallback((text: string, kind: Notice['kind'] = 'info') => {
    setNotice({ text, kind })
    window.setTimeout(() => setNotice(null), 4200)
  }, [])

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null)
      notify('Votre session a expiré. Veuillez vous reconnecter.', 'error')
    }
    window.addEventListener('campusflow:session-expired', handleExpiredSession)
    return () => window.removeEventListener('campusflow:session-expired', handleExpiredSession)
  }, [notify])

  const signOut = useCallback(() => {
    clearSession()
    setUser(null)
    notify('Vous êtes déconnecté.', 'info')
  }, [notify])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setUser} notify={notify} />} />
        <Route
          path="/*"
          element={
            user ? (
              <AppShell user={user} onLogout={signOut} notify={notify} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      {notice && <div className={`toast toast-${notice.kind}`} role="status">{notice.text}</div>}
    </BrowserRouter>
  )
}

function LoginPage({
  onLogin,
  notify,
}: {
  onLogin: (user: User) => void
  notify: (message: string, kind?: Notice['kind']) => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      if (mode === 'register') {
        await api.register({
          email: String(form.get('email')),
          password: String(form.get('password')),
          firstName: String(form.get('firstName')),
          lastName: String(form.get('lastName')),
        })
        setMode('login')
        notify('Votre compte étudiant a été créé. Vous pouvez vous connecter.', 'success')
      } else {
        const response = await api.login(String(form.get('email')), String(form.get('password')))
        saveSession(response.access_token, response.user)
        onLogin(response.user)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-brand">
        <div className="brand-mark"><GraduationCap size={23} strokeWidth={2.2} /></div>
        <span>Campus<span className="brand-light">Flow</span></span>
      </div>
      <div className="login-layout">
        <section className="login-story">
          <div className="eyebrow"><span className="eyebrow-dot" /> PLATEFORME ACADÉMIQUE</div>
          <h1>Un campus mieux organisé, <em>chaque jour.</em></h1>
          <p>Les cours, les salles et les équipes réunis dans un espace clair, pensé pour votre quotidien universitaire.</p>
          <div className="login-proof">
            <div className="proof-avatars"><span>AM</span><span>JD</span><span>SL</span><b>+</b></div>
            <span>La communauté pédagogique<br /><strong>commence ici</strong></span>
          </div>
          <div className="story-foot"><ShieldCheck size={16} /> Accès sécurisé par votre établissement</div>
        </section>
        <section className="login-card">
          <div className="card-kicker">{mode === 'login' ? 'RAVI DE VOUS REVOIR' : 'REJOINDRE LE CAMPUS'}</div>
          <h2>{mode === 'login' ? 'Connectez-vous' : 'Créer un compte'}</h2>
          <p className="card-intro">{mode === 'login' ? 'Accédez à votre espace de travail.' : 'L’inscription est ouverte aux étudiants.'}</p>
          <div className="auth-tabs">
            <button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError('') }}>Connexion</button>
            <button type="button" className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError('') }}>Inscription</button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <div className="field-pair">
                <label>Prénom<input name="firstName" required autoComplete="given-name" placeholder="Sophie" /></label>
                <label>Nom<input name="lastName" required autoComplete="family-name" placeholder="Laurent" /></label>
              </div>
            )}
            <label>Adresse e-mail
              <input name="email" type="email" required autoComplete="username" placeholder="vous@universite.fr" />
            </label>
            <label>Mot de passe
              <input name="password" type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="6 caractères minimum" />
            </label>
            {mode === 'register' && <label className="check-line"><input type="checkbox" required /> Je confirme l’exactitude des informations fournies.</label>}
            {error && <div className="inline-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" disabled={loading}>
              {loading ? 'Veuillez patienter…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'} <ArrowRight size={17} />
            </button>
          </form>
          {mode === 'login' && (
            <div className="demo-section">
              <div className="demo-heading"><span>ACCÈS DE DÉMONSTRATION</span><span>OPTIONNEL</span></div>
              <div className="demo-list">
                {demoAccounts.map((account) => (
                  <button type="button" className="demo-row" key={account.email} onClick={() => {
                    const form = document.querySelector<HTMLFormElement>('.auth-form')
                    if (!form) return
                    ;(form.elements.namedItem('email') as HTMLInputElement).value = account.email
                    ;(form.elements.namedItem('password') as HTMLInputElement).value = account.password
                    notify('Identifiants de démonstration renseignés. Le serveur doit être actif pour se connecter.', 'info')
                  }}>
                    <span className={`avatar avatar-${account.color}`}>{account.initials}</span>
                    <span className="demo-name">{account.role}<small>{account.email}</small></span>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
              <p className="demo-note">Ces comptes nécessitent une base de données initialisée.</p>
            </div>
          )}
        </section>
      </div>
      <footer className="login-footer"><span>© 2026 CampusFlow</span><span>Conçu pour les communautés universitaires</span><a href="mailto:support@campusflow.local"><CircleHelp size={15} /> Besoin d’aide ?</a></footer>
    </main>
  )
}

const navigation: { label: string; path: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { label: 'Vue d’ensemble', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'professor', 'student'] },
  { label: 'Cours', path: '/courses', icon: BookOpen, roles: ['admin', 'professor', 'student'] },
  { label: 'Emploi du temps', path: '/schedule', icon: CalendarDays, roles: ['admin', 'professor', 'student'] },
  { label: 'Suggestions', path: '/suggestions', icon: Sparkles, roles: ['admin', 'professor'] },
]

function AppShell({
  user,
  onLogout,
  notify,
}: {
  user: User
  onLogout: () => void
  notify: (message: string, kind?: Notice['kind']) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const role = getRole(user)
  const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
  const initials = fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const pageTitle = navigation.find((item) => location.pathname.startsWith(item.path))?.label || 'Vue d’ensemble'

  return (
    <div className="app-frame">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <NavLink to="/dashboard" className="sidebar-brand">
          <span className="brand-mark"><GraduationCap size={22} /></span>
          <span>Campus<span className="brand-light">Flow</span></span>
        </NavLink>
        <div className="workspace-label">ESPACE DE TRAVAIL</div>
        <nav className="side-nav">
          {navigation.filter((item) => item.roles.includes(role)).map(({ label, path, icon: Icon }) => (
            <NavLink to={path} key={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="term-card"><span className="term-icon"><CalendarDays size={16} /></span><span><b>Année universitaire</b><small>2025 – 2026</small></span><ChevronDown size={14} /></div>
          <div className="sidebar-help"><span className="help-icon"><CircleHelp size={17} /></span><span><b>Besoin d’aide ?</b><small>Notre équipe est là</small></span><ArrowUpRight size={14} /></div>
          <button type="button" className="sidebar-profile" onClick={onLogout}>
            <span className="avatar avatar-indigo">{initials}</span><span className="profile-copy"><b>{fullName}</b><small>{roleLabel(role)}</small></span><LogOut size={16} />
          </button>
          <div className="sidebar-version"><span>CampusFlow <span>v1.0</span></span><span className="online-dot" /> Connecté</div>
        </div>
      </aside>
      {menuOpen && <button className="sidebar-overlay" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />}
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Ouvrir le menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button><div className="breadcrumbs"><span>Espace de travail</span><span>/</span><b>{pageTitle}</b></div></div>
          <div className="topbar-actions"><NavLink to="/courses" className="search-trigger"><Search size={16} /><span>Rechercher un cours…</span></NavLink><span className="topbar-divider" /><button className="top-user" onClick={onLogout} aria-label="Se déconnecter"><span className="avatar avatar-indigo">{initials}</span><ChevronDown size={14} /></button></div>
        </header>
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage user={user} notify={notify} />} />
            <Route path="/courses" element={<CoursesPage role={role} notify={notify} />} />
            <Route path="/schedule" element={<SchedulePage notify={notify} />} />
            <Route path="/suggestions" element={role === 'admin' || role === 'professor' ? <SuggestionsPage role={role} notify={notify} /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function DashboardPage({ user, notify }: { user: User; notify: (message: string, kind?: Notice['kind']) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [scheduleCounts, setScheduleCounts] = useState<number[]>([])
  const [error, setError] = useState('')
  const displayName = user.first_name || user.full_name?.split(' ')[0] || 'Utilisateur'

  useEffect(() => {
    let active = true
    Promise.all([api.stats(), api.courses(), api.scheduleStats()])
      .then(([statsResponse, coursesResponse, scheduleResponse]) => {
        if (!active) return
        setStats(statsResponse.stats)
        setCourses(coursesResponse.courses.slice(0, 5))
        setScheduleCounts(scheduleResponse.schedule_stats.counts)
        setError('')
      })
      .catch((requestError: unknown) => {
        if (active) setError(errorMessage(requestError))
      })
    return () => { active = false }
  }, [])

  const maxDay = Math.max(1, ...scheduleCounts)
  const statsCards = [
    { title: 'Cours au catalogue', value: stats?.total_courses, change: '', icon: BookOpen, color: 'violet', note: 'dans votre établissement', trend: 'steady' },
    { title: 'Étudiants inscrits', value: stats?.total_students, change: '', icon: Users, color: 'blue', note: 'comptes actifs', trend: 'steady' },
    { title: 'Salles disponibles', value: stats?.total_rooms, change: 'À jour', icon: DoorOpen, color: 'green', note: 'dans le catalogue', trend: 'steady' },
    { title: 'Suggestions en attente', value: stats?.pending_suggestions, icon: Sparkles, color: 'amber', note: 'à examiner', trend: 'down' },
  ]

  return (
    <>
      <div className="welcome-row">
        <div><div className="eyebrow muted-eyebrow"><span className="eyebrow-dot" /> VOTRE ESPACE ACADÉMIQUE</div><h1>Bonjour {displayName} <span className="wave">👋</span></h1><p>Voici ce qui se passe sur votre campus aujourd’hui.</p></div>
        <div className="welcome-date"><CalendarDays size={16} />{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      {error && <div className="api-banner"><Activity size={18} /><div><b>Connexion au serveur indisponible</b><span>{error}. Vérifiez que l’API et PostgreSQL sont démarrés.</span></div><button onClick={() => window.location.reload()}>Réessayer</button></div>}
      <section className="metric-grid">
        {statsCards.map(({ title, value, change, icon: Icon, color, note, trend }) => (
          <article className="metric-card" key={title}>
            <div className="metric-top"><span className={`metric-icon metric-${color}`}><Icon size={18} /></span>{change && <span className={`metric-change ${trend === 'steady' ? 'neutral' : ''}`}>{trend === 'up' ? <ArrowUpRight size={13} /> : trend === 'down' ? <ArrowDownRight size={13} /> : <Check size={13} />}{change}</span>}</div>
            <div className="metric-value">{value === undefined ? <span className="skeleton skeleton-number" /> : value.toLocaleString('fr-FR')}</div><div className="metric-title">{title}</div><div className="metric-note">{note}</div>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel activity-panel">
          <div className="panel-heading"><div><h2>Activité des cours</h2><p>Répartition hebdomadaire des séances</p></div><button className="select-button">Cette semaine <ChevronDown size={14} /></button></div>
          <div className="chart-legend"><span><i />Cours programmés</span><span className="chart-total">{scheduleCounts.reduce((sum, count) => sum + count, 0)}<small> séances</small></span></div>
          <div className="bar-chart">
            {(scheduleCounts.length ? scheduleCounts : [0, 0, 0, 0, 0]).map((count, index) => (
              <div className="bar-column" key={index}><div className="bar-area"><span className="bar-tooltip">{count} cours</span><div className={`bar ${count ? 'bar-filled' : ''}`} style={{ height: `${count ? Math.max(8, count / maxDay * 100) : 4}%` }} /></div><span className="bar-label">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'][index]}</span></div>
            ))}
          </div>
        </article>
        <article className="panel schedule-panel">
          <div className="panel-heading"><div><h2>À venir</h2><p>Les prochains rendez-vous</p></div><NavLink className="text-link" to="/schedule">Tout voir <ArrowRight size={14} /></NavLink></div>
          <UpcomingSchedule notify={notify} />
        </article>
      </section>
      <section className="panel table-panel">
        <div className="panel-heading"><div><h2>Cours récents</h2><p>Le catalogue de votre établissement</p></div><NavLink className="button button-light button-small" to="/courses">Voir le catalogue <ArrowRight size={14} /></NavLink></div>
        <CourseTable courses={courses} loading={!stats && !error} />
      </section>
      <div className="dashboard-footer"><span><span className={`online-dot ${error ? 'offline-dot' : ''}`} />{error ? 'Synchronisation interrompue' : 'Données synchronisées'}</span><span>{error ? 'Vérifiez la connexion à l’API' : 'Dernière synchronisation : à l’instant'}</span></div>
    </>
  )
}

function UpcomingSchedule({ notify }: { notify: (message: string, kind?: Notice['kind']) => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.schedules().then((result) => setSchedules(result.schedules.slice(0, 3))).catch((error: unknown) => notify(errorMessage(error), 'error')).finally(() => setLoading(false))
  }, [notify])
  if (loading) return <div className="empty-inline">Chargement du planning…</div>
  if (!schedules.length) return <div className="empty-inline"><Clock3 size={18} /><span>Aucun cours programmé pour le moment.</span></div>
  const weekdays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
  const orderedSchedules = [...schedules].sort((a, b) => {
    const dayDifference = weekdays.indexOf(a.day_of_week.toLowerCase()) - weekdays.indexOf(b.day_of_week.toLowerCase())
    return dayDifference || a.start_time.localeCompare(b.start_time)
  })
  return <div className="upcoming-list">{orderedSchedules.map((schedule) => (
    <div className="upcoming-item" key={schedule.id}><span className="upcoming-day">{schedule.day_of_week.slice(0, 3)}</span><span className="upcoming-time">{schedule.start_time}</span><span className="upcoming-details"><b>{schedule.course?.course_name || 'Cours'}</b><small>{schedule.room?.room_number ? `Salle ${schedule.room.room_number}` : 'Salle à confirmer'}</small></span></div>
  ))}</div>
}

function CourseTable({ courses, loading, onDelete }: { courses: Course[]; loading: boolean; onDelete?: (course: Course) => void }) {
  if (loading) return <div className="table-empty">Chargement du catalogue…</div>
  if (!courses.length) return <div className="table-empty"><BookOpen size={22} /><span>Aucun cours à afficher. Le catalogue est vide pour le moment.</span></div>
  return (
    <div className="table-overflow"><table className="data-table"><thead><tr><th>INTITULÉ DU COURS</th><th>CODE</th><th>ENSEIGNANT</th><th>INSCRITS</th><th>STATUT</th>{onDelete && <th>ACTIONS</th>}</tr></thead><tbody>
      {courses.map((course) => <tr key={course.id}><td><div className="course-cell"><span className="course-symbol"><BookOpen size={16} /></span><span><b>{course.course_name}</b><small>{course.credits || '—'} crédits · {course.semester || 'Semestre à confirmer'}</small></span></div></td><td><span className="code-pill">{course.course_code}</span></td><td>{course.professor?.name || 'À assigner'}</td><td>{course.enrolled_students ?? 0}<span className="capacity"> / {course.max_students ?? '—'}</span></td><td><span className={`status-pill status-${course.status}`}>{course.status === 'active' ? 'Actif' : course.status}</span></td>{onDelete && <td><button className="delete-course" aria-label={`Supprimer ${course.course_name}`} onClick={() => onDelete(course)}><Trash2 size={14} /></button></td>}</tr>)}
    </tbody></table></div>
  )
}

function CoursesPage({ role, notify }: { role: Role; notify: (message: string, kind?: Notice['kind']) => void }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    api.courses().then((response) => { setCourses(response.courses); setError('') }).catch((requestError: unknown) => setError(errorMessage(requestError))).finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    refresh()
    if (role === 'admin') {
      api.professors().then((response) => setProfessors(response.users)).catch((requestError: unknown) => {
        setProfessors([])
        setError(errorMessage(requestError))
      })
    }
  }, [refresh, role])

  const filtered = useMemo(() => courses.filter((course) => `${course.course_name} ${course.course_code} ${course.professor?.name || ''}`.toLowerCase().includes(search.toLowerCase())), [courses, search])

  async function addCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      await api.createCourse({
        course_name: String(form.get('course_name')),
        course_code: String(form.get('course_code')),
        professor_id: Number(form.get('professor_id')),
        max_students: Number(form.get('max_students')),
        credits: Number(form.get('credits')),
      })
      notify('Le cours a été ajouté au catalogue.', 'success')
      setShowForm(false)
      refresh()
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Supprimer « ${course.course_name} » ?`)) return
    try {
      await api.deleteCourse(course.id)
      notify('Le cours a été supprimé.', 'success')
      refresh()
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    }
  }

  return (
    <>
      <div className="page-title-row"><div><div className="eyebrow muted-eyebrow">CATALOGUE ACADÉMIQUE</div><h1>Gestion des cours</h1><p>Consultez les enseignements et les informations du catalogue.</p></div>{role === 'admin' && <button className="button button-primary" onClick={() => setShowForm(!showForm)}>{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Fermer' : 'Ajouter un cours'}</button>}</div>
      {error && <div className="api-banner"><Activity size={18} /><div><b>Impossible de charger le catalogue</b><span>{error}</span></div><button onClick={() => { setLoading(true); refresh() }}>Réessayer</button></div>}
      {showForm && <form className="panel create-course-form" onSubmit={addCourse}><div className="panel-heading"><div><h2>Nouveau cours</h2><p>Complétez les informations du cours à ajouter au catalogue.</p></div></div><div className="form-grid"><label>Nom du cours<input name="course_name" required /></label><label>Code du cours<input name="course_code" required /></label><label>Professeur<select name="professor_id" required defaultValue=""><option value="" disabled>Choisir un professeur</option>{professors.map((professor) => <option value={professor.id} key={professor.id}>{professor.full_name || `${professor.first_name || ''} ${professor.last_name || ''}`.trim()}</option>)}</select></label><label>Nombre maximum d’étudiants<input name="max_students" type="number" min="1" defaultValue="30" required /></label><label>Crédits<input name="credits" type="number" min="1" defaultValue="6" required /></label></div><div className="form-actions"><button type="button" className="button button-light" onClick={() => setShowForm(false)}>Annuler</button><button className="button button-primary" disabled={submitting || professors.length === 0}>{submitting ? 'Enregistrement…' : 'Créer le cours'}</button></div>{professors.length === 0 && <p className="form-hint">La liste des professeurs est indisponible. Vérifiez la connexion à l’API.</p>}</form>}
      <section className="panel catalog-panel"><div className="catalog-toolbar"><div><h2>Catalogue des cours</h2><span className="catalog-count">{loading ? 'Chargement…' : `${filtered.length} cours`}</span></div><label className="catalog-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un cours…" /></label></div><CourseTable courses={filtered} loading={loading} onDelete={role === 'admin' ? deleteCourse : undefined} />{!loading && filtered.length === 0 && courses.length > 0 && <div className="table-empty">Aucun cours ne correspond à cette recherche.</div>}</section>
    </>
  )
}

function SchedulePage({ notify }: { notify: (message: string, kind?: Notice['kind']) => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    api.schedules().then((response) => setSchedules(response.schedules)).catch((requestError: unknown) => { setError(errorMessage(requestError)); notify(errorMessage(requestError), 'error') }).finally(() => setLoading(false))
  }, [notify])
  const grouped = useMemo(() => ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => ({
    day,
    items: schedules.filter((item) => item.day_of_week.toLowerCase() === day.toLowerCase()).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })), [schedules])
  return (
    <>
      <div className="page-title-row"><div><div className="eyebrow muted-eyebrow">PLANIFICATION</div><h1>Emploi du temps</h1><p>Les créneaux de cours de la semaine, en un seul regard.</p></div><button className="button button-light" onClick={() => window.print()}><CalendarDays size={16} /> Imprimer</button></div>
      {error && <div className="api-banner"><Activity size={18} /><div><b>Planning indisponible</b><span>{error}</span></div></div>}
      {loading ? <div className="panel loading-panel">Chargement de l’emploi du temps…</div> : (
        <section className="schedule-board">{grouped.map(({ day, items }) => <article className="day-column" key={day}><div className="day-heading">{day}<span>{items.length}</span></div>{items.length ? items.map((item) => <div className="schedule-card" key={item.id}><div className="schedule-card-time"><Clock3 size={13} />{item.start_time} – {item.end_time}</div><b>{item.course?.course_name || 'Cours'}</b><span>{item.course?.professor?.name || 'Enseignant à confirmer'}</span><div className="schedule-room">{item.room?.room_number ? <><DoorOpen size={13} /> Salle {item.room.room_number}</> : 'Salle à confirmer'}</div></div>) : <div className="day-empty">Aucun cours prévu</div>}</article>)}</section>
      )}
      {!loading && !schedules.length && !error && <div className="panel table-empty schedule-empty"><CalendarDays size={22} /><span>Aucun horaire n’est enregistré pour le moment.</span></div>}
    </>
  )
}

function SuggestionsPage({ role, notify }: { role: Role; notify: (message: string, kind?: Notice['kind']) => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const refresh = useCallback(() => {
    setLoading(true)
    api.suggestions().then((response) => { setSuggestions(response.suggestions); setError('') }).catch((requestError: unknown) => setError(errorMessage(requestError))).finally(() => setLoading(false))
  }, [])
  useEffect(() => refresh(), [refresh])

  async function submitSuggestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      await api.createSuggestion({
        course_name: String(form.get('course_name')),
        course_code: String(form.get('course_code') || ''),
        preferred_day: String(form.get('preferred_day')),
        preferred_time: String(form.get('preferred_time')),
        duration: Number(form.get('duration')),
        frequency: String(form.get('frequency')),
        room_type: String(form.get('room_type')),
        capacity: Number(form.get('capacity')),
        justification: String(form.get('justification')),
      })
      notify('Votre proposition a été envoyée.', 'success')
      setShowForm(false)
      refresh()
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function reviewSuggestion(suggestion: Suggestion, action: 'approve' | 'reject') {
    let reason: string | undefined
    if (action === 'reject') {
      reason = window.prompt('Indiquez le motif du refus :') || undefined
      if (!reason) return
    }
    try {
      if (action === 'approve') await api.approveSuggestion(suggestion.id)
      else await api.rejectSuggestion(suggestion.id, reason!)
      notify(action === 'approve' ? 'La proposition a été approuvée.' : 'La proposition a été refusée.', 'success')
      refresh()
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    }
  }

  return (
    <>
      <div className="page-title-row"><div><div className="eyebrow muted-eyebrow">INNOVATION PÉDAGOGIQUE</div><h1>Suggestions de cours</h1><p>Découvrez les idées proposées pour enrichir le catalogue.</p></div>{role === 'professor' && <button className="button button-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Proposer un cours</button>}</div>
      {error && <div className="api-banner"><Activity size={18} /><div><b>Suggestions indisponibles</b><span>{error}</span></div><button onClick={refresh}>Réessayer</button></div>}
      {showForm && <form className="panel create-course-form" onSubmit={submitSuggestion}><div className="panel-heading"><div><h2>Nouvelle proposition</h2><p>Partagez votre idée avec l’équipe pédagogique.</p></div></div><div className="form-grid"><label>Nom du cours<input name="course_name" required /></label><label>Code du cours<input name="course_code" /></label><label>Jour souhaité<select name="preferred_day" required><option value="">Choisir</option>{['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].map((day) => <option key={day} value={day}>{day[0].toUpperCase() + day.slice(1)}</option>)}</select></label><label>Heure souhaitée<input type="time" name="preferred_time" required /></label><label>Durée<select name="duration" required><option value="1">1 heure</option><option value="1.5">1h30</option><option value="2">2 heures</option><option value="3">3 heures</option></select></label><label>Type de salle<select name="room_type" required><option value="classroom">Salle de classe</option><option value="laboratory">Laboratoire</option><option value="computer_room">Salle informatique</option><option value="amphitheater">Amphithéâtre</option></select></label><label>Capacité souhaitée<input name="capacity" type="number" min="1" defaultValue="30" /></label><label>Fréquence<select name="frequency"><option value="weekly">Hebdomadaire</option><option value="biweekly">Bi-hebdomadaire</option><option value="monthly">Mensuelle</option></select></label><label className="form-wide">Justification<textarea name="justification" required rows={3} /></label></div><div className="form-actions"><button type="button" className="button button-light" onClick={() => setShowForm(false)}>Annuler</button><button className="button button-primary" disabled={submitting}>{submitting ? 'Envoi…' : 'Envoyer la proposition'}</button></div></form>}
      <div className="suggestion-summary"><div className="summary-card"><span className="summary-icon summary-amber"><Clock3 size={17} /></span><span><b>{suggestions.filter((item) => item.status === 'pending').length}</b><small>En attente</small></span></div><div className="summary-card"><span className="summary-icon summary-green"><Check size={17} /></span><span><b>{suggestions.filter((item) => item.status === 'approved').length}</b><small>Approuvées</small></span></div><div className="summary-card"><span className="summary-icon summary-red"><X size={17} /></span><span><b>{suggestions.filter((item) => item.status === 'rejected').length}</b><small>Refusées</small></span></div></div>
      {loading ? <div className="panel loading-panel">Chargement des propositions…</div> : suggestions.length ? <div className="suggestion-grid">{suggestions.map((item) => <article className="panel suggestion-card" key={item.id}><div className="suggestion-card-head"><span className="suggestion-icon"><Sparkles size={17} /></span><span className={`status-pill status-${item.status}`}>{statusLabel(item.status)}</span></div><h2>{item.course_name}</h2><p>{item.justification}</p><div className="suggestion-meta"><span><CalendarDays size={14} />{item.preferred_day || 'Jour à définir'} {item.preferred_time || ''}</span><span><Users size={14} />{item.required_capacity || '—'} places</span></div><div className="suggestion-owner"><span className="avatar avatar-blue">{(item.professor || 'P').split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span><small>Proposé par</small><b>{item.professor || 'Équipe enseignante'}</b></span><time>{item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''}</time></div>{role === 'admin' && item.status === 'pending' && <div className="suggestion-actions"><button className="button button-light" onClick={() => reviewSuggestion(item, 'reject')}>Refuser</button><button className="button button-primary" onClick={() => reviewSuggestion(item, 'approve')}><Check size={15} /> Approuver</button></div>}</article>)}</div> : <div className="panel table-empty"><Sparkles size={22} /><span>Aucune suggestion à afficher pour le moment.</span></div>}
    </>
  )
}

function getRole(user: User): Role {
  const role = typeof user.role === 'string' ? user.role : user.role?.name
  return role === 'admin' || role === 'professor' ? role : 'student'
}

function roleLabel(role: Role) {
  return role === 'admin' ? 'Administrateur' : role === 'professor' ? 'Professeur' : 'Étudiant'
}

function statusLabel(status: string) {
  return status === 'pending' ? 'En attente' : status === 'approved' ? 'Approuvée' : status === 'rejected' ? 'Refusée' : status
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  return error instanceof Error ? error.message : 'Une erreur est survenue.'
}

export default function RoutedApp() {
  return <App />
}
