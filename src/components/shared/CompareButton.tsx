"use client";
import { useCompare } from "@/context/CompareContext";
import { useToast } from "@/components/ui/Toast";

export default function CompareButton({
  productId,
  variant = "icon",
  className = "",
}: {
  productId: string;
  variant?: "icon" | "pill";
  className?: string;
}) {
  const { isInCompare, toggleCompare, compareIds } = useCompare();
  const toast = useToast();
  const active = isInCompare(productId);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!active && compareIds.length >= 4) {
      toast.error("You can compare up to 4 products. Remove one first.");
      return;
    }
    await toggleCompare(productId);
    toast.success(active ? "Removed from compare" : "Added to compare");
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handle}
        className={`flex items-center justify-center gap-2 border px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors ${className}
          ${active ? "bg-[#4A3B2C] text-white border-[#4A3B2C]" : "border-[#B6925B]/40 text-[#4A3B2C] hover:bg-[#FAFAFA]"}`}
      >
        <i className={`ri-${active ? "check-double-line" : "arrow-left-right-line"} text-sm`} />
        {active ? "In Compare" : "Add to Compare"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={active ? "Remove from compare" : "Add to compare"}
      className={`absolute z-10 w-8 h-8 flex items-center justify-center rounded-none transition-colors ${className}
        ${active ? "bg-[#4A3B2C] text-white" : "bg-white/90 text-[#4A3B2C] hover:bg-[#B6925B] hover:text-white"}`}
    >
      <i className={`ri-${active ? "check-double-line" : "arrow-left-right-line"} text-sm`} />
    </button>
  );
}