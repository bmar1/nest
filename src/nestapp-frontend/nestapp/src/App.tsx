import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LandingPage } from '@/pages/LandingPage'
import { SearchFormPage } from '@/pages/SearchFormPage'
import { ResultsPage } from '@/pages/ResultsPage'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchFormPage />} />
          <Route path="/search/:searchId/results" element={<ResultsPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
