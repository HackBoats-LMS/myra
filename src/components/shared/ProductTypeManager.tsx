"use client";

import React, { useState, useTransition } from "react";
import {
  type ProductTypeTemplate,
  type ProductTypeField,
} from "@/services/product-types";
import {
  saveProductTypeAction,
  deleteProductTypeAction,
  reorderProductTypesAction,
  resetToDefaultProductTypesAction,
} from "@/actions/product-types";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

interface ProductTypeManagerProps {
  initialTypes: ProductTypeTemplate[];
  basePath: "/admin" | "/worker";
}

export default function ProductTypeManager({
  initialTypes,
  basePath,
}: ProductTypeManagerProps) {
  const [types, setTypes] = useState<ProductTypeTemplate[]>(initialTypes);
  const [selectedId, setSelectedId] = useState<string>(
    initialTypes[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Selected template currently being edited
  const selectedType = types.find((t) => t.id === selectedId);

  // Form editing state for the active product type
  const [editName, setEditName] = useState(selectedType?.name || "");
  const [editFields, setEditFields] = useState<ProductTypeField[]>(
    selectedType?.fields || []
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // When selectedId changes, refresh form state
  const handleSelectType = (type: ProductTypeTemplate) => {
    setSelectedId(type.id);
    setEditName(type.name);
    setEditFields([...type.fields]);
    setIsCreatingNew(false);
    setStatusMessage(null);
  };

  const handleStartNewType = () => {
    setIsCreatingNew(true);
    setSelectedId("");
    setEditName("");
    setEditFields([
      { id: `f-${Date.now()}-1`, name: "Material / Fabric", required: true },
      { id: `f-${Date.now()}-2`, name: "Pattern / Design", required: false },
      { id: `f-${Date.now()}-3`, name: "Wash Care", required: false },
    ]);
    setStatusMessage(null);
  };

  const handleAddField = () => {
    setEditFields((prev) => [
      ...prev,
      {
        id: `f-${Date.now()}-${prev.length + 1}`,
        name: "",
        required: false,
      },
    ]);
  };

  const handleUpdateFieldName = (index: number, name: string) => {
    setEditFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name };
      return next;
    });
  };

  const handleToggleFieldRequired = (index: number) => {
    setEditFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], required: !next[index].required };
      return next;
    });
  };

  const handleRemoveField = (index: number) => {
    setEditFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editFields.length) return;

    setEditFields((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Reorder product types in list
  const handleMoveType = (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= types.length) return;

    const nextTypes = [...types];
    const temp = nextTypes[index];
    nextTypes[index] = nextTypes[targetIndex];
    nextTypes[targetIndex] = temp;

    setTypes(nextTypes);

    startTransition(async () => {
      const res = await reorderProductTypesAction(nextTypes);
      if (!res.success) {
        setStatusMessage({ type: "error", text: res.error || "Failed to reorder types." });
      }
    });
  };

  const handleSave = () => {
    if (!editName.trim()) {
      setStatusMessage({ type: "error", text: "Product type name cannot be empty." });
      return;
    }

    const cleanFields = editFields.filter((f) => f.name.trim().length > 0);

    const templateToSave: ProductTypeTemplate = {
      id: isCreatingNew ? `pt-${Date.now()}` : selectedId,
      name: editName.trim(),
      fields: cleanFields,
    };

    startTransition(async () => {
      const res = await saveProductTypeAction(templateToSave);
      if (res.success) {
        setStatusMessage({ type: "success", text: `Product type "${templateToSave.name}" saved successfully!` });
        
        let updatedList: ProductTypeTemplate[];
        if (isCreatingNew) {
          updatedList = [...types, templateToSave];
        } else {
          updatedList = types.map((t) => (t.id === templateToSave.id ? templateToSave : t));
        }

        setTypes(updatedList);
        setSelectedId(templateToSave.id);
        setIsCreatingNew(false);
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to save product type." });
      }
    });
  };

  const handleDelete = () => {
    if (!selectedType) return;
    if (!confirm(`Are you sure you want to delete the product type "${selectedType.name}"? Existing products will keep their saved attributes, but this type will no longer appear as a template.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteProductTypeAction(selectedType.id);
      if (res.success) {
        const nextTypes = types.filter((t) => t.id !== selectedType.id);
        setTypes(nextTypes);
        if (nextTypes.length > 0) {
          handleSelectType(nextTypes[0]);
        } else {
          handleStartNewType();
        }
        setStatusMessage({ type: "success", text: `Product type "${selectedType.name}" deleted.` });
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to delete product type." });
      }
    });
  };

  const handleResetDefaults = () => {
    if (!confirm("Reset all product types and specifications back to default templates? Any custom types will be overwritten.")) {
      return;
    }

    startTransition(async () => {
      const res = await resetToDefaultProductTypesAction();
      if (res.success) {
        window.location.reload();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to reset." });
      }
    });
  };

  const filteredTypes = types.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D1F2F] to-[#7A0B2E] text-white p-6 sm:p-8 shadow-md border-b-2 border-[#D4AF37]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-white/10 text-[#F5EFE6] border border-white/20">
                <SlidersHorizontal className="w-3 h-3 text-[#D4AF37]" /> Inventory Catalog Schema
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-wide text-white">
              Product Types & Specifications
            </h1>
            <p className="text-xs sm:text-sm text-[#F5EFE6]/80 mt-1 max-w-2xl">
              Configure product varieties and define required (<code className="text-amber-300 font-bold">req</code>) vs optional (<code className="text-amber-300 font-bold">not req</code>) specifications. When adding a product, selecting its type instantly reveals the exact fields needed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleStartNewType}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#2D1F2F] font-bold text-xs uppercase tracking-widest shadow transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Product Type
            </button>
            <button
              onClick={handleResetDefaults}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-[#F5EFE6] font-bold text-xs uppercase tracking-widest border border-white/20 transition-colors cursor-pointer disabled:opacity-50"
              title="Reset to factory templates"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" /> Reset Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 flex items-center justify-between gap-3 text-xs uppercase tracking-wider font-bold ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "bg-red-50 text-red-800 border border-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-gray-500 hover:text-black font-normal normal-case text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Types List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#7A0B2E]/20 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#7A0B2E]/10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#2D1F2F] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7A0B2E]" />
              Types List ({types.length})
            </h2>
            <button
              onClick={handleStartNewType}
              className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 focus:outline-none focus:border-[#7A0B2E]"
            />
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredTypes.map((type, index) => {
              const isSelected = !isCreatingNew && type.id === selectedId;
              const reqCount = type.fields.filter((f) => f.required).length;
              const optCount = type.fields.length - reqCount;

              return (
                <div
                  key={type.id}
                  onClick={() => handleSelectType(type)}
                  className={`group relative p-3 border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-[#7A0B2E]/5 border-[#7A0B2E] ring-1 ring-[#7A0B2E]"
                      : "bg-white border-gray-200 hover:border-[#7A0B2E]/40"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? "text-[#7A0B2E]" : "text-[#2D1F2F]"
                        }`}
                      >
                        {type.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                      <span className="font-semibold text-emerald-700">
                        {reqCount} req
                      </span>
                      <span>·</span>
                      <span className="text-gray-500">{optCount} opt</span>
                      <span>·</span>
                      <span className="text-gray-400">
                        {type.fields.length} total
                      </span>
                    </div>
                  </div>

                  {/* Move Up/Down Controls */}
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0 || isPending}
                      onClick={(e) => handleMoveType(index, "up", e)}
                      className="p-1 text-gray-400 hover:text-[#7A0B2E] disabled:opacity-20"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === types.length - 1 || isPending}
                      onClick={(e) => handleMoveType(index, "down", e)}
                      className="p-1 text-gray-400 hover:text-[#7A0B2E] disabled:opacity-20"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTypes.length === 0 && (
              <div className="p-6 text-center text-xs text-gray-400">
                No product types matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Type Editor (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#7A0B2E]/20 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#7A0B2E]/10">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#7A0B2E]">
                {isCreatingNew ? "Creating New Type" : "Editing Template"}
              </span>
              <h2 className="text-xl font-serif text-[#2D1F2F]">
                {isCreatingNew ? "New Product Type" : editName || "Untitled Type"}
              </h2>
            </div>

            {!isCreatingNew && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Type
              </button>
            )}
          </div>

          {/* Product Type Name */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F]">
              Product Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Saree, Lehenga, Kurti, Gown, Evening Dress..."
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-[#7A0B2E]/20 px-3.5 py-2.5 text-sm text-[#2D1F2F] font-medium focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E]"
            />
            <p className="text-[10px] text-gray-500">
              This name appears in the &ldquo;Product Type&rdquo; dropdown when creating or editing products.
            </p>
          </div>

          {/* Specifications List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D1F2F] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Specifications & Details Fields ({editFields.length})
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Set whether each detail is strictly required or optional for this product type.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddField}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7A0B2E] hover:bg-[#5e0823] text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>

            {/* Field Table / List */}
            <div className="space-y-2.5">
              {editFields.map((field, index) => (
                <div
                  key={field.id || index}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 border border-gray-200 bg-stone-50/50 hover:border-[#7A0B2E]/30 transition-colors"
                >
                  {/* Reorder Arrows */}
                  <div className="flex sm:flex-col items-center justify-center gap-0.5 sm:gap-0 self-center">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveField(index, "up")}
                      className="p-1 text-gray-400 hover:text-[#7A0B2E] disabled:opacity-20"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === editFields.length - 1}
                      onClick={() => handleMoveField(index, "down")}
                      className="p-1 text-gray-400 hover:text-[#7A0B2E] disabled:opacity-20"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Field Name Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Field Name (e.g. Material / Fabric, Blouse Piece, Wash Care)"
                      value={field.name}
                      onChange={(e) => handleUpdateFieldName(index, e.target.value)}
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E]"
                    />
                  </div>

                  {/* Required vs Optional Toggle Buttons */}
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (!field.required) handleToggleFieldRequired(index);
                      }}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                        field.required
                          ? "bg-[#7A0B2E] text-white border-[#7A0B2E] shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                      title="Mark as Required (* req)"
                    >
                      {field.required && <Check className="w-3 h-3 text-[#D4AF37]" />}
                      * Required (req)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (field.required) handleToggleFieldRequired(index);
                      }}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                        !field.required
                          ? "bg-stone-200 text-stone-800 border-stone-300 font-semibold"
                          : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                      }`}
                      title="Mark as Optional (not req)"
                    >
                      {!field.required && <Check className="w-3 h-3 text-stone-700" />}
                      Optional (not req)
                    </button>

                    {/* Delete Field */}
                    <button
                      type="button"
                      onClick={() => handleRemoveField(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent transition-colors ml-1"
                      title="Remove field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {editFields.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 bg-stone-50">
                  <p className="text-xs text-gray-500">
                    No specifications added for this product type yet.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#7A0B2E] font-bold uppercase tracking-widest border border-[#7A0B2E]/30 hover:bg-[#7A0B2E]/5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Specification
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-[#7A0B2E]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-[11px] text-gray-500">
              {editFields.filter((f) => f.required).length} required specification(s) · {editFields.filter((f) => !f.required).length} optional
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7A0B2E] hover:bg-[#5e0823] text-white text-xs font-bold uppercase tracking-widest shadow-md hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#D4AF37]" /> Save Product Type
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
