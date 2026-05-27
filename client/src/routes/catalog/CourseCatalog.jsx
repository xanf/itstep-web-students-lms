import { useQuery } from '@tanstack/react-query'
import { getCourses } from '../../api/courses.js'

export function CourseCatalog() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  if (isLoading) return <div>Завантаження...</div>
  if (isError) return <div>Помилка завантаження</div>

  return (
    <div>
      {data.data.map((course) => (
        <div key={course.id}>
          <p>{course.title}</p>
          <p>{course.description}</p>
          <p>{course.instructor.fullName}</p>
        </div>
      ))}
    </div>
  )
}