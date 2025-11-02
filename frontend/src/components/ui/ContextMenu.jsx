/**
 * ContextMenu Component
 * Right-click context menu for items
 */

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export const ContextMenu = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    const handleContextMenu = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) {
        e.preventDefault()

        // Calculate position
        const x = e.clientX
        const y = e.clientY

        setPosition({ x, y })
        setIsOpen(true)
      }
    }

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => {
      setIsOpen(false)
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', handleClick)
    document.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  return (
    <>
      <div ref={triggerRef}>{trigger}</div>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{
            top: `${position.y}px`,
            left: `${position.x}px`,
          }}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </>
  )
}

export const ContextMenuItem = ({ onClick, children, icon: Icon, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50'
      )}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  )
}

export const ContextMenuSeparator = () => {
  return <div className="my-1 h-px bg-border" />
}

export const ContextMenuSub = ({ label, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:bg-accent focus:text-accent-foreground'
        )}
      >
        {Icon && <Icon className="mr-2 h-4 w-4" />}
        <span className="flex-1 text-left">{label}</span>
        <svg
          className="h-4 w-4 ml-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute left-full top-0 ml-1 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {children}
        </div>
      )}
    </div>
  )
}
