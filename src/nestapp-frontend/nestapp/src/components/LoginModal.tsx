import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'
import { getRequiredGoogleClientId } from '@/lib/env'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              width?: number
            }
          ) => void
          cancel: () => void
        }
      }
    }
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services'

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google login script failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google login script failed to load'))
    document.head.appendChild(script)
  })
}

interface LoginModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function LoginModal({
  open,
  onClose,
  title = 'Sign in to continue',
  description = 'Use Google to save your session before starting an apartment search.',
}: LoginModalProps) {
  const { loginWithGoogleCredential } = useAuth()
  const buttonRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const clientId = getRequiredGoogleClientId()

  useEffect(() => {
    if (!open || !buttonRef.current) return

    let cancelled = false
    setError(null)

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return
        buttonRef.current.innerHTML = ''
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response.credential) {
              setError('Google did not return a credential. Please try again.')
              return
            }
            loginWithGoogleCredential(response.credential)
            onClose()
          },
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          width: 280,
        })
      })
      .catch((err: Error) => setError(err.message))

    return () => {
      cancelled = true
      window.google?.accounts?.id.cancel()
    }
  }, [clientId, loginWithGoogleCredential, onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/45 px-4 pt-24 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Nest account</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close login modal"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-6 flex min-h-11 justify-center" ref={buttonRef} />

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        <Button type="button" variant="ghost" className="mt-4 w-full" onClick={onClose}>
          Maybe later
        </Button>
      </div>
    </div>
  )
}
