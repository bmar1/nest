import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { ProfilePanel } from '@/components/ProfilePanel'
import { LandingPage } from '@/pages/LandingPage'
import { SearchFormPage } from '@/pages/SearchFormPage'
import { ResultsPage } from '@/pages/ResultsPage'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/search" element={<SearchFormPage />} />
            <Route path="/search/:searchId/results" element={<ResultsPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
          <ProfilePanel />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
