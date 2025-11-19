export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 flex justify-between">
      <h1 className="text-lg font-bold text-blue-400">AI Content Planner</h1>
      <div className="space-x-4">
        <a href="/" className="hover:text-blue-400">Dashboard</a>
        <a href="/create" className="hover:text-blue-400">New Plan</a>
      </div>
    </nav>
  );
}
