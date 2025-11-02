/**
 * API Client for SRS Link Manager Backend
 * Handles all HTTP requests to the FastAPI backend
 */

import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging (optional)
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// ===== File Upload API =====

/**
 * Upload one or more Excel files
 * @param {FileList} files - Files to upload
 * @returns {Promise} Upload response
 */
export const uploadFiles = async (files) => {
  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i])
  }

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

/**
 * Get list of uploaded files
 * @returns {Promise} List of files
 */
export const getUploadedFiles = async () => {
  const response = await api.get('/files')
  return response.data
}

/**
 * Delete an uploaded file
 * @param {string} filename - Name of file to delete
 * @returns {Promise} Delete response
 */
export const deleteFile = async (filename) => {
  const response = await api.delete(`/files/${filename}`)
  return response.data
}

/**
 * Analyze uploaded files and create groups
 * @param {Array<string>} filePaths - Optional list of specific files to analyze
 * @returns {Promise} Analysis results
 */
export const analyzeFiles = async (filePaths = null) => {
  const response = await api.post('/analyze', {
    file_paths: filePaths,
  })
  return response.data
}

// ===== File Viewer API =====

/**
 * Get file statistics without loading all data
 * @param {string} filename - Name of the file
 * @returns {Promise} File statistics
 */
export const getFileStats = async (filename) => {
  const response = await api.get(`/files/${filename}/stats`)
  return response.data
}

/**
 * Get paginated file data with filtering
 * @param {string} filename - Name of the file
 * @param {number} offset - Starting index
 * @param {number} limit - Number of items to return
 * @param {boolean} filterOrphaned - Filter orphaned items only
 * @param {string} search - Search term
 * @returns {Promise} Paginated file data
 */
export const getFileData = async (filename, offset = 0, limit = 100, filterOrphaned = null, search = null) => {
  const params = new URLSearchParams()
  params.append('offset', offset)
  params.append('limit', limit)
  if (filterOrphaned !== null) {
    params.append('filter_orphaned', filterOrphaned)
  }
  if (search) {
    params.append('search', search)
  }

  const response = await api.get(`/files/${filename}/data?${params.toString()}`)
  return response.data
}

/**
 * Get all file data for client-side virtual scrolling
 * @param {string} filename - Name of the file
 * @returns {Promise} All file data
 */
export const getFileAllData = async (filename) => {
  const response = await api.get(`/files/${filename}/all`)
  return response.data
}

// ===== Group API =====

/**
 * Get all groups
 * @returns {Promise} List of groups
 */
export const getAllGroups = async () => {
  const response = await api.get('/groups')
  return response.data
}

/**
 * Get a specific group by ID
 * @param {string} groupId - Group ID
 * @returns {Promise} Group data
 */
export const getGroup = async (groupId) => {
  const response = await api.get(`/groups/${groupId}`)
  return response.data
}

/**
 * Update a group
 * @param {string} groupId - Group ID
 * @param {Object} updates - Update data
 * @returns {Promise} Updated group
 */
export const updateGroup = async (groupId, updates) => {
  const response = await api.put(`/groups/${groupId}`, updates)
  return response.data
}

/**
 * Delete a group
 * @param {string} groupId - Group ID
 * @returns {Promise} Delete response
 */
export const deleteGroup = async (groupId) => {
  const response = await api.delete(`/groups/${groupId}`)
  return response.data
}

/**
 * Add an item to a group
 * @param {string} groupId - Group ID
 * @param {Object} item - Item data
 * @returns {Promise} Updated group
 */
export const addItemToGroup = async (groupId, item) => {
  const response = await api.post(`/groups/${groupId}/items`, { item })
  return response.data
}

/**
 * Remove an item from a group
 * @param {string} groupId - Group ID
 * @param {string} itemId - Item ID
 * @returns {Promise} Updated group
 */
export const removeItemFromGroup = async (groupId, itemId) => {
  const response = await api.delete(`/groups/${groupId}/items/${itemId}`)
  return response.data
}

/**
 * Merge two groups
 * @param {string} groupId1 - First group ID (will be kept)
 * @param {string} groupId2 - Second group ID (will be deleted)
 * @param {string} newName - Optional new name for merged group
 * @returns {Promise} Merged group
 */
export const mergeGroups = async (groupId1, groupId2, newName = null) => {
  const response = await api.post('/groups/merge', {
    group_id_1: groupId1,
    group_id_2: groupId2,
    new_name: newName,
  })
  return response.data
}

/**
 * Get group statistics
 * @returns {Promise} Statistics data
 */
export const getStatistics = async () => {
  const response = await api.get('/groups/statistics/summary')
  return response.data
}

/**
 * Export a group as JSON
 * @param {string} groupId - Group ID
 * @returns {Promise} Download URL
 */
export const exportGroupAsJSON = (groupId) => {
  return `/api/groups/${groupId}/export/json`
}

/**
 * Export a group as Excel
 * @param {string} groupId - Group ID
 * @returns {Promise} Download URL
 */
export const exportGroupAsExcel = (groupId) => {
  return `/api/groups/${groupId}/export/excel`
}

// ===== Orphaned Items API =====

/**
 * Get all orphaned items
 * @returns {Promise} Orphaned items data
 */
export const getOrphanedItems = async () => {
  const response = await api.get('/groups/orphaned')
  return response.data
}

/**
 * Add orphaned items to an existing group
 * @param {string} groupId - Target group ID
 * @param {Array<string>} itemIds - IDs of orphaned items to add
 * @returns {Promise} Updated group
 */
export const addOrphanedToGroup = async (groupId, itemIds) => {
  const response = await api.post('/groups/orphaned/add-to-group', {
    group_id: groupId,
    item_ids: itemIds,
  })
  return response.data
}

/**
 * Create a new group from orphaned items
 * @param {Array<string>} itemIds - IDs of orphaned items
 * @param {string} groupName - Name for the new group
 * @returns {Promise} Created group
 */
export const createGroupFromOrphaned = async (itemIds, groupName) => {
  const response = await api.post('/groups/orphaned/create-group', {
    item_ids: itemIds,
    group_name: groupName,
  })
  return response.data
}

/**
 * Clear all groups and orphaned items
 * @returns {Promise} Delete response
 */
export const clearAllGroups = async () => {
  const response = await api.delete('/groups/all')
  return response.data
}

/**
 * Create a manual item in a group
 * @param {string} groupId - The group ID
 * @param {string} title - Title of the manual item
 * @param {string} description - Optional description
 * @returns {Promise} Updated group
 */
export const createManualItem = async (groupId, title, description = '') => {
  const response = await api.post('/groups/manual-item', {
    group_id: groupId,
    title,
    description,
  })
  return response.data
}

export default api
