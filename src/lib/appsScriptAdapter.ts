import { ApplicationState, UserAccount } from '../types';

// Global declaration for Google Apps Script client runner
declare global {
  interface Window {
    google?: {
      script?: {
        run?: {
          withSuccessHandler: (fn: (res: any) => void) => {
            withFailureHandler: (fn: (err: any) => void) => Record<string, (...args: any[]) => void>;
          };
          withFailureHandler: (fn: (err: any) => void) => {
            withSuccessHandler: (fn: (res: any) => void) => Record<string, (...args: any[]) => void>;
          };
          [key: string]: any;
        };
        host?: {
          close?: () => void;
          setHeight?: (h: number) => void;
          setWidth?: (w: number) => void;
          editor?: {
            focus?: () => void;
          };
        };
      };
    };
  }
}

/**
 * Checks if the application is currently running inside Google Apps Script HTML Service iframe
 */
export function isRunningInAppsScript(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.google !== 'undefined' &&
    typeof window.google.script !== 'undefined' &&
    typeof window.google.script.run !== 'undefined'
  );
}

/**
 * Load state from Google Apps Script (PropertiesService or Sheet)
 */
export function loadStateFromGAS(): Promise<Partial<ApplicationState> | null> {
  return new Promise((resolve, reject) => {
    if (!isRunningInAppsScript()) {
      resolve(null);
      return;
    }

    try {
      window.google!.script!.run!
        .withSuccessHandler((res: string | null) => {
          if (!res) {
            resolve(null);
            return;
          }
          try {
            const parsed = typeof res === 'string' ? JSON.parse(res) : res;
            resolve(parsed);
          } catch (e) {
            console.error('Failed to parse GAS payload:', e);
            resolve(null);
          }
        })
        .withFailureHandler((err: any) => {
          console.warn('Apps Script load error:', err);
          reject(err);
        })
        .getStudyData();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Save state to Google Apps Script UserProperties / DocumentProperties
 */
export function saveStateToGAS(state: ApplicationState): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!isRunningInAppsScript()) {
      resolve(false);
      return;
    }

    try {
      const payload = JSON.stringify({
        theme: state.theme,
        mainTopics: state.mainTopics,
        subtopics: state.subtopics,
        resources: state.resources,
        examScores: state.examScores,
        timeLogs: state.timeLogs,
        activeSubtopicId: state.activeSubtopicId,
        activeTab: state.activeTab,
        targetExamDate: state.targetExamDate,
        lastSaved: new Date().toISOString(),
      });

      window.google!.script!.run!
        .withSuccessHandler(() => {
          resolve(true);
        })
        .withFailureHandler((err: any) => {
          console.warn('Apps Script save error:', err);
          reject(err);
        })
        .saveStudyData(payload);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Load registered users list from Google Apps Script ScriptProperties (chunk-safe)
 */
export function gasGetUsers(): Promise<UserAccount[] | null> {
  return new Promise((resolve) => {
    if (!isRunningInAppsScript()) {
      resolve(null);
      return;
    }
    try {
      if (typeof (window.google?.script?.run as any)?.loadUsersFromGAS === 'function') {
        (window.google!.script!.run as any)
          .withSuccessHandler((res: string | null) => {
            if (!res) return resolve(null);
            try {
              const parsed = JSON.parse(res);
              resolve(Array.isArray(parsed) ? parsed : null);
            } catch {
              resolve(null);
            }
          })
          .withFailureHandler(() => resolve(null))
          .loadUsersFromGAS();
      } else {
        resolve(null);
      }
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save registered users list to Google Apps Script ScriptProperties (chunk-safe)
 */
export function gasSaveUsers(users: UserAccount[]): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isRunningInAppsScript()) {
      resolve(false);
      return;
    }
    try {
      if (typeof (window.google?.script?.run as any)?.saveUsersToGAS === 'function') {
        (window.google!.script!.run as any)
          .withSuccessHandler(() => resolve(true))
          .withFailureHandler(() => resolve(false))
          .saveUsersToGAS(JSON.stringify(users));
      } else {
        resolve(false);
      }
    } catch {
      resolve(false);
    }
  });
}

/**
 * Load a user's study state from Google Apps Script ScriptProperties
 */
export function gasGetUserState(userId: string): Promise<any | null> {
  return new Promise((resolve) => {
    if (!isRunningInAppsScript()) {
      resolve(null);
      return;
    }
    try {
      if (typeof (window.google?.script?.run as any)?.loadUserStateFromGAS === 'function') {
        (window.google!.script!.run as any)
          .withSuccessHandler((res: string | null) => {
            if (!res) return resolve(null);
            try {
              const parsed = JSON.parse(res);
              resolve(parsed);
            } catch {
              resolve(null);
            }
          })
          .withFailureHandler(() => resolve(null))
          .loadUserStateFromGAS(userId);
      } else {
        resolve(null);
      }
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save a user's study state to Google Apps Script ScriptProperties (chunk-safe)
 */
export function gasSaveUserState(userId: string, state: any): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isRunningInAppsScript()) {
      resolve(false);
      return;
    }
    try {
      if (typeof (window.google?.script?.run as any)?.saveUserStateToGAS === 'function') {
        (window.google!.script!.run as any)
          .withSuccessHandler(() => resolve(true))
          .withFailureHandler(() => resolve(false))
          .saveUserStateToGAS(userId, JSON.stringify(state));
      } else {
        resolve(false);
      }
    } catch {
      resolve(false);
    }
  });
}

/**
 * Push structured data directly into Google Sheets tabs
 */
export function syncDataToGoogleSheets(state: ApplicationState): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isRunningInAppsScript()) {
      reject(new Error('Not connected to Google Apps Script runtime.'));
      return;
    }

    try {
      const payload = {
        mainTopics: state.mainTopics,
        subtopics: state.subtopics,
        examScores: state.examScores,
        timeLogs: state.timeLogs,
        targetExamDate: state.targetExamDate,
        exportTimestamp: new Date().toISOString(),
      };

      window.google!.script!.run!
        .withSuccessHandler((message: string) => {
          resolve(message || 'Synced successfully to Google Sheets');
        })
        .withFailureHandler((err: any) => {
          reject(err);
        })
        .syncAllToGoogleSheets(JSON.stringify(payload));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Complete, standalone Code.gs file content ready to paste into script.google.com
 */
export const GAS_SERVER_CODE_GS = `/**
 * ============================================================================
 * BOARD EXAM STUDY TRACKER - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ============================================================================
 * This script serves the React Study Tracker as a Google Apps Script Web App
 * and provides custom Google Sheets menus, sidebar views, and two-way sync.
 */

// Key for UserProperties storage
const STUDY_STORAGE_KEY = 'BOARD_EXAM_STUDY_STATE_V1';

/**
 * Serves the standalone Web Application
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Board Exam Study Tracker & CPA Ledger')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Adds custom menu when opened inside Google Sheets
 */
function onOpen(e) {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('📚 Board Exam Tracker')
      .addItem('🚀 Open Tracker Sidebar', 'showTrackerSidebar')
      .addItem('🖥️ Open Fullscreen Dialog', 'showTrackerDialog')
      .addSeparator()
      .addItem('📊 Sync All Tracker Data to Sheets', 'syncFromPropertiesToSheets')
      .addItem('📥 Reset / Seed CPALE Sample Syllabus', 'seedSampleSyllabusToSheets')
      .addToUi();
  } catch (err) {
    Logger.log('Not in Spreadsheet context: ' + err);
  }
}

/**
 * Displays the tracker inside the Google Sheets right sidebar
 */
function showTrackerSidebar() {
  var html = HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Board Exam Tracker')
    .setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Displays the tracker inside a large modal dialog
 */
function showTrackerDialog() {
  var html = HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setWidth(1080)
    .setHeight(750);
  SpreadsheetApp.getUi().showModalDialog(html, 'Board Exam Study Tracker & Diagnostic Ledger');
}

/**
 * Chunk-safe storage helpers for ScriptProperties (bypasses 9KB property limit)
 */
function saveChunkedProperty_(baseKey, str) {
  var props = PropertiesService.getScriptProperties();
  if (!str) {
    props.deleteProperty(baseKey + '_count');
    props.deleteProperty(baseKey);
    return;
  }
  var CHUNK_SIZE = 8000;
  var totalChunks = Math.ceil(str.length / CHUNK_SIZE);
  props.setProperty(baseKey + '_count', String(totalChunks));
  for (var i = 0; i < totalChunks; i++) {
    var chunk = str.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    props.setProperty(baseKey + '_' + i, chunk);
  }
  var oldI = totalChunks;
  while (props.getProperty(baseKey + '_' + oldI) !== null) {
    props.deleteProperty(baseKey + '_' + oldI);
    oldI++;
    if (oldI > totalChunks + 10) break;
  }
}

function loadChunkedProperty_(baseKey) {
  var props = PropertiesService.getScriptProperties();
  var countStr = props.getProperty(baseKey + '_count');
  if (!countStr) {
    return props.getProperty(baseKey);
  }
  var count = parseInt(countStr, 10);
  var result = '';
  for (var i = 0; i < count; i++) {
    var part = props.getProperty(baseKey + '_' + i);
    if (part) {
      result += part;
    }
  }
  return result;
}

/**
 * Multi-user account sync in Google Apps Script (shared across all Chrome profiles & devices)
 */
function saveUsersToGAS(usersJson) {
  saveChunkedProperty_('CPALE_USERS_V3', usersJson);
  return true;
}

function loadUsersFromGAS() {
  return loadChunkedProperty_('CPALE_USERS_V3') || null;
}

/**
 * Multi-user study progress & syllabus state in Google Apps Script
 */
function saveUserStateToGAS(userId, stateJson) {
  var cleanId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  saveChunkedProperty_('CPALE_USER_DATA_' + cleanId, stateJson);
  return true;
}

function loadUserStateFromGAS(userId) {
  var cleanId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return loadChunkedProperty_('CPALE_USER_DATA_' + cleanId) || null;
}

/**
 * Retrieves saved JSON study state from ScriptProperties / UserProperties
 */
function getStudyData() {
  try {
    var data = loadChunkedProperty_(STUDY_STORAGE_KEY);
    if (!data) {
      var userProperties = PropertiesService.getUserProperties();
      data = userProperties.getProperty(STUDY_STORAGE_KEY);
    }
    return data || null;
  } catch (err) {
    Logger.log('Error in getStudyData: ' + err);
    return null;
  }
}

/**
 * Persists JSON study state into ScriptProperties (chunk-safe)
 */
function saveStudyData(jsonPayload) {
  try {
    saveChunkedProperty_(STUDY_STORAGE_KEY, jsonPayload);
    return true;
  } catch (err) {
    Logger.log('Error in saveStudyData: ' + err);
    throw new Error('Failed to save study data in Apps Script: ' + err.message);
  }
}

/**
 * Syncs full study state to formatted Google Sheets tabs
 */
function syncAllToGoogleSheets(jsonPayload) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('Please open this script inside a Google Sheet to sync sheet tabs.');
    }
    
    var data = typeof jsonPayload === 'string' ? JSON.parse(jsonPayload) : jsonPayload;
    var mainTopics = data.mainTopics || [];
    var subtopics = data.subtopics || [];
    var examScores = data.examScores || [];
    var timeLogs = data.timeLogs || [];
    
    // 1. SYLLABUS SHEET
    var syllabusSheet = getOrCreateSheet(ss, '📚 Syllabus & Subtopics', '#1E293B');
    syllabusSheet.clear();
    var syllabusHeaders = ['Main Topic Code', 'Main Topic Title', 'Weight %', 'Subtopic Code', 'Subtopic Title', 'Status', 'Target Hours', 'Logged Hours', 'Notes / Scratchpad'];
    var syllabusRows = [syllabusHeaders];
    
    mainTopics.forEach(function(mt) {
      var subs = subtopics.filter(function(st) { return st.mainTopicId === mt.id; });
      if (subs.length === 0) {
        syllabusRows.push([mt.code, mt.title, mt.weightPercentage + '%', '-', '-', '-', mt.targetHours, 0, mt.description || '']);
      } else {
        subs.forEach(function(st) {
          var loggedMins = timeLogs
            .filter(function(tl) { return tl.subtopicId === st.id; })
            .reduce(function(acc, tl) { return acc + (tl.durationMinutes || 0); }, 0);
          var loggedHrs = Math.round((loggedMins / 60) * 10) / 10;
          syllabusRows.push([mt.code, mt.title, mt.weightPercentage + '%', st.code, st.title, st.status, st.targetHours, loggedHrs, st.notesScratchpad || '']);
        });
      }
    });
    
    if (syllabusRows.length > 0) {
      syllabusSheet.getRange(1, 1, syllabusRows.length, syllabusRows[0].length).setValues(syllabusRows);
      formatHeaderRow(syllabusSheet, syllabusRows[0].length, '#0F172A', '#F8FAFC');
    }
    
    // 2. TIME LOGS SHEET
    var timeSheet = getOrCreateSheet(ss, '⏱️ Study Time Logs', '#065F46');
    timeSheet.clear();
    var timeHeaders = ['Date', 'Main Topic', 'Subtopic Code', 'Subtopic Name', 'Duration (Min)', 'Duration (Hrs)', 'Session Type', 'Study Notes'];
    var timeRows = [timeHeaders];
    
    timeLogs.forEach(function(tl) {
      var mt = mainTopics.find(function(m) { return m.id === tl.mainTopicId; });
      var st = subtopics.find(function(s) { return s.id === tl.subtopicId; });
      var hrs = Math.round((tl.durationMinutes / 60) * 100) / 100;
      timeRows.push([
        tl.date || '',
        mt ? mt.code + ' - ' + mt.title : '',
        st ? st.code : '',
        st ? st.title : '',
        tl.durationMinutes,
        hrs,
        tl.sessionType,
        tl.notes || ''
      ]);
    });
    
    if (timeRows.length > 0) {
      timeSheet.getRange(1, 1, timeRows.length, timeRows[0].length).setValues(timeRows);
      formatHeaderRow(timeSheet, timeRows[0].length, '#064E3B', '#ECFDF5');
    }
    
    // 3. EXAM SCORES SHEET
    var examSheet = getOrCreateSheet(ss, '📝 Exam Scores & Diagnostics', '#7C2D12');
    examSheet.clear();
    var examHeaders = ['Date', 'Subtopic Code', 'Subtopic Name', 'Exam / Quiz Name', 'Score', 'Max Score', 'Percentage %', 'Performance Diagnostic', 'Notes'];
    var examRows = [examHeaders];
    
    examScores.forEach(function(es) {
      var st = subtopics.find(function(s) { return s.id === es.subtopicId; });
      var pct = es.maxScore > 0 ? Math.round((es.score / es.maxScore) * 100) : 0;
      var diag = pct >= 85 ? '🌟 Mastered (>=85%)' : pct >= 75 ? '✅ Passing (>=75%)' : pct >= 60 ? '⚠️ Borderline (60-74%)' : '🚨 Critical Review (<60%)';
      examRows.push([
        es.date || '',
        st ? st.code : '',
        st ? st.title : '',
        es.examName,
        es.score,
        es.maxScore,
        pct + '%',
        diag,
        es.notes || ''
      ]);
    });
    
    if (examRows.length > 0) {
      examSheet.getRange(1, 1, examRows.length, examRows[0].length).setValues(examRows);
      formatHeaderRow(examSheet, examRows[0].length, '#7C2D12', '#FEF2F2');
    }
    
    return 'Synced ' + mainTopics.length + ' subjects, ' + subtopics.length + ' subtopics, ' + timeLogs.length + ' time logs, and ' + examScores.length + ' exam scores to Google Sheets!';
  } catch (err) {
    Logger.log('Error in syncAllToGoogleSheets: ' + err);
    throw new Error('Google Sheets Sync Failed: ' + err.message);
  }
}

/**
 * Helper to retrieve or insert a named worksheet
 */
function getOrCreateSheet(ss, sheetName, tabColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (tabColor) {
    try { sheet.setTabColor(tabColor); } catch (e) {}
  }
  return sheet;
}

/**
 * Formats table header row with elegant dark background & bold text
 */
function formatHeaderRow(sheet, colCount, bgColor, fgColor) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground(bgColor || '#0F172A');
  headerRange.setFontColor(fgColor || '#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial');
  headerRange.setFontSize(10);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, colCount);
}
`;

/**
 * Generates TSV tables suitable for direct copy-pasting into Google Sheets / Excel
 */
export function generateGoogleSheetsTSV(
  state: ApplicationState,
  sheetType: 'syllabus' | 'timelogs' | 'scores' | 'summary' | 'accounts',
  accountsList?: Array<{ id: string; name: string; username?: string; email?: string; role?: string; targetExam?: string; createdAt: string; lastLoginAt?: string }>
): string {
  if (sheetType === 'accounts') {
    const headers = ['Account ID', 'Full Name', 'Username', 'Role', 'Target Exam', 'Registered Date', 'Last Active'];
    const rows = [headers.join('\t')];
    const users = accountsList || (state.currentUser ? [state.currentUser] : []);
    users.forEach((u) => {
      rows.push([
        u.id,
        u.name,
        u.username || u.email || '—',
        u.role === 'owner' ? '👑 Owner (Admin)' : 'Student / Candidate',
        u.targetExam || 'Philippine CPA Licensure Exam',
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
        u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never',
      ].join('\t'));
    });
    return rows.join('\n');
  }

  if (sheetType === 'syllabus') {
    const headers = ['Main Topic Code', 'Main Topic Title', 'Weight %', 'Subtopic Code', 'Subtopic Title', 'Status', 'Target Hours', 'Logged Hours', 'Notes'];
    const rows = [headers.join('\t')];
    state.mainTopics.forEach((mt) => {
      const subs = state.subtopics.filter((st) => st.mainTopicId === mt.id);
      if (subs.length === 0) {
        rows.push([mt.code, mt.title, `${mt.weightPercentage}%`, '-', '-', '-', mt.targetHours, 0, mt.description].join('\t'));
      } else {
        subs.forEach((st) => {
          const loggedMins = state.timeLogs
            .filter((tl) => tl.subtopicId === st.id)
            .reduce((acc, tl) => acc + (tl.durationMinutes || 0), 0);
          const loggedHrs = Math.round((loggedMins / 60) * 10) / 10;
          rows.push([
            mt.code,
            mt.title,
            `${mt.weightPercentage}%`,
            st.code,
            st.title,
            st.status,
            st.targetHours,
            loggedHrs,
            (st.notesScratchpad || '').replace(/\t|\n/g, ' '),
          ].join('\t'));
        });
      }
    });
    return rows.join('\n');
  }

  if (sheetType === 'timelogs') {
    const headers = ['Date', 'Main Topic', 'Subtopic Code', 'Subtopic Name', 'Duration (Min)', 'Duration (Hrs)', 'Session Type', 'Study Notes'];
    const rows = [headers.join('\t')];
    state.timeLogs.forEach((tl) => {
      const mt = state.mainTopics.find((m) => m.id === tl.mainTopicId);
      const st = state.subtopics.find((s) => s.id === tl.subtopicId);
      const hrs = Math.round((tl.durationMinutes / 60) * 100) / 100;
      rows.push([
        tl.date || '',
        mt ? `${mt.code} - ${mt.title}` : '',
        st ? st.code : '',
        st ? st.title : '',
        tl.durationMinutes,
        hrs,
        tl.sessionType,
        (tl.notes || '').replace(/\t|\n/g, ' '),
      ].join('\t'));
    });
    return rows.join('\n');
  }

  if (sheetType === 'scores') {
    const headers = ['Date', 'Subtopic Code', 'Subtopic Name', 'Exam Name', 'Score', 'Max Score', 'Percentage %', 'Diagnostic Level', 'Notes'];
    const rows = [headers.join('\t')];
    state.examScores.forEach((es) => {
      const st = state.subtopics.find((s) => s.id === es.subtopicId);
      const pct = es.maxScore > 0 ? Math.round((es.score / es.maxScore) * 100) : 0;
      const diag = pct >= 85 ? 'Mastered (>=85%)' : pct >= 75 ? 'Passing (>=75%)' : pct >= 60 ? 'Borderline (60-74%)' : 'Critical Review (<60%)';
      rows.push([
        es.date || '',
        st ? st.code : '',
        st ? st.title : '',
        es.examName,
        es.score,
        es.maxScore,
        `${pct}%`,
        diag,
        (es.notes || '').replace(/\t|\n/g, ' '),
      ].join('\t'));
    });
    return rows.join('\n');
  }

  // Summary
  const totalMins = state.timeLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalHours = Math.round((totalMins / 60) * 10) / 10;
  const masteredCount = state.subtopics.filter((s) => s.status === 'Mastered').length;
  const inProgressCount = state.subtopics.filter((s) => s.status === 'In Progress' || s.status === 'Reviewing').length;

  return [
    'Metric\tValue',
    `Target Exam Date\t${state.targetExamDate || 'Not specified'}`,
    `Total Main Topics (Subjects)\t${state.mainTopics.length}`,
    `Total Subtopics\t${state.subtopics.length}`,
    `Mastered Subtopics\t${masteredCount}`,
    `In Progress / Reviewing Subtopics\t${inProgressCount}`,
    `Total Study Hours Logged\t${totalHours} hours`,
    `Total Exam Scores Logged\t${state.examScores.length}`,
    `Generated At\t${new Date().toLocaleString()}`,
  ].join('\n');
}
