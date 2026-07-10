import type { ReactNode } from 'react';
import { formatDualUsd } from '../lib/currency';

interface DualCurrencyProps {
    usd: number;
    usdToLocalRate: number;
    currency: string;
    size?: 'sm' | 'md' | 'lg';
    emphasize?: 'usd' | 'local';
}

export function DualCurrency({
    usd,
    usdToLocalRate,
    currency,
    size = 'md',
    emphasize = 'usd',
}: DualCurrencyProps) {
    const { usd: usdText, local: localText } = formatDualUsd(usd, usdToLocalRate, currency);
    const primary = emphasize === 'usd' ? usdText : localText;
    const secondary = emphasize === 'usd' ? localText : usdText;

    const sizeClass =
        size === 'lg' ? 'text-2xl font-bold' : size === 'sm' ? 'text-sm' : 'text-lg font-semibold';

    return (
        <div>
            <div className={`${sizeClass} text-white`}>{primary}</div>
            <div className="text-xs text-[var(--color-muted)]">{secondary}</div>
        </div>
    );
}

interface DualCurrencyInlineProps {
    usd: number;
    usdToLocalRate: number;
    currency: string;
}

export function DualCurrencyInline({ usd, usdToLocalRate, currency }: DualCurrencyInlineProps) {
    const { usd: usdText, local: localText } = formatDualUsd(usd, usdToLocalRate, currency);
    return (
        <span className="text-sm">
            <span className="text-white">{usdText}</span>
            <span className="text-[var(--color-muted)]"> · {localText}</span>
        </span>
    );
}

interface PanelProps {
    title: string;
    children: ReactNode;
    className?: string;
}

export function Panel({ title, children, className = '' }: PanelProps) {
    return (
        <section
            className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 ${className}`}
        >
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                {title}
            </h2>
            {children}
        </section>
    );
}
