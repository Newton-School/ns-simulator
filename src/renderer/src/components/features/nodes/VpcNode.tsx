import { memo, useState, useCallback } from 'react'
import { NodeProps, NodeResizer } from 'reactflow'
import { Cloud, Box, LucideIcon } from 'lucide-react'
import { useVpcLogic } from './vpc/useVpcLogic'
import { VpcToolbar } from './vpc/VpcToolBar'
import { VpcHeader } from './vpc/VpcHeader'
import { NodeSettingsMenu } from '@renderer/components/molecules/NodeSettingsMenu'

const VPC_ICON_LOOKUP: Record<string, LucideIcon> = {
  cloud: Cloud,
  az: Box
}

const VpcNode = ({ id, data, selected }: NodeProps) => {
  const { isUngrouped, hasChildren, minSize, handleUngroup } = useVpcLogic(id)
  const ContainerIcon = VPC_ICON_LOOKUP[data.iconKey] || Cloud
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMenuOpen(true)
  }, [])

  const handleMenuClose = useCallback(() => setIsMenuOpen(false), [])

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen((prev) => !prev)
  }, [])

  const isSuccessState = isUngrouped && !hasChildren

  const getContainerStyle = () => {
    if (isSuccessState) {
      return 'border-nss-success bg-nss-success/5 shadow-[0_0_15px_rgba(var(--nss-success),0.15)]'
    }
    if (selected) {
      return 'border-[rgb(var(--nss-primary))] bg-[rgb(var(--nss-primary))]/10 shadow-[0_0_15px_rgba(var(--nss-primary),0.2)]'
    }

    // Default State (Neutral)
    // Uses the new specific variables for better light/dark contrast
    return 'border-[var(--nss-vpc-border)] bg-[rgba(var(--nss-vpc-bg),0.3)] hover:border-nss-muted transition-colors'
  }

  return (
    <div
      onContextMenu={handleContextMenu}
      className="relative w-full h-full group transition-all duration-200 ease-in-out"
      style={{ minWidth: minSize.width, minHeight: minSize.height }}
    >
      <VpcToolbar
        isVisible={selected}
        isUngrouped={isUngrouped}
        hasChildren={hasChildren}
        onUngroup={handleUngroup}
      />

      <div
        className={`
        absolute inset-0 rounded-xl border-2 border-dashed transition-all duration-300 
        overflow-visible
        ${getContainerStyle()}
      `}
      >
        <VpcHeader label={data.label} isSuccessState={isSuccessState} icon={ContainerIcon}>
          <NodeSettingsMenu
            nodeId={id}
            isOpen={isMenuOpen}
            onClose={handleMenuClose}
            onToggle={handleMenuToggle}
          />
        </VpcHeader>
      </div>

      <NodeResizer
        color="rgb(var(--nss-primary))"
        isVisible={selected}
        minWidth={minSize.width}
        minHeight={minSize.height}
        handleStyle={{ width: 12, height: 12, borderRadius: '50%' }}
      />
    </div>
  )
}

export default memo(VpcNode)
