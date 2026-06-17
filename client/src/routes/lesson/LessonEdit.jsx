import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'
import apiClient from '../../api/client.js'

function fetchLesson(lessonId) {
  return apiClient.get(`/lessons/${lessonId}`).then(r => r.data)
}

export function LessonEdit() {
  const { lessonId } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => fetchLesson(lessonId),
  })

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || '')
      setContent(lesson.contentMarkdown || '')
    }
  }, [lesson])

  const save = useMutation({
    mutationFn: () => apiClient.patch(`/lessons/${lessonId}`, { title, contentMarkdown: content }),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  if (isLoading) return <div style={{ padding: 32 }}>Завантаження...</div>

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 20, background: 'none', border: 'none',
          color: '#1a73e8', cursor: 'pointer', fontSize: 14, padding: 0,
        }}
      >
        ← Назад
      </button>

      <h1 style={{ marginBottom: 20 }}>Редагування уроку</h1>

      {/* Заголовок */}
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Назва уроку</label>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', marginBottom: 20,
          border: '1px solid #ddd', borderRadius: 8, fontSize: 15,
          boxSizing: 'border-box',
        }}
      />

      {/* MD редактор */}
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Вміст (Markdown)</label>
      <div data-color-mode="light" style={{ marginBottom: 24 }}>
        <MDEditor
          value={content}
          onChange={setContent}
          height={400}
          preview="live"
        />
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          style={{
            padding: '10px 28px', border: 'none', borderRadius: 8,
            background: '#1a73e8', color: '#fff', fontSize: 15,
            cursor: 'pointer', fontWeight: 600,
          }}
        >
          {save.isPending ? 'Збереження...' : 'Зберегти'}
        </button>
        <button
          onClick={() => navigate(`/lessons/${lessonId}`)}
          style={{
            padding: '10px 20px', border: '1px solid #ddd', borderRadius: 8,
            background: '#fff', color: '#555', fontSize: 15, cursor: 'pointer',
          }}
        >
          Скасувати
        </button>
        {saved && <span style={{ color: '#34a853', fontWeight: 500 }}>✓ Збережено!</span>}
        {save.isError && <span style={{ color: 'red' }}>Помилка збереження</span>}
      </div>
    </div>
  )
}
