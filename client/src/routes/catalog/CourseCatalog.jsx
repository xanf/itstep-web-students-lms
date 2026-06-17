import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import apiClient from '../../api/client.js'

function fetchCourses() {
  return apiClient.get('/courses/', { params: { pageSize: 100 } }).then(r => r.data)
}

function fetchEnrollments() {
  return apiClient.get('/courses/', { params: { pageSize: 100 } }).then(r => r.data)
}

function enrollCourse(courseId) {
  return apiClient.post(`/courses/${courseId}/enroll`).then(r => r.data)
}

export function CourseCatalog() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [enrolledIds, setEnrolledIds] = useState(new Set())

  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  })

  const enroll = useMutation({
    mutationFn: enrollCourse,
    onSuccess: (_, courseId) => {
      setEnrolledIds(prev => new Set([...prev, courseId]))
      qc.invalidateQueries(['courses'])
    },
    onError: (err, courseId) => {
      const code = err?.response?.data?.error?.code
      // Якщо вже записаний — просто позначаємо кнопку
      if (code === 'CONFLICT') {
        setEnrolledIds(prev => new Set([...prev, courseId]))
      }
    },
  })

  const courses = (data?.data || []).filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const isEnrolled = (courseId) =>
    enrolledIds.has(courseId) || data?.data?.find(c => c.id === courseId)?.enrolled

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 16 }}>Каталог курсів</h1>

      <input
        placeholder="Пошук курсів..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', marginBottom: 24,
          border: '1px solid #ddd', borderRadius: 8, fontSize: 15,
          boxSizing: 'border-box',
        }}
      />

      {isLoading && <p>Завантаження...</p>}
      {isError && <p style={{ color: 'red' }}>Помилка завантаження курсів</p>}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {courses.map(course => {
          const enrolled = enrolledIds.has(course.id) || course.enrolled
          return (
            <div
              key={course.id}
              style={{
                border: '1px solid #e0e0e0', borderRadius: 10, padding: 20,
                background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <h3
                style={{ margin: 0, cursor: 'pointer', color: '#1a73e8' }}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                {course.title}
              </h3>
              {course.description && (
                <p style={{ margin: 0, color: '#555', fontSize: 14, lineHeight: 1.5 }}>
                  {course.description.slice(0, 120)}{course.description.length > 120 ? '...' : ''}
                </p>
              )}
              <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                Викладач: {course.instructor?.fullName || '—'}
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  style={{
                    flex: 1, padding: '8px 0', border: '1px solid #1a73e8',
                    borderRadius: 6, background: '#fff', color: '#1a73e8',
                    cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  Переглянути
                </button>
                {user?.role === 'Student' && (
                  <button
                    onClick={() => !enrolled && enroll.mutate(course.id)}
                    disabled={enrolled || enroll.isPending}
                    style={{
                      flex: 1, padding: '8px 0', border: 'none',
                      borderRadius: 6, fontWeight: 500, cursor: enrolled ? 'default' : 'pointer',
                      background: enrolled ? '#e6f4ea' : '#1a73e8',
                      color: enrolled ? '#34a853' : '#fff',
                    }}
                  >
                    {enrolled ? '✓ Ви записались на курс' : 'Записатись'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!isLoading && courses.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>
          Курсів не знайдено
        </p>
      )}
    </div>
  )
}
