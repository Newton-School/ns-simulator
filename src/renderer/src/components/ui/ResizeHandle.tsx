import { PanelResizeHandle } from 'react-resizable-panels'

type ResizeHandleProps = {
  className?: string
  vertical?: boolean
  id?: string
}

export const ResizeHandle = ({ className = '', vertical = false, id }: ResizeHandleProps) => (
  <PanelResizeHandle
    id={id}
    tabIndex={0}
    role="separator"
    aria-orientation={vertical ? 'vertical' : 'horizontal'}
    aria-label="Resize Panel"
    className={`
            bg-nss-bg 
            hover:bg-nss-primary 
            transition-colors 
            group 
            flex 
            justify-center 
            items-center
            outline-none
            focus-visible:bg-nss-primary
            
            ${vertical ? 'w-1 flex-col h-full cursor-col-resize' : 'h-1 w-full flex-row cursor-row-resize'} 
            ${className}
        `}
  >
    <div
      className={`
                bg-nss-border 
                group-hover:bg-white 
                rounded-full
                transition-colors
                group-focus-visible:bg-white
                ${vertical ? 'h-8 w-0.5' : 'w-8 h-0.5'}
            `}
    />
  </PanelResizeHandle>
)
