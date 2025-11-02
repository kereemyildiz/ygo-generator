/**
 * App Component
 * Main application component
 */

import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { ToastProvider } from './context/ToastContext'
import Header from './components/Header'
import FileUpload from './components/FileUpload'
import FileExplorer from './components/FileExplorer'
import GroupList from './components/GroupList'
import OrphanedItems from './components/OrphanedItems'

// Main content component (wrapped by providers)
const AppContent = () => {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* File Upload Section */}
        <FileUpload />

        {/* File Explorer Section */}
        <FileExplorer />

        {/* Groups List Section */}
        <GroupList />

        {/* Orphaned Items Section */}
        <OrphanedItems />
      </main>

      {/* Footer */}
      <footer className="bg-muted py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>ASEL Trace - İzlenebilirlik ve Bağlantı Yönetim Sistemi</p>
          <p className="mt-1">React, FastAPI ve NetworkX ile geliştirildi</p>
        </div>
      </footer>
    </div>
  )
}

// App component with providers
const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
