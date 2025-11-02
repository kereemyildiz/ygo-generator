/**
 * App Component
 * Main application component
 */

import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import FileUpload from './components/FileUpload'
import GroupList from './components/GroupList'
import { Alert, AlertDescription } from './components/ui/Alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

// Main content component (wrapped by AppProvider)
const AppContent = () => {
  const { error, message, clearError } = useApp()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Global Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="ml-4 underline hover:no-underline"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert variant="success" className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* File Upload Section */}
        <FileUpload />

        {/* Groups List Section */}
        <GroupList />
      </main>

      {/* Footer */}
      <footer className="bg-muted py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>SRS Link Manager - Linked Requirements Document Manager</p>
          <p className="mt-1">Built with React, FastAPI, and NetworkX</p>
        </div>
      </footer>
    </div>
  )
}

// App component with provider
const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
