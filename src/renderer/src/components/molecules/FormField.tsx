import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Slider } from '../atoms/Slider';

interface FormFieldProps {
    fieldKey: string;
    config: any;
    value: any;
    onChange: (value: any) => void;
}

export const FormField = ({ config, value, onChange }: FormFieldProps) => {
    if (value === undefined) return null;

    const renderInput = () => {
        switch (config.type) {
            case 'slider':
                return (
                    <Slider
                        value={value}
                        min={config.min}
                        max={config.max}
                        unit={config.unit}
                        onChange={onChange}
                    />
                );

            case 'select':
                return (
                    <Select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    >
                        {config.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </Select>
                );

            case 'input':
            default:
                return (
                    <Input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        step={config.step}
                        value={value}
                        rightElement={config.unit}
                        onChange={(e) => {
                            const val = e.target.value;
                            onChange(typeof value === 'number' ? parseFloat(val) : val);
                        }}
                    />
                );
        }
    };

    if (config.type === 'boolean') {
        return <div className="mb-5">{renderInput()}</div>;
    }

    return (
        <div className="mb-5">
            <Label>{config.label}</Label>
            {renderInput()}
        </div>
    );
};