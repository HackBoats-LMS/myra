"use client";
import { useReducer } from "react";
import { deleteUserAccount } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";
import { signOut } from "next-auth/react";

interface DeleteAccountCardProps {
  userEmail: string | null;
  userPhone: string | null;
}

interface DeleteState {
  showConfirm: boolean;
  confirmInput: string;
  loading: boolean;
}

type DeleteAction =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TYPE"; value: string }
  | { type: "LOADING" }
  | { type: "DONE" };

function deleteReducer(state: DeleteState, action: DeleteAction): DeleteState {
  switch (action.type) {
    case "OPEN":
      return { ...state, showConfirm: true };
    case "CLOSE":
      return { showConfirm: false, confirmInput: "", loading: false };
    case "TYPE":
      return { ...state, confirmInput: action.value };
    case "LOADING":
      return { ...state, loading: true };
    case "DONE":
      return { ...state, loading: false };
    default:
      return state;
  }
}

export default function DeleteAccountCard({ userEmail, userPhone }: DeleteAccountCardProps) {
  const [state, dispatch] = useReducer(deleteReducer, {
    showConfirm: false,
    confirmInput: "",
    loading: false,
  });
  const { showConfirm, confirmInput, loading } = state;
  const toast = useToast();

  const expectedMatch = userEmail || userPhone || "";

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput.trim() !== expectedMatch) {
      toast.error("Input does not match your email or phone number.");
      return;
    }

    dispatch({ type: "LOADING" });
    try {
      await deleteUserAccount();
      toast.success("Account deleted successfully.");
      // Terminate next-auth session and redirect
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account.");
      dispatch({ type: "DONE" });
    }
  };

  return (
    <div className="bg-red-50/30 border border-red-200 p-6 shadow-sm mt-8 space-y-4 rounded-none">
      <div className="flex items-center gap-2 text-red-800">
        <i className="ri-alert-line text-xl" />
        <h3 className="text-xl font-serif tracking-wide">Danger Zone</h3>
      </div>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
        Permanently delete your account and remove all saved addresses, shopping carts, wishlist items, 
        and reviews. This action is irreversible.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => dispatch({ type: "OPEN" })}
          className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm rounded-none"
        >
          Delete Account
        </button>
      ) : (
        <form onSubmit={handleDelete} className="space-y-4 pt-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">
              Confirm by typing your email or phone number (<span className="font-mono text-red-700 select-none">{expectedMatch}</span>):
            </label>
            <input
              required
              type="text"
              value={confirmInput}
              onChange={(e) => dispatch({ type: "TYPE", value: e.target.value })}
              className="w-full bg-white border border-red-200 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 text-[#4A3B2C]"
              placeholder={expectedMatch}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || confirmInput.trim() !== expectedMatch}
              className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 rounded-none"
            >
              {loading && <i className="ri-loader-4-line animate-spin text-base" />}
              <span>Delete Permanently</span>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "CLOSE" })}
              className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#4A3B2C] border border-[#B6925B]/20 transition-colors rounded-none"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
