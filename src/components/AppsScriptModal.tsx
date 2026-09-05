import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Code2,
  Copy,
  Check,
  Download,
  UploadCloud,
  FileCode,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  FolderSync,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ApplicationState } from '../types';
import {
  isRunningInAppsScript,
  GAS_SERVER_CODE_GS,
  generateGoogleSheetsTSV,
  syncDataToGoogleSheets,
  saveStateToGAS,
  loadStateFromGAS,
} from '../lib/appsScriptAdapter';
import { getRegisteredUsers, isAppAdmin } from '../lib/auth';
import { Modal } from './Modal';
import { useToast } from './Toast';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: ApplicationState;
  setState: React.Dispatch<React.SetStateAction<ApplicationState>>;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  state,
  setState,
}) => {
  const { showToast } = useToast();
  const isOwner = isAppAdmin(state.currentUser);

  if (!isOwner) {
    return null;
  }
  const [activeTab, setActiveTab] = useState<'bundle_html' | 'setup' | 'sheets_data' | 'instructions'>('sheets_data');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedSheetExport, setSelectedSheetExport] = useState<'syllabus' | 'timelogs' | 'scores' | 'summary' | 'accounts'>('syllabus');
  const [isSyncing, setIsSyncing] = useState(false);
  const [bundledHtml, setBundledHtml] = useState<string | null>(null);
  const [isLoadingBundle, setIsLoadingBundle] = useState<boolean>(false);

  const isConnectedToGAS = isRunningInAppsScript();

  // If user is owner, default to bundle_html tab on first open; else default to sheets_data
  useEffect(() => {
    if (isOpen) {
      if (isOwner) {
        setActiveTab('bundle_html');
      } else {
        setActiveTab('sheets_data');
      }
    }
  }, [isOpen, isOwner]);

  // Fetch true compiled single-file bundle when modal opens (only if owner)
  useEffect(() => {
    if (isOpen && !bundledHtml && isOwner) {
      setIsLoadingBundle(true);
      fetch('/api/gas-bundle')
        .then((res) => {
          if (!res.ok) throw new Error('Bundle endpoint unavailable');
          return res.text();
        })
        .then((html) => {
          if (html && (html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>'))) {
            setBundledHtml(html);
          }
        })
        .catch((err) => {
          console.warn('Notice: Could not pre-fetch dist bundle via API:', err);
        })
        .finally(() => {
          setIsLoadingBundle(false);
        });
    }
  }, [isOpen, bundledHtml, isOwner]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    showToast('Copied to Clipboard', `${label} is ready to paste.`, 'success');
    setTimeout(() => {
      setCopiedSection((prev) => (prev === label ? null : prev));
    }, 2500);
  };

  const handleDownloadTSV = (sheetType: 'syllabus' | 'timelogs' | 'scores' | 'summary' | 'accounts') => {
    const allUsers = getRegisteredUsers();
    const tsvData = generateGoogleSheetsTSV(state, sheetType, allUsers);
    const blob = new Blob([tsvData], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpa_study_tracker_${sheetType}_${new Date().toISOString().slice(0, 10)}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('TSV Downloaded', `Exported ${sheetType} table for Google Sheets.`, 'success');
  };

  const handleLiveSyncToGAS = async () => {
    if (!isConnectedToGAS) {
      showToast(
        'Standalone Mode',
        'You are currently previewing in Web mode. Copy the Code.gs and Index.html to Google Apps Script to enable live sheet sync.',
        'info',
        6000
      );
      return;
    }

    setIsSyncing(true);
    try {
      await saveStateToGAS(state);
      const res = await syncDataToGoogleSheets(state);
      showToast('Synced to Google Sheets', res, 'success');
    } catch (err: any) {
      showToast('Sync Failed', err.message || 'Could not communicate with Google Apps Script.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadFromGAS = async () => {
    if (!isConnectedToGAS) {
      showToast(
        'Standalone Mode',
        'Not currently running inside Google Apps Script iframe.',
        'info'
      );
      return;
    }

    try {
      const data = await loadStateFromGAS();
      if (data) {
        setState((prev) => ({
          ...prev,
          ...data,
          mainTopics: Array.isArray(data.mainTopics) ? data.mainTopics : prev.mainTopics,
          subtopics: Array.isArray(data.subtopics) ? data.subtopics : prev.subtopics,
          resources: Array.isArray(data.resources) ? data.resources : prev.resources,
          examScores: Array.isArray(data.examScores) ? data.examScores : prev.examScores,
          timeLogs: Array.isArray(data.timeLogs) ? data.timeLogs : prev.timeLogs,
        }));
        showToast('Restored from Apps Script', 'Synchronized your candidate ledger from Google Apps Script cloud storage.', 'success');
      } else {
        showToast('No Cloud State Found', 'Google Apps Script storage is empty. Saving initial state...', 'info');
        saveStateToGAS(state);
      }
    } catch (err: any) {
      showToast('Load Error', err.message || 'Could not load data from Apps Script.', 'error');
    }
  };

  // Copy true compiled single-file bundle
  const handleCopyBundledHTML = async () => {
    if (!isOwner) {
      showToast('Access Restricted', 'Source code extraction is restricted to the verified App Owner.', 'error');
      return;
    }
    try {
      let content = bundledHtml;
      if (!content) {
        setIsLoadingBundle(true);
        const res = await fetch('/api/gas-bundle');
        if (res.ok) {
          content = await res.text();
          setBundledHtml(content);
        }
      }

      if (content) {
        await navigator.clipboard.writeText(content);
        setCopiedSection('HTML Bundle');
        showToast('Full Bundle Copied!', 'Compiled single-file HTML copied (~1.3MB with all styles and scripts). Paste into Apps Script Index.html.', 'success');
        setTimeout(() => setCopiedSection(null), 2500);
      } else {
        // Fallback to direct download link
        window.location.href = '/api/download-gas-html';
        showToast('Downloading Bundle', 'Downloading compiled Index.html file directly.', 'info');
      }
    } catch (err) {
      // Direct file download fallback
      window.location.href = '/api/download-gas-html';
      showToast('Downloading Index.html', 'Downloading compiled file to your computer.', 'info');
    } finally {
      setIsLoadingBundle(false);
    }
  };

  const handleDownloadIndexHtml = () => {
    if (!isOwner) {
      showToast('Access Restricted', 'Source code extraction is restricted to the verified App Owner.', 'error');
      return;
    }
    if (bundledHtml) {
      const blob = new Blob([bundledHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Index.html';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Index.html Downloaded', 'Open Index.html in notepad, copy all, and paste into Google Apps Script.', 'success');
    } else {
      window.location.href = '/api/download-gas-html';
      showToast('Downloading Index.html', 'Downloading compiled bundle...', 'info');
    }
  };

  const allRegisteredUsers = getRegisteredUsers();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Apps Script & Google Sheets Integration Hub"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Runtime Status Banner */}
        <div className="p-4 rounded-xl border bg-slate-950/70 border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                isConnectedToGAS
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {isConnectedToGAS ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <FolderSync className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Runtime Environment:
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    isConnectedToGAS
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {isConnectedToGAS ? 'Google Apps Script (GAS) Active' : 'Standalone Web / Single-File Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isConnectedToGAS
                  ? 'Connected to Google Workspace APIs via google.script.run bridge.'
                  : isOwner
                  ? 'Single-file bundle compiled and ready. Copy Index.html below directly to your Google Apps Script project.'
                  : 'Connected to candidate study ledger. Export your tables or sync with Google Sheets.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isConnectedToGAS ? (
              <>
                <button
                  onClick={handleLoadFromGAS}
                  className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Pull from Cloud
                </button>
                <button
                  onClick={handleLiveSyncToGAS}
                  disabled={isSyncing}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'Syncing...' : 'Sync to Sheets'}</span>
                </button>
              </>
            ) : isOwner ? (
              <button
                onClick={() => setActiveTab('bundle_html')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Get Index.html</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('sheets_data')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Tables</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
          {/* Owner-Only Tabs */}
          {isOwner ? (
            <>
              <button
                onClick={() => setActiveTab('bundle_html')}
                className={`pb-3 px-3 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'bundle_html'
                    ? 'text-amber-400 border-amber-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>1. Bundled Index.html</span>
              </button>

              <button
                onClick={() => setActiveTab('setup')}
                className={`pb-3 px-3 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'setup'
                    ? 'text-amber-400 border-amber-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>2. Code.gs Script</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-3 pb-3 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Student / Candidate View (Code Gated)</span>
            </div>
          )}

          <button
            onClick={() => setActiveTab('sheets_data')}
            className={`pb-3 px-3 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'sheets_data'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isOwner ? '3. Sheets Data Tables' : 'Data Tables & Export'}</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab('instructions')}
              className={`pb-3 px-3 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'instructions'
                  ? 'text-amber-400 border-amber-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>4. Guide</span>
            </button>
          )}
        </div>

        {/* TAB: BUNDLE HTML (Owner Only) */}
        {activeTab === 'bundle_html' && (
          isOwner ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Compiled Single-File Bundle (`Index.html`)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {bundledHtml ? (
                        <span className="text-emerald-400 font-mono font-medium">
                          ✓ Bundle compiled (~{(bundledHtml.length / 1024).toFixed(0)} KB) — Ready to paste into Apps Script
                        </span>
                      ) : isLoadingBundle ? (
                        <span className="inline-flex items-center gap-1 text-amber-300 font-mono">
                          <Loader2 className="w-3 h-3 animate-spin" /> Fetching bundle...
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Production single-file bundle with all React components, styles, and themes inline.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyBundledHTML}
                      disabled={isLoadingBundle}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {copiedSection === 'HTML Bundle' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied Bundle!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy All HTML</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadIndexHtml}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Index.html</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Exact Steps to Paste into Apps Script:
                </h5>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                  <li>In your Apps Script project, click the <strong className="text-slate-100">+ icon</strong> next to <em>Files</em> ➔ select <strong className="text-slate-100">HTML</strong>.</li>
                  <li>Name the file exactly <strong className="text-amber-400 font-mono">Index</strong> (so Apps Script shows <code>Index.html</code>).</li>
                  <li>Click <strong className="text-amber-400">"Copy All HTML"</strong> above (or download the file and open in Notepad).</li>
                  <li>Select all placeholder code in Apps Script (<kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px]">Ctrl+A</kbd>) and paste (<kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px]">Ctrl+V</kbd>).</li>
                  <li>Save (<kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px]">Ctrl+S</kbd>) and click <strong>Deploy &gt; Test deployments</strong> or <strong>New deployment</strong>.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-200">Owner Access Required</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Direct source code viewing and HTML bundle exporting are restricted to the application owner.
              </p>
            </div>
          )
        )}

        {/* TAB: Code.gs Setup (Owner Only) */}
        {activeTab === 'setup' && (
          isOwner ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <span>Backend Script (`Code.gs`)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Google Apps Script V8 Engine
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paste this script into your Apps Script `Code.gs` file.
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(GAS_SERVER_CODE_GS, 'Code.gs Script')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  {copiedSection === 'Code.gs Script' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code.gs</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 scrollbar-thin">
                  <code>{GAS_SERVER_CODE_GS}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-200">Owner Access Required</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Server script configuration is accessible only by the application owner.
              </p>
            </div>
          )
        )}

        {/* TAB: Direct Google Sheets TSV/CSV Export */}
        {activeTab === 'sheets_data' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Direct Google Sheets / Excel Table Export</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Copy tab-separated tables directly to your clipboard and paste (<kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-[10px]">Ctrl+V</kbd>) into any Google Sheet.
              </p>
            </div>

            {/* Table Type Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSheetExport('syllabus')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedSheetExport === 'syllabus'
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200">📚 Syllabus</div>
                <div className="text-[10px] font-mono text-slate-400">{state.mainTopics.length} subjects, {state.subtopics.length} subs</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSheetExport('timelogs')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedSheetExport === 'timelogs'
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200">⏱️ Time Logs</div>
                <div className="text-[10px] font-mono text-slate-400">{state.timeLogs.length} study sessions</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSheetExport('scores')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedSheetExport === 'scores'
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200">📝 Exam Scores</div>
                <div className="text-[10px] font-mono text-slate-400">{state.examScores.length} logged tests</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSheetExport('summary')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedSheetExport === 'summary'
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200">📊 Summary Stats</div>
                <div className="text-[10px] font-mono text-slate-400">Readiness ledger</div>
              </button>

              {/* Accounts Database Table (Accessible to Owner) */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setSelectedSheetExport('accounts')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedSheetExport === 'accounts'
                      ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-200">👥 Accounts DB</div>
                  <div className="text-[10px] font-mono text-slate-400">{allRegisteredUsers.length} users</div>
                </button>
              )}
            </div>

            {/* Preview Box */}
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-slate-800/80 bg-slate-900/50">
                <span className="text-xs font-mono text-slate-400">
                  TSV Table Preview ({selectedSheetExport.toUpperCase()})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(generateGoogleSheetsTSV(state, selectedSheetExport, allRegisteredUsers), `${selectedSheetExport.toUpperCase()} Table`)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                  >
                    {copiedSection === `${selectedSheetExport.toUpperCase()} Table` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Table</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadTSV(selectedSheetExport)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TSV</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-60 scrollbar-thin">
                <code>{generateGoogleSheetsTSV(state, selectedSheetExport, allRegisteredUsers)}</code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB: Deployment Instructions */}
        {activeTab === 'instructions' && isOwner && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <span>Step-by-Step Google Apps Script Deployment</span>
              </h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-100 block text-xs">Open Google Apps Script</strong>
                    <p className="text-slate-400 mt-0.5">
                      Go to <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">script.google.com</a> to create a new standalone project, OR in your Google Sheet go to <span className="font-mono text-slate-200 bg-slate-800 px-1 py-0.5 rounded">Extensions &gt; Apps Script</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-100 block text-xs">Paste Code.gs</strong>
                    <p className="text-slate-400 mt-0.5">
                      In the editor, open the default <span className="font-mono text-slate-200 bg-slate-800 px-1 py-0.5 rounded">Code.gs</span> file and replace everything with the script from the <strong>Code.gs Script</strong> tab.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-100 block text-xs">Create Index.html</strong>
                    <p className="text-slate-400 mt-0.5">
                      Click <span className="font-mono text-slate-200 bg-slate-800 px-1 py-0.5 rounded">+ &gt; HTML</span>, name the file <span className="font-mono text-slate-200 bg-slate-800 px-1 py-0.5 rounded">Index</span>, and paste the code from the <strong>Bundled Index.html</strong> tab.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-100 block text-xs">Deploy as Web App or Sheet Extension</strong>
                    <p className="text-slate-400 mt-0.5">
                      Click <span className="font-mono text-slate-200 bg-slate-800 px-1 py-0.5 rounded">Deploy &gt; New Deployment</span>. Select type: <span className="text-slate-200">Web App</span>. If attached to a Google Sheet, simply reload the spreadsheet to see the new custom menu!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close Integration Hub
          </button>
        </div>
      </div>
    </Modal>
  );
};

