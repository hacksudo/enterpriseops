export function getApiBase(): string {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    const port = window.location.port;
    if (port) {
      // If accessed via port 3xxx (e.g. 3000, 3001, 3002), automatically pair with backend port 8xxx (8000, 8001, 8002)
      if (/^3\d{3}$/.test(port)) {
        const backendPort = (parseInt(port, 10) + 5000).toString();
        return `${window.location.protocol}//${window.location.hostname}:${backendPort}`;
      }
      // If frontend is directly accessed on a custom port
      return `${window.location.protocol}//${window.location.hostname}:${port}`;
    }
    // Behind reverse proxy (e.g. port 80/443), use relative URL
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("enterpriseops_token");
}

export function setStoredToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("enterpriseops_token", token);
  }
}

export function removeStoredToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("enterpriseops_token");
    localStorage.removeItem("enterpriseops_user");
  }
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const baseUrl = getApiBase();
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let errorDetail = "API Request failed";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

// API methods
export const api = {
  // Auth
  login: (data: any) => apiRequest("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => apiRequest("/api/v1/auth/me"),
  logout: () => apiRequest("/api/v1/auth/logout", { method: "POST" }),

  // Bootstrap
  initBootstrap: () => apiRequest("/api/v1/bootstrap/init", { method: "POST" }),
  getBootstrapStatus: () => apiRequest("/api/v1/bootstrap/status"),

  // Organizations & Workspaces
  getDepartments: () => apiRequest("/api/v1/org/departments"),
  createDepartment: (data: any) => apiRequest("/api/v1/org/departments", { method: "POST", body: JSON.stringify(data) }),
  getWorkspaces: () => apiRequest("/api/v1/org/workspaces"),
  createWorkspace: (data: any) => apiRequest("/api/v1/org/workspaces", { method: "POST", body: JSON.stringify(data) }),
  getUsers: (deptId?: string) => apiRequest(deptId ? `/api/v1/users?department_id=${deptId}` : "/api/v1/users"),
  createUser: (data: any) => apiRequest("/api/v1/users", { method: "POST", body: JSON.stringify(data) }),
  updateUserStatus: (id: string, status: string) => apiRequest(`/api/v1/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ account_status: status }) }),
  resetUserPassword: (id: string, newPassword: string) => apiRequest(`/api/v1/users/${id}/reset-password`, { method: "PATCH", body: JSON.stringify({ new_password: newPassword }) }),
  deleteUser: (id: string) => apiRequest(`/api/v1/users/${id}`, { method: "DELETE" }),

  // Analytics
  getExecutiveStats: () => apiRequest("/api/v1/analytics/executive"),
  getEmployeeStats: () => apiRequest("/api/v1/analytics/employee"),
  getPmoStats: () => apiRequest("/api/v1/analytics/pmo"),

  // Worklogs
  getWorkStatus: () => apiRequest("/api/v1/worklogs/status"),
  checkin: (data: any = {}) => apiRequest("/api/v1/worklogs/checkin", { method: "POST", body: JSON.stringify(data) }),
  checkout: () => apiRequest("/api/v1/worklogs/checkout", { method: "POST" }),
  submitDailyReport: (data: any) => apiRequest("/api/v1/worklogs/daily-reports", { method: "POST", body: JSON.stringify(data) }),
  getDailyReports: () => apiRequest("/api/v1/worklogs/daily-reports"),

  // Tasks
  getTasks: (params: string = "") => apiRequest(`/api/v1/tasks${params}`),
  createTask: (data: any) => apiRequest("/api/v1/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => apiRequest(`/api/v1/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: string) => apiRequest(`/api/v1/tasks/${id}`, { method: "DELETE" }),
  clearAllTasks: () => apiRequest("/api/v1/tasks/clear-all", { method: "DELETE" }),
  addTaskComment: (id: string, content: string) => apiRequest(`/api/v1/tasks/${id}/comments`, { method: "POST", body: JSON.stringify({ content }) }),

  // VAPT
  calculateCVSS: (version: string, vector: string) => apiRequest("/api/v1/vapt/cvss/calculate", { method: "POST", body: JSON.stringify({ version, vector }) }),
  getFindings: (params: string = "") => apiRequest(`/api/v1/vapt/findings${params}`),
  createFinding: (data: any) => apiRequest("/api/v1/vapt/findings", { method: "POST", body: JSON.stringify(data) }),
  updateFinding: (id: string, data: any) => apiRequest(`/api/v1/vapt/findings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  uploadExtractFindings: (formData: FormData) => apiRequest("/api/v1/vapt/findings/upload-extract", { method: "POST", body: formData }),
  bulkImportFindings: (data: any) => apiRequest("/api/v1/vapt/findings/bulk-import", { method: "POST", body: JSON.stringify(data) }),
  clearAllFindings: () => apiRequest("/api/v1/vapt/findings/clear-all", { method: "DELETE" }),
  deleteFinding: (id: string) => apiRequest(`/api/v1/vapt/findings/${id}`, { method: "DELETE" }),
  retestFinding: (id: string, data: any) => apiRequest(`/api/v1/vapt/findings/${id}/retest`, { method: "POST", body: JSON.stringify(data) }),
  getEngagements: () => apiRequest("/api/v1/vapt/engagements"),
  downloadFindingsExcel: async (params: string = "") => {
    const token = getStoredToken();
    const baseUrl = getApiBase();
    const res = await fetch(`${baseUrl}/api/v1/vapt/findings/export/excel${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Failed to export Excel report");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EnterpriseOps_VAPT_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  downloadFindingsDocx: async (params: string = "") => {
    const token = getStoredToken();
    const baseUrl = getApiBase();
    const res = await fetch(`${baseUrl}/api/v1/vapt/findings/export/docx${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Failed to export Word report");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EnterpriseOps_VAPT_Report_${new Date().toISOString().slice(0, 10)}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Collaboration / Handoffs
  getHandoffs: () => apiRequest("/api/v1/handoffs"),
  createHandoff: (data: any) => apiRequest("/api/v1/handoffs", { method: "POST", body: JSON.stringify(data) }),
  respondHandoff: (id: string, status: string, notes?: string) => apiRequest(`/api/v1/handoffs/${id}/respond`, { method: "PATCH", body: JSON.stringify({ status, notes }) }),

  // Reports
  getReports: () => apiRequest("/api/v1/reports"),
  generateReport: (data: any) => apiRequest("/api/v1/reports", { method: "POST", body: JSON.stringify(data) }),

  // Chat
  getChannels: () => apiRequest("/api/v1/chat/channels"),
  getMessages: (channelId: string) => apiRequest(`/api/v1/chat/channels/${channelId}/messages`),
  sendMessage: (channelId: string, content: string) => apiRequest(`/api/v1/chat/channels/${channelId}/messages`, { method: "POST", body: JSON.stringify({ content }) }),

  // Notifications & Audit
  getNotifications: () => apiRequest("/api/v1/notifications"),
  markNotificationRead: (id: string) => apiRequest(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),
  getAuditLogs: () => apiRequest("/api/v1/audit/logs"),

  // System & Fresh Launch
  clearDemoData: (wipeDemoUsers: boolean = false) => apiRequest("/api/v1/bootstrap/clear-demo-data", { method: "POST", body: JSON.stringify({ wipe_demo_users: wipeDemoUsers }) }),
};
