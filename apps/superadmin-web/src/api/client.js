import http from "./http";

export const authApi = {
  login: async (payload) => (await http.post("/auth/superadmin/login", payload)).data
};

export const dashboardApi = {
  getMetrics: async () => (await http.get("/superadmin/dashboard")).data
};

export const clientsApi = {
  list: async () => (await http.get("/superadmin/clients")).data,
  create: async (payload) => (await http.post("/superadmin/clients", payload)).data,
  update: async (id, payload) => (await http.put(`/superadmin/clients/${id}`, payload)).data,
  toggleStatus: async (id) => (await http.patch(`/superadmin/clients/${id}/toggle-status`)).data,
  remove: async (id) => (await http.delete(`/superadmin/clients/${id}`)).data,
  getEvents: async (id) => (await http.get(`/superadmin/clients/${id}/events`)).data
};
