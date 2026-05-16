import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3800)
  }, [])

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast, onDismiss }) {
  const icons = {
    success: (
      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
    ),
    error: (
      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
    ),
    info: (
      <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
    ),
  }

  return (
    <div
      className="pointer-events-auto flex items-center gap-2.5 bg-white border border-black/[0.08] shadow-lg rounded-xl px-3.5 py-2.5 min-w-[220px] max-w-[320px]"
      style={{ animation: 'toastIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      {icons[toast.type] ?? icons.info}
      <span className="text-sm text-baxa-ink font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-black/20 hover:text-black/40 transition-colors shrink-0 ml-1"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
    </div>
  )
}
