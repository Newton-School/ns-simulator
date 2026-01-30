import { useRef, useEffect, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { Trash2 } from 'lucide-react';

import { MenuTrigger } from '../atoms/MenuTrigger';
import { MenuHeader } from '../atoms/MenuHeader';
import { MenuOption } from '../atoms/MenuOption';

interface NodeSettingsMenuProps {
  nodeId: string;
  isOpen: boolean;
  onClose: () => void;
  onToggle: (e: React.MouseEvent) => void;
}

export const NodeSettingsMenu = ({ nodeId, isOpen, onClose, onToggle }: NodeSettingsMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { deleteElements } = useReactFlow();

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id: nodeId }] });
    onClose();
  }, [nodeId, deleteElements, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (menuRef.current && menuRef.current.contains(target)) ||
        (triggerRef.current && triggerRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    return () => document.removeEventListener('mousedown', handleClickOutside, { capture: true });
  }, [isOpen, onClose]);

  return (
    <div className="relative flex items-center">
      <MenuTrigger
        ref={triggerRef}
        isOpen={isOpen}
        onClick={onToggle}
      />

      {isOpen && (
        <div
          ref={menuRef}
          className="
            absolute right-0 top-full mt-2 w-48 
            bg-nss-panel border border-nss-border 
            rounded-lg shadow-xl
            overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-100
            z-50
          "
          onClick={(e) => e.stopPropagation()}
        >
          <MenuHeader onClose={onClose} />

          <div className="p-1 flex flex-col gap-0.5">
            <MenuOption
              icon={Trash2}
              label="Delete"
              onClick={handleDelete}
              isDestructive
            />
          </div>
        </div>
      )}
    </div>
  );
};
