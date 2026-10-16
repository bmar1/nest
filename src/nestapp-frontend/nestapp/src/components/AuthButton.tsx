import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { LoginModal } from '@/components/LoginModal'
import { cn } from '@/lib/utils'

export function AuthButton({ className }: { className?: string }) {
  const { user, isAuthenticated } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  if (isAuthenticated && user) {
    return (
      <span className={cn('items-center gap-2 text-sm font-semibold', className)}>
        {user.picture && <img src={user.picture} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />}
        <span className="max-w-[160px] truncate">{user.email}</span>
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        className={cn('link-u min-h-11 cursor-pointer items-center', className)}
        onClick={() => setLoginOpen(true)}
      >
        Sign in
      </button>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
