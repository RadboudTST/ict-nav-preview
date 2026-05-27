import { useRef, useEffect, useState, useCallback } from 'react';
import {
  FileJson,
  FileSpreadsheet,
  FileCode,
  Upload,
  RotateCcw,
  Undo2,
  Redo2,
  ChevronDown,
  Lock,
  Pencil,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button, toast, confirm } from '@/components/ui';
import { useNavigationStore, useTemporalStore, clearNavigationStorage } from '../hooks';
import { downloadJson, downloadExcel, importStructure } from '../utils/export-helpers';
import { downloadHtml } from '../utils/export-html';

// Check if running in development mode
const isDev = import.meta.env.DEV;

export default function Toolbar() {
  const {
    categories,
    importStructure: storeImport,
    reset,
    syncStructures,
    activeStructure,
    setActiveStructure,
    isReadOnly,
  } = useNavigationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetMenuOpen, setResetMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    type: 'success' | 'error';
    message: string;
    warnings?: string[];
  } | null>(null);
  const importResultTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const importPopoverRef = useRef<HTMLDivElement>(null);
  const resetMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const dismissImportResult = useCallback(() => {
    setImportResult(null);
    if (importResultTimerRef.current) {
      clearTimeout(importResultTimerRef.current);
      importResultTimerRef.current = null;
    }
  }, []);

  const showImportResult = useCallback((result: NonNullable<typeof importResult>, duration = 8000) => {
    dismissImportResult();
    setImportResult(result);
    importResultTimerRef.current = setTimeout(() => {
      setImportResult(null);
      importResultTimerRef.current = null;
    }, duration);
  }, [dismissImportResult]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (importResultTimerRef.current) clearTimeout(importResultTimerRef.current);
    };
  }, []);

  const { pastStates, futureStates, undo, redo } = useTemporalStore((state) => ({
    pastStates: state.pastStates,
    futureStates: state.futureStates,
    undo: state.undo,
    redo: state.redo,
  }));

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // Undo/redo handlers with toast feedback
  const handleUndo = () => {
    if (canUndo) {
      undo();
      toast.info('Actie ongedaan gemaakt');
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      redo();
      toast.info('Actie opnieuw uitgevoerd');
    }
  };

  // Keyboard shortcuts for undo/redo and structure switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      // Ctrl/Cmd + 1/2 to switch structures
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setActiveStructure('current');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setActiveStructure('proposed');
      }
      // Ctrl/Cmd + Shift + R to reset storage (dev only)
      if (isDev && (e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        confirm({
          title: 'Storage resetten?',
          message: 'Dit verwijdert alle opgeslagen data en herlaadt de pagina. Dit kan niet ongedaan worden gemaakt.',
          confirmLabel: 'Reset & herlaad',
          cancelLabel: 'Annuleren',
          variant: 'danger',
        }).then((confirmed) => {
          if (confirmed) {
            clearNavigationStorage();
            toast.success('Storage gereset, pagina wordt herladen...');
            setTimeout(() => window.location.reload(), 500);
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, setActiveStructure]);

  // Close menus/popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resetMenuRef.current && !resetMenuRef.current.contains(e.target as Node)) {
        setResetMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
      if (importResult && importPopoverRef.current && !importPopoverRef.current.contains(e.target as Node)) {
        dismissImportResult();
      }
    };

    if (resetMenuOpen || exportMenuOpen || importResult) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [resetMenuOpen, exportMenuOpen, importResult, dismissImportResult]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    dismissImportResult();
    try {
      const result = await importStructure(file);

      if (result.success) {
        storeImport(result.data);
        const pageCount = result.data.reduce((sum, cat) => sum + (cat.pages?.length || 0), 0);
        const crossLinkCount = result.data.reduce(
          (sum, cat) => sum + (cat.pages?.filter((p) => p.crossLink).length || 0),
          0
        );
        const crossLinkSuffix = crossLinkCount > 0 ? ` (${crossLinkCount} externe link${crossLinkCount > 1 ? 's' : ''})` : '';
        const message = `${result.format} geïmporteerd: ${result.data.length} categorieën, ${pageCount} pagina's${crossLinkSuffix}`;

        // Collect warnings if any
        let warnings: string[] | undefined;
        if (result.warnings && result.warnings.length > 0) {
          warnings = result.warnings.slice(0, 5);
          if (result.warnings.length > 5) {
            warnings.push(`...en ${result.warnings.length - 5} meer`);
          }
        }

        showImportResult({ type: 'success', message, warnings });
      } else {
        showImportResult({ type: 'error', message: result.error });
      }
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportJson = () => {
    try {
      downloadJson(categories, activeStructure);
      setExportMenuOpen(false);
      toast.success('JSON bestand gedownload');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export mislukt');
    }
  };

  const handleExportExcel = async () => {
    setExportMenuOpen(false);
    try {
      await downloadExcel(categories, activeStructure);
      toast.success('Excel bestand gedownload');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export mislukt');
    }
  };

  const handleExportHtml = () => {
    try {
      downloadHtml(categories, activeStructure);
      setExportMenuOpen(false);
      toast.success('HTML preview gedownload - open in browser om te bekijken');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export mislukt');
    }
  };

  const handleResetAll = async () => {
    const confirmed = await confirm({
      title: 'Beide structuren terugzetten',
      message: 'Weet je zeker dat je BEIDE structuren wilt terugzetten naar de originele versies? Alle wijzigingen gaan verloren.',
      confirmLabel: 'Beide terugzetten',
      variant: 'danger',
    });
    if (confirmed) {
      reset();
      toast.info('Beide structuren teruggezet');
    }
  };

  const handleSyncCurrentToProposed = async () => {
    const confirmed = await confirm({
      title: 'Voorstel terugzetten',
      message: 'Weet je zeker dat je je voorstel wilt resetten naar de originele RU.nl structuur? Al je wijzigingen gaan verloren.',
      confirmLabel: 'Terugzetten',
      variant: 'warning',
    });
    if (confirmed) {
      syncStructures('current-to-proposed');
      toast.info('Voorstel teruggezet naar origineel');
    }
  };

  return (
    <div className="h-14 bg-white border-b border-ru-border flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Ongedaan maken (Ctrl+Z)"
          aria-label="Ongedaan maken"
        >
          <Undo2 size={18} aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Opnieuw (Ctrl+Shift+Z)"
          aria-label="Opnieuw"
        >
          <Redo2 size={18} aria-hidden="true" />
        </Button>

        <div className="w-px h-8 bg-ru-border/50 mx-3" />

        {/* Export dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            title="Exporteren"
            aria-expanded={exportMenuOpen}
            aria-haspopup="menu"
          >
            <FileJson size={18} className="mr-2" aria-hidden="true" />
            Exporteren
            <ChevronDown size={14} className={`ml-1 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </Button>
          {exportMenuOpen && (
            <div className="absolute left-0 top-full mt-1 z-10">
              <div className="bg-white border border-ru-border rounded-lg shadow-lg py-1 min-w-[180px]">
                <button
                  onClick={handleExportJson}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-ru-light-gray flex items-center gap-2"
                >
                  <FileJson size={16} />
                  <span>JSON (.json)</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-ru-light-gray flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} />
                  <span>Excel (.xlsx)</span>
                </button>
                <div className="border-t border-ru-border my-1" />
                <button
                  onClick={handleExportHtml}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-ru-light-gray flex items-center gap-2"
                >
                  <FileCode size={16} />
                  <span>HTML (.html)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Structure Switcher - Toggle Buttons */}
      <div className="flex items-center">
        <div className="inline-flex rounded-lg border border-ru-border overflow-hidden">
          <button
            onClick={() => setActiveStructure('current')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeStructure === 'current'
                ? 'bg-ru-blue text-white'
                : 'bg-white text-ru-text hover:bg-ru-light-gray'
            }`}
            title="Originele ru.nl structuur (alleen lezen) — Ctrl+1"
          >
            <Lock size={14} />
            RU.nl
          </button>
          <button
            onClick={() => setActiveStructure('proposed')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-ru-border flex items-center gap-2 ${
              activeStructure === 'proposed'
                ? 'bg-ru-green text-white'
                : 'bg-white text-ru-text hover:bg-ru-light-gray'
            }`}
            title="Bewerk je voorstel — Ctrl+2"
          >
            <Pencil size={14} />
            Bewerken
          </button>
        </div>
        <span className="ml-3 text-xs text-ru-text-light">
          Ctrl+1/2
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Import - disabled in read-only mode */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xlsx,.xls,.txt,.csv"
            onChange={handleImport}
            className="hidden"
            id="import-file"
            disabled={isReadOnly || isImporting}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title={isReadOnly ? 'Importeren niet beschikbaar — schakel naar Bewerken' : 'Importeer bestand (JSON, Excel, of Tekst)'}
            disabled={isReadOnly || isImporting}
          >
            {isImporting ? (
              <Loader2 size={18} className="mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Upload size={18} className="mr-2" aria-hidden="true" />
            )}
            {isImporting ? 'Importeren...' : 'Importeren'}
          </Button>

          {/* Inline import result popover */}
          {importResult && (
            <div
              ref={importPopoverRef}
              className={`absolute right-0 top-full mt-2 z-20 w-80 rounded-lg border shadow-lg animate-slide-down-fade-in ${
                importResult.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-2.5 p-3">
                {importResult.type === 'success' ? (
                  <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    importResult.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {importResult.message}
                  </p>
                  {importResult.warnings && importResult.warnings.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200 bg-amber-50 -mx-3 -mb-3 px-3 pb-3 rounded-b-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle size={14} className="text-amber-600" />
                        <span className="text-xs font-medium text-amber-700">
                          Waarschuwingen
                        </span>
                      </div>
                      <ul className="space-y-0.5">
                        {importResult.warnings.map((w, i) => (
                          <li key={i} className="text-xs text-amber-700">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={dismissImportResult}
                  className={`shrink-0 p-0.5 rounded hover:bg-black/10 ${
                    importResult.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                  aria-label="Sluiten"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-ru-border/50 mx-1" />

        {/* Reset dropdown */}
        <div className="relative" ref={resetMenuRef}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setResetMenuOpen(!resetMenuOpen)}
            title="Terugzetten naar origineel"
            aria-expanded={resetMenuOpen}
            aria-haspopup="menu"
          >
            <RotateCcw size={18} className="mr-2" aria-hidden="true" />
            Terugzetten
            <ChevronDown size={14} className={`ml-1 transition-transform ${resetMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </Button>
          {/* Dropdown menu */}
          {resetMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-10">
              <div className="bg-white border border-ru-border rounded-lg shadow-lg py-1 min-w-[260px]">
                <button
                  onClick={() => {
                    handleSyncCurrentToProposed();
                    setResetMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-ru-light-gray flex items-center gap-3"
                >
                  <RotateCcw size={14} className="text-ru-gray" />
                  <div>
                    <span className="font-medium">Voorstel terugzetten</span>
                    <p className="text-xs text-ru-text-light mt-0.5">Herstel naar originele RU.nl structuur</p>
                  </div>
                </button>
                <div className="border-t border-ru-border my-1" />
                <button
                  onClick={() => {
                    handleResetAll();
                    setResetMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-ru-light-gray text-ru-red-impact flex items-center gap-3"
                >
                  <RotateCcw size={14} />
                  <div>
                    <span className="font-medium">Alles terugzetten</span>
                    <p className="text-xs text-ru-red-impact/70 mt-0.5">Beide structuren naar origineel</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
