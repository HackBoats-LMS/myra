"use client";
import { useState } from "react";
import { createFlashSale, updateFlashSale, deleteFlashSale } from "@/features/flash-sale/actions";
import { useToast } from "@/components/ui/Toast";
import DeleteButton from "@/components/shared/DeleteButton";

interface CollectionOption {
  id: string;
  name: string;
}

interface FlashSaleItem {
  id: string;
  title: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  collectionId: string | null;
  collection: { id: string; name: string } | null;
}

export default function FlashSaleManager({
  sales,
  collections,
}: {
  sales: FlashSaleItem[];
  collections: CollectionOption[];
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<FlashSaleItem | null>(null);
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEditing(null);
    setTitle("");
    setDiscountType("PERCENTAGE");
    setValue("");
    setStartAt("");
    setEndAt("");
    setCollectionId("");
    setIsActive(true);
  };

  const beginEdit = (s: FlashSaleItem) => {
    setEditing(s);
    setTitle(s.title);
    setDiscountType(s.discountType);
    setValue(String(s.value));
    setStartAt(new Date(s.startAt).toISOString().slice(0, 16));
    setEndAt(new Date(s.endAt).toISOString().slice(0, 16));
    setCollectionId(s.collectionId || "");
    setIsActive(s.isActive);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      title,
      discountType,
      value: parseFloat(value),
      startAt,
      endAt,
      collectionId: collectionId || undefined,
      isActive,
    };
    try {
      if (editing) {
        await updateFlashSale(editing.id, payload);
        toast.success("Flash sale updated.");
      } else {
        await createFlashSale(payload);
        toast.success("Flash sale created.");
      }
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] text-[#4A3B2C]";
  const label = "block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest mb-1";

  const now = new Date();
  const activeNow = sales.filter((s) => s.isActive && new Date(s.startAt) <= now && new Date(s.endAt) >= now);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#B6925B]/20 p-6 shadow-sm">
        <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-3 mb-4">
          {editing ? `Edit: ${editing.title}` : "Create Flash Sale"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={label}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={field} placeholder="e.g. Mid-Year Mega Sale" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={label}>Discount Type</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")} className={field}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className={label}>{discountType === "PERCENTAGE" ? "Discount %" : "Discount ₹"} *</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} required type="number" step="0.01" min="0" className={field} />
            </div>
            <div>
              <label className={label}>Start</label>
              <input value={startAt} onChange={(e) => setStartAt(e.target.value)} required type="datetime-local" className={field} />
            </div>
            <div>
              <label className={label}>End</label>
              <input value={endAt} onChange={(e) => setEndAt(e.target.value)} required type="datetime-local" className={field} />
            </div>
            <div>
              <label className={label}>Scope</label>
              <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className={field}>
                <option value="">All products</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[#B6925B]" />
                <span className="text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Active</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {editing && (
              <button type="button" onClick={reset} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#4A3B2C]">
                Cancel
              </button>
            )}
            <button type="submit" disabled={busy} className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 rounded-none">
              {busy ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>

      {activeNow.length > 0 && (
        <div className="bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          <strong>{activeNow.length}</strong> flash sale{activeNow.length === 1 ? " is" : "s are"} currently live on the storefront.
        </div>
      )}

      <div className="bg-white border border-[#B6925B]/20 shadow-sm">
        <div className="p-4 border-b border-[#B6925B]/20">
          <h3 className="font-serif text-lg text-[#4A3B2C]">All Flash Sales</h3>
        </div>
        {sales.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">No flash sales yet.</p>
        ) : (
          <div className="divide-y divide-[#B6925B]/10">
            {sales.map((s) => (
              <div key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#4A3B2C]">{s.title}</p>
                  <p className="text-xs text-gray-500">
                    {s.discountType === "PERCENTAGE" ? `${s.value}% off` : `₹${s.value} off`}
                    {s.collection ? ` · ${s.collection.name}` : " · All products"}
                    {" · "}
                    {new Date(s.startAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    {" → "}
                    {new Date(s.endAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border rounded-none ${s.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                  <button onClick={() => beginEdit(s)} className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C]">
                    Edit
                  </button>
                  <DeleteButton
                    id={s.id}
                    entityName="flash sale"
                    deleteAction={deleteFlashSale}
                    confirmMessage={`Delete flash sale "${s.title}"?`}
                    label="Delete"
                    className="text-red-600 hover:text-red-800"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}