import apiClient from './client.js'

export const getCourses = async (params = {}) => {
  const { data } = await apiClient.get('/courses', { params })
  return data
}

export const getCourse = async (id) => {
  const { data } = await apiClient.get(`/courses/${id}`)
  return data
}

export const createCourse = async (courseData) => {
  const { data } = await apiClient.post('/courses', courseData)
  return data
}

export const updateCourse = async (id, courseData) => {
  const { data } = await apiClient.patch(`/courses/${id}`, courseData)
  return data
}

export const enrollCourse = async (courseId) => {
  const { data } = await apiClient.post(`/courses/${courseId}/enroll`)
  return data
}

export const getEnrollments = (courseId) => apiClient.get(`/courses/${courseId}/enrollments`)

export const deleteCourse = (id) => apiClient.delete(`/courses/${id}`)

export const hideEnrollment = (enrollmentId) => apiClient.post(`/enrollments/${enrollmentId}/hide`)

export const unhideEnrollment = (enrollmentId) => apiClient.post(`/enrollments/${enrollmentId}/unhide`)
