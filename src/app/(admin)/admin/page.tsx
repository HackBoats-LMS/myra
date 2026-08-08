export default function AdminDashboard() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Myra Shopping Mall - Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Total Orders</h2>
          <p className="text-gray-500">0</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Total Products</h2>
          <p className="text-gray-500">0</p>
        </div>
      </div>
    </main>
  );
}
