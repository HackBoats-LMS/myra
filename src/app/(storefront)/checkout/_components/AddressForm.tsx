"use client";
import { useState } from "react";
import { createAddress } from "@/actions/address";
import { useToast } from "@/components/ui/Toast";

interface AddressFormProps {
  onSaved: () => void;
  onCancel: () => void;
  className?: string;
}

export default function AddressForm({ onSaved, onCancel, className = "" }: AddressFormProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    label: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    isDefault: false,
  });

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData();
    fd.set("label", form.label);
    fd.set("addressLine1", form.addressLine1);
    fd.set("city", form.city);
    fd.set("state", form.state);
    fd.set("postalCode", form.postalCode);
    fd.set("country", form.country);
    fd.set("phone", form.phone);
    fd.set("isDefault", form.isDefault ? "true" : "false");
    try {
      await createAddress(fd);
      toast.success("Address added!");
      setForm({ label: "", addressLine1: "", city: "", state: "", postalCode: "", country: "India", phone: "", isDefault: false });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 text-xs border border-[#7A0B2E]/30 focus:outline-none focus:border-[#7A0B2E] text-[#2D1F2F] rounded-none";
  const labelCls = "block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className={`border border-[#7A0B2E]/30 bg-white p-4 space-y-3 ${className}`}>
      <span className="block text-xs font-bold text-[#2D1F2F] uppercase tracking-widest">Add New Address</span>

      <div>
        <label className={labelCls}>Label</label>
        <input
          type="text"
          required
          placeholder="e.g. Home"
          value={form.label}
          onChange={(e) => set("label", e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Address Line</label>
        <input
          type="text"
          required
          placeholder="House no, street, area"
          value={form.addressLine1}
          onChange={(e) => set("addressLine1", e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>City</label>
          <input type="text" required value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input type="text" required value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Postal Code</label>
          <input
            type="text"
            required
            value={form.postalCode}
            onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Country</label>
          <input type="text" required value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Phone (10 digits)</label>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
          placeholder="e.g. 9876543210"
          className={inputCls}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          className="w-4 h-4 accent-[#7A0B2E]"
        />
        <span className="text-xs text-[#2D1F2F]">Set as default address</span>
      </label>

      {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center rounded-none"
        >
          {saving ? <i className="ri-loader-4-line animate-spin text-base" /> : "Save Address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#2D1F2F] border border-[#7A0B2E]/30 hover:bg-[#FAFAFA] transition-colors rounded-none"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
