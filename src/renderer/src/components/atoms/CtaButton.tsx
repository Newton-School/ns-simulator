import { Play } from 'lucide-react'

interface CtaButtonProps {
  onClick: () => void
  label?: string
}

export const CtaButton = ({ onClick, label = 'Run Sim' }: CtaButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="
            flex items-center gap-2 px-6 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all
            bg-nss-primary hover:bg-nss-primaryHover text-white 
            shadow-lg shadow-nss-bg/50
            focus:outline-none focus:ring-2 focus:ring-nss-primary 
            hover:scale-105 active:scale-95
        "
  >
    <Play size={12} fill="currentColor" />
    {label}
  </button>
)
