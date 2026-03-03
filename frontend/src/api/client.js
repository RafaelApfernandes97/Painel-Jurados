import http from "./http";

export const authApi = {
  loginClient: async (payload) => (await http.post("/auth/client/login", payload)).data
};

export const eventsApi = {
  list: async () => (await http.get("/events")).data,
  create: async (payload) => (await http.post("/events", payload)).data,
  update: async (id, payload) => (await http.put(`/events/${id}`, payload)).data,
  remove: async (id) => (await http.delete(`/events/${id}`)).data,
  callChoreography: async (eventId, choreographyId) =>
    (await http.post(`/events/${eventId}/call/${choreographyId}`)).data,
  returnToQueue: async (eventId, choreographyId) =>
    (await http.post(`/events/${eventId}/queue/${choreographyId}`)).data,
  getCurrentChoreography: async (eventId) =>
    (await http.get(`/events/${eventId}/current-choreography`)).data,
  getRanking: async (eventId) => (await http.get(`/events/${eventId}/ranking`)).data
};

export const choreographiesApi = {
  list: async (eventId) => (await http.get(`/events/${eventId}/choreographies`)).data,
  create: async (eventId, payload) =>
    (await http.post(`/events/${eventId}/choreographies`, payload)).data,
  update: async (id, payload) => (await http.put(`/choreographies/${id}`, payload)).data,
  remove: async (id) => (await http.delete(`/choreographies/${id}`)).data
};

export const judgesApi = {
  list: async (eventId) => (await http.get(`/events/${eventId}/judges`)).data,
  create: async (eventId, payload) => (await http.post(`/events/${eventId}/judges`, payload)).data
};

export const scoresApi = {
  listStatus: async (eventId, choreographyId) =>
    (await http.get(`/events/${eventId}/scores/${choreographyId}`)).data
};

export const juryApi = {
  access: async (token) => (await http.get(`/jury/access/${token}`)).data,
  submitScore: async (payload) => (await http.post("/jury/score", payload)).data
};
