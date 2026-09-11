const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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

async function handleApiResponse(response, defaultErrorMsg = "Request failed") {
  if (response.status === 429) {
    let errorDetail = "Rate limit exceeded. Please wait a moment before trying again.";
    try {
      const data = await response.json();
      if (data?.detail) errorDetail = data.detail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  if (response.status === 401) {
    localStorage.removeItem("clinora_token");
    let errorDetail = "Authentication required or session expired. Please sign in.";
    try {
      const data = await response.json();
      if (data?.detail) errorDetail = data.detail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMsg = data?.detail || defaultErrorMsg;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      errorMsg = data.errors.join("; ");
    }
    throw new Error(errorMsg);
  }
  return data;
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

  return handleApiResponse(response, "Login failed");
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

  return handleApiResponse(response, "Registration failed");
}

/**
 * Fetch profile of currently authenticated user.
 */
export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Failed to fetch user profile");
}

/**
 * Fetch paginated list of patients.
 */
export async function getPatients(page = 1, perPage = 20, search = "", isActive = true) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  if (search) {
    params.append("search", search);
  }
  if (isActive !== null) {
    params.append("is_active", String(isActive));
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/patients?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Failed to fetch patients");
}

/**
 * Fetch single patient by UUID.
 */
export async function getPatient(patientId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Failed to fetch patient details");
}

/**
 * Create a new patient record.
 */
export async function createPatient(patientData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(patientData),
  });

  return handleApiResponse(response, "Failed to create patient");
}

/**
 * Update an existing patient record.
 */
export async function updatePatient(patientId, patientData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(patientData),
  });

  return handleApiResponse(response, "Failed to update patient");
}

/**
 * Soft delete a patient record.
 */
export async function deletePatient(patientId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Failed to delete patient");
}

/**
 * Upload a new clinical document.
 */
export async function uploadDocument(formData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });

  return handleApiResponse(response, "Failed to upload document");
}

/**
 * Fetch paginated list of clinical documents.
 */
export async function getDocuments({
  page = 1,
  perPage = 20,
  patientId = null,
  documentType = null,
  status = null,
  search = "",
  isActive = true,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  if (patientId) params.append("patient_id", patientId);
  if (documentType && documentType !== "all") params.append("document_type", documentType);
  if (status) params.append("status", status);
  if (search) params.append("search", search);
  if (isActive !== null) params.append("is_active", String(isActive));

  const response = await fetch(`${API_BASE_URL}/api/v1/documents?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Failed to fetch documents");
}

/**
 * Fetch metadata for a single clinical document.
 */
export async function getDocument(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Failed to fetch document metadata");
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
 * Trigger OCR text extraction on a clinical document.
 * POST /api/v1/documents/{documentId}/ocr
 */
export async function triggerDocumentOcr(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/ocr`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "OCR extraction failed");
}

/**
 * Trigger structured clinical information extraction via LLM/NLP (Phase 6).
 * POST /api/v1/documents/{documentId}/extract
 */
export async function triggerClinicalExtraction(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/extract`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Clinical entity extraction failed");
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

  return handleApiResponse(response, "Failed to update document");
}

/**
 * Soft delete a clinical document.
 */
export async function deleteDocument(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Failed to delete document");
}

/**
 * Ask natural language clinical question with grounded RAG answers & citations (Phase 7).
 * POST /api/v1/rag/query
 */
export async function queryClinicalRag({ query, patientId = null, topK = 4 }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/rag/query`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      query,
      patient_id: patientId,
      top_k: topK,
    }),
  });

  return handleApiResponse(response, "Clinical Q&A query failed");
}

/**
 * Perform semantic vector search across clinical records (Phase 7).
 * GET /api/v1/rag/search
 */
export async function searchSemanticDocuments({ query, patientId = null, topK = 6 }) {
  const params = new URLSearchParams({
    query,
    top_k: String(topK),
  });
  if (patientId) params.append("patient_id", patientId);

  const response = await fetch(`${API_BASE_URL}/api/v1/rag/search?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Semantic search failed");
}

/**
 * Trigger re-indexing of all clinical documents into vector database.
 * POST /api/v1/rag/index
 */
export async function reindexVectorStore() {
  const response = await fetch(`${API_BASE_URL}/api/v1/rag/index`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  return handleApiResponse(response, "Vector re-indexing failed");
}

