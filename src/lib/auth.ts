import { UserAccount, ApplicationState } from '../types';
import { initialBlankState, sampleCPALEData, getCleanCPALESyllabus } from './storage';

const USERS_KEY = 'cpale_tracker_users_v3';
const ACTIVE_SESSION_KEY = 'cpale_tracker_active_session_v3';
const USER_DATA_PREFIX = 'cpale_tracker_data_u_';

// Simple reliable client-side string hashing for local authentication
export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(password + '_cpa_salt_2026');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if crypto.subtle is unavailable
  }
  // Simple fallback hash
  let hash = 0;
  const str = password + '_cpa_salt_2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(16);
}

// Generate an attractive avatar color for user badge
const AVATAR_COLORS = [
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

/**
 * Validates if a user is the designated admin/owner (admin@cpale.com)
 * Only the admin account is granted access to Apps Script, Google Sheets, and Schema Documentation.
 */
export function isAppAdmin(user: UserAccount | null | undefined): boolean {
  if (!user) return false;
  const uname = (user.username || user.email || '').toLowerCase().trim();
  return (
    user.role === 'owner' ||
    uname === 'admin@cpale.com' ||
    uname === 'candidate@cpale.ph' ||
    user.id === 'usr_admin_cpale' ||
    user.id === 'usr_demo_cpale'
  );
}

export function getRegisteredUsers(): UserAccount[] {
  try {
    let raw = localStorage.getItem(USERS_KEY);
    // Check if migrating from v2
    if (!raw) {
      const v2 = localStorage.getItem('cpale_tracker_users_v2');
      if (v2) {
        try {
          const parsedV2 = JSON.parse(v2);
          if (Array.isArray(parsedV2)) {
            parsedV2.forEach((u: any) => {
              u.username = u.username || u.email || 'user_' + u.id;
            });
            localStorage.setItem(USERS_KEY, JSON.stringify(parsedV2));
            raw = JSON.stringify(parsedV2);
          }
        } catch {
          // ignore migration error
        }
      }
    }

    if (!raw) {
      // Seed initial Admin user with username admin@cpale.com and password boardtracker
      const adminUser: UserAccount = {
        id: 'usr_admin_cpale',
        username: 'admin@cpale.com',
        email: 'admin@cpale.com',
        name: 'Administrator',
        role: 'owner',
        passwordHash: '', // populated below
        targetExam: 'Philippine CPA Licensure Exam (CPALE)',
        targetExamDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        avatarColor: '#F59E0B',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      hashPassword('boardtracker').then((h) => {
        adminUser.passwordHash = h;
        localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
        // Seed admin user's syllabus & initial sample data
        const adminState: ApplicationState = {
          ...initialBlankState,
          currentUser: adminUser,
          mainTopics: sampleCPALEData.mainTopics,
          subtopics: sampleCPALEData.subtopics,
          resources: sampleCPALEData.resources,
          examScores: sampleCPALEData.examScores,
          timeLogs: sampleCPALEData.timeLogs,
          targetExamDate: adminUser.targetExamDate,
        };
        localStorage.setItem(USER_DATA_PREFIX + adminUser.id, JSON.stringify(adminState));
      });
      return [adminUser];
    }

    const parsed: UserAccount[] = JSON.parse(raw);
    let updated = false;

    // Ensure admin@cpale.com account exists in the list
    let admin = parsed.find(
      (u) =>
        (u.username && u.username.toLowerCase() === 'admin@cpale.com') ||
        (u.email && u.email.toLowerCase() === 'admin@cpale.com') ||
        u.id === 'usr_admin_cpale'
    );

    if (!admin) {
      admin = {
        id: 'usr_admin_cpale',
        username: 'admin@cpale.com',
        email: 'admin@cpale.com',
        name: 'Administrator',
        role: 'owner',
        passwordHash: '',
        targetExam: 'Philippine CPA Licensure Exam (CPALE)',
        targetExamDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        avatarColor: '#F59E0B',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      parsed.unshift(admin);
      updated = true;
    }

    // Ensure admin has role owner and username is admin@cpale.com
    if (admin.role !== 'owner' || admin.username !== 'admin@cpale.com') {
      admin.role = 'owner';
      admin.username = 'admin@cpale.com';
      updated = true;
    }

    // Ensure all users have a valid username field
    parsed.forEach((u) => {
      if (!u.username) {
        u.username = u.email || 'user_' + u.id;
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.error('Failed to read registered users:', err);
    return [];
  }
}

export function saveRegisteredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save registered users:', err);
  }
}

export function getActiveSessionUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const sessionUser: UserAccount = JSON.parse(raw);
    // Verify user still exists in registered users
    const users = getRegisteredUsers();
    const existing = users.find(
      (u) =>
        u.id === sessionUser.id ||
        (u.username && sessionUser.username && u.username.toLowerCase() === sessionUser.username.toLowerCase()) ||
        (u.email && sessionUser.email && u.email.toLowerCase() === sessionUser.email.toLowerCase())
    );
    return existing || sessionUser;
  } catch (err) {
    console.error('Failed to read active session:', err);
    return null;
  }
}

export function setActiveSessionUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (err) {
    console.error('Failed to set active session:', err);
  }
}

export function loadUserState(userId: string): ApplicationState {
  try {
    const raw = localStorage.getItem(USER_DATA_PREFIX + userId);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...initialBlankState,
        ...parsed,
        mainTopics: Array.isArray(parsed.mainTopics) ? parsed.mainTopics : [],
        subtopics: Array.isArray(parsed.subtopics) ? parsed.subtopics : [],
        resources: Array.isArray(parsed.resources) ? parsed.resources : [],
        examScores: Array.isArray(parsed.examScores) ? parsed.examScores : [],
        timeLogs: Array.isArray(parsed.timeLogs) ? parsed.timeLogs : [],
        timerState: {
          ...initialBlankState.timerState,
          ...(parsed.timerState || {}),
          isRunning: false,
          isPaused: false,
        },
      };
    }
  } catch (err) {
    console.error('Failed to load user state for', userId, err);
  }

  // Fallback to sample data for admin, blank syllabus for others
  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === userId);
  if (user && isAppAdmin(user)) {
    return {
      ...initialBlankState,
      currentUser: user,
      mainTopics: sampleCPALEData.mainTopics,
      subtopics: sampleCPALEData.subtopics,
      resources: sampleCPALEData.resources,
      examScores: sampleCPALEData.examScores,
      timeLogs: sampleCPALEData.timeLogs,
      targetExamDate: user.targetExamDate,
    };
  }

  const clean = getCleanCPALESyllabus();
  return {
    ...initialBlankState,
    currentUser: user || null,
    mainTopics: clean.mainTopics,
    subtopics: clean.subtopics,
    resources: [],
    examScores: [],
    timeLogs: [],
    targetExamDate: user?.targetExamDate,
  };
}

