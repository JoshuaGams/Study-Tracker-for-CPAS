import React from 'react';
import { Database, Code2, Terminal, Layers, CheckCircle2, Copy, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { GAS_SERVER_CODE_GS } from '../lib/appsScriptAdapter';
import { getActiveSessionUser, isAppAdmin } from '../lib/auth';

export const SchemaDocumentation: React.FC = () => {
  const user = getActiveSessionUser();
  if (!isAppAdmin(user)) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Restricted Access</h3>
        <p className="text-xs text-slate-400">
          Architecture, database schemas, and integration documentation are proprietary and restricted to the app administrator.
        </p>
      </div>
    );
  }

  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const schemaJSON = `{
  "mainTopics": [
    {
      "id": "mt-rfbt",
      "title": "Regulatory Framework for Business Transactions",
      "code": "RFBT",
      "description": "Obligations, Contracts, Sales, Partnerships...",
      "color": "#3B82F6",
      "targetHours": 60,
      "weightPercentage": 15,
      "createdAt": "2026-08-06T00:00:00.000Z"
    }
  ],
  "subtopics": [
    {
      "id": "st-rfbt-1",
      "mainTopicId": "mt-rfbt",
      "title": "Law on Obligations & Contracts",
      "code": "RFBT-01",
      "status": "In Progress", // 'Not Started' | 'In Progress' | 'Reviewing' | 'Mastered'
      "targetHours": 15,
      "notesScratchpad": "Remember: Fortuitous events excuse obligation EXCEPT when specified by law.",
      "createdAt": "2026-08-06T00:00:00.000Z",
      "updatedAt": "2026-08-06T00:00:00.000Z"
    }
  ],
  "resources": [
    {
      "id": "res-1",
      "subtopicId": "st-rfbt-1",
      "title": "De Leon Obligations Notes PDF",
      "type": "doc", // 'link' | 'file_reference' | 'doc' | 'quizlet'
      "urlOrPath": "https://drive.google.com/file/...",
      "createdAt": "2026-08-06T00:00:00.000Z"
    }
  ],
  "examScores": [
    {
      "id": "es-1",
      "subtopicId": "st-rfbt-1",
      "examName": "Pre-board Diagnostic Exam",
      "score": 35,
      "maxScore": 50, // Auto calculates (35/50) * 100 = 70%
      "date": "2026-08-05",
      "notes": "Struggled with joint liability provisions"
    }
  ],
  "timeLogs": [
    {
      "id": "tl-1",
      "mainTopicId": "mt-rfbt",
      "subtopicId": "st-rfbt-1",
      "durationMinutes": 120,
      "sessionType": "Practice Drills", // 'Reading' | 'Practice Drills' | 'Flashcards' | 'Video Lecture' | 'Mock Exam' | 'Revision'
      "date": "2026-08-06",
      "notes": "Completed 50 multiple choice drill items"
    }
  ]
}`;

  const runCommands = `# 1. Install dependencies
npm install

# 2. Launch dev server on port 3000
npm run dev

# 3. Build for production deployment
npm run build
npm start`;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-100">
            Software Architecture & Database State Schema
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          Technical specifications, data models, and local run instructions for the Board Exam Study Tracker.
        </p>
      </div>

      {/* 1. Tech Stack & State Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-400" />
          <span>1. Tech Stack & State Management Strategy</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The application is engineered as a high-performance <strong>React 19 single-page application (SPA)</strong> written in strict TypeScript, styled with Tailwind CSS v4, and powered by Vite. Data persistence is managed locally via an isolated <code>localStorage</code> state sync engine with full JSON backup, export, and import capabilities.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-blue-400 block mb-1">Hierarchical Tree Relational Core</span>
            <p className="text-slate-400">
              Establishes 1-to-Many entity relationships from <code>MainTopic</code> → <code>Subtopic</code> → <code>ExamScore</code>, <code>TimeLog</code>, and <code>NoteResource</code>.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">Diagnostic Algorithmic Engine</span>
            <p className="text-slate-400">
              Aggregates subtopic exam percentages and study time logged to classify topics into Strong (≥80%), Moderate (60-79%), Weak (&lt;60%), or Untested.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Database Schema Specification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>2. JSON State & Database Schema Specification</span>
          </h3>

          <button
            onClick={() => copyToClipboard(schemaJSON, 'schema')}
            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
          >
            {copiedSection === 'schema' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON Schema</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
          {schemaJSON}
        </pre>
      </div>

      {/* 3. Instructions to Run Locally */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>3. Instructions to Run Code Locally</span>
          </h3>

          <button
            onClick={() => copyToClipboard(runCommands, 'commands')}
            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
          >
            {copiedSection === 'commands' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Shell Commands</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
          {runCommands}
        </pre>
      </div>

      {/* 4. Instructions to Deploy to Google Apps Script & Sheets */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>4. Google Apps Script & Google Sheets Web App Deployment</span>
          </h3>

          <button
            onClick={() => copyToClipboard(GAS_SERVER_CODE_GS, 'gas_code')}
            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
          >
            {copiedSection === 'gas_code' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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

        <p className="text-xs text-slate-300 leading-relaxed">
          The app uses <code>vite-plugin-singlefile</code> to compile all HTML, JavaScript, CSS, and SVG icons into a single self-contained <code>dist/index.html</code>. In Google Apps Script, you can deploy this as a standalone Web App or embed it in a Google Sheets sidebar via <code>SpreadsheetApp.getUi().showSidebar()</code>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">Step 1: Build Singlefile</span>
            <p className="text-slate-400">Run <code>npm run build</code>. The output in <code>dist/index.html</code> contains all inline assets.</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">Step 2: Paste in Apps Script</span>
            <p className="text-slate-400">In <code>script.google.com</code>, paste <code>Code.gs</code> and create <code>Index.html</code> with the bundle.</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-blue-400 block mb-1">Step 3: Deploy Web App</span>
            <p className="text-slate-400">Click Deploy &gt; New Deployment &gt; Web App, or open inside Google Sheets for a custom sidebar.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
