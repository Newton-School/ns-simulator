interface FileStatusProps {
  fileName: string | null
  isUnsaved: boolean
}

export const FileStatus = ({ fileName, isUnsaved }: FileStatusProps) => (
  <div
    className="
        text-xs font-medium text-nss-text/70 bg-nss-bg px-3 py-1 
        rounded border border-nss-border flex items-center gap-1 
        min-w-[150px] justify-center select-none
    "
  >
    {fileName || 'Untitled'}
    {isUnsaved && (
      <span
        className="text-nss-warning font-bold text-lg leading-none mb-1"
        title="Unsaved changes"
      >
        *
      </span>
    )}
  </div>
)
