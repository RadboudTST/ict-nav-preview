import { useRef, useEffect, useState } from 'react';
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  Upload,
  RotateCcw,
  Undo2,
  Redo2,
  ChevronDown,
  Lock,
  Pencil,
} from 'lucide-react';
import { Button, toast, confirm } from '@/components/ui';
import { useNavigationStore, useTemporalStore } from '../hooks';
import { downloadJson, downloadExcel, downloadText, importStructure } from '../utils/export-helpers';

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
  const resetMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, setActiveStructure]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resetMenuRef.current && !resetMenuRef.current.contains(e.target as Node)) {
        setResetMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };

    if (resetMenuOpen || exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [resetMenuOpen, exportMenuOpen]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importStructure(file);

    if (result.success) {
      storeImport(result.data);
      toast.success('Navigatiestructuur succesvol geïmporteerd!');
    } else {
      toast.error(result.error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportJson = () => {
    downloadJson(categories, activeStructure);
    setExportMenuOpen(false);
    toast.success('JSON bestand gedownload');
  };

  const handleExportExcel = async () => {
    setExportMenuOpen(false);
    await downloadExcel(categories, activeStructure);
    toast.success('Excel bestand gedownload');
  };

  const handleExportText = () => {
    downloadText(categories, activeStructure);
    setExportMenuOpen(false);
    toast.success('Tekst bestand gedownload');
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
      title: '"Nieuw" terugzetten',
      message: 'Weet je zeker dat je de nieuwe structuur wilt resetten naar de originele ru.nl versie? Je wijzigingen in "Nieuw" gaan verloren.',
      confirmLabel: 'Terugzetten',
      variant: 'warning',
    });
    if (confirmed) {
      syncStructures('current-to-proposed');
      toast.info('"Nieuw" teruggezet naar origineel ru.nl');
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
                <button
                  onClick={handleExportText}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-ru-light-gray flex items-center gap-2"
                >
                  <FileText size={16} />
                  <span>Tekst (.txt)</span>
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
            title="Huidige ru.nl structuur - alleen lezen (Ctrl+1)"
          >
            <Lock size={14} />
            Huidig (ru.nl)
          </button>
          <button
            onClick={() => setActiveStructure('proposed')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-ru-border flex items-center gap-2 ${
              activeStructure === 'proposed'
                ? 'bg-ru-green text-white'
                : 'bg-white text-ru-text hover:bg-ru-light-gray'
            }`}
            title="Nieuwe voorgestelde structuur - bewerkbaar (Ctrl+2)"
          >
            <Pencil size={14} />
            Nieuw (voorstel)
          </button>
        </div>
        <span className="ml-3 text-xs text-ru-text-light">
          Ctrl+1/2
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Import - disabled in read-only mode */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.xlsx,.xls,.txt,.csv"
          onChange={handleImport}
          className="hidden"
          id="import-file"
          disabled={isReadOnly}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          title={isReadOnly ? 'Importeren niet beschikbaar - schakel naar "Nieuw" om te bewerken' : 'Importeer bestand (JSON, Excel, of Tekst)'}
          disabled={isReadOnly}
        >
          <Upload size={18} className="mr-2" aria-hidden="true" />
          Importeren
        </Button>

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
                    <span className="font-medium">"Nieuw" terugzetten</span>
                    <p className="text-xs text-ru-text-light mt-0.5">Herstel naar originele ru.nl structuur</p>
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
