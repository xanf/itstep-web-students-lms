import apiClient from './client.js'

export async function getSections(courseId) {
  const { data } = await apiClient.get(`/courses/${courseId}/sections`)
  return data
}

export async function createSection(courseId, sectionData) {
  const { data } = await apiClient.post(`/courses/${courseId}/sections`, sectionData)
  return data
}

export async function updateSection({ id, ...sectionData }) {
  const { data } = await apiClient.patch(`/sections/${id}`, sectionData)
  return data
}

export async function deleteSection(id) {
  const { data } = await apiClient.delete(`/sections/${id}`)
  return data
}

export async function reorderSections(courseId, orderedIds) {
  const { data } = await apiClient.patch(`/courses/${courseId}/sections/reorder`, { orderedIds })
  return data
}
