"use client";
import { useReducer } from "react";
import { updateUserProfile, changePassword } from "@/actions/user";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import type { User } from "@/generated/prisma";

interface ProfileState {
  isEditing: boolean;
  isSubmitting: boolean;
  showPasswordSection: boolean;
  isChangingPassword: boolean;
}

type ProfileAction =
  | { type: "START_EDIT" }
  | { type: "CANCEL_EDIT" }
  | { type: "PROFILE_SUBMITTING" }
  | { type: "PROFILE_DONE" }
  | { type: "PROFILE_SAVED" }
  | { type: "TOGGLE_PASSWORD" }
  | { type: "PASSWORD_SUBMITTING" }
  | { type: "PASSWORD_SAVED" }
  | { type: "PASSWORD_DONE" };

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case "START_EDIT":
      return { ...state, isEditing: true };
    case "CANCEL_EDIT":
      return { ...state, isEditing: false };
    case "PROFILE_SUBMITTING":
      return { ...state, isSubmitting: true };
    case "PROFILE_DONE":
      return { ...state, isSubmitting: false };
    case "PROFILE_SAVED":
      return { ...state, isEditing: false, isSubmitting: false };
    case "TOGGLE_PASSWORD":
      return { ...state, showPasswordSection: !state.showPasswordSection };
    case "PASSWORD_SUBMITTING":
      return { ...state, isChangingPassword: true };
    case "PASSWORD_SAVED":
      return { ...state, isChangingPassword: false, showPasswordSection: false };
    case "PASSWORD_DONE":
      return { ...state, isChangingPassword: false };
    default:
      return state;
  }
}

