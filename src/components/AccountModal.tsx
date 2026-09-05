import React, { useState } from 'react';
import {
  LogOut,
  Palette,
  CheckCircle2,
  KeyRound,
  GraduationCap,
  Users,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Crown,
} from 'lucide-react';
import { UserAccount, ApplicationState } from '../types';
import { Modal } from './Modal';
import { updateUserAccount, getRegisteredUsers, deleteRegisteredUser, isAppAdmin } from '../lib/auth';
import { useToast } from './Toast';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  state: ApplicationState;
  setState: React.Dispatch<React.SetStateAction<ApplicationState>>;
  onSignOut: () => void;
  onSwitchUser: (user: UserAccount) => void;
  onOpenThemeModal?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  state,
  setState,
  onSignOut,
  onSwitchUser,
  onOpenThemeModal,
}) => {
  const { showToast } = useToast();
  const isOwner = isAppAdmin(currentUser);

  const [name, setName] = useState(currentUser.name);
  const [targetExam, setTargetExam] = useState(currentUser.targetExam || 'Philippine CPA Licensure Exam (CPALE)');
  const [targetExamDate, setTargetExamDate] = useState(
    state.targetExamDate || currentUser.targetExamDate || new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // Change password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status feedback
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteCandidateUser, setDeleteCandidateUser] = useState<UserAccount | null>(null);

  const registeredUsers = getRegisteredUsers();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!name.trim()) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New passwords do not match.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await updateUserAccount(
        currentUser.id,
        {
          name: name.trim(),
          targetExam: targetExam.trim(),
          targetExamDate,
        },
        newPassword || undefined
      );

      if (res.success && res.user) {
        setState((prev) => ({
          ...prev,
          currentUser: res.user,
          targetExamDate,
        }));
        setStatusMessage('Account profile updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Profile Saved', 'Account settings have been updated.', 'success');
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      } else {
        setErrorMessage(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchAccount = async (targetUser: UserAccount) => {
    if (targetUser.id === currentUser.id) return;
    onClose();
    onSwitchUser(targetUser);
  };

  const handleDeleteUser = (target: UserAccount) => {
    const res = deleteRegisteredUser(target.id);
    if (res.success) {
      showToast('Account Removed', `User account ${target.name} (@${target.username || target.email}) was deleted.`, 'info');
      setDeleteCandidateUser(null);
    } else {
      showToast('Delete Failed', res.error || 'Could not delete user account.', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Account & Reviewer Profile" maxWidth="lg">
      <div className="space-y-6">
        {/* User Identity Header Card */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-slate-950 shadow-inner shrink-0"
              style={{ backgroundColor: currentUser.avatarColor || '#F59E0B' }}
            >
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-base">{currentUser.name}</span>
                {isOwner ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>App Owner (Admin)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <span>Student / Candidate</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">@{currentUser.username || currentUser.email}</div>
              <div className="text-[10px] text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                <span>{currentUser.targetExam || 'CPA Licensure Exam'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Feedback alerts */}
        {statusMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dashboard Theme Quick Action */}
        {onOpenThemeModal && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-950 shadow-xs"
                style={{ backgroundColor: state.theme?.accentColor || '#F59E0B' }}
              >
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Theme: {state.theme?.name || 'Classic CPALE Gold'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Accent: {state.theme?.accentColor || '#F59E0B'} • Mode: {state.theme?.backgroundMode || 'dark-slate'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenThemeModal();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Customize Colors</span>
            </button>
          </div>
        )}

        {/* Profile Settings Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800 pb-2">
            Reviewer Details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1 font-semibold">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-hidden focus:border-amber-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1 font-semibold">
                Username (Login Identifier)
              </label>
              <input
                type="text"
                disabled
                value={currentUser.username || currentUser.email}
                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800/60 rounded-xl text-slate-400 text-sm font-mono cursor-not-allowed"
                title="Username is your unique account identifier"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1 font-semibold">
                Target Board Exam
              </label>
              <input
                type="text"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                placeholder="e.g. Philippine CPA Licensure Exam"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-hidden focus:border-amber-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1 font-semibold">
                Target Exam Date
              </label>
              <input
                type="date"
                value={targetExamDate}
                onChange={(e) => setTargetExamDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="pt-3">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800 pb-2 mb-3 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Password (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty to keep current"
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* Multiple Accounts & User Management Section (Owner Only) */}
        {isOwner && (
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Registered Accounts Database ({registeredUsers.length})</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Owner Directory</span>
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {registeredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                    u.id === currentUser.id
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs text-slate-950 shrink-0"
                      style={{ backgroundColor: u.avatarColor || '#F59E0B' }}
                    >
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{u.name}</span>
                        {u.role === 'owner' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                            Owner
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">@{u.username || u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {u.id === currentUser.id ? (
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchAccount(u)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        Switch To
                      </button>
                    )}

                    {/* Owner-Only Account Deletion (Except Self) */}
                    {isOwner && u.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => setDeleteCandidateUser(u)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Remove Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In-App Delete Confirmation Modal */}
        {deleteCandidateUser && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-3">
            <div className="text-xs text-rose-200 font-medium">
              Are you sure you want to remove the account <strong className="text-white">{deleteCandidateUser.name}</strong> (@{deleteCandidateUser.username || deleteCandidateUser.email}) and all their isolated study data?
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateUser(null)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deleteCandidateUser)}
                className="px-3 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
