import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface UniversalHandleProps {
  position: Position;
  offset: string;
  id: string;
}

const UniversalHandle = ({ position, offset, id }: UniversalHandleProps) => {
  const baseStyle = `
    !w-2 !h-2 rounded-full border border-nss-surface z-50
    transition-all duration-200 
    opacity-0 group-hover:opacity-40
  `;

  const style: React.CSSProperties = {};

  if (position === Position.Left || position === Position.Right) {
    style.top = offset;
  } else {
    style.left = offset;
  }

  if (position === Position.Left) style.left = '-5px';
  if (position === Position.Right) style.right = '-5px';
  if (position === Position.Top) style.top = '-5px';
  if (position === Position.Bottom) style.bottom = '-5px';

  return (
    <>
      {/* TARGET HANDLE (Receiver) 
        - Z-Index: Low (1) by default
        - Z-Index: High (20) when dragging (handled by global CSS)
        - Color: Blue/Green
      */}
      <Handle
        type="target"
        position={position}
        id={`${id}-target`}
        className={`${baseStyle} custom-target-handle !bg-nss-primary`}
        style={style}
      />

      {/* SOURCE HANDLE (Sender)
        - Z-Index: High (10) by default
        - Pointer Events: None when dragging (handled by global CSS)
        - Color: Orange/Amber
      */}
      <Handle
        type="source"
        position={position}
        id={`${id}-source`}
        className={`${baseStyle} custom-source-handle !bg-nss-warning`}
        style={style}
      />
    </>
  );
};

export default memo(UniversalHandle);