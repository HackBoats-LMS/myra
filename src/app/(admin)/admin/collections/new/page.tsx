import CollectionForm from "@/components/admin/CollectionForm";

export default function NewCollectionPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-6">
        <h2 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Add New Collection</h2>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Create a new category to organize your products.</p>
      </div>
      
      <CollectionForm />
    </div>
  );
}
