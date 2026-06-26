import apiClient from './client.js'

export async function getCourseLessons(courseId, params = {}) {
  const { data } = await apiClient.get(`/courses/${courseId}/lessons`, { params })
  return data // returns { data, meta }
}

export async function getSectionLessons(sectionId) {
  const { data } = await apiClient.get(`/sections/${sectionId}/lessons`)
  return data
}

export async function createLesson(sectionId, lessonData) {
  const { data } = await apiClient.post(`/sections/${sectionId}/lessons`, lessonData)
  return data
}

export async function updateLesson({ id, ...lessonData }) {
  const { data } = await apiClient.patch(`/lessons/${id}`, lessonData)
  return data
}

export async function deleteLesson(id) {
  const { data } = await apiClient.delete(`/lessons/${id}`)
  return data
}

export async function reorderLessons(sectionId, orderedIds) {
  const { data } = await apiClient.patch(`/sections/${sectionId}/lessons/reorder`, { orderedIds })
  return data
}
