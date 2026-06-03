import apiClient from "./client";

export const materialsApi = {
  getAll: (params) =>
    apiClient.get("/materials", { params }).then((r) => r.data),

  create: (body) =>
    apiClient.post("/materials", body).then((r) => r.data),

  update: ({ id, ...body }) =>
    apiClient.patch(`/materials/${id}`, body).then((r) => r.data),

  remove: (id) =>
    apiClient.delete(`/materials/${id}`),

  addFavorite: (id) =>
    apiClient.post(`/materials/${id}/favorite`).then((r) => r.data),

  removeFavorite: (id) =>
    apiClient.delete(`/materials/${id}/favorite`).then((r) => r.data),
};
