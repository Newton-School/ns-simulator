import { StatusBadge } from '../atoms/StatusBadge';
import { PropertiesNodeIcon } from '../molecules/PropertiesNodeIcon';

interface PropertiesHeaderProps {
  data: {
    label?: string;
    subLabel?: string;
    iconKey: string;
    status?: string;
    id: string;
  };
}

export const PropertiesHeader = ({ data }: PropertiesHeaderProps) => {
  return (
    <div className="p-5 border-b border-nss-border bg-nss-panel">
      <div className="flex items-center gap-4">

        {/* Molecule: Icon */}
        <div className="shrink-0">
          <PropertiesNodeIcon iconKey={data.iconKey} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-sm text-nss-text leading-tight truncate pr-2">
              {data.label || 'Unnamed Node'}
            </h2>
            {/* Atom: Badge */}
            {data.status && <StatusBadge status={data.status} />}
          </div>

          {/* Sublabel Row */}
          <div className="mt-1 flex items-center gap-2">
            {data.subLabel && (
              <span className="text-[10px] text-nss-muted font-mono uppercase truncate">
                {data.subLabel}
              </span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};