/**
 * FileExplorer Component
 * Displays uploaded files as cards with statistics
 * Allows users to view file contents in a modal
 */

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Eye, AlertCircle, Database, FileX } from 'lucide-react';
import FileViewer from './FileViewer';
import * as api from '../lib/api';
import { useApp } from '../context/AppContext';

/**
 * File card component showing file statistics
 */
const FileCard = ({ filename, stats, onView }) => {
  const orphanedPercentage = stats.total_rows > 0
    ? ((stats.orphaned_count / stats.total_rows) * 100).toFixed(1)
    : 0;

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer bg-card"
      onClick={() => onView(filename)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium truncate max-w-[200px]" title={filename}>
              {filename}
            </h3>
            <p className="text-sm text-muted-foreground">
              Excel Dosyası
            </p>
          </div>
        </div>
        <button
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onView(filename);
          }}
        >
          <Eye className="h-4 w-4" />
          Görüntüle
        </button>
      </div>

      {/* Statistics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <Database className="h-4 w-4" />
            Toplam Satır
          </span>
          <span className="font-medium">{stats.total_rows.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <FileX className="h-4 w-4" />
            Linklenmeyen Maddeler
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{stats.orphaned_count.toLocaleString()}</span>
            {stats.orphaned_count > 0 && (
              <span className="text-xs text-orange-500">
                ({orphanedPercentage}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sütunlar</span>
          <span className="font-medium">{stats.columns.length}</span>
        </div>
      </div>

      {/* Column Info */}
      <div className="mt-3 pt-3 border-t">
        <p className="text-xs text-muted-foreground">
          ID: <span className="font-mono">{stats.id_column}</span>
          {stats.in_link_column && (
            <> | In: <span className="font-mono">{stats.in_link_column}</span></>
          )}
          {stats.out_link_column && (
            <> | Out: <span className="font-mono">{stats.out_link_column}</span></>
          )}
        </p>
      </div>
    </div>
  );
};

/**
 * FileExplorer Component
 * Main component for browsing uploaded files
 */
export default function FileExplorer() {
  const { uploadedFiles } = useApp();
  const [fileStats, setFileStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch stats for all uploaded files
  useEffect(() => {
    const fetchStats = async () => {
      if (!uploadedFiles || uploadedFiles.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const statsPromises = uploadedFiles.map(filename =>
          api.getFileStats(filename)
            .then(stats => ({ filename, stats }))
            .catch(err => ({ filename, error: err.message }))
        );

        const results = await Promise.all(statsPromises);

        const statsMap = {};
        results.forEach(result => {
          if (result.stats) {
            statsMap[result.filename] = result.stats;
          }
        });

        setFileStats(statsMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [uploadedFiles]);

  // Handle view file
  const handleViewFile = (filename) => {
    setSelectedFile(filename);
  };

  // Handle close viewer
  const handleCloseViewer = () => {
    setSelectedFile(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Dosya istatistikleri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Dosya istatistikleri yüklenemedi</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // No files
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Henüz dosya yüklenmedi</p>
          <p className="text-sm text-muted-foreground mt-2">
            Başlamak için Excel dosyaları yükleyin
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dosya Gezgini</h2>
            <p className="text-muted-foreground">
              Yüklenen dosyaları görüntüleyin ve keşfedin
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {uploadedFiles.length} dosya
          </div>
        </div>

        {/* File Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploadedFiles.map(filename => (
            fileStats[filename] ? (
              <FileCard
                key={filename}
                filename={filename}
                stats={fileStats[filename]}
                onView={handleViewFile}
              />
            ) : (
              <div
                key={filename}
                className="border rounded-lg p-4 bg-muted/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-muted-foreground">{filename}</h3>
                    <p className="text-sm text-muted-foreground">
                      İstatistikler yüklenemedi
                    </p>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer
          filename={selectedFile}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}