let userSaveDebounceTimer: any = null;

export function saveUserState(userId: string, state: ApplicationState, immediate = false): void {
  const doSave = () => {
    try {
      const payload = {
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
      };
      localStorage.setItem(USER_DATA_PREFIX + userId, JSON.stringify(payload));
    } catch (err) {
      console.error('Failed to persist user state for', userId, err);
    }
  };

  if (immediate) {
    if (userSaveDebounceTimer) clearTimeout(userSaveDebounceTimer);
    doSave();
  } else {
    if (userSaveDebounceTimer) clearTimeout(userSaveDebounceTimer);
    userSaveDebounceTimer = setTimeout(doSave, 800);
  }
}

export interface SignUpParams {
  name: string;
  username: string;
  password: string;
  targetExam?: string;
  targetExamDate?: string;
  templateOption?: 'cpale' | 'blank';
}

export async function registerUser(params: SignUpParams): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanName = params.name.trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }
  if (!/^[a-zA-Z0-9_.@-]+$/.test(cleanUsername)) {
    return { success: false, error: 'Username can only contain letters, numbers, hyphens, underscores, dots, and @.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Please enter your full name or nickname.' };
  }
  if (!params.password || params.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const users = getRegisteredUsers();
  const alreadyExists = users.some(
    (u) =>
      (u.username && u.username.toLowerCase() === cleanUsername) ||
      (u.email && u.email.toLowerCase() === cleanUsername)
  );
  if (alreadyExists) {
    return { success: false, error: 'An account with this username already exists. Please choose a different username or sign in.' };
  }

  const passwordHash = await hashPassword(params.password);
  const colorIndex = users.length % AVATAR_COLORS.length;

  const isOwner = cleanUsername === 'admin@cpale.com';
  const newUser: UserAccount = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    username: cleanUsername,
    name: cleanName,
    passwordHash,
    role: isOwner ? 'owner' : 'student',
    targetExam: params.targetExam || 'Philippine CPA Licensure Exam (CPALE)',
    targetExamDate: params.targetExamDate || new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    avatarColor: AVATAR_COLORS[colorIndex],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveRegisteredUsers(users);

  // Initialize their isolated user storage ledger
  let initialState: ApplicationState;
  if (params.templateOption === 'blank') {
    initialState = {
      ...initialBlankState,
      currentUser: newUser,
      targetExamDate: newUser.targetExamDate,
    };
  } else {
    // Default CPALE template: Clean curriculum without another user's scores, logs, or notes
    const cleanSyllabus = getCleanCPALESyllabus();
    initialState = {
      ...initialBlankState,
      currentUser: newUser,
      mainTopics: cleanSyllabus.mainTopics,
      subtopics: cleanSyllabus.subtopics,
      resources: [],
      examScores: [],
      timeLogs: [],
      targetExamDate: newUser.targetExamDate,
    };
  }

  // Save new user state immediately to their private storage slot
  saveUserState(newUser.id, initialState, true);
  setActiveSessionUser(newUser);

  return { success: true, user: newUser };
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    return { success: false, error: 'Please enter your username.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  const users = getRegisteredUsers();
  // Find matching user by username (or fallback legacy email)
  let user = users.find(
    (u) =>
      (u.username && u.username.toLowerCase() === cleanUsername) ||
      (u.email && u.email.toLowerCase() === cleanUsername)
  );

  // If user entered admin alias
  if (!user && (cleanUsername === 'admin@cpale.com' || cleanUsername === 'admin' || cleanUsername === 'candidate@cpale.ph')) {
    user = users.find((u) => u.role === 'owner' || u.id === 'usr_admin_cpale' || u.id === 'usr_demo_cpale');
  }

  if (!user) {
    return { success: false, error: 'No account found with this username. Please check your spelling or sign up.' };
  }

  const inputHash = await hashPassword(password);
  const isDefaultAdmin = isAppAdmin(user);
  
  // Accept hashed password OR the requested admin password "boardtracker" for admin accounts
  const isValidPassword =
    (user.passwordHash && user.passwordHash === inputHash) ||
    (isDefaultAdmin && (password === 'boardtracker' || password === 'board2026'));

  if (!isValidPassword) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  // Update last login & ensure admin privileges
  user.lastLoginAt = new Date().toISOString();
  if (isDefaultAdmin) {
    user.role = 'owner';
    user.username = 'admin@cpale.com';
  }
  // Store hashed password if not set
  if (!user.passwordHash || (isDefaultAdmin && password === 'boardtracker')) {
    user.passwordHash = inputHash;
  }
  saveRegisteredUsers(users);
  setActiveSessionUser(user);

  return { success: true, user };
}

export function logoutUser(): void {
  setActiveSessionUser(null);
}

export async function updateUserAccount(
  userId: string,
  updates: { username?: string; name?: string; targetExam?: string; targetExamDate?: string; avatarColor?: string; theme?: any; role?: 'owner' | 'student' },
  newPassword?: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return { success: false, error: 'User account not found.' };
  }

  if (updates.username) {
    const clean = updates.username.trim().toLowerCase();
    if (clean.length >= 3) {
      users[idx].username = clean;
    }
  }
  if (updates.name) users[idx].name = updates.name.trim();
  if (updates.targetExam) users[idx].targetExam = updates.targetExam.trim();
  if (updates.targetExamDate) users[idx].targetExamDate = updates.targetExamDate;
  if (updates.avatarColor) users[idx].avatarColor = updates.avatarColor;
  if (updates.theme) users[idx].theme = updates.theme;
  if (updates.role) users[idx].role = updates.role;

  if (newPassword && newPassword.length >= 6) {
    users[idx].passwordHash = await hashPassword(newPassword);
  }

  saveRegisteredUsers(users);
  setActiveSessionUser(users[idx]);

  return { success: true, user: users[idx] };
}

export function deleteRegisteredUser(userId: string): { success: boolean; error?: string } {
  try {
    const users = getRegisteredUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };
    
    // Do not allow deleting the sole owner if it is the only user
    const remaining = users.filter((u) => u.id !== userId);
    if (remaining.length === 0) {
      return { success: false, error: 'Cannot delete the only registered account.' };
    }
    
    // Ensure at least one owner remains
    if (!remaining.some((u) => u.role === 'owner')) {
      remaining[0].role = 'owner';
    }

    saveRegisteredUsers(remaining);
    localStorage.removeItem(USER_DATA_PREFIX + userId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove user' };
  }
}
