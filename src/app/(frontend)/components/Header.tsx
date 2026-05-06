'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RegisterForm } from './RegisterForm'
import { SignInForm } from './SignInForm'
import { Button } from '@payloadcms/ui'
import ProfilePopUp from './ProfilePopUp'
import FavoritesPopup from '../home/components/FavoritesPopup'
import { selectUser, selectIsLoggedIn } from '../store/slices/authSlice'
import type { RootState } from '../store'

const navLinks = [
  { href: '/properties', label: 'Nhà đất bán' },
  { href: '/projects', label: 'Dự án' },
  { href: '/articles', label: 'Tin tức' },
]

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

function isNavLinkActive(pathname: string, href: string): boolean {
  const normalizedPathname = normalizePath(pathname)
  const normalizedHref = normalizePath(href)

  if (normalizedHref === '/') {
    return normalizedPathname === '/'
  }

  return (
    normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`)
  )
}

export default function Header() {
  const pathname = usePathname()
  const user = useSelector((state: RootState) => selectUser(state as any))
  const isLoggedIn = useSelector((state: RootState) => selectIsLoggedIn(state as any))

  const profilePopupContainerRef = useRef<HTMLDivElement | null>(null)
  const favoritesPopupContainerRef = useRef<HTMLDivElement | null>(null)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const isAuthModalOpen = showSignIn || showRegister
  const [showProfilePopUp, setShowProfilePopUp] = useState(false)
  const [showFavoritesPopup, setShowFavoritesPopup] = useState(false)

  const closeAuthModal = () => {
    setShowSignIn(false)
    setShowRegister(false)
  }

  const openSignInModal = () => {
    setShowSignIn(true)
    setShowRegister(false)
  }

  const openRegisterModal = () => {
    setShowSignIn(false)
    setShowRegister(true)
  }

  const modalContainerClassName =
    'relative w-2/3 h-[85vh] overflow-hidden rounded-2xl bg-white shadow-[0px_24px_48px_rgba(0,0,0,0.25)]'

  useEffect(() => {
    if (!isAuthModalOpen) return

    const originalOverflow = document.body.style.overflow

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAuthModal()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isAuthModalOpen])

  useEffect(() => {
    if (!showProfilePopUp) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null

      if (!target) return
      if (profilePopupContainerRef.current?.contains(target)) return

      setShowProfilePopUp(false)
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfilePopUp])

  useEffect(() => {
    if (!showFavoritesPopup) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null

      if (!target) return
      if (favoritesPopupContainerRef.current?.contains(target)) return

      setShowFavoritesPopup(false)
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFavoritesPopup])

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-white/80 shadow-[0px_12px_32px_rgba(27,28,28,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-4 font-headline tracking-tighter md:px-8">
          <div className="flex items-center gap-4 md:gap-8">
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-900 sm:text-base lg:text-xl">
              <Link href="/">GOLDENLAND</Link>
            </span>

            <nav className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => {
                const isActive = isNavLinkActive(pathname, link.href)

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`
                    relative inline-block pb-1

                    after:content-[''] after:absolute after:left-0 after:bottom-0
                    after:h-[2px] after:bg-red-500
                    after:transition-all after:duration-300
                    after:w-0
                    hover:after:w-full
                    ${isActive ? 'after:w-full' : ''}
                  `}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div ref={favoritesPopupContainerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFavoritesPopup((current) => !current)}
                    className="favorite-toggle inline-flex h-9 w-9 items-center justify-center"
                    aria-label="Mở danh sách yêu thích"
                  >
                    <span
                      className={`material-symbols-outlined text-base transition-all duration-100 ${
                        showFavoritesPopup
                          ? 'material-symbols-filled text-red-500 scale-125'
                          : 'text-zinc-500 hover:text-red-500 hover:scale-125'
                      }`}
                    >
                      {showFavoritesPopup ? 'favorite' : 'favorite_border'}
                    </span>
                  </button>

                  {showFavoritesPopup ? (
                    <div className="absolute right-0 top-full z-[80] mt-4">
                      <FavoritesPopup />
                    </div>
                  ) : null}
                </div>

                <div ref={profilePopupContainerRef} className="relative">
                  <Button onClick={() => setShowProfilePopUp((current) => !current)}>
                    <img
                      src={user?.avatarUrl || '/default-avatar.png'}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full"
                    />
                  </Button>

                  {showProfilePopUp ? (
                    <div className="absolute right-0 top-full z-[80] mt-5">
                      <ProfilePopUp />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <Button
                  onClick={openSignInModal}
                  className="scale-95 text-sm font-semibold text-zinc-700 transition-all duration-300 active:scale-100 hover:text-zinc-900"
                >
                  Đăng nhập
                </Button>

                <Button
                  onClick={openRegisterModal}
                  className="scale-95 rounded-md border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-all duration-300 active:scale-100 hover:border-zinc-400 hover:text-zinc-900"
                >
                  Đăng ký
                </Button>
              </>
            )}

            <button className="editorial-gradient scale-95 rounded-md px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-100 sm:px-6">
              Đăng tin
            </button>
          </div>
        </div>
      </header>

      {isAuthModalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6 "
          onClick={closeAuthModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className={modalContainerClassName}
            onClick={(event) => event.stopPropagation()}
          >
            {showSignIn ? (
              <SignInForm onClose={closeAuthModal} onSwitchToRegister={openRegisterModal} />
            ) : null}
            {showRegister ? (
              <RegisterForm onClose={closeAuthModal} onSwitchToSignIn={openSignInModal} />
            ) : null}

            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Đóng cửa sổ xác thực"
              className="absolute right-4 top-4 z-50 rounded-md px-2 py-1 text-2xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
