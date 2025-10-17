import { Link } from '@tanstack/react-router'

import { LogIn, Menu, Rabbit, UserPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { ThemeToggle } from './ui/theme-toggle'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const focusableElements = menuRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault()
              lastElement.focus()
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault()
              firstElement.focus()
            }
          }
        }
      }

      document.addEventListener('keydown', handleTabKey)
      firstElement?.focus()

      return () => {
        document.removeEventListener('keydown', handleTabKey)
      }
    }
  }, [isOpen])

  const closeMenu = () => {
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <>
      <header className="bg-background border-border flex items-center justify-between border-b p-4 shadow-lg">
        <nav aria-label="Main navigation">
          <div className="flex items-center gap-2">
            <div className="from-primary to-accent flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg">
              <Rabbit className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Desafio
            </span>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <nav
            className="hidden items-center gap-3 sm:flex"
            aria-label="Desktop navigation"
          >
            <Link to="/login">
              <Button variant="secondary">Login</Button>
            </Link>
            <Link to="/cadastro">
              <Button>Criar conta</Button>
            </Link>
          </nav>

          <ThemeToggle />

          <div className="flex items-center sm:hidden">
            <button
              ref={buttonRef}
              onClick={() => setIsOpen(true)}
              className="hover:bg-accent focus:ring-primary rounded-lg p-2 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
              aria-label="Abrir menu de navegação"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-haspopup="true"
            >
              <Menu size={24} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          aria-hidden="true"
          onClick={closeMenu}
        />
      )}

      <nav
        ref={menuRef}
        id="mobile-menu"
        className={`bg-card text-card-foreground fixed top-0 left-0 z-50 flex h-full w-80 transform flex-col shadow-2xl transition-transform duration-300 ease-in-out sm:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu de navegação mobile"
        role="navigation"
      >
        <div className="border-border flex w-full items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <div className="from-primary to-accent flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
              <Rabbit className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-base font-semibold">Desafio</span>
          </div>
          <button
            onClick={closeMenu}
            className="hover:bg-accent focus:ring-primary rounded-lg p-2 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
            aria-label="Fechar menu de navegação"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <Link
              to="/login"
              onClick={closeMenu}
              className="hover:bg-accent focus:ring-primary flex items-center gap-3 rounded-lg p-3 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              }}
            >
              <LogIn size={18} aria-hidden="true" />
              <span className="font-medium">Login</span>
            </Link>

            <Link
              to="/cadastro"
              onClick={closeMenu}
              className="hover:bg-accent focus:ring-primary flex items-center gap-3 rounded-lg p-3 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              }}
            >
              <UserPlus size={18} aria-hidden="true" />
              <span className="font-medium">Registro</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