export default function ProfileForm({ user }: { user: User }) {
  const toast = useToast();
  const router = useRouter();
  const [state, dispatch] = useReducer(profileReducer, {
    isEditing: false,
    isSubmitting: false,
    showPasswordSection: false,
    isChangingPassword: false,
  });
  const { isEditing, isSubmitting, showPasswordSection, isChangingPassword } = state;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch({ type: "PROFILE_SUBMITTING" });
    const formData = new FormData(e.currentTarget);

    try {
      await updateUserProfile(formData);
      toast.success("Profile updated successfully!");
      dispatch({ type: "PROFILE_SAVED" });
      router.refresh();
    } catch {
      toast.error("Failed to update profile. Please try again.");
      dispatch({ type: "PROFILE_DONE" });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch({ type: "PASSWORD_SUBMITTING" });
    const formData = new FormData(e.currentTarget);

    try {
      await changePassword(formData);
      toast.success("Password changed successfully!");
      (e.target as HTMLFormElement).reset();
      dispatch({ type: "PASSWORD_SAVED" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password.");
      dispatch({ type: "PASSWORD_DONE" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Details Box */}
      <div className="bg-white border border-[#B6925B]/20 shadow-sm relative rounded-none">
        <div className="p-6 border-b border-[#B6925B]/20 flex justify-between items-center bg-[#FAFAFA]">
          <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide">Account Details</h3>
          <div className="flex items-center gap-4">
            {!isEditing && (
              <button 
                onClick={() => dispatch({ type: "START_EDIT" })}
                className="text-sm font-semibold text-[#B6925B] hover:text-[#9c7d4e] flex items-center gap-1.5 transition-colors uppercase tracking-widest"
              >
                <i className="ri-edit-box-line text-base" />
                Edit Profile
              </button>
            )}
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm font-bold text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 uppercase tracking-widest"
            >
              <i className="ri-logout-box-r-line text-base" />
              Sign Out
            </button>
          </div>
        </div>

        {isEditing ? (
          /* EDIT MODE FORM */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">Personal Info</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Full Name</label>
                  <input name="name" defaultValue={user.name || ''} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Email Address</label>
                  <input name="email" type="email" defaultValue={user.email || ''} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                    {user.phoneNumber ? "Phone Number (Cannot be changed)" : "Phone Number"}
                  </label>
                  <input 
                    name="phoneNumber"
                    disabled={!!user.phoneNumber} 
                    defaultValue={user.phoneNumber || ''} 
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full rounded-none border px-3 py-2 text-sm font-medium transition-all ${
                      user.phoneNumber 
                        ? "border-[#B6925B]/10 bg-[#FAFAFA] text-gray-500 cursor-not-allowed" 
                        : "border-[#B6925B]/20 bg-white text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]"
                    }`} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#B6925B]/20">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">Shipping Address</h4>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Address Line 1</label>
                <input name="addressLine1" defaultValue={user.addressLine1 || ''} placeholder="Street address, P.O. box, etc." className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">City</label>
                  <input name="city" defaultValue={user.city || ''} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">State / Province</label>
                  <input name="state" defaultValue={user.state || ''} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Postal Code</label>
                  <input name="postalCode" defaultValue={user.postalCode || ''} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Country</label>
                  <input name="country" defaultValue={user.country || ''} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-[#B6925B]/20">
              <button 
                type="button"
                onClick={() => dispatch({ type: "CANCEL_EDIT" })}
                className="px-5 py-2.5 text-[10px] font-bold text-gray-500 hover:text-[#4A3B2C] uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center disabled:opacity-50 rounded-none"
              >
                {isSubmitting ? <i className="ri-loader-4-line mr-2 animate-spin text-base" /> : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          /* READ/VIEW MODE SUMMARY */
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] border-b border-[#B6925B]/20 pb-2">
                Personal Info
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <i className="ri-user-line text-lg text-[#B6925B] flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Full Name</span>
                    <span className="text-sm font-medium text-[#4A3B2C]">{user.name || "Not set"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <i className="ri-mail-line text-lg text-[#B6925B] flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Email Address</span>
                    <span className="text-sm font-medium text-[#4A3B2C]">{user.email || "Not set"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <i className="ri-phone-line text-lg text-[#B6925B] flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Phone Number</span>
                    <span className="text-sm font-medium text-[#4A3B2C]">{user.phoneNumber || "Not set"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] border-b border-[#B6925B]/20 pb-2">
                Shipping Address
              </h4>
              {user.addressLine1 ? (
                <div className="flex items-start gap-3">
                  <i className="ri-map-pin-line text-lg text-[#B6925B] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#4A3B2C] space-y-1">
                    <p className="font-bold text-[#4A3B2C]">{user.name || "Customer Address"}</p>
                    <p>{user.addressLine1}</p>
                    <p>{user.city}, {user.state} {user.postalCode}</p>
                    <p className="uppercase text-[10px] font-bold text-gray-500 tracking-widest mt-1">{user.country}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500 text-xs font-bold uppercase tracking-widest py-2">
                  <i className="ri-map-pin-line text-lg text-gray-400 flex-shrink-0" />
                  <p>No shipping address saved. Click &quot;Edit Profile&quot; to configure.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change Password Block — Only visible for users with a local password set */}
      {user.password && (
        <div className="bg-white border border-[#B6925B]/20 shadow-sm rounded-none">
          <button
            onClick={() => dispatch({ type: "TOGGLE_PASSWORD" })}
            className="w-full p-6 flex justify-between items-center text-left focus:outline-none"
          >
            <div>
              <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide">Security</h3>
              <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Update your account password</p>
            </div>
            {showPasswordSection ? (
              <i className="ri-arrow-up-s-line text-xl text-[#B6925B]" />
            ) : (
              <i className="ri-arrow-down-s-line text-xl text-[#B6925B]" />
            )}
          </button>

          {showPasswordSection && (
            <form onSubmit={handlePasswordSubmit} className="p-6 border-t border-[#B6925B]/20 space-y-4 bg-[#FAFAFA]">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Current Password</label>
                <input
                  required
                  name="currentPassword"
                  type="password"
                  className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">New Password</label>
                <input
                  required
                  name="newPassword"
                  type="password"
                  className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Confirm New Password</label>
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] placeholder-gray-400 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all"
                />
              </div>
              <div className="pt-4 flex justify-end border-t border-[#B6925B]/20 mt-6">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-[#4A3B2C] hover:bg-[#34291f] text-white px-8 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center disabled:opacity-50 rounded-none"
                >
                  {isChangingPassword ? <i className="ri-loader-4-line mr-2 animate-spin text-base" /> : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
