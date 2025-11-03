/**
 * Turkish (Türkçe) translations for ASEL Trace
 * All UI text in the application
 */

export const tr = {
  // App Name
  appName: 'ASEL Trace',
  appFullName: 'ASEL İzlenebilirlik Sistemi',
  appTagline: 'Gereksinim İzlenebilirlik ve Bağlantı Yönetim Sistemi',

  // Common
  common: {
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    cancel: 'İptal',
    save: 'Kaydet',
    delete: 'Sil',
    edit: 'Düzenle',
    create: 'Oluştur',
    close: 'Kapat',
    search: 'Ara',
    filter: 'Filtrele',
    export: 'Dışa Aktar',
    upload: 'Yükle',
    analyze: 'Analiz Et',
    add: 'Ekle',
    remove: 'Kaldır',
    view: 'Görüntüle',
    select: 'Seç',
    selected: 'Seçildi',
    all: 'Tümü',
    none: 'Hiçbiri',
    showing: 'Gösteriliyor',
    of: '/',
    items: 'madde',
    files: 'dosya',
    groups: 'grup',
    rows: 'satır',
  },

  // Header
  header: {
    title: 'ASEL Trace',
    uploadedFiles: 'Yüklenen Dosyalar',
    totalItems: 'Toplam madde',
    linkedGroups: 'Bağlantılı Gruplar',
    orphanedItems: 'Bağımsız maddeler',
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
  },

  // File Upload
  fileUpload: {
    title: 'Excel Dosyalarını Yükle',
    description: 'Gereksinimler, kullanım senaryoları veya test senaryolarını içeren bir veya daha fazla Excel dosyası (.xlsx, .xls) yükleyin',
    dragDrop: 'Dosyaları buraya sürükleyip bırakın',
    or: 'veya',
    browse: 'Dosyalara Gözat',
    selectedFiles: 'Seçilen Dosyalar',
    removeFile: 'Dosyayı Kaldır',
    uploadButton: 'Yükle',
    analyzeButton: 'Bağlantıları Analiz Et',
    uploadedFiles: 'Yüklenen Dosyalar',
    noFiles: 'Henüz dosya yüklenmedi',
    deleteFile: 'Dosyayı Sil',
    clearAll: 'Tümünü Temizle',
    confirmDelete: 'silmek istediğinizden emin misiniz?',
    confirmClearAll: 'Tüm dosyaları silip analizi sıfırlamak istediğinizden emin misiniz? Bu işlem tüm grupları da temizleyecektir.',
    uploadSuccess: 'Dosyalar başarıyla yüklendi',
    analysisSuccess: 'Analiz başarıyla tamamlandı',
  },

  // File Explorer
  fileExplorer: {
    title: 'Dosya Gezgini',
    description: 'Yüklenen dosyaları görüntüle ve keşfet',
    totalRows: 'Toplam Satır',
    orphanedItems: 'Bağımsız maddeler',
    columns: 'Sütunlar',
    excelFile: 'Excel Dosyası',
    view: 'Görüntüle',
    noFiles: 'Henüz dosya yüklenmedi',
    noFilesDescription: 'Başlamak için Excel dosyaları yükleyin',
    loadingStats: 'Dosya istatistikleri yükleniyor...',
    failedToLoad: 'Dosya istatistikleri yüklenemedi',
  },

  // File Viewer
  fileViewer: {
    loading: 'Dosya verileri yükleniyor...',
    loadingMessage: 'Bu işlem büyük dosyalar için biraz zaman alabilir',
    failedToLoad: 'Dosya yüklenemedi',
    searchPlaceholder: 'Tüm sütunlarda ara...',
    showOrphaned: 'Bağımsızları Göster',
    showingOrphaned: 'Bağımsızlar Gösteriliyor',
    addToGroup: 'Gruba Ekle',
    createNewGroup: 'Yeni Grup Oluştur',
    addToExistingGroup: 'Mevcut Gruba Ekle',
    groupNamePlaceholder: 'Grup adı...',
    noGroupsAvailable: 'Kullanılabilir grup yok',
    noItemsMatch: 'Hiçbir madde filtreyle eşleşmiyor',
    adjustFilters: 'Arama veya filtre ayarlarınızı düzenlemeyi deneyin',
    closeShortcut: 'Kapat (Esc)',
  },

  // VirtualizedTable
  table: {
    noItems: 'Görüntülenecek madde yok',
    noColumns: 'Sütun tanımlanmamış',
    showing: 'Gösteriliyor',
    selected: 'seçildi',
  },

  // Groups
  groups: {
    title: 'Bağlantılı Gruplar',
    noGroups: 'Grup Bulunamadı',
    noGroupsDescription: 'Bağlantı ilişkilerine göre grup oluşturmak için Excel dosyalarını yükleyin ve "Bağlantıları Analiz Et" düğmesine tıklayın',
    loading: 'Gruplar yükleniyor...',
    deleteConfirm: 'maddesini silmek istediğinizden emin misiniz?',
    removeItemConfirm: 'Bu maddeyi gruptan kaldırmak istediğinizden emin misiniz?',
    exportJSON: 'JSON Olarak Dışa Aktar',
    exportExcel: 'Excel Olarak Dışa Aktar',
    expand: 'Genişlet',
    collapse: 'Daralt',
    editName: 'Adı Düzenle',
    saveName: 'Kaydet',
    cancelEdit: 'İptal',
    groupCleared: 'Tüm gruplar başarıyla temizlendi',
  },

  // Orphaned Items
  orphaned: {
    title: 'Bağımsız maddeler',
    description: 'Herhangi bir bağlantıya sahip olmayan maddeler',
    noItems: 'Bağımsız madde Yok',
    noItemsDescription: 'Tüm maddeler en az bir bağlantıya sahip',
    loading: 'Bağımsız maddeler yükleniyor...',
    selectAll: 'Tümünü Seç',
    deselectAll: 'Seçimi Kaldır',
    selectedCount: 'madde seçildi',
    addToGroup: 'Gruba Ekle',
    createGroup: 'Grup Oluştur',
    bulkActions: 'Toplu İşlemler',
  },

  // Context Menu
  contextMenu: {
    addToGroup: 'Gruba Ekle',
    createNewGroup: 'Yeni Grup Oluştur',
    removeFromGroup: 'Gruptan Kaldır',
    viewDetails: 'Detayları Görüntüle',
  },

  // Statistics
  stats: {
    totalFiles: 'Toplam Dosya',
    totalItems: 'Toplam madde',
    totalGroups: 'Toplam Grup',
    orphanedItems: 'Bağımsız maddeler',
    linkedItems: 'Bağlantılı maddeler',
  },

  // Footer
  footer: {
    tagline: 'Bağlantılı Gereksinim Dokümanı Yöneticisi',
    builtWith: 'made by aky',
  },

  // Error Messages
  errors: {
    uploadFailed: 'Dosya yükleme başarısız oldu',
    analysisFailed: 'Analiz başarısız oldu',
    deleteFailed: 'Silme başarısız oldu',
    updateFailed: 'Güncelleme başarısız oldu',
    loadFailed: 'Yükleme başarısız oldu',
    invalidFile: 'Geçersiz dosya türü',
    noFiles: 'Dosya bulunamadı',
    serverError: 'Sunucu hatası',
    networkError: 'Ağ hatası',
    unknownError: 'Bilinmeyen hata',
  },

  // Success Messages
  success: {
    fileUploaded: 'Dosya başarıyla yüklendi',
    filesUploaded: 'Dosyalar başarıyla yüklendi',
    analysisComplete: 'Analiz başarıyla tamamlandı',
    groupCreated: 'Grup başarıyla oluşturuldu',
    groupUpdated: 'Grup başarıyla güncellendi',
    groupDeleted: 'Grup başarıyla silindi',
    itemAdded: 'madde gruba eklendi',
    itemRemoved: 'madde gruptan kaldırıldı',
    fileDeleted: 'Dosya başarıyla silindi',
  },
};

export default tr;
