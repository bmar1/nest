import { useState } from 'react'
import { LogOut, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'
import { LoginModal } from '@/components/LoginModal'

export function ProfilePanel() {
  const { user, isAuthenticated, logout } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <aside className="fixed right-4 bottom-4 z-[80]">
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-border bg-card/95 p-2 pr-3 shadow-xl backdrop-blur-md hover:bg-card"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              {user.picture ? (
                <img src={user.picture} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <UserRound className="h-5 w-5" aria-hidden />
                </span>
              )}
              <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground sm:block">{user.email}</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 bottom-14 w-72 rounded-2xl border border-border bg-card p-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="h-12 w-12 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <UserRound className="h-6 w-6" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="float-right font-medium text-foreground">user</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => {
                    logout()
                    setProfileOpen(false)
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  Log out
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button type="button" className="rounded-full shadow-xl" onClick={() => setLoginOpen(true)}>
            Sign in
          </Button>
        )}
      </aside>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
