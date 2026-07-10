interface NumberInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    suffix?: string;
    step?: number;
    min?: number;
    size?: 'default' | 'wide';
}

export function NumberInput({
    label,
    value,
    onChange,
    suffix,
    step = 1,
    min = 0,
    size = 'default',
}: NumberInputProps) {
    const isWide = size === 'wide';

    return (
        <label className="block min-w-0">
            <span className={`mb-1.5 block text-[var(--color-muted)] ${isWide ? 'text-sm' : 'text-xs'}`}>
                {label}
            </span>
            <div
                className={`flex min-w-0 items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-accent)] ${
                    isWide ? 'px-4 py-3' : 'px-3 py-2'
                }`}
            >
                <input
                    type="number"
                    value={Number.isFinite(value) ? value : 0}
                    min={min}
                    step={step}
                    onChange={e => onChange(Number.parseFloat(e.target.value) || 0)}
                    className={`min-w-0 flex-1 bg-transparent text-white outline-none tabular-nums ${
                        isWide ? 'text-base font-medium' : 'text-sm'
                    }`}
                />
                {suffix ? (
                    <span
                        className={`shrink-0 text-[var(--color-muted)] ${isWide ? 'text-sm' : 'text-xs'}`}
                    >
                        {suffix}
                    </span>
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
