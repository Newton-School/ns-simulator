import { X } from 'lucide-react'

interface RunToastProps {
  messages: string[]
  tone: 'error' | 'warning'
  onClose: () => void
}

export function RunToast({ messages, tone, onClose }: RunToastProps) {
  const isError = tone === 'error'

  return (
    <div
      role="alert"
      className={`
        fixed top-14 right-4 z-50 w-80 rounded-lg border shadow-2xl font-sans text-xs
        ${
          isError
            ? 'bg-nss-panel border-nss-danger/40 text-nss-text'
            : 'bg-nss-panel border-nss-warning/40 text-nss-text'
        }
      `}
    >
      {/* Header bar */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 rounded-t-lg border-b
          ${
            isError
              ? 'bg-nss-danger/10 border-nss-danger/20 text-nss-danger'
              : 'bg-nss-warning/10 border-nss-warning/20 text-nss-warning'
          }
        `}
      >
        <span className="font-semibold uppercase tracking-widest text-[10px]">
          {isError ? 'Run blocked' : 'Run checks'}
        </span>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={13} />
        </button>
      </div>

      {/* Message list */}
      <ul className="px-3 py-2.5 space-y-1.5 text-nss-text/80">
        {messages.map((msg, i) => (
          <li key={i} className="flex gap-2 leading-relaxed">
            <span className={`mt-0.5 shrink-0 ${isError ? 'text-nss-danger' : 'text-nss-warning'}`}>
              •
            </span>
            {msg}
          </li>
        ))}
      </ul>
    </div>
  )
}
