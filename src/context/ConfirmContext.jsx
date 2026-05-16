import { createContext, useCallback, useContext, useState } from 'react'

const ConfirmContext = createContext(null)

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  // dialog: { title, message, confirmLabel, danger, resolve }

  const confirm = useCallback(({ title, message, confirmLabel = 'Confirm', danger = false }) => {
    return new Promise(resolve => {
      setDialog({ title, message, confirmLabel, danger, resolve })
    })
  }, [])

  function handleChoice(result) {
    dialog?.resolve(result)
    setDialog(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: 'rgba(10,10,20,0.45)', backdropFilter: 'blur(4px)', animation: 'confirmFadeIn 0.15s ease' }}
          onClick={() => handleChoice(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-modal w-full max-w-sm overflow-hidden"
            style={{ animation: 'confirmSlideIn 0.18s cubic-bezier(0.34,1.3,0.64,1)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <h2 className="font-bold text-base text-baxa-ink">{dialog.title}</h2>
              {dialog.message && (
                <p className="mt-1.5 text-sm text-black/45 leading-relaxed">{dialog.message}</p>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-black/[0.06] mx-6" />

            {/* Actions */}
            <div className="flex gap-2.5 px-6 py-4">
              <button
                className="btn-secondary flex-1 justify-center"
                onClick={() => handleChoice(false)}
              >
                Cancel
              </button>
              <button
                className={`flex-1 justify-center inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  dialog.danger
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'btn-primary'
                }`}
                onClick={() => handleChoice(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>

          <style>{`
            @keyframes confirmFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes confirmSlideIn {
              from { opacity: 0; transform: scale(0.94) translateY(8px); }
              to   { opacity: 1; transform: scale(1)    translateY(0); }
            }
          `}</style>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
