import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { deleteAllUserData } from '../services/tripStore';

interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataDeleted: () => void;
}

export const DeleteDataModal: React.FC<DeleteDataModalProps> = ({
  isOpen,
  onClose,
  onDataDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await deleteAllUserData();
      setConfirmedSuccess(true);
      setTimeout(() => {
        setConfirmedSuccess(false);
        onDataDeleted();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Delete data failed:', err);
      setErrorMsg(err.message || 'Failed to delete data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-150 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!confirmedSuccess ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  Delete All My Travel Data
                </h3>
                <p className="text-xs text-slate-500">
                  Data Privacy & Erasure Control
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>This action cannot be undone</span>
              </div>
              <p className="leading-relaxed">
                We will permanently delete all your saved trips, custom itineraries, draft planning sessions, and preferences stored in Firestore under your account.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All Data</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">All Travel Data Deleted</h4>
            <p className="text-xs text-slate-500">
              Your trips and draft storage have been completely erased.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
