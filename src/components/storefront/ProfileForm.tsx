"use client";
import { useState } from "react";
import { updateUserProfile } from "@/actions/user";
import { signOut } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";

export default function ProfileForm({ user }: { user: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");
    const formData = new FormData(e.currentTarget);

    try {
      await updateUserProfile(formData);
      setSuccessMsg("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Account Details</h3>
        <button 
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {successMsg && (
          <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-md">
            {successMsg}
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Personal Info</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" defaultValue={user.name || ''} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <input name="email" type="email" defaultValue={user.email || ''} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number (Cannot be changed)</label>
              <input disabled defaultValue={user.phoneNumber || ''} className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Shipping Address</h4>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 1</label>
            <input name="addressLine1" defaultValue={user.addressLine1 || ''} placeholder="Street address, P.O. box, etc." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input name="city" defaultValue={user.city || ''} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">State / Province</label>
              <input name="state" defaultValue={user.state || ''} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
              <input name="postalCode" defaultValue={user.postalCode || ''} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
              <input name="country" defaultValue={user.country || ''} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-[#0D3B66] hover:bg-[#082a4d] text-white px-8 py-2.5 rounded-md text-sm font-bold tracking-widest uppercase transition-colors flex items-center disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
