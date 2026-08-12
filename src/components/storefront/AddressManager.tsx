"use client";
import { useState } from "react";
import { createAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/actions/address";
import { useToast } from "@/components/ui/Toast";
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckIcon, ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Address {
  id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressManagerProps {
  addresses: Address[];
}

export default function AddressManager({ addresses }: AddressManagerProps) {
  const toast = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleSetDefault = async (id: string) => {
    setLoading(`default-${id}`);
    try {
      await setDefaultAddress(id);
      toast.success("Default address updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update default address.");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setLoading(`delete-${id}`);
    try {
      await deleteAddress(id);
      toast.success("Address deleted successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete address.");
    } finally {
      setLoading(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading("submit");
    const formData = new FormData(e.currentTarget);

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
        toast.success("Address updated!");
      } else {
        await createAddress(formData);
        toast.success("Address added successfully!");
      }
      setShowForm(false);
      setEditingAddress(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save address.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Saved Addresses</h3>
          <p className="text-xs text-gray-500 mt-1">Manage your shipping destinations</p>
        </div>
        <button
          onClick={() => {
            setEditingAddress(null);
            setShowForm(true);
          }}
          className="bg-[#0D3B66] hover:bg-[#082a4d] text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 focus:outline-none"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>Add Address</span>
        </button>
      </div>

      {/* Address Form Modal/Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form
            onSubmit={handleFormSubmit}
            className="relative bg-white w-full max-w-md p-6 rounded-lg shadow-2xl space-y-4 z-10 border border-gray-100"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-serif text-lg text-gray-900 font-bold">
                {editingAddress ? "Edit Address" : "New Address"}
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Label (e.g. Home, Work)
                </label>
                <input
                  required
                  name="label"
                  type="text"
                  defaultValue={editingAddress?.label || ""}
                  placeholder="Home"
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-[#0D3B66] text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Address Line 1
                </label>
                <input
                  required
                  name="addressLine1"
                  type="text"
                  defaultValue={editingAddress?.addressLine1 || ""}
                  placeholder="Apartment, suite, unit, building, street"
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-[#0D3B66] text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    required
                    name="city"
                    type="text"
                    defaultValue={editingAddress?.city || ""}
                    placeholder="Bangalore"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-[#0D3B66] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    required
                    name="state"
                    type="text"
                    defaultValue={editingAddress?.state || ""}
                    placeholder="Karnataka"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-[#0D3B66] text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Postal Code
                  </label>
                  <input
                    required
                    name="postalCode"
                    type="text"
                    defaultValue={editingAddress?.postalCode || ""}
                    placeholder="560001"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-[#0D3B66] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    required
                    name="country"
                    type="text"
                    defaultValue={editingAddress?.country || "India"}
                    placeholder="India"
                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-[#0D3B66] text-gray-900"
                  />
                </div>
              </div>

              {(!editingAddress || !editingAddress.isDefault) && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    name="isDefault"
                    value="true"
                    id="isDefault"
                    className="rounded border-gray-300 text-[#0D3B66] focus:ring-[#0D3B66]"
                  />
                  <label htmlFor="isDefault" className="text-xs text-gray-600 cursor-pointer">
                    Set as default shipping address
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading === "submit"}
                className="bg-[#0D3B66] hover:bg-[#082a4d] text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading === "submit" && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingAddress ? "Update" : "Save"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address cards list */}
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">You haven&rsquo;t saved any addresses yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 border rounded-lg flex flex-col justify-between gap-4 transition-all relative ${
                  address.isDefault ? "border-[#0D3B66] bg-slate-50/10 shadow-sm" : "border-gray-200"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900 capitalize">{address.label}</span>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0D3B66]/10 text-[#0D3B66] uppercase tracking-wider">
                        <CheckIcon className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>{address.addressLine1}</p>
                    <p>{address.city}, {address.state} - {address.postalCode}</p>
                    <p className="uppercase tracking-wider text-[10px] text-gray-400 font-semibold">{address.country}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingAddress(address);
                        setShowForm(true);
                      }}
                      className="text-gray-400 hover:text-[#0D3B66] transition-colors p-1"
                      title="Edit Address"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleDelete(address.id)}
                        disabled={loading === `delete-${address.id}`}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                        title="Delete Address"
                      >
                        {loading === `delete-${address.id}` ? (
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      disabled={loading === `default-${address.id}`}
                      className="text-[10px] font-bold text-[#0D3B66] hover:underline uppercase tracking-wider flex items-center gap-1 disabled:opacity-50"
                    >
                      {loading === `default-${address.id}` && <ArrowPathIcon className="w-3 h-3 animate-spin" />}
                      <span>Set as Default</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
