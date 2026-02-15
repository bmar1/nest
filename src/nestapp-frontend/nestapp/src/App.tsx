import { useState } from 'react'
import { SearchForm } from './components/SearchForm'
import { ResultsPage } from './components/ResultsPage'
import './App.css'

function App() {
  const [searchId, setSearchId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white p-6 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">🏡 Nest</h1>
          <p className="text-sm mt-1">Stop scrolling. Start scoring.</p>
        </div>
      </header>

      <main className="container mx-auto py-8">
        {!searchId ? (
          <SearchForm onSearchSubmitted={setSearchId} />
        ) : (
          <>
            <button
              onClick={() => setSearchId(null)}
              className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              ← New Search
            </button>
            <ResultsPage searchId={searchId} />
          </>
        )}
      </main>
    </div>
  )
}

export default App
