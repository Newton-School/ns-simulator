import { FIELD_DEFINITIONS, FIELD_GROUPS } from '@renderer/config/fieldConfig';
import { FormField } from '../molecules/FormField';

interface PropertiesFormProps {
    data: Record<string, any>;
    onUpdate: (key: string, value: any) => void;
}

export const PropertiesForm = ({ data, onUpdate }: PropertiesFormProps) => {

    // Helper to render a specific field by key
    const renderField = (key: string) => {
        const config = FIELD_DEFINITIONS[key];
        // Skip if no config exists (internal keys) or if data is missing
        if (!config || data[key] === undefined) return null;

        return (
            <FormField
                key={key}
                fieldKey={key}
                config={config}
                value={data[key]}
                onChange={(val) => onUpdate(key, val)}
            />
        );
    };

    // Get a list of all keys currently displayed in groups to avoid duplicates later
    const groupedKeys = new Set(Object.values(FIELD_GROUPS).flat());

    return (
        <div className="space-y-1">
            {Object.entries(FIELD_GROUPS).map(([groupName, fields]) => {
                // Hide group if node doesn't have any of the fields in this group
                const hasVisibleFields = fields.some(k => data[k] !== undefined && FIELD_DEFINITIONS[k]);
                if (!hasVisibleFields) return null;

                return (
                    <div key={groupName} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[14px] font-bold text-nss-muted uppercase">{groupName}</span>
                            <div className="h-px flex-1 bg-nss-border"></div>
                        </div>
                        {fields.map(key => renderField(key))}
                    </div>
                );
            })}

            <div className="pt-2">
                {Object.keys(data).map(key => {
                    // Skip internal keys, grouped keys, or keys without definitions
                    if (['id', 'label', 'subLabel', 'iconKey', 'position', 'type'].includes(key)) return null;
                    if (groupedKeys.has(key)) return null;

                    return renderField(key);
                })}
            </div>

        </div>
    );
};