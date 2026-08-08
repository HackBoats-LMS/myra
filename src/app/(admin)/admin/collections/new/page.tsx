import CollectionForm from "@/components/admin/CollectionForm";

export default function NewCollectionPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Add New Collection</h2>
        <p className="text-sm text-gray-500 mt-1">Create a new category to organize your products.</p>
      </div>
      
      <CollectionForm />
    </div>
  );
}
