interface NumberInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    suffix?: string;
    step?: number;
    min?: number;
}

export function NumberInput({
    label,
    value,
    onChange,
    suffix,
    step = 1,
    min = 0,
}: NumberInputProps) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--color-muted)]">{label}</span>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 focus-within:border-[var(--color-accent)]">
                <input
                    type="number"
                    value={Number.isFinite(value) ? value : 0}
                    min={min}
                    step={step}
                    onChange={e => onChange(Number.parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-sm text-white outline-none"
                />
                {suffix ? (
                    <span className="shrink-0 text-xs text-[var(--color-muted)]">{suffix}</span>
                ) : null}
            </div>
        </label>
    );
}

interface SliderFieldProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    format: (value: number) => string;
    hint?: string;
}

export function SliderField({
    label,
    value,
    onChange,
    min,
    max,
    step,
    format,
    hint,
}: SliderFieldProps) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-white">{label}</span>
                <span className="rounded-md bg-[var(--color-accent)]/20 px-2 py-0.5 text-sm font-medium text-[var(--color-accent)]">
                    {format(value)}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(Number.parseFloat(e.target.value))}
            />
            {hint ? <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p> : null}
        </div>
    );
}
