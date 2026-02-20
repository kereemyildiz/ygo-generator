/**
 * LinkingWizard Component
 * Step-by-step wizard for linking STT items to Use Case items.
 * Pre-selects existing Excel links, allows user edits, creates groups on finalize.
 */

import { useState, useEffect, useCallback } from 'react'
import {
    Wand2, ChevronRight, ChevronLeft, SkipForward, Check, Loader2,
    FileText, Link2, CheckSquare, Square, AlertCircle, CheckCircle2,
    ArrowRight, Play, FolderPlus, Link
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import {
    startLinkingWizard, getWizardCurrent, getWizardSuggestions,
    confirmWizardLinks, nextWizardStep, skipWizardStep, prevWizardStep,
    getWizardSummary, finalizeWizard
} from '../lib/api'


const WIZARD_STATE = {
    IDLE: 'idle',
    LOADING: 'loading',
    ACTIVE: 'active',
    COMPLETED: 'completed',
}


const LinkingWizard = () => {
    const { uploadedFiles, fetchUploadedFiles, fetchGroups, fetchStatistics } = useApp()
    const toast = useToast()

    // Wizard state
    const [wizardState, setWizardState] = useState(WIZARD_STATE.IDLE)
    const [sessionId, setSessionId] = useState(null)

    // File selection
    const [sttFile, setSttFile] = useState('')
    const [ucFile, setUcFile] = useState('')

    // Current step data
    const [currentStt, setCurrentStt] = useState(null)
    const [suggestions, setSuggestions] = useState([])
    const [selectedUcIds, setSelectedUcIds] = useState(new Set())
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [existingLinkInfo, setExistingLinkInfo] = useState({ count: 0, sttCount: 0 })

    // Summary data
    const [summary, setSummary] = useState(null)
    const [finalizing, setFinalizing] = useState(false)

    // Fetch files on mount
    useEffect(() => {
        fetchUploadedFiles()
    }, [fetchUploadedFiles])

    // ===== Start Wizard =====
    const handleStart = async () => {
        if (!sttFile || !ucFile) {
            toast.error('Lütfen STT ve Senaryo dosyalarını seçin')
            return
        }
        if (sttFile === ucFile) {
            toast.error('STT ve Senaryo dosyaları farklı olmalıdır')
            return
        }

        try {
            setWizardState(WIZARD_STATE.LOADING)
            const result = await startLinkingWizard(sttFile, ucFile)
            setSessionId(result.session_id)
            setExistingLinkInfo({
                count: result.existing_links_count || 0,
                sttCount: result.stt_with_existing_links || 0
            })

            const msg = result.existing_links_count > 0
                ? `Wizard başlatıldı: ${result.total_stt} STT, ${result.total_uc} Senaryo — ${result.existing_links_count} mevcut link bulundu`
                : `Wizard başlatıldı: ${result.total_stt} STT, ${result.total_uc} Senaryo`
            toast.success(msg)

            await loadCurrentStep(result.session_id)
            setWizardState(WIZARD_STATE.ACTIVE)
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Wizard başlatılamadı')
            setWizardState(WIZARD_STATE.IDLE)
        }
    }

    // ===== Load Current Step =====
    const loadCurrentStep = useCallback(async (sid) => {
        const id = sid || sessionId
        if (!id) return

        try {
            setLoadingSuggestions(true)

            const current = await getWizardCurrent(id)
            setCurrentStt(current)

            if (current.completed) {
                const sum = await getWizardSummary(id)
                setSummary(sum)
                setWizardState(WIZARD_STATE.COMPLETED)
                setSelectedUcIds(new Set())
            } else {
                // Load suggestions
                const sugg = await getWizardSuggestions(id)
                const suggList = sugg.suggestions || []
                setSuggestions(suggList)

                // Pre-select: existing links from Excel + any previously confirmed links
                const preSelected = new Set()
                // Add UC IDs that are already linked (from Excel data)
                for (const s of suggList) {
                    if (s.already_linked) {
                        preSelected.add(s.item.id)
                    }
                }
                // Also add any previously confirmed links for this STT (for when going back)
                if (current.current_uc_ids) {
                    for (const ucId of current.current_uc_ids) {
                        preSelected.add(ucId)
                    }
                }
                setSelectedUcIds(preSelected)
            }
        } catch (err) {
            toast.error('Veri yüklenemedi')
        } finally {
            setLoadingSuggestions(false)
        }
    }, [sessionId, toast])

    // ===== Toggle UC Selection =====
    const toggleUcSelection = (ucId) => {
        setSelectedUcIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(ucId)) {
                newSet.delete(ucId)
            } else {
                newSet.add(ucId)
            }
            return newSet
        })
    }

    // ===== Select All / Deselect All =====
    const toggleSelectAll = () => {
        if (selectedUcIds.size === suggestions.length) {
            setSelectedUcIds(new Set())
        } else {
            setSelectedUcIds(new Set(suggestions.map(s => s.item.id)))
        }
    }

    // ===== Confirm & Next =====
    const handleConfirmAndNext = async () => {
        if (!currentStt?.stt_item) return

        try {
            setConfirming(true)
            const sttId = currentStt.stt_item.id
            const ucIds = Array.from(selectedUcIds)

            // Always confirm (even with 0 UCs — means user deliberately deselected)
            await confirmWizardLinks(sessionId, sttId, ucIds)
            await nextWizardStep(sessionId)
            await loadCurrentStep()
        } catch (err) {
            toast.error('Onaylama başarısız')
        } finally {
            setConfirming(false)
        }
    }

    // ===== Skip =====
    const handleSkip = async () => {
        try {
            setConfirming(true)
            await skipWizardStep(sessionId)
            await loadCurrentStep()
        } catch (err) {
            toast.error('Atlama başarısız')
        } finally {
            setConfirming(false)
        }
    }

    // ===== Prev =====
    const handlePrev = async () => {
        try {
            setConfirming(true)
            await prevWizardStep(sessionId)
            await loadCurrentStep()
        } catch (err) {
            toast.error('Geri dönüş başarısız')
        } finally {
            setConfirming(false)
        }
    }

    // ===== Finalize: Create Groups =====
    const handleFinalize = async () => {
        try {
            setFinalizing(true)
            const result = await finalizeWizard(sessionId)
            toast.success(`${result.groups_created} grup başarıyla oluşturuldu!`)

            // Refresh groups in the main app
            await fetchGroups()
            await fetchStatistics()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Gruplar oluşturulamadı')
        } finally {
            setFinalizing(false)
        }
    }

    // ===== Reset =====
    const handleReset = () => {
        setWizardState(WIZARD_STATE.IDLE)
        setSessionId(null)
        setCurrentStt(null)
        setSuggestions([])
        setSelectedUcIds(new Set())
        setSummary(null)
        setSttFile('')
        setUcFile('')
        setFinalizing(false)
    }


    // ===========================
    // RENDER: IDLE — File Selection
    // ===========================
    if (wizardState === WIZARD_STATE.IDLE) {
        return (
            <div className="mt-8">
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Wand2 className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Linkleme Sihirbazı</h2>
                            <p className="text-sm text-muted-foreground">
                                STT maddelerini Senaryo maddeleri ile adım adım ilişkilendirin —
                                Excel'deki mevcut linkler otomatik olarak seçili gelir
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <FileText className="h-4 w-4 inline mr-1" />
                                STT Dokümanı (System Requirements)
                            </label>
                            <select
                                value={sttFile}
                                onChange={(e) => setSttFile(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                            >
                                <option value="">Dosya seçin...</option>
                                {uploadedFiles.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <FileText className="h-4 w-4 inline mr-1" />
                                Senaryo Dokümanı (Use Cases)
                            </label>
                            <select
                                value={ucFile}
                                onChange={(e) => setUcFile(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                            >
                                <option value="">Dosya seçin...</option>
                                {uploadedFiles.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button
                        onClick={handleStart}
                        disabled={!sttFile || !ucFile}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Play className="h-4 w-4" />
                        Sihirbazı Başlat
                    </Button>
                </div>
            </div>
        )
    }


    // ===========================
    // RENDER: LOADING
    // ===========================
    if (wizardState === WIZARD_STATE.LOADING) {
        return (
            <div className="mt-8 flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="ml-3 text-lg">Sihirbaz başlatılıyor, mevcut linkler taranıyor...</span>
            </div>
        )
    }


    // ===========================
    // RENDER: COMPLETED — Summary + Finalize
    // ===========================
    if (wizardState === WIZARD_STATE.COMPLETED && summary) {
        return (
            <div className="mt-8">
                <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Linkleme Tamamlandı!</h2>
                            <p className="text-sm text-muted-foreground">
                                {summary.stt_linked} STT maddesine toplam {summary.total_uc_links} senaryo linklendi
                            </p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-card rounded-lg p-3 text-center border">
                            <div className="text-2xl font-bold text-foreground">{summary.total_stt}</div>
                            <div className="text-xs text-muted-foreground">Toplam STT</div>
                        </div>
                        <div className="bg-card rounded-lg p-3 text-center border">
                            <div className="text-2xl font-bold text-emerald-500">{summary.stt_linked}</div>
                            <div className="text-xs text-muted-foreground">Linklenen</div>
                        </div>
                        <div className="bg-card rounded-lg p-3 text-center border">
                            <div className="text-2xl font-bold text-amber-500">{summary.stt_skipped}</div>
                            <div className="text-xs text-muted-foreground">Atlanan</div>
                        </div>
                        <div className="bg-card rounded-lg p-3 text-center border">
                            <div className="text-2xl font-bold text-indigo-500">{summary.total_uc_links}</div>
                            <div className="text-xs text-muted-foreground">Toplam Link</div>
                        </div>
                    </div>

                    {/* Link Details Table */}
                    <div className="bg-card rounded-lg border overflow-hidden mb-6">
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted sticky top-0">
                                    <tr>
                                        <th className="text-left px-4 py-2 font-medium">STT ID</th>
                                        <th className="text-left px-4 py-2 font-medium">Başlık</th>
                                        <th className="text-center px-4 py-2 font-medium">Durum</th>
                                        <th className="text-left px-4 py-2 font-medium">Linklenen Senaryolar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {summary.link_details.map((detail) => (
                                        <tr key={detail.stt_id} className="hover:bg-muted/50">
                                            <td className="px-4 py-2 font-mono text-xs">{detail.stt_id}</td>
                                            <td className="px-4 py-2 max-w-xs truncate">{detail.stt_title}</td>
                                            <td className="px-4 py-2 text-center">
                                                {detail.skipped ? (
                                                    <Badge variant="outline" className="text-amber-500 border-amber-500/30">Atlandı</Badge>
                                                ) : detail.linked_uc_count > 0 ? (
                                                    <Badge variant="default" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                                                        {detail.linked_uc_count} link
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">–</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {detail.linked_ucs.map(uc => (
                                                        <span
                                                            key={uc.id}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${uc.is_existing
                                                                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                                    : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                                                }`}
                                                        >
                                                            {uc.is_existing && <Link className="h-3 w-3" />}
                                                            {uc.id}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                <Link className="h-3 w-3" /> UC-XXX
                            </span>
                            <span>Excel'den mevcut link</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-flex px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                                UC-XXX
                            </span>
                            <span>Yeni eklenen link</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleFinalize}
                            disabled={finalizing}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {finalizing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Gruplar oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    <FolderPlus className="h-4 w-4" />
                                    Grupları Oluştur ({summary.total_stt} grup)
                                </>
                            )}
                        </Button>
                        <Button onClick={handleReset} variant="outline" className="gap-2">
                            <Wand2 className="h-4 w-4" />
                            Yeni Linkleme Başlat
                        </Button>
                    </div>
                </div>
            </div>
        )
    }


    // ===========================
    // RENDER: ACTIVE — Main Wizard UI
    // ===========================
    const sttItem = currentStt?.stt_item
    const sttData = sttItem?.data || {}
    const progressPercent = currentStt?.progress_percent || 0
    const currentIdx = (currentStt?.current_index || 0) + 1
    const totalStt = currentStt?.total_stt || 0
    const existingUcIds = new Set(currentStt?.existing_uc_ids || [])

    // Count how many selected are existing vs new
    const existingSelectedCount = Array.from(selectedUcIds).filter(id => existingUcIds.has(id)).length
    const newSelectedCount = selectedUcIds.size - existingSelectedCount

    return (
        <div className="mt-8">
            <div className="bg-card border rounded-xl overflow-hidden shadow-lg">

                {/* Progress Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5" />
                            <span className="font-semibold">Linkleme Sihirbazı</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm opacity-80">STT {currentIdx} / {totalStt}</span>
                            <Badge variant="outline" className="border-white/30 text-white text-xs">
                                %{progressPercent}
                            </Badge>
                        </div>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>


                {/* Main Content — Two Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">

                    {/* LEFT PANEL: Current STT Item */}
                    <div className="lg:col-span-2 p-5">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            Aktif STT Maddesi
                        </h3>

                        {sttItem ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="default" className="bg-indigo-500 text-white font-mono">
                                        {sttItem.id}
                                    </Badge>
                                    {sttData.Priority && (
                                        <Badge variant="outline" className={
                                            sttData.Priority === 'High' ? 'text-red-500 border-red-500/30' :
                                                sttData.Priority === 'Medium' ? 'text-amber-500 border-amber-500/30' :
                                                    'text-green-500 border-green-500/30'
                                        }>
                                            {sttData.Priority}
                                        </Badge>
                                    )}
                                    {sttData.Category && (
                                        <Badge variant="outline">{sttData.Category}</Badge>
                                    )}
                                    {existingUcIds.size > 0 && (
                                        <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                                            <Link className="h-3 w-3 mr-1" />
                                            {existingUcIds.size} mevcut link
                                        </Badge>
                                    )}
                                </div>

                                <h4 className="text-lg font-bold text-foreground">
                                    {sttData.Requirement_Title || sttItem.id}
                                </h4>

                                {sttData.Description && (
                                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground/80 leading-relaxed">
                                        {sttData.Description}
                                    </div>
                                )}

                                {(sttItem.in_links?.length > 0 || sttItem.out_links?.length > 0) && (
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        {sttItem.out_links?.length > 0 && (
                                            <p>
                                                <Link2 className="h-3 w-3 inline mr-1" />
                                                Giden: {sttItem.out_links.join(', ')}
                                            </p>
                                        )}
                                        {sttItem.in_links?.length > 0 && (
                                            <p>
                                                <Link2 className="h-3 w-3 inline mr-1" />
                                                Gelen: {sttItem.in_links.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>


                    {/* RIGHT PANEL: Suggested Use Cases */}
                    <div className="lg:col-span-3 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Önerilen Senaryolar
                            </h3>
                            <div className="flex items-center gap-2">
                                {suggestions.length > 0 && (
                                    <>
                                        <button
                                            onClick={toggleSelectAll}
                                            className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                                        >
                                            {selectedUcIds.size === suggestions.length ? (
                                                <><CheckSquare className="h-3 w-3" /> Seçimi Kaldır</>
                                            ) : (
                                                <><Square className="h-3 w-3" /> Tümünü Seç</>
                                            )}
                                        </button>
                                        <Badge variant="outline" className="text-xs">
                                            {selectedUcIds.size} seçili
                                            {existingSelectedCount > 0 && (
                                                <span className="text-blue-500 ml-1">({existingSelectedCount} mevcut)</span>
                                            )}
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>

                        {loadingSuggestions ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Öneriler yükleniyor...</span>
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Bu STT maddesi için öneri bulunamadı</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {suggestions.map((sugg) => {
                                    const uc = sugg.item
                                    const ucData = uc.data || {}
                                    const isSelected = selectedUcIds.has(uc.id)
                                    const isExisting = sugg.already_linked
                                    const score = Math.round(sugg.relevance_score * 100)

                                    return (
                                        <button
                                            key={uc.id}
                                            onClick={() => toggleUcSelection(uc.id)}
                                            className={`
                        w-full text-left rounded-lg border p-3 transition-all duration-150
                        ${isSelected
                                                    ? isExisting
                                                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                                                        : 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                                                    : 'border-border hover:border-indigo-500/40 hover:bg-muted/50'
                                                }
                      `}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 flex-shrink-0">
                                                    {isSelected ? (
                                                        <CheckSquare className={`h-5 w-5 ${isExisting ? 'text-blue-500' : 'text-indigo-500'}`} />
                                                    ) : (
                                                        <Square className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="font-mono text-xs text-indigo-500">{uc.id}</span>
                                                        {isExisting && (
                                                            <Badge variant="outline" className="text-xs px-1.5 py-0 text-blue-500 border-blue-500/30">
                                                                <Link className="h-3 w-3 mr-0.5" />
                                                                Excel'den mevcut
                                                            </Badge>
                                                        )}
                                                        {score > 0 && !isExisting && (
                                                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                                {score}% eşleşme
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-sm text-foreground">
                                                        {ucData.Use_Case_Name || uc.id}
                                                    </p>
                                                    {ucData.Main_Flow && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {ucData.Main_Flow}
                                                        </p>
                                                    )}
                                                    {ucData.Actor && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            <span className="font-medium">Aktör:</span> {ucData.Actor}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>


                {/* Footer Actions */}
                <div className="border-t bg-muted/30 px-5 py-3 flex items-center justify-between">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrev}
                            disabled={confirming || (currentStt?.current_index === 0)}
                            className="gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Geri
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            disabled={confirming}
                        >
                            İptal
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSkip}
                            disabled={confirming}
                            className="gap-1"
                        >
                            <SkipForward className="h-4 w-4" />
                            Atla
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmAndNext}
                            disabled={confirming}
                            className="gap-1 bg-indigo-600 hover:bg-indigo-700"
                        >
                            {confirming ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    {selectedUcIds.size > 0
                                        ? `Onayla & Devam (${selectedUcIds.size})`
                                        : 'Linklemeden Devam'
                                    }
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default LinkingWizard
