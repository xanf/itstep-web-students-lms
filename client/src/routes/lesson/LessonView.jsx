import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { useAuth } from '../../auth/useAuth.js'
import apiClient from '../../api/client.js'

function fetchLesson(lessonId) {
  return apiClient.get(`/lessons/${lessonId}`).then(r => r.data)
}

export function LessonView() {
  const { lessonId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => fetchLesson(lessonId),
  })

  const complete = useMutation({
    mutationFn: () => apiClient.post(`/lessons/${lessonId}/complete`),
    onSuccess: () => qc.invalidateQueries(['lesson', lessonId]),
  })

  if (isLoading) return <div style={{ padding: 32 }}>Завантаження уроку...</div>
  if (isError) return <div style={{ padding: 32, color: 'red' }}>Помилка завантаження уроку</div>

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 20, background: 'none', border: 'none',
          color: '#1a73e8', cursor: 'pointer', fontSize: 14, padding: 0,
        }}
      >
        ← Назад
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 26 }}>{lesson.title}</h1>
        {user?.role === 'Instructor' && (
          <button
            onClick={() => navigate(`/lessons/${lessonId}/edit`)}
            style={{
              padding: '8px 16px', border: '1px solid #1a73e8', borderRadius: 6,
              background: '#fff', color: '#1a73e8', cursor: 'pointer', fontWeight: 500,
            }}
          >
            Редагувати
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, color: '#888', fontSize: 14 }}>
        {lesson.publishedAt && (
          <span>Опубліковано: {new Date(lesson.publishedAt).toLocaleDateString('uk-UA')}</span>
        )}
        {lesson.completedAt && (
          <span style={{ color: '#34a853', fontWeight: 500 }}>✓ Урок завершено</span>
        )}
      </div>

      {/* Markdown контент */}
      <div style={{
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
        padding: 28, lineHeight: 1.8, fontSize: 16, minHeight: 200,
      }}>
        {lesson.content
          ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {lesson.content}
            </ReactMarkdown>
          )
          : <span style={{ color: '#aaa' }}>Вміст уроку відсутній</span>
        }
      </div>

      {user?.role === 'Student' && !lesson.completedAt && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => complete.mutate()}
            disabled={complete.isPending}
            style={{
              padding: '12px 28px', border: 'none', borderRadius: 8,
              background: '#34a853', color: '#fff', fontSize: 15,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            {complete.isPending ? 'Збереження...' : '✓ Позначити як виконаний'}
          </button>
        </div>
      )}
    </div>
  )
}
