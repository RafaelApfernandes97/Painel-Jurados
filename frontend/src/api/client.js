import http from "./http";

export const authApi = {
  loginClient: async (payload) => (await http.post("/auth/client/login", payload)).data
};

export const eventsApi = {
  list: async () => (await http.get("/events")).data,
  create: async (payload) => (await http.post("/events", payload)).data,
  update: async (id, payload) => (await http.put(`/events/${id}`, payload)).data,
  remove: async (id) => (await http.delete(`/events/${id}`)).data,
  getDashboard: async (eventId) => (await http.get(`/events/${eventId}/dashboard`)).data,
  callChoreography: async (eventId, choreographyId) =>
    (await http.post(`/events/${eventId}/call/${choreographyId}`)).data,
  returnToQueue: async (eventId, choreographyId) =>
    (await http.post(`/events/${eventId}/queue/${choreographyId}`)).data,
  getCurrentChoreography: async (eventId) =>
    (await http.get(`/events/${eventId}/current-choreography`)).data,
  getRanking: async (eventId) => (await http.get(`/events/${eventId}/ranking`)).data,
  withdrawChoreography: async (eventId, choreographyId) =>
    (await http.post(`/events/${eventId}/withdraw/${choreographyId}`)).data,
  restoreChoreography: async (eventId, choreographyId) =>
    (await http.post(`/events/${eventId}/restore/${choreographyId}`)).data
};

export const choreographiesApi = {
  list: async (eventId) => (await http.get(`/events/${eventId}/choreographies`)).data,
  create: async (eventId, payload) =>
    (await http.post(`/events/${eventId}/choreographies`, payload)).data,
  update: async (id, payload) => (await http.put(`/choreographies/${id}`, payload)).data,
  remove: async (id) => (await http.delete(`/choreographies/${id}`)).data,
  import: async (eventId, items) =>
    (await http.post(`/events/${eventId}/choreographies/import`, { items })).data
};

export const judgesApi = {
  list: async (eventId) => (await http.get(`/events/${eventId}/judges`)).data,
  create: async (eventId, payload) => (await http.post(`/events/${eventId}/judges`, payload)).data
};

export const scoresApi = {
  listStatus: async (eventId, choreographyId) =>
    (await http.get(`/events/${eventId}/scores/${choreographyId}`)).data
};

export const blocksApi = {
  list: async (eventId) => (await http.get(`/events/${eventId}/blocks`)).data,
  create: async (eventId, payload) => (await http.post(`/events/${eventId}/blocks`, payload)).data,
  update: async (id, payload) => (await http.put(`/blocks/${id}`, payload)).data,
  remove: async (id) => (await http.delete(`/blocks/${id}`)).data,
  assignChoreographies: async (eventId, blockId, choreographyIds) =>
    (await http.put(`/events/${eventId}/blocks/${blockId}/choreographies`, { choreographyIds })).data
};

export const registrationsApi = {
  // Admin endpoints (authenticated)
  list: async (eventId) => (await http.get(`/events/${eventId}/registrations`)).data,
  update: async (id, payload) => (await http.put(`/registrations/${id}`, payload)).data,
  updateVideo: async (id, coreografiaId, payload) =>
    (await http.put(`/registrations/${id}/coreografias/${coreografiaId}/video`, payload)).data,
  remove: async (id) => (await http.delete(`/registrations/${id}`)).data,
  approve: async (id) => (await http.post(`/registrations/${id}/approve`)).data,
  registerPayment: async (id, payload) =>
    (await http.post(`/registrations/${id}/payments`, payload)).data,
  // Public endpoints (no auth)
  getPublicEventInfo: async (eventId) => (await http.get(`/public/events/${eventId}/info`)).data,
  submitPublic: async (eventId, payload) =>
    (await http.post(`/public/events/${eventId}/registrations`, payload)).data,
  calculateValue: async (eventId, payload) =>
    (await http.post(`/public/events/${eventId}/financial/calculate`, payload)).data
};

export const financialApi = {
  getSummary: async (eventId) => (await http.get(`/events/${eventId}/financial/summary`)).data,
  getBySchool: async (eventId) => (await http.get(`/events/${eventId}/financial/by-school`)).data,
  getDetails: async (eventId) => (await http.get(`/events/${eventId}/financial/details`)).data
};

export const certificatesApi = {
  list: async (eventId) => (await http.get(`/events/${eventId}/certificates`)).data,
  get: async (eventId, choreographyId) =>
    (await http.get(`/events/${eventId}/certificates/${choreographyId}`)).data
};

export const juryApi = {
  access: async (token) => (await http.get(`/jury/access/${token}`)).data,
  submitScore: async (payload) => (await http.post("/jury/score", payload)).data,
  scoreLogs: async (token, choreographyId) =>
    (await http.get(`/jury/score-logs/${token}/${choreographyId}`)).data
};
