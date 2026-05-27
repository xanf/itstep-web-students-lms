import apiClient from './client.js'

export const getCourses = async () => {
  const { data } = await apiClient.get('/courses/')
  return data
}