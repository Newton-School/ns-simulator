import { memo } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { useVpcLogic } from './vpc/useVpcLogic';
import { VpcToolbar } from './vpc/VpcToolBar';
import { VpcHeader } from './vpc/VpcHeader';

const VpcNode = ({ id, data, selected }: NodeProps) => {
  // Hook into logic
  const { isUngrouped, hasChildren, minSize, handleUngroup } = useVpcLogic(id);

  //Derived Visual States
  const isSuccessState = isUngrouped && !hasChildren;

  // Determine Container Styles
  const getContainerStyle = () => {
    // Success State (Green)
    if (isSuccessState) {
      return 'border-[rgb(var(--nss-success))] bg-[rgb(var(--nss-success))]/10 shadow-[0_0_15px_rgba(var(--nss-success),0.2)]';
    }

    // Selected State (Blue)
    if (selected) {
      return 'border-[rgb(var(--nss-primary))] bg-[rgb(var(--nss-primary))]/10 shadow-[0_0_15px_rgba(var(--nss-primary),0.2)]';
    }

    // Default State (Neutral)
    // Uses the new specific variables for better light/dark contrast
    return 'border-[var(--nss-vpc-border)] bg-[rgba(var(--nss-vpc-bg),0.3)] hover:border-nss-muted transition-colors';
  };

  return (
    <div
      className="relative w-full h-full group transition-all duration-200 ease-in-out"
      style={{ minWidth: minSize.width, minHeight: minSize.height }}
    >
      {/* --- Toolbar Atom --- */}
      <VpcToolbar
        isVisible={selected}
        isUngrouped={isUngrouped}
        hasChildren={hasChildren}
        onUngroup={handleUngroup}
      />

      {/* --- Main Container --- */}
      <div className={`
        absolute inset-0 rounded-xl border-2 border-dashed transition-all duration-300
        ${getContainerStyle()}
      `}>
        {/* --- Header Atom --- */}
        <VpcHeader
          label={data.label}
          isSuccessState={isSuccessState}
        />
      </div>

      {/* --- Resizer (Built-in Atom) --- */}
      <NodeResizer
        color="rgb(var(--nss-primary))"
        isVisible={selected}
        minWidth={minSize.width}
        minHeight={minSize.height}
        handleStyle={{ width: 12, height: 12, borderRadius: '50%' }}
      />
    </div>
  );
};

export default memo(VpcNode);