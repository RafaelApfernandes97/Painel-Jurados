export const APP_ROUTES = {
  login: "/superadmin/login",
  dashboard: "/superadmin/dashboard",
  clients: "/superadmin/clients",
  clientDetail: (clientId = ":clientId") => `/superadmin/clients/${clientId}`
};
