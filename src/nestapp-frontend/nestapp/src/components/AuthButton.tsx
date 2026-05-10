import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'
import { LoginModal } from '@/components/LoginModal'

export function AuthButton({ className }: { className?: string }) {
  const { user, isAuthenticated } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  if (isAuthenticated && user) {
    return (
      <span className={className}>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
          {user.picture && <img src={user.picture} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />}
          <span className="max-w-[140px] truncate">{user.email}</span>
        </span>
      </span>
    )
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" className={className} onClick={() => setLoginOpen(true)}>
        Sign in
      </Button>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
