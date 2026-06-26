import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../../api/client.js'
import { getSections, createSection, updateSection, deleteSection, reorderSections } from '../../../api/sections.js'
import { getCourseLessons, createLesson, deleteLesson, reorderLessons } from '../../../api/lessons.js'
import { createAssignment, updateAssignment, deleteAssignment } from '../../../api/assignments.js'

export function useCourseBuilderData(courseId) {
  const queryClient = useQueryClient()

  // --- Queries ---
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/courses/${courseId}`)
      return data
    }
  })

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', courseId],
    queryFn: () => getSections(courseId)
  })

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => getCourseLessons(courseId, { pageSize: 100 })
  })

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/courses/${courseId}/assignments`, { params: { pageSize: 100 } })
      return data
    }
  })

  const isLoading = courseLoading || sectionsLoading || lessonsLoading || assignmentsLoading

  // --- Mutations ---
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['sections', courseId] })
    queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
    queryClient.invalidateQueries({ queryKey: ['assignments', courseId] })
  }

  // Sections
  const createSecMut = useMutation({ mutationFn: (d) => createSection(courseId, d), onSuccess: invalidateAll })
  const updateSecMut = useMutation({ mutationFn: updateSection, onSuccess: invalidateAll })
  const deleteSecMut = useMutation({ mutationFn: deleteSection, onSuccess: invalidateAll })
  const reorderSecMut = useMutation({ mutationFn: (ids) => reorderSections(courseId, ids), onSuccess: invalidateAll })

  // Lessons
  const createLessMut = useMutation({ mutationFn: ({ sectionId, data }) => createLesson(sectionId, data), onSuccess: invalidateAll })
  const deleteLessMut = useMutation({ mutationFn: deleteLesson, onSuccess: invalidateAll })
  const reorderLessMut = useMutation({ mutationFn: ({ sectionId, ids }) => reorderLessons(sectionId, ids), onSuccess: invalidateAll })

  // Assignments
  const createAssMut = useMutation({ mutationFn: ({ sectionId, data }) => createAssignment(sectionId, data), onSuccess: invalidateAll })
  const updateAssMut = useMutation({ mutationFn: updateAssignment, onSuccess: invalidateAll })
  const deleteAssMut = useMutation({ mutationFn: deleteAssignment, onSuccess: invalidateAll })

  // --- Drag and Drop Logic ---
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over) return
    if (active.id === over.id) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    if (activeIdStr.startsWith('section-')) {
      const activeId = activeIdStr.replace('section-', '')
      const overId = overIdStr.replace('section-', '')

      const sections = sectionsData || []
      const oldIndex = sections.findIndex(s => s.id === activeId)
      const newIndex = sections.findIndex(s => s.id === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = Array.from(sections)
        const [moved] = newSections.splice(oldIndex, 1)
        newSections.splice(newIndex, 0, moved)

        queryClient.setQueryData(['sections', courseId], newSections)
        reorderSecMut.mutate(newSections.map(s => s.id))
      }
    } 
    else if (activeIdStr.startsWith('lesson-')) {
      const activeId = activeIdStr.replace('lesson-', '')
      const overId = overIdStr.replace('lesson-', '')

      const allLessons = lessonsData?.data || []
      const activeLesson = allLessons.find(l => l.id === activeId)
      if (!activeLesson) return
      const sectionId = activeLesson.sectionId

      const sectionLessons = allLessons.filter(l => l.sectionId === sectionId).sort((a,b) => a.order - b.order)
      const oldIndex = sectionLessons.findIndex(l => l.id === activeId)
      const newIndex = sectionLessons.findIndex(l => l.id === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newLessons = Array.from(sectionLessons)
        const [moved] = newLessons.splice(oldIndex, 1)
        newLessons.splice(newIndex, 0, moved)

        // Optimistic Update без мутации оригинальных объектов!
        const newOrderMap = {}
        newLessons.forEach((l, idx) => { newOrderMap[l.id] = idx })

        const oldLessonsData = queryClient.getQueryData(['lessons', courseId])
        if (oldLessonsData) {
          const updatedAllLessons = (oldLessonsData.data || []).map(l => {
            if (l.sectionId === sectionId && newOrderMap[l.id] !== undefined) {
               return { ...l, order: newOrderMap[l.id] } // Создаем новый объект!
            }
            return l
          })
          queryClient.setQueryData(['lessons', courseId], { ...oldLessonsData, data: updatedAllLessons })
        }

        reorderLessMut.mutate({ sectionId, ids: newLessons.map(l => l.id) })
      }
    }
  }

  return {
    isLoading,
    course,
    sectionsData,
    lessonsData,
    assignmentsData,
    handleDragEnd,
    mutations: {
      createSecMut, updateSecMut, deleteSecMut,
      createLessMut, deleteLessMut,
      createAssMut, updateAssMut, deleteAssMut
    }
  }
}
