export type Role = 'admin' | 'professor' | 'student'

export type User = {
  id: number
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  role: Role | { name: Role }
}

export type Course = {
  id: number
  course_code: string
  course_name: string
  credits?: number | null
  status: string
  max_students?: number | null
  enrolled_students?: number | null
  semester?: string | null
  professor?: { id: number; name: string; email: string } | null
}

export type Schedule = {
  id: number
  day_of_week: string
  start_time: string
  end_time: string
  course?: Course | null
  room?: { room_number: string; capacity: number } | null
}

export type Suggestion = {
  id: number
  course_name: string
  course_code?: string | null
  preferred_day?: string | null
  preferred_time?: string | null
  required_capacity?: number | null
  justification: string
  status: string
  professor?: string
  created_at?: string | null
}

export type DashboardStats = {
  total_courses: number
  total_professors: number
  total_rooms: number
  total_students: number
  pending_suggestions: number
  approved_suggestions: number
  rejected_suggestions: number
  total_conflicts: number
}

export type Professor = Pick<User, 'id' | 'full_name' | 'first_name' | 'last_name'>

type ApiEnvelope<T> = T & { success?: boolean; message?: string }
type LoginResponse = { access_token: string; user: User }

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'campusflow.accessToken'
const USER_KEY = 'campusflow.user'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError(`Impossible de joindre l’API (${API_BASE_URL}).`, 0)
  }

  const body = await response.json().catch(() => ({})) as ApiEnvelope<T>
  if (!response.ok || body.success === false) {
    if (response.status === 401) {
      clearSession()
      window.dispatchEvent(new Event('campusflow:session-expired'))
    }
    throw new ApiError(body.message || `La requête a échoué (${response.status}).`, response.status)
  }
  return body
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  register(data: { email: string; password: string; firstName: string; lastName: string }) {
    return request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  stats() {
    return request<{ stats: DashboardStats }>('/stats')
  },

  scheduleStats() {
    return request<{ schedule_stats: { days: string[]; counts: number[] } }>('/stats/schedule')
  },

  courses() {
    return request<{ courses: Course[]; total?: number }>('/courses?per_page=100')
  },

  professors() {
    return request<{ users: Professor[] }>('/auth/users?role=professor')
  },

  createCourse(data: {
    course_name: string
    course_code: string
    professor_id: number
    max_students: number
    credits: number
  }) {
    return request<{ course: Course }>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  deleteCourse(id: number) {
    return request<{ message: string }>(`/courses/${id}`, { method: 'DELETE' })
  },

  schedules() {
    return request<{ schedules: Schedule[] }>('/courses/schedule')
  },

  suggestions() {
    return request<{ suggestions: Suggestion[] }>('/suggestions')
  },

  createSuggestion(data: {
    course_name: string
    course_code: string
    preferred_day: string
    preferred_time: string
    duration: number
    frequency: string
    room_type: string
    capacity: number
    justification: string
  }) {
    return request<{ suggestion: Suggestion }>('/suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  approveSuggestion(id: number) {
    return request<{ message: string }>(`/suggestions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },

  rejectSuggestion(id: number, reason: string) {
    return request<{ message: string }>(`/suggestions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },
}

export function getSession(): User | null {
  try {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) as User : null
  } catch {
    clearSession()
    return null
  }
}

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
