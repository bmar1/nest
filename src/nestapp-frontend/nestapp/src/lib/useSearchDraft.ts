import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@/components/AuthProvider'
import { getApiBaseUrl } from '@/lib/apiBaseUrl'
import { getSearchSubmitErrorMessage } from '@/lib/searchSubmitErrors'
import { defaultDraft, priorityPresets, type Priority, type SearchDraft } from '@/lib/searchDraft'

const STORAGE_KEY = 'nest.searchDraft'

function readStoredDraft(): SearchDraft {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? { ...defaultDraft, ...JSON.parse(stored) } : defaultDraft
  } catch {
    return defaultDraft
  }
}

export function useSearchDraft() {
  const navigate = useNavigate()
  const { isAuthenticated, idToken } = useAuth()
  const [draft, setDraft] = useState<SearchDraft>(readStoredDraft)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // Private browsing can refuse storage; the draft still lives in memory.
    }
  }, [draft])

  const selectPriority = useCallback((priority: Priority) => {
    setDraft({ priority, ...priorityPresets[priority] })
  }, [])

  const update = useCallback((patch: Partial<SearchDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }, [])

  const toggleAmenity = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      desiredAmenities: prev.desiredAmenities.includes(id)
        ? prev.desiredAmenities.filter((a) => a !== id)
        : [...prev.desiredAmenities, id],
    }))
  }, [])

  const submit = useCallback(async () => {
    setError(null)

    if (!isAuthenticated) {
      setLoginOpen(true)
      setError('Sign in with Google to start a search.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post(`${getApiBaseUrl()}/api/v1/search`, draft, {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
      })
      navigate(`/search/${response.data.searchId}/results`)
    } catch (err) {
      console.error('Error submitting search:', err)
      setError(getSearchSubmitErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }, [draft, idToken, isAuthenticated, navigate])

  const closeLogin = useCallback(() => setLoginOpen(false), [])

  return {
    draft,
    selectPriority,
    update,
    toggleAmenity,
    submit,
    isSubmitting,
    error,
    loginOpen,
    closeLogin,
    isAuthenticated,
  }
}

export type SearchDraftState = ReturnType<typeof useSearchDraft>
