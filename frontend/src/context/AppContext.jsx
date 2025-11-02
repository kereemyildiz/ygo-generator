/**
 * AppContext - Global State Management
 * Manages application state including files, groups, and loading states
 */

import { createContext, useContext, useState, useCallback } from 'react'
import * as api from '../lib/api'
import { useToast } from './ToastContext'

// Create context
const AppContext = createContext(null)

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

// Provider component
export const AppProvider = ({ children }) => {
  const toast = useToast()

  // State
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [groups, setGroups] = useState([])
  const [orphanedItems, setOrphanedItems] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(false)

  // Helper to handle errors
  const handleError = useCallback((err) => {
    const errorMessage = err.response?.data?.detail || err.message || 'Bir hata oluştu'
    toast.error(errorMessage)
    console.error('Error:', err)
  }, [toast])

  // Helper to show success message
  const showMessage = useCallback((msg) => {
    toast.success(msg)
  }, [toast])

  // ===== File Operations =====

  const fetchUploadedFiles = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getUploadedFiles()
      setUploadedFiles(data.files)
      setError(null)
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const uploadFiles = useCallback(async (files) => {
    try {
      setLoading(true)
      const data = await api.uploadFiles(files)
      showMessage(data.message)
      await fetchUploadedFiles()
      setError(null)
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage, fetchUploadedFiles])

  const deleteFile = useCallback(async (filename) => {
    try {
      setLoading(true)
      const data = await api.deleteFile(filename)
      showMessage(data.message)
      await fetchUploadedFiles()
      setError(null)
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage, fetchUploadedFiles])

  const analyzeFiles = useCallback(async (filePaths = null) => {
    try {
      setLoading(true)
      const data = await api.analyzeFiles(filePaths)
      showMessage(data.message)

      // Refresh groups, statistics, and orphaned items directly
      await Promise.all([
        api.getAllGroups().then(result => setGroups(result.groups)),
        api.getStatistics().then(result => setStatistics(result)),
        api.getOrphanedItems().then(result => setOrphanedItems(result.orphaned_items))
      ])

      setError(null)
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage])

  // ===== Group Operations =====

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getAllGroups()
      setGroups(data.groups)
      setError(null)
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const getGroup = useCallback(async (groupId) => {
    try {
      setLoading(true)
      const data = await api.getGroup(groupId)
      setError(null)
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const updateGroup = useCallback(async (groupId, updates) => {
    try {
      setLoading(true)
      const data = await api.updateGroup(groupId, updates)
      showMessage('Group updated successfully')
      await fetchGroups()
      setError(null)
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage, fetchGroups])

  const deleteGroup = useCallback(async (groupId) => {
    try {
      setLoading(true)
      const data = await api.deleteGroup(groupId)
      showMessage(data.message)
      await fetchGroups()
      setError(null)
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage, fetchGroups])

  const addItemToGroup = useCallback(async (groupId, item) => {
    try {
      setLoading(true)
      const data = await api.addItemToGroup(groupId, item)
      showMessage('Item added to group')
      await fetchGroups()
      setError(null)
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage, fetchGroups])

  const removeItemFromGroup = useCallback(async (groupId, itemId) => {
    try {
      setLoading(true)
      const data = await api.removeItemFromGroup(groupId, itemId)
      showMessage('Item removed from group')
      await fetchGroups()
      setError(null)
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage, fetchGroups])

  const mergeGroups = useCallback(async (groupId1, groupId2, newName) => {
    try {
      setLoading(true)
      const data = await api.mergeGroups(groupId1, groupId2, newName)
      showMessage(data.message)
      await fetchGroups()
      setError(null)
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage, fetchGroups])

  // ===== Statistics =====

  const fetchStatistics = useCallback(async () => {
    try {
      const data = await api.getStatistics()
      setStatistics(data)
      setError(null)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  // ===== Orphaned Items Operations =====

  const fetchOrphanedItems = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getOrphanedItems()
      setOrphanedItems(data.orphaned_items)
      setError(null)
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const addOrphanedToGroup = useCallback(async (groupId, itemIds) => {
    try {
      setLoading(true)
      await api.addOrphanedToGroup(groupId, itemIds)
      showMessage('Items added to group successfully')

      // Refresh groups and orphaned items directly
      await Promise.all([
        api.getAllGroups().then(result => setGroups(result.groups)),
        api.getOrphanedItems().then(result => setOrphanedItems(result.orphaned_items))
      ])

      setError(null)
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage])

  const createGroupFromOrphaned = useCallback(async (itemIds, groupName) => {
    try {
      setLoading(true)
      await api.createGroupFromOrphaned(itemIds, groupName)
      showMessage(`Group "${groupName}" created successfully`)

      // Refresh groups, orphaned items, and statistics directly
      await Promise.all([
        api.getAllGroups().then(result => setGroups(result.groups)),
        api.getOrphanedItems().then(result => setOrphanedItems(result.orphaned_items)),
        api.getStatistics().then(result => setStatistics(result))
      ])

      setError(null)
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage])

  const clearAllGroups = useCallback(async () => {
    try {
      setLoading(true)
      await api.clearAllGroups()
      // Immediately clear all related state
      setGroups([])
      setOrphanedItems([])
      setStatistics(null)
      showMessage('Tüm gruplar ve analiz sonuçları temizlendi')
      setError(null)
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, showMessage])

  // Context value
  const value = {
    // State
    uploadedFiles,
    groups,
    orphanedItems,
    statistics,
    loading,
    // Actions
    fetchUploadedFiles,
    uploadFiles,
    deleteFile,
    analyzeFiles,
    fetchGroups,
    getGroup,
    updateGroup,
    deleteGroup,
    addItemToGroup,
    removeItemFromGroup,
    mergeGroups,
    fetchStatistics,
    fetchOrphanedItems,
    addOrphanedToGroup,
    createGroupFromOrphaned,
    clearAllGroups,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default AppContext
