"use client";
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Pencil, CornerDownRight, ArrowUp, ArrowDown, Loader2, Trash2 } from "lucide-react";
import { deleteCollection, swapCollectionOrder, updateCollectionOrder, toggleCollectionShowInNav } from "@/actions/admin";

interface SubCategoryItem {
  id: string;
  name: string;
  slug: string;
  order: number;
  showInNav?: boolean;
  parentId: string | null;
  _count: { products: number };
}

interface MainCategoryItem {
  id: string;
  name: string;
  slug: string;
  order: number;
  showInNav?: boolean;
  parentId: string | null;
  children: SubCategoryItem[];
  _count: { products: number };
}

interface CollectionListTableProps {
  initialCategories: MainCategoryItem[];
  basePath?: string; // "/admin" or "/worker"
}

export default function CollectionListTable({
  initialCategories,
  basePath = "/admin"
}: CollectionListTableProps) {
  const [categories, setCategories] = useState<MainCategoryItem[]>(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [tempOrderValue, setTempOrderValue] = useState<string>("");

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? Products in it will be preserved.`)) {
      return;
    }

    // Optimistically remove from state
    setCategories(prev =>
      prev
        .filter(c => c.id !== id)
        .map(c => ({
          ...c,
          children: c.children.filter(s => s.id !== id)
        }))
    );

    startTransition(async () => {
      try {
        await deleteCollection(id);
      } catch (error) {
        console.error("Failed to delete category:", error);
      }
    });
  };

  // Move Main Category Up or Down
  const handleMoveMain = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const current = categories[index];
    const target = categories[targetIndex];

    // Optimistically swap
    const nextCategories = [...categories];
    const currentOrder = current.order;
    const targetOrder = target.order;

    // If both had the same order, assign distinct indices
    const newCurrentOrder = currentOrder === targetOrder
      ? (direction === "up" ? targetOrder - 1 : targetOrder + 1)
      : targetOrder;
    const newTargetOrder = currentOrder;

    const updatedCurrent = { ...current, order: newCurrentOrder };
    const updatedTarget = { ...target, order: newTargetOrder };

    nextCategories[index] = updatedTarget;
    nextCategories[targetIndex] = updatedCurrent;
    setCategories(nextCategories);

    startTransition(async () => {
      try {
        await swapCollectionOrder(current.id, newCurrentOrder, target.id, newTargetOrder);
      } catch (error) {
        console.error("Failed to swap category order:", error);
      }
    });
  };

  // Move Subcategory Up or Down within its parent
  const handleMoveSub = (mainIndex: number, subIndex: number, direction: "up" | "down") => {
    const main = categories[mainIndex];
    const targetSubIndex = direction === "up" ? subIndex - 1 : subIndex + 1;
    if (targetSubIndex < 0 || targetSubIndex >= main.children.length) return;

    const currentSub = main.children[subIndex];
    const targetSub = main.children[targetSubIndex];

    const nextCategories = [...categories];
    const nextSubs = [...main.children];

    const currentOrder = currentSub.order;
    const targetOrder = targetSub.order;

    const newCurrentOrder = currentOrder === targetOrder
      ? (direction === "up" ? targetOrder - 1 : targetOrder + 1)
      : targetOrder;
    const newTargetOrder = currentOrder;

    const updatedCurrentSub = { ...currentSub, order: newCurrentOrder };
    const updatedTargetSub = { ...targetSub, order: newTargetOrder };

    nextSubs[subIndex] = updatedTargetSub;
    nextSubs[targetSubIndex] = updatedCurrentSub;
    nextCategories[mainIndex] = { ...main, children: nextSubs };
    setCategories(nextCategories);

    startTransition(async () => {
      try {
        await swapCollectionOrder(currentSub.id, newCurrentOrder, targetSub.id, newTargetOrder);
      } catch (error) {
        console.error("Failed to swap subcategory order:", error);
      }
    });
  };

  // Save manual order number input
  const handleSaveOrderInput = (id: string) => {
    const parsed = parseInt(tempOrderValue, 10);
    if (isNaN(parsed)) {
      setEditingOrderId(null);
      return;
    }

    // Update in local state
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === id) {
          return { ...cat, order: parsed };
        }
        return {
          ...cat,
          children: cat.children.map(sub => (sub.id === id ? { ...sub, order: parsed } : sub))
        };
      })
    );
    setEditingOrderId(null);

    startTransition(async () => {
      try {
        await updateCollectionOrder(id, parsed);
      } catch (error) {
        console.error("Failed to update order:", error);
      }
    });
  };

  // Toggle Navbar inclusion directly
  const handleToggleNav = (id: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === id) {
          return { ...cat, showInNav: nextVal };
        }
        return {
          ...cat,
          children: cat.children.map(sub => (sub.id === id ? { ...sub, showInNav: nextVal } : sub))
        };
      })
    );

    startTransition(async () => {
      try {
        await toggleCollectionShowInNav(id, nextVal);
      } catch (error) {
        console.error("Failed to toggle navbar visibility:", error);
      }
    });
  };

  return (
    <div className="bg-white border border-[#7A0B2E]/20 relative rounded-none overflow-hidden">
      {isPending && (
        <div className="absolute top-2 right-4 z-10 flex items-center gap-1.5 text-xs text-[#7A0B2E] bg-white/90 px-2 py-1 shadow-sm border border-[#7A0B2E]/30 font-bold uppercase tracking-wider">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Updating Navigation...
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm text-[#2D1F2F]">
          <thead className="bg-[#F5EFE6] text-[#7A0B2E] text-[10px] uppercase font-bold tracking-widest border-b border-[#7A0B2E]/20">
            <tr>
              <th className="px-4 py-4 w-28 border-r border-[#7A0B2E]/10 text-center">Order</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Category / Subcategory</th>
              <th className="px-4 py-4 border-r border-[#7A0B2E]/10">Type</th>
              <th className="px-4 py-4 border-r border-[#7A0B2E]/10">Slug</th>
              <th className="px-4 py-4 border-r border-[#7A0B2E]/10 text-center">In Navbar</th>
              <th className="px-4 py-4 border-r border-[#7A0B2E]/10 text-center">Products</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#7A0B2E]/10">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
                  No categories found. Click &ldquo;Add Category&rdquo; to create your first category (e.g. Sarees, Women, Kids).
                </td>
              </tr>
            ) : (
              categories.map((mainCat, mainIdx) => {
                const isMainNavVisible = mainCat.showInNav ?? true;
                return (
                  <React.Fragment key={mainCat.id}>
                    {/* Top Level Category Row */}
                    <tr className="bg-[#F5EFE6] hover:bg-[#FAF0F2] transition-colors font-medium border-t-2 border-[#7A0B2E]/20">
                      {/* Order Controls */}
                      <td className="px-3 py-3 border-r border-[#7A0B2E]/10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={mainIdx === 0 || isPending}
                            onClick={() => handleMoveMain(mainIdx, "up")}
                            className="p-1 hover:bg-[#7A0B2E] hover:text-white disabled:opacity-20 text-[#2D1F2F] border border-[#7A0B2E]/20 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          
                          {editingOrderId === mainCat.id ? (
                            <input
                              type="number"
                              autoFocus
                              value={tempOrderValue}
                              onChange={(e) => setTempOrderValue(e.target.value)}
                              onBlur={() => handleSaveOrderInput(mainCat.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveOrderInput(mainCat.id);
                                if (e.key === "Escape") setEditingOrderId(null);
                              }}
                              className="w-10 text-center text-xs font-bold py-0.5 border border-[#7A0B2E] bg-white outline-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrderId(mainCat.id);
                                setTempOrderValue(String(mainCat.order ?? 0));
                              }}
                              className="px-1.5 py-0.5 text-xs font-bold font-mono text-[#7A0B2E] hover:bg-[#7A0B2E]/10 cursor-pointer"
                              title="Click to edit order number"
                            >
                              #{mainCat.order ?? mainIdx + 1}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={mainIdx === categories.length - 1 || isPending}
                            onClick={() => handleMoveMain(mainIdx, "down")}
                            className="p-1 hover:bg-[#7A0B2E] hover:text-white disabled:opacity-20 text-[#2D1F2F] border border-[#7A0B2E]/20 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-[#2D1F2F] border-r border-[#7A0B2E]/10">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-serif">{mainCat.name}</span>
                          {mainCat.children.length > 0 && (
                            <span className="text-[10px] font-sans px-1.5 py-0.5 bg-[#7A0B2E]/10 text-[#7A0B2E] font-bold">
                              {mainCat.children.length} subcategories
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 border-r border-[#7A0B2E]/10 text-xs">
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#7A0B2E] text-white">
                          Main Category
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-[#7A0B2E] border-r border-[#7A0B2E]/10">
                        /{mainCat.slug}
                      </td>

                      {/* Navbar Visibility Toggle */}
                      <td className="px-4 py-4 border-r border-[#7A0B2E]/10 text-center whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggleNav(mainCat.id, isMainNavVisible)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                            isMainNavVisible
                              ? "bg-[#7A0B2E]/15 text-[#7A0B2E] border-[#7A0B2E]/40 hover:bg-[#7A0B2E]/25"
                              : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                          }`}
                          title={isMainNavVisible ? "Visible in Navbar - Click to Hide" : "Hidden from Navbar - Click to Show"}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isMainNavVisible ? "bg-[#7A0B2E]" : "bg-gray-400"}`} />
                          {isMainNavVisible ? "Visible" : "Hidden"}
                        </button>
                      </td>

                      <td className="px-4 py-4 border-r border-[#7A0B2E]/10 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-white border border-[#7A0B2E]/30 text-[#7A0B2E]">
                          {mainCat._count.products} products
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link 
                            href={`${basePath}/collections/new?parentId=${mainCat.id}`} 
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#7A0B2E] hover:text-[#2D1F2F] border border-[#7A0B2E]/30 bg-white px-2 py-1 transition-colors"
                            title="Add Subcategory under this category"
                          >
                            <Plus className="w-3 h-3" />
                            Subcategory
                          </Link>
                          <Link 
                            href={`${basePath}/collections/${mainCat.id}`} 
                            className="inline-flex text-[#7A0B2E] hover:text-[#2D1F2F] transition-colors p-1" 
                            title="Edit Category"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button 
                            type="button"
                            onClick={() => handleDelete(mainCat.id, mainCat.name)} 
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 flex items-center justify-center cursor-pointer"
                            title={`Delete ${mainCat.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Subcategories Rows */}
                    {mainCat.children.map((sub, subIdx) => {
                      const isSubNavVisible = sub.showInNav ?? true;
                      return (
                        <tr key={sub.id} className="hover:bg-[#F5EFE6] transition-colors bg-white">
                          {/* Subcategory Order Controls */}
                          <td className="px-3 py-2.5 border-r border-[#7A0B2E]/10 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                disabled={subIdx === 0 || isPending}
                                onClick={() => handleMoveSub(mainIdx, subIdx, "up")}
                                className="p-0.5 hover:bg-gray-200 disabled:opacity-20 text-gray-500 border border-gray-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Move Subcategory Up"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              
                              {editingOrderId === sub.id ? (
                                <input
                                  type="number"
                                  autoFocus
                                  value={tempOrderValue}
                                  onChange={(e) => setTempOrderValue(e.target.value)}
                                  onBlur={() => handleSaveOrderInput(sub.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveOrderInput(sub.id);
                                    if (e.key === "Escape") setEditingOrderId(null);
                                  }}
                                  className="w-9 text-center text-[11px] font-mono py-0.5 border border-[#7A0B2E] bg-white outline-none"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOrderId(sub.id);
                                    setTempOrderValue(String(sub.order ?? 0));
                                  }}
                                  className="px-1 py-0.5 text-[11px] font-mono text-gray-500 hover:bg-gray-100 cursor-pointer"
                                  title="Click to edit subcategory order"
                                >
                                  .{sub.order ?? subIdx + 1}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={subIdx === mainCat.children.length - 1 || isPending}
                                onClick={() => handleMoveSub(mainIdx, subIdx, "down")}
                                className="p-0.5 hover:bg-gray-200 disabled:opacity-20 text-gray-500 border border-gray-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Move Subcategory Down"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-3.5 text-xs text-[#2D1F2F] border-r border-[#7A0B2E]/10 pl-12">
                            <div className="flex items-center gap-2">
                              <CornerDownRight className="w-3.5 h-3.5 text-[#7A0B2E]" />
                              <span className="font-medium text-[13px]">{sub.name}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 border-r border-[#7A0B2E]/10 text-xs">
                            <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                              Subcategory
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-xs text-gray-500 border-r border-[#7A0B2E]/10">
                            /{sub.slug}
                          </td>

                          {/* Subcategory Navbar Visibility Toggle */}
                          <td className="px-4 py-3.5 border-r border-[#7A0B2E]/10 text-center whitespace-nowrap">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleToggleNav(sub.id, isSubNavVisible)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                                isSubNavVisible
                                  ? "bg-[#7A0B2E]/10 text-[#7A0B2E] border-[#7A0B2E]/30 hover:bg-[#7A0B2E]/20"
                                  : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                              }`}
                              title={isSubNavVisible ? "Visible in Dropdown - Click to Hide" : "Hidden from Dropdown - Click to Show"}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isSubNavVisible ? "bg-[#7A0B2E]" : "bg-gray-400"}`} />
                              {isSubNavVisible ? "Visible" : "Hidden"}
                            </button>
                          </td>

                          <td className="px-4 py-3.5 border-r border-[#7A0B2E]/10 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] bg-[#F5EFE6] border border-gray-200 text-gray-600">
                              {sub._count.products} products
                            </span>
                          </td>

                          <td className="px-6 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
                              <Link 
                                href={`${basePath}/collections/${sub.id}`} 
                                className="inline-flex text-[#7A0B2E] hover:text-[#2D1F2F] transition-colors p-1" 
                                title="Edit Subcategory"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Link>
                              <button 
                                type="button"
                                onClick={() => handleDelete(sub.id, sub.name)} 
                                className="text-gray-400 hover:text-red-600 transition-colors p-1 flex items-center justify-center cursor-pointer"
                                title={`Delete subcategory ${sub.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
