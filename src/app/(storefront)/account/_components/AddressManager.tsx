"use client";
import { useReducer } from "react";
import { createAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/actions/storefront/address";
import { useToast } from "@/components/ui/Toast";
import DeleteButton from "@/components/shared/DeleteButton";

interface Address {
  id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string | null;
  isDefault: boolean;
}

interface AddressManagerProps {
  addresses: Address[];
}

interface AddressUIState {
  loading: string | null;
  showForm: boolean;
  editingAddress: Address | null;
}

type AddressUIAction =
  | { type: "LOADING"; key: string }
  | { type: "DONE" }
  | { type: "OPEN_ADD" }
  | { type: "OPEN_EDIT"; address: Address }
  | { type: "CLOSE_FORM" };

function addressUIReducer(state: AddressUIState, action: AddressUIAction): AddressUIState {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: action.key };
    case "DONE":
      return { ...state, loading: null };
    case "OPEN_ADD":
      return { ...state, showForm: true, editingAddress: null };
    case "OPEN_EDIT":
      return { ...state, showForm: true, editingAddress: action.address };
    case "CLOSE_FORM":
      return { ...state, showForm: false, editingAddress: null };
    default:
      return state;
  }
}

export default function AddressManager({ addresses }: AddressManagerProps) {
  const toast = useToast();
  const [ui, dispatch] = useReducer(addressUIReducer, {
    loading: null,
    showForm: false,
    editingAddress: null,
  });
  const { loading, showForm, editingAddress } = ui;

  const handleSetDefault = async (id: string) => {
    dispatch({ type: "LOADING", key: `default-${id}` });
    try {
      await setDefaultAddress(id);
      toast.success("Default address updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update default address.");
    } finally {
      dispatch({ type: "DONE" });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch({ type: "LOADING", key: "submit" });
    const formData = new FormData(e.currentTarget);

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
        toast.success("Address updated!");
      } else {
        await createAddress(formData);
        toast.success("Address added successfully!");
      }
      dispatch({ type: "CLOSE_FORM" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save address.");
    } finally {
      dispatch({ type: "DONE" });
    }
  };

  return (
    <div className="bg-white border border-[#B6925B]/20 shadow-sm space-y-6 relative rounded-none">
      <div className="flex items-center justify-between border-b border-[#B6925B]/20 p-6 bg-[#FAFAFA]">
        <div>
          <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide">Saved Addresses</h3>
          <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Manage your shipping destinations</p>
        </div>
        <button
          onClick={() => dispatch({ type: "OPEN_ADD" })}
          className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 focus:outline-none rounded-none"
        >
          <i className="ri-plus-line text-sm" />
          <span>Add Address</span>
        </button>
      </div>

      {/* Address Form Modal/Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => dispatch({ type: "CLOSE_FORM" })} />
          <form
            onSubmit={handleFormSubmit}
            className="relative bg-white w-full max-w-md p-6 shadow-2xl space-y-4 z-10 border border-[#B6925B]/20 rounded-none"
          >
            <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-4">
              <h4 className="font-serif text-xl text-[#4A3B2C] font-bold tracking-wide">
                {editingAddress ? "Edit Address" : "New Address"}
              </h4>
              <button
                type="button"
                onClick={() => dispatch({ type: "CLOSE_FORM" })}
                className="text-gray-400 hover:text-[#B6925B] transition-colors focus:outline-none flex items-center justify-center"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="space-y-4 text-sm pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                  Label (e.g. Home, Work)
                </label>
                <input
                  required
                  name="label"
                  type="text"
                  defaultValue={editingAddress?.label || ""}
                  placeholder="Home"
                  className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                  Address Line 1
                </label>
                <input
                  required
                  name="addressLine1"
                  type="text"
                  defaultValue={editingAddress?.addressLine1 || ""}
                  placeholder="Apartment, suite, unit, building, street"
                  className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                  Phone Number (10 digits)
                </label>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  defaultValue={editingAddress?.phone || ""}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1">Used as the contact number for this delivery address.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                    City
                  </label>
                  <input
                    required
                    name="city"
                    type="text"
                    defaultValue={editingAddress?.city || ""}
                    placeholder="Bangalore"
                    className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                    State
                  </label>
                  <input
                    required
                    name="state"
                    type="text"
                    defaultValue={editingAddress?.state || ""}
                    placeholder="Karnataka"
                    className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                    Postal Code
                  </label>
                  <input
                    required
                    name="postalCode"
                    type="text"
                    defaultValue={editingAddress?.postalCode || ""}
                    placeholder="560001"
                    className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                    Country
                  </label>
                  <input
                    required
                    name="country"
                    type="text"
                    defaultValue={editingAddress?.country || "India"}
                    placeholder="India"
                    className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
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
                    className="rounded-none border-[#B6925B]/30 text-[#B6925B] focus:ring-[#B6925B]"
                  />
                  <label htmlFor="isDefault" className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] cursor-pointer">
                    Set as default shipping address
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#B6925B]/20 mt-4">
              <button
                type="button"
                onClick={() => dispatch({ type: "CLOSE_FORM" })}
                className="px-5 py-2.5 text-[10px] font-bold text-gray-500 hover:text-[#4A3B2C] uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading === "submit"}
                className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-2 disabled:opacity-50 rounded-none"
              >
                {loading === "submit" && <i className="ri-loader-4-line animate-spin text-base" />}
                <span>{editingAddress ? "Update" : "Save"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address cards list */}
      <div className="p-6">
        {addresses.length === 0 ? (
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center py-6">You haven&rsquo;t saved any addresses yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-6 border flex flex-col justify-between gap-4 transition-all relative rounded-none ${
                  address.isDefault ? "border-[#B6925B] bg-white shadow-sm" : "border-[#B6925B]/20 bg-[#FAFAFA]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#4A3B2C] tracking-wide capitalize">{address.label}</span>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 border border-[#B6925B]/30 bg-white text-[10px] font-bold text-[#B6925B] uppercase tracking-widest">
                        <i className="ri-check-line" />
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[#4A3B2C] space-y-1">
                    <p>{address.addressLine1}</p>
                    <p>{address.city}, {address.state} - {address.postalCode}</p>
                    {address.phone && (
                      <p className="font-mono text-[#B6925B]">{address.phone}</p>
                    )}
                    <p className="uppercase tracking-widest text-[10px] text-gray-500 font-bold mt-2">{address.country}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#B6925B]/10">
                  <div className="flex gap-4">
                    <button
                      onClick={() => dispatch({ type: "OPEN_EDIT", address })}
                      className="text-[#B6925B] hover:text-[#4A3B2C] transition-colors py-2 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest"
                      title="Edit Address"
                    >
                      <i className="ri-edit-box-line text-sm" /> Edit
                    </button>
                    {!address.isDefault && (
                      <DeleteButton
                        id={address.id}
                        entityName="address"
                        deleteAction={deleteAddress}
                        label="Delete"
                        className="text-gray-400 hover:text-red-700"
                      />
                    )}
                  </div>

                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      disabled={loading === `default-${address.id}`}
                      className="text-[10px] font-bold text-[#B6925B] hover:text-[#4A3B2C] uppercase tracking-widest flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {loading === `default-${address.id}` && <i className="ri-loader-4-line animate-spin text-xs" />}
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
