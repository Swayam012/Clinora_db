const API_BASE_URL = "http://localhost:8000";

function getAuthHeaders(isMultipart = false) {
  const token = localStorage.getItem("clinora_token");
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Checks backend health endpoint and measures latency.
 */
export async function checkBackendHealth() {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (!response.ok) {
      return { status: "error", connected: false, message: `HTTP ${response.status}`, latency };
    }
    const data = await response.json();
    return { status: "success", connected: true, data, latency };
  } catch (error) {
    const endTime = performance.now();
    return { status: "error", connected: false, message: error.message, latency: Math.round(endTime - startTime) };
  }
}

/**
 * Authenticate user and get JWT token.
 */
export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }
  return data;
}

/**
 * Register a new user account.
 */
export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }
  return data;
}

/**
 * Get current authenticated user profile.
 */
export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Not authenticated");
  }
  return response.json();
}

/**
 * List patients with pagination and optional search filter.
 */
export async function getPatients(page = 1, perPage = 50, search = "") {
  let url = `${API_BASE_URL}/api/v1/patients?page=${page}&per_page=${perPage}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch patients");
  }
  return response.json();
}

/**
 * Get single patient details by ID.
 */
export async function getPatient(patientId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch patient details");
  }
  return response.json();
}

/**
 * Create a new patient.
 */
export async function createPatient(patientData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(patientData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to create patient");
  }
  return data;
}

/**
 * Update an existing patient.
 */
export async function updatePatient(patientId, updateData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update patient");
  }
  return data;
}

/**
 * Soft delete / deactivate a patient.
 */
export async function deletePatient(patientId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete patient");
  }
  return response.json();
}

// ============================================
// Clinical Document Management API
// ============================================

/**
 * Upload a clinical document with file and metadata.
 */
export async function uploadDocument(formData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
    method: "POST",
    headers: getAuthHeaders(true), // True for multipart
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Document upload failed");
  }
  return data;
}

/**
 * List documents with multi-parameter filtering and search.
 */
export async function getDocuments({
  page = 1,
  perPage = 20,
  patientId = null,
  documentType = null,
  status = null,
  search = "",
} = {}) {
  let url = `${API_BASE_URL}/api/v1/documents?page=${page}&per_page=${perPage}`;
  if (patientId) url += `&patient_id=${patientId}`;
  if (documentType && documentType !== "all") url += `&document_type=${documentType}`;
  if (status && status !== "all") url += `&status=${status}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }
  return response.json();
}

/**
 * Get document metadata by ID.
 */
export async function getDocument(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch document metadata");
  }
  return response.json();
}

/**
 * Get the direct streaming/download URL for a document file.
 */
export function getDocumentFileUrl(documentId) {
  const token = localStorage.getItem("clinora_token");
  let url = `${API_BASE_URL}/api/v1/documents/${documentId}/file`;
  if (token) {
    url += `?token=${encodeURIComponent(token)}`;
  }
  return url;
}

/**
 * Update document metadata or processing status.
 */
export async function updateDocument(documentId, updateData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update document");
  }
  return data;
}

/**
 * Soft delete a clinical document.
 */
export async function deleteDocument(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete document");
  }
  return response.json();
}
