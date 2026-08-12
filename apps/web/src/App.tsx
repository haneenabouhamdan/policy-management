import { Link, Route, Routes } from 'react-router-dom';

function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Policies</h1>
      <p className="mt-2 text-sm text-gray-600">No policies to show yet.</p>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            Policy Management
          </Link>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  );
}
