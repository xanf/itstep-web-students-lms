import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/useAuth.js'
import apiClient from '../../api/client.js'

function fetchCourse(courseId) {
  return apiClient.get(`/courses/${courseId}`).then(r => r.data)
}

function fetchLessons(courseId) {
  return apiClient.get(`/courses/${courseId}/lessons`, { params: { pageSize: 100 } }).then(r => r.data)
}

function enrollCourse(courseId) {
  return apiClient.post(`/courses/${courseId}/enroll`).then(r => r.data)
}

export function CourseDetail() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId),
  })

  const { data: lessonsData, isLoading: loadingLessons } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => fetchLessons(courseId),
  })

  const enroll = useMutation({
    mutationFn: () => enrollCourse(courseId),
    onSuccess: () => qc.invalidateQueries(['course', courseId]),
  })

  if (loadingCourse) return <div style={{ padding: 32 }}>Завантаження...</div>
  if (!course) return <div style={{ padding: 32, color: 'red' }}>Курс не знайдено</div>

  const lessons = lessonsData?.data || []

  return (
    <div style={{ padding: '24px', maxWidth: 860, margin: '0 auto' }}>
      {/* Назад */}
      <button
        onClick={() => navigate('/courses')}
        style={{
          marginBottom: 20, background: 'none', border: 'none',
          color: '#1a73e8', cursor: 'pointer', fontSize: 14, padding: 0,
        }}
      >
        ← До каталогу
      </button>

      {/* Заголовок курсу */}
      <div style={{
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12,
        padding: 28, marginBottom: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h1 style={{ margin: '0 0 10px' }}>{course.title}</h1>
            {course.description && (
              <p style={{ margin: '0 0 12px', color: '#555', lineHeight: 1.6 }}>{course.description}</p>
            )}
            <p style={{ margin: 0, fontSize: 14, color: '#888' }}>
              Викладач: {course.instructor?.fullName || '—'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {user?.role === 'Student' && (
              <button
                onClick={() => enroll.mutate()}
                disabled={enroll.isPending}
                style={{
                  padding: '10px 20px', border: 'none', borderRadius: 8,
                  background: '#1a73e8', color: '#fff', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Записатись
              </button>
            )}
            {user?.role === 'Instructor' && (
              <button
                onClick={() => navigate(`/courses/${courseId}/build`)}
                style={{
                  padding: '10px 20px', border: '1px solid #1a73e8', borderRadius: 8,
                  background: '#fff', color: '#1a73e8', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Редагувати курс
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Список уроків */}
      <h2 style={{ marginBottom: 16 }}>Уроки курсу</h2>

      {loadingLessons && <p>Завантаження уроків...</p>}

      {!loadingLessons && lessons.length === 0 && (
        <p style={{ color: '#999' }}>Уроків поки немає</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lessons.map((lesson, index) => (
          <Link
            key={lesson.id}
            to={`/lessons/${lesson.id}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
              transition: 'box-shadow 0.15s',
              cursor: 'pointer',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Номер уроку */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: lesson.completedAt ? '#34a853' : '#e8f0fe',
                color: lesson.completedAt ? '#fff' : '#1a73e8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 15,
              }}>
                {lesson.completedAt ? '✓' : index + 1}
              </div>

              {/* Назва */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: '#222', fontSize: 15 }}>{lesson.title}</div>
                {lesson.publishedAt && (
                  <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
                    {new Date(lesson.publishedAt).toLocaleDateString('uk-UA')}
                  </div>
                )}
              </div>

              {/* Статус */}
              {lesson.completedAt && (
                <span style={{ fontSize: 13, color: '#34a853', fontWeight: 500 }}>Пройдено</span>
              )}

              <span style={{ color: '#aaa', fontSize: 18 }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
