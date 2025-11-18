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

  // YGÖ Job tracking state
  const [activeYGOJobs, setActiveYGOJobs] = useState([]) // Jobs currently running
  const [completedYGOResults, setCompletedYGOResults] = useState([]) // Completed results for viewing

  // Separate loading states for different operations
  const [loadingFilesFetch, setLoadingFilesFetch] = useState(false) // For fetching file list
  const [loadingFilesUpload, setLoadingFilesUpload] = useState(false) // For uploading files
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingOrphaned, setLoadingOrphaned] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  // Helper to handle errors (not in any dependency arrays)
  const handleError = useCallback((err) => {
    const errorMessage = err.response?.data?.detail || err.message || 'Bir hata oluştu'
    toast.error(errorMessage)
    console.error('Error:', err)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to show success message (not in any dependency arrays)
  const showMessage = useCallback((msg) => {
    toast.success(msg)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== File Operations =====

  const fetchUploadedFiles = useCallback(async () => {
    try {
      setLoadingFilesFetch(true)
      const data = await api.getUploadedFiles()
      setUploadedFiles(data.files)
    } catch (err) {
      handleError(err)
    } finally {
      setLoadingFilesFetch(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const uploadFiles = useCallback(async (files) => {
    try {
      setLoadingFilesUpload(true)
      const data = await api.uploadFiles(files)
      showMessage(data.message)
      await fetchUploadedFiles()
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingFilesUpload(false)
    }
  }, [fetchUploadedFiles]) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteFile = useCallback(async (filename) => {
    try {
      setLoadingFilesUpload(true)
      const data = await api.deleteFile(filename)
      showMessage(data.message)
      await fetchUploadedFiles()
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingFilesUpload(false)
    }
  }, [fetchUploadedFiles]) // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeFiles = useCallback(async (filePaths = null) => {
    try {
      setLoadingAnalysis(true)
      const data = await api.analyzeFiles(filePaths)
      showMessage(data.message)

      // Refresh groups, statistics, and orphaned items directly
      await Promise.all([
        api.getAllGroups().then(result => setGroups(result.groups)),
        api.getStatistics().then(result => setStatistics(result)),
        api.getOrphanedItems().then(result => setOrphanedItems(result.orphaned_items))
      ])

      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingAnalysis(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Group Operations =====

  const fetchGroups = useCallback(async () => {
    try {
      setLoadingGroups(true)
      const data = await api.getAllGroups()
      setGroups(data.groups)
    } catch (err) {
      handleError(err)
    } finally {
      setLoadingGroups(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getGroup = useCallback(async (groupId) => {
    try {
      setLoadingGroups(true)
      const data = await api.getGroup(groupId)
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingGroups(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateGroup = useCallback(async (groupId, updates) => {
    try {
      setLoadingGroups(true)
      const data = await api.updateGroup(groupId, updates)
      showMessage('Group updated successfully')
      await fetchGroups()
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingGroups(false)
    }
  }, [fetchGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteGroup = useCallback(async (groupId) => {
    try {
      setLoadingGroups(true)
      const data = await api.deleteGroup(groupId)
      showMessage(data.message)
      await fetchGroups()
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingGroups(false)
    }
  }, [fetchGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  const addItemToGroup = useCallback(async (groupId, item) => {
    try {
      setLoadingGroups(true)
      const data = await api.addItemToGroup(groupId, item)
      showMessage('Item added to group')
      await fetchGroups()
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingGroups(false)
    }
  }, [fetchGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeItemFromGroup = useCallback(async (groupId, itemId) => {
    try {
      setLoadingGroups(true)
      const data = await api.removeItemFromGroup(groupId, itemId)
      showMessage('Item removed from group')
      await fetchGroups()
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingGroups(false)
    }
  }, [fetchGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  const mergeGroups = useCallback(async (groupId1, groupId2, newName) => {
    try {
      setLoadingGroups(true)
      const data = await api.mergeGroups(groupId1, groupId2, newName)
      showMessage(data.message)
      await fetchGroups()
      return data
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingGroups(false)
    }
  }, [fetchGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Statistics =====

  const fetchStatistics = useCallback(async () => {
    try {
      const data = await api.getStatistics()
      setStatistics(data)
    } catch (err) {
      handleError(err)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Orphaned Items Operations =====

  const fetchOrphanedItems = useCallback(async () => {
    try {
      setLoadingOrphaned(true)
      const data = await api.getOrphanedItems()
      setOrphanedItems(data.orphaned_items)
    } catch (err) {
      handleError(err)
    } finally {
      setLoadingOrphaned(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addOrphanedToGroup = useCallback(async (groupId, itemIds) => {
    try {
      setLoadingOrphaned(true)
      await api.addOrphanedToGroup(groupId, itemIds)
      showMessage('Items added to group successfully')

      // Refresh groups and orphaned items directly
      await Promise.all([
        api.getAllGroups().then(result => setGroups(result.groups)),
        api.getOrphanedItems().then(result => setOrphanedItems(result.orphaned_items))
      ])
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingOrphaned(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const createGroupFromOrphaned = useCallback(async (itemIds, groupName) => {
    try {
      setLoadingOrphaned(true)
      await api.createGroupFromOrphaned(itemIds, groupName)
      showMessage(`Group "${groupName}" created successfully`)

      // Refresh groups, orphaned items, and statistics directly
      await Promise.all([
        api.getAllGroups().then(result => setGroups(result.groups)),
        api.getOrphanedItems().then(result => setOrphanedItems(result.orphaned_items)),
        api.getStatistics().then(result => setStatistics(result))
      ])
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingOrphaned(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clearAllGroups = useCallback(async () => {
    try {
      setLoadingGroups(true)
      await api.clearAllGroups()
      // Immediately clear all related state
      setGroups([])
      setOrphanedItems([])
      setStatistics(null)
      showMessage('Tüm gruplar ve analiz sonuçları temizlendi')
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoadingGroups(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== YGÖ Job Management =====

  /**
   * Start tracking a YGÖ job (non-blocking)
   */
  const trackYGOJob = useCallback((jobId, jobInfo) => {
    setActiveYGOJobs(prev => [...prev, { jobId, ...jobInfo, startedAt: new Date() }])
    console.log('🎯 Started tracking YGÖ job:', jobId, jobInfo)
  }, [])

  /**
   * Update status of a tracked job
   */
  const updateYGOJobStatus = useCallback((jobId, statusUpdate) => {
    setActiveYGOJobs(prev =>
      prev.map(job =>
        job.jobId === jobId ? { ...job, ...statusUpdate } : job
      )
    )
  }, [])

  /**
   * Handle job completion
   */
  const completeYGOJob = useCallback((jobId, result) => {
    console.log('✅ YGÖ job completed:', jobId, result)
    console.log('🔍 DEBUG: Storing completed job:', {
      jobId,
      resultKeys: result ? Object.keys(result) : [],
      ygoTextLength: result?.ygo_text?.length || 0,
      ygoTextPreview: result?.ygo_text?.substring(0, 100) || 'EMPTY',
      inputItemsCount: result?.input_items?.length || 0
    })

    // Remove from active jobs
    setActiveYGOJobs(prev => prev.filter(job => job.jobId !== jobId))

    // Add to completed results
    setCompletedYGOResults(prev => [{
      jobId,
      result,
      completedAt: new Date()
    }, ...prev])

    // Show success notification
    showMessage(`YGÖ üretimi tamamlandı: ${result?.group_name || 'YGÖ'}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle job failure
   */
  const failYGOJob = useCallback((jobId, error) => {
    console.error('❌ YGÖ job failed:', jobId, error)

    // Remove from active jobs
    setActiveYGOJobs(prev => prev.filter(job => job.jobId !== jobId))

    // Show error
    handleError(new Error(error))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Remove a completed result
   */
  const removeCompletedYGOResult = useCallback((jobId) => {
    setCompletedYGOResults(prev => prev.filter(r => r.jobId !== jobId))
  }, [])

  /**
   * Clear all completed results
   */
  const clearCompletedYGOResults = useCallback(() => {
    setCompletedYGOResults([])
  }, [])

  // Context value
  const value = {
    // State
    uploadedFiles,
    groups,
    orphanedItems,
    statistics,
    // Loading states
    loadingFilesFetch,
    loadingFilesUpload,
    loadingGroups,
    loadingOrphaned,
    loadingAnalysis,
    // YGÖ Job tracking
    activeYGOJobs,
    completedYGOResults,
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
    // YGÖ Job actions
    trackYGOJob,
    updateYGOJobStatus,
    completeYGOJob,
    failYGOJob,
    removeCompletedYGOResult,
    clearCompletedYGOResults,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default AppContext
