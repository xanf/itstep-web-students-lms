import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

function fetchCourse(courseId) {
  return apiClient.get(`/courses/${courseId}`).then(r => r.data)
}

function fetchSections(courseId) {
  return apiClient.get(`/courses/${courseId}/sections`, { params: { pageSize: 100 } }).then(r => r.data)
}

function fetchLessons(courseId) {
  return apiClient.get(`/courses/${courseId}/lessons`, { params: { pageSize: 100 } }).then(r => r.data)
}

export function CourseBuilder() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saved, setSaved] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newLessonTitles, setNewLessonTitles] = useState({})

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId),
  })

  const { data: sectionsData, isLoading: loadingSections } = useQuery({
    queryKey: ['sections', courseId],
    queryFn: () => fetchSections(courseId),
  })

  const { data: lessonsData } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => fetchLessons(courseId),
  })

  useEffect(() => {
    if (course) {
      setTitle(course.title || '')
      setDescription(course.description || '')
    }
  }, [course])

  const saveCourse = useMutation({
    mutationFn: () => apiClient.patch(`/courses/${courseId}`, { title, description }),
    onSuccess: () => {
      setSaved(true)
      qc.invalidateQueries(['course', courseId])
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const addSection = useMutation({
    mutationFn: () => apiClient.post(`/courses/${courseId}/sections`, { title: newSectionTitle }),
    onSuccess: () => {
      setNewSectionTitle('')
      qc.invalidateQueries(['sections', courseId])
    },
  })

  const deleteSection = useMutation({
    mutationFn: (sectionId) => apiClient.delete(`/sections/${sectionId}`),
    onSuccess: () => qc.invalidateQueries(['sections', courseId]),
  })

  const addLesson = useMutation({
    mutationFn: ({ sectionId, lessonTitle }) =>
      apiClient.post(`/sections/${sectionId}/lessons`, { title: lessonTitle, contentMarkdown: '' }),
    onSuccess: (_, { sectionId }) => {
      setNewLessonTitles(prev => ({ ...prev, [sectionId]: '' }))
      qc.invalidateQueries(['lessons', courseId])
    },
  })

  const deleteLesson = useMutation({
    mutationFn: (lessonId) => apiClient.delete(`/lessons/${lessonId}`),
    onSuccess: () => qc.invalidateQueries(['lessons', courseId]),
  })

  if (loadingCourse) return <div style={{ padding: 32 }}>Завантаження...</div>

  const sections = Array.isArray(sectionsData) ? sectionsData : (sectionsData?.data || [])
  const lessons = Array.isArray(lessonsData) ? lessonsData : (lessonsData?.data || [])

  const getLessonsForSection = (sectionId) =>
    lessons.filter(l => l.sectionId === sectionId)

  return (
    <div style={{ padding: '24px', maxWidth: 860, margin: '0 auto' }}>
      <button
        onClick={() => navigate(`/courses/${courseId}`)}
        style={{
          marginBottom: 20, background: 'none', border: 'none',
          color: '#1a73e8', cursor: 'pointer', fontSize: 14, padding: 0,
        }}
      >
        ← До курсу
      </button>

      <h1 style={{ marginBottom: 24 }}>Редактор курсу</h1>

      {/* Основна інформація */}
      <div style={{
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12,
        padding: 24, marginBottom: 28,
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Основна інформація</h2>

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Назва курсу</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 16,
            border: '1px solid #ddd', borderRadius: 8, fontSize: 15,
            boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Опис</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 16,
            border: '1px solid #ddd', borderRadius: 8, fontSize: 15,
            boxSizing: 'border-box', resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => saveCourse.mutate()}
            disabled={saveCourse.isPending}
            style={{
              padding: '10px 24px', border: 'none', borderRadius: 8,
              background: '#1a73e8', color: '#fff', fontSize: 15,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            {saveCourse.isPending ? 'Збереження...' : 'Зберегти'}
          </button>
          {saved && <span style={{ color: '#34a853', fontWeight: 500 }}>✓ Збережено!</span>}
        </div>
      </div>

      {/* Розділи та уроки */}
      <div style={{
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12,
        padding: 24, marginBottom: 28,
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>Розділи та уроки</h2>

        {loadingSections && <p>Завантаження розділів...</p>}

        {sections.map(section => (
          <div key={section.id} style={{
            border: '1px solid #e8e8e8', borderRadius: 10, marginBottom: 16, overflow: 'hidden',
          }}>
            {/* Заголовок розділу */}
            <div style={{
              background: '#f8f9fa', padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{section.title}</span>
              <button
                onClick={() => deleteSection.mutate(section.id)}
                style={{
                  background: 'none', border: 'none', color: '#e53935',
                  cursor: 'pointer', fontSize: 13,
                }}
              >
                Видалити розділ
              </button>
            </div>

            {/* Уроки розділу */}
            <div style={{ padding: '12px 16px' }}>
              {getLessonsForSection(section.id).map(lesson => (
                <div key={lesson.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid #f0f0f0',
                }}>
                  <span
                    onClick={() => navigate(`/lessons/${lesson.id}/edit`)}
                    style={{ cursor: 'pointer', color: '#1a73e8', fontSize: 14 }}
                  >
                    {lesson.title}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => navigate(`/lessons/${lesson.id}/edit`)}
                      style={{
                        background: 'none', border: '1px solid #ddd', borderRadius: 6,
                        padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#555',
                      }}
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => deleteLesson.mutate(lesson.id)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#e53935', cursor: 'pointer', fontSize: 13,
                      }}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              ))}

              {/* Додати урок */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  placeholder="Назва нового уроку..."
                  value={newLessonTitles[section.id] || ''}
                  onChange={e => setNewLessonTitles(prev => ({ ...prev, [section.id]: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newLessonTitles[section.id]?.trim()) {
                      addLesson.mutate({ sectionId: section.id, lessonTitle: newLessonTitles[section.id].trim() })
                    }
                  }}
                  style={{
                    flex: 1, padding: '8px 12px', border: '1px solid #ddd',
                    borderRadius: 6, fontSize: 14,
                  }}
                />
                <button
                  onClick={() => {
                    if (newLessonTitles[section.id]?.trim()) {
                      addLesson.mutate({ sectionId: section.id, lessonTitle: newLessonTitles[section.id].trim() })
                    }
                  }}
                  style={{
                    padding: '8px 16px', border: 'none', borderRadius: 6,
                    background: '#1a73e8', color: '#fff', cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  + Урок
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Додати розділ */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            placeholder="Назва нового розділу..."
            value={newSectionTitle}
            onChange={e => setNewSectionTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newSectionTitle.trim()) {
                addSection.mutate()
              }
            }}
            style={{
              flex: 1, padding: '10px 14px', border: '1px solid #ddd',
              borderRadius: 8, fontSize: 15,
            }}
          />
          <button
            onClick={() => { if (newSectionTitle.trim()) addSection.mutate() }}
            style={{
              padding: '10px 20px', border: 'none', borderRadius: 8,
              background: '#34a853', color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}
          >
            + Розділ
          </button>
        </div>
      </div>
    </div>
  )
}
