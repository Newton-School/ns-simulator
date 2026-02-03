import { StatusBadge } from '../atoms/StatusBadge';
import { PropertiesNodeIcon } from '../molecules/PropertiesNodeIcon';

interface PropertiesHeaderProps {
  data: {
    label?: string;
    subLabel?: string;
    iconKey: string;
    status?: string;
    id: string;
    computeType?: string;
    is_overloaded?: boolean;
  };
}

export const PropertiesHeader = ({ data }: PropertiesHeaderProps) => {

  const isCompute = !!data.computeType;
  const isOverloaded = data.is_overloaded;

  return (
    <div className="p-5 border-b border-nss-border bg-nss-panel">
      <div className="flex items-center gap-4">

        {/* Molecule: Icon */}
        <div className={`
          shrink-0 transition-colors duration-300 rounded-lg p-0.5
          ${isOverloaded ? 'bg-nss-danger/10 ring-1 ring-nss-danger/30' : ''}
        `}>
          <PropertiesNodeIcon iconKey={data.iconKey} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex justify-between items-center">
            <h2 className={`font-semibold text-sm leading-tight truncate pr-2 ${isOverloaded ? 'text-nss-danger' : 'text-nss-text'}`}>
              {data.label || 'Unnamed Node'}
            </h2>

            {/* Badge Logic: Switch between Legacy Status and New Compute State */}
            {isCompute ? (
              <span className={`
                 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border
                 ${isOverloaded
                  ? 'bg-nss-danger/10 text-nss-danger border-nss-danger/20'
                  : 'bg-nss-success/10 text-nss-success border-nss-success/20'}
               `}>
                {isOverloaded ? 'Overloaded' : 'Running'}
              </span>
            ) : (
              data.status && <StatusBadge status={data.status} />
            )}
          </div>

          {/* Sublabel Row */}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] text-nss-muted font-mono uppercase truncate">
              {isCompute ? data.computeType : (data.subLabel || data.id.split('-')[0])}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};