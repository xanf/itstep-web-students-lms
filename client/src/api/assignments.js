import apiClient from './client.js'

export async function getSectionAssignments(sectionId, params = {}) {
  const { data } = await apiClient.get(`/sections/${sectionId}/assignments`, { params })
  return data // returns { data, meta }
}

export async function createAssignment(sectionId, assignmentData) {
  const { data } = await apiClient.post(`/sections/${sectionId}/assignments`, assignmentData)
  return data
}

export async function updateAssignment({ id, ...assignmentData }) {
  const { data } = await apiClient.patch(`/assignments/${id}`, assignmentData)
  return data
}

export async function deleteAssignment(id) {
  const { data } = await apiClient.delete(`/assignments/${id}`)
  return data
}
