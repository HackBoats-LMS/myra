"use client";
import { useState } from "react";
import { updateUserProfile, changePassword } from "@/actions/user";
import { signOut } from "next-auth/react";
import { 
  ArrowPathIcon, 
  ArrowRightOnRectangleIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  PencilSquareIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import type { User } from "@/generated/prisma";

export default function ProfileForm({ user }: { user: User }) {
  const toast = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      await updateUserProfile(formData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPassword(true);
    const formData = new FormData(e.currentTarget);

    try {
      await changePassword(formData);
      toast.success("Password changed successfully!");
      (e.target as HTMLFormElement).reset();
      setShowPasswordSection(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Details Box */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Account Details</h3>
          <div className="flex items-center gap-4">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-[#0D3B66] hover:text-[#082a4d] flex items-center gap-1.5 transition-colors"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Edit Profile
              </button>
            )}
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {isEditing ? (
          /* EDIT MODE FORM */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Personal Info</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Full Name</label>
                  <input name="name" defaultValue={user.name || ''} className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Email Address</label>
                  <input name="email" type="email" defaultValue={user.email || ''} className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    {user.phoneNumber ? "Phone Number (Cannot be changed)" : "Phone Number"}
                  </label>
                  <input 
                    name="phoneNumber"
                    disabled={!!user.phoneNumber} 
                    defaultValue={user.phoneNumber || ''} 
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                      user.phoneNumber 
                        ? "border-gray-300 bg-gray-100 text-gray-700 cursor-not-allowed" 
                        : "border-gray-400 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20"
                    }`} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Shipping Address</h4>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Address Line 1</label>
                <input name="addressLine1" defaultValue={user.addressLine1 || ''} placeholder="Street address, P.O. box, etc." className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">City</label>
                  <input name="city" defaultValue={user.city || ''} className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">State / Province</label>
                  <input name="state" defaultValue={user.state || ''} className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Postal Code</label>
                  <input name="postalCode" defaultValue={user.postalCode || ''} className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Country</label>
                  <input name="country" defaultValue={user.country || ''} className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#0D3B66] hover:bg-[#082a4d] text-white px-8 py-2.5 rounded-md text-sm font-bold tracking-widest uppercase transition-colors flex items-center disabled:opacity-50"
              >
                {isSubmitting ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          /* READ/VIEW MODE SUMMARY */
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                Personal Info
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500 block">Full Name</span>
                    <span className="text-sm font-semibold text-gray-900">{user.name || "Not set"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500 block">Email Address</span>
                    <span className="text-sm font-semibold text-gray-900">{user.email || "Not set"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500 block">Phone Number</span>
                    <span className="text-sm font-semibold text-gray-900">{user.phoneNumber || "Not set"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                Shipping Address
              </h4>
              {user.addressLine1 ? (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-semibold text-gray-900">{user.name || "Customer Address"}</p>
                    <p>{user.addressLine1}</p>
                    <p>{user.city}, {user.state} {user.postalCode}</p>
                    <p className="uppercase text-xs font-bold text-gray-500 tracking-wider mt-1">{user.country}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500 text-sm py-2">
                  <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <p>No shipping address saved. Click &quot;Edit Profile&quot; to configure.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change Password Block — Only visible for users with a local password set */}
      {user.password && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full p-6 flex justify-between items-center text-left focus:outline-none"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Security</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">Update your account password</p>
            </div>
            {showPasswordSection ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showPasswordSection && (
            <form onSubmit={handlePasswordSubmit} className="p-6 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Current Password</label>
                <input
                  required
                  name="currentPassword"
                  type="password"
                  className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">New Password</label>
                <input
                  required
                  name="newPassword"
                  type="password"
                  className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Confirm New Password</label>
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/20 transition-all"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-2.5 rounded-md text-sm font-bold tracking-widest uppercase transition-colors flex items-center disabled:opacity-50"
                >
                  {isChangingPassword ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
