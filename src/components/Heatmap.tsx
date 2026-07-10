import { useState } from 'react';
import type { CalculateProfitRateGrid } from '../lib/types';
import { formatLocal, formatUsd, usdToLocal } from '../lib/currency';

export interface HeatmapConfig {
    countryName: string;
    currency: string;
    usdToLocalRate: number;
    purchasePriceUsd: number;
    sellingPriceLocal: number;
    cplUsd: number;
}

interface HeatmapProps {
    grid: CalculateProfitRateGrid;
    title: string;
    metricLabel: string;
    valueKind: 'usd' | 'local';
    usdToLocalRate: number;
    currency: string;
    currentConfirmation: number;
    currentDelivery: number;
    config: HeatmapConfig;
    scenarioNote?: string;
}

interface HoveredCell {
    confirmationRate: number;
    deliveryRate: number;
    value: number | null;
    isCurrent: boolean;
    x: number;
    y: number;
}

function colorForValue(value: number, min: number, max: number): string {
    if (min === max) {
        return 'rgb(59, 130, 246)';
    }
    if (value < 0 && max <= 0) {
        const intensity = Math.min(1, Math.abs(value) / Math.max(Math.abs(min), 1));
        return `rgb(${Math.round(120 + intensity * 80)}, 40, 40)`;
    }
    if (value >= 0 && min >= 0) {
        const t = (value - min) / (max - min);
        return `rgb(30, ${Math.round(80 + t * 120)}, ${Math.round(50 + t * 60)})`;
    }
    if (value < 0) {
        const intensity = Math.min(1, Math.abs(value) / Math.max(Math.abs(min), 1));
        return `rgb(${Math.round(180 + intensity * 55)}, 50, 50)`;
    }
    const intensity = value / Math.max(max, 1);
    return `rgb(30, ${Math.round(100 + intensity * 100)}, 60)`;
}

function formatMetricValue(
    value: number,
    kind: 'usd' | 'local',
    usdToLocalRate: number,
    currency: string,
): { primary: string; secondary: string } {
    if (kind === 'local') {
        return {
            primary: formatLocal(value, currency),
            secondary: formatUsd(value / usdToLocalRate),
        };
    }
    return {
        primary: formatUsd(value),
        secondary: formatLocal(usdToLocal(value, usdToLocalRate), currency),
    };
}

function Tooltip({
    cell,
    metricLabel,
    valueKind,
    config,
    scenarioNote,
}: {
    cell: HoveredCell;
    metricLabel: string;
    valueKind: 'usd' | 'local';
    config: HeatmapConfig;
    scenarioNote?: string;
}) {
    const { primary, secondary } =
        cell.value === null
            ? { primary: 'N/A', secondary: '' }
            : formatMetricValue(cell.value, valueKind, config.usdToLocalRate, config.currency);

    return (
        <div
            className="pointer-events-none fixed z-50 w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--color-border)] bg-[#0d1520] p-3 text-xs shadow-xl"
            style={{ left: cell.x, top: cell.y - 8 }}
        >
            {cell.isCurrent ? (
                <p className="mb-2 font-semibold text-[var(--color-accent)]">★ Your current setup</p>
            ) : null}

            <p className="mb-2 font-semibold text-white">Rates at this cell</p>
            <div className="space-y-1 text-[var(--color-muted)]">
                <p>
                    <span className="text-white">Confirmation rate:</span> {cell.confirmationRate}%
                </p>
                <p>
                    <span className="text-white">Delivery rate:</span> {cell.deliveryRate}%
                </p>
            </div>

            <div className="my-2 border-t border-[var(--color-border)]" />

            <p className="mb-1 font-semibold text-white">{metricLabel}</p>
            <p className="text-sm font-medium text-white">{primary}</p>
            {secondary ? <p className="text-[var(--color-muted)]">{secondary}</p> : null}

            <div className="my-2 border-t border-[var(--color-border)]" />

            <p className="mb-1 font-semibold text-white">Fixed config (unchanged)</p>
            <div className="space-y-1 text-[var(--color-muted)]">
                <p>
                    <span className="text-white">Country:</span> {config.countryName}
                </p>
                <p>
                    <span className="text-white">Purchase:</span> {formatUsd(config.purchasePriceUsd)}{' '}
                    ({formatLocal(usdToLocal(config.purchasePriceUsd, config.usdToLocalRate), config.currency)})
                </p>
                <p>
                    <span className="text-white">Selling price:</span>{' '}
                    {formatLocal(config.sellingPriceLocal, config.currency)}
                </p>
                <p>
                    <span className="text-white">CPL:</span> {formatUsd(config.cplUsd)} (
                    {formatLocal(usdToLocal(config.cplUsd, config.usdToLocalRate), config.currency)})
                </p>
                <p>
                    <span className="text-white">Exchange:</span> 1 USD ={' '}
                    {config.usdToLocalRate.toLocaleString()} {config.currency}
                </p>
            </div>

            {scenarioNote ? (
                <>
                    <div className="my-2 border-t border-[var(--color-border)]" />
                    <p className="text-[var(--color-muted)]">{scenarioNote}</p>
                </>
            ) : null}
        </div>
    );
}

export function Heatmap({
    grid,
    title,
    metricLabel,
    valueKind,
    usdToLocalRate,
    currency,
    currentConfirmation,
    currentDelivery,
    config,
    scenarioNote,
}: HeatmapProps) {
    const [hovered, setHovered] = useState<HoveredCell | null>(null);

    const flat = grid.values.flat().filter((v): v is number => v !== null);
    const min = flat.length ? Math.min(...flat) : 0;
    const max = flat.length ? Math.max(...flat) : 0;

    const currentCi = grid.confirmationRates.indexOf(Math.round(currentConfirmation / 5) * 5);
    const currentDi = grid.deliveryRates.indexOf(Math.round(currentDelivery / 5) * 5);

    const colCount = grid.deliveryRates.length;

    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="text-xs text-[var(--color-muted)]">
                        Each cell shows {metricLabel.toLowerCase()} if confirmation and delivery rates
                        were at that pair — all other inputs stay fixed.
                    </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-sm bg-red-500/80" /> Low
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-sm bg-green-500/80" /> High
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-sm ring-2 ring-white" /> Current
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto pb-1">
                <div
                    className="inline-grid gap-px"
                    style={{
                        gridTemplateColumns: `88px repeat(${colCount}, minmax(28px, 1fr))`,
                    }}
                >
                    <div className="col-span-1" />
                    <div
                        className="flex items-center justify-center border-b border-[var(--color-border)] pb-1 text-[11px] font-semibold uppercase tracking-wide text-white"
                        style={{ gridColumn: `2 / span ${colCount}` }}
                    >
                        Delivery rate →
                    </div>

                    <div className="flex items-end justify-end pr-2 pb-6 text-[10px] font-medium leading-tight text-[var(--color-muted)]">
                        Confirmation
                        <br />
                        rate ↓
                    </div>
                    {grid.deliveryRates.map(rate => (
                        <div
                            key={`d-${rate}`}
                            className="flex flex-col items-center justify-end border-b border-[var(--color-border)] pb-1"
                        >
                            <span className="text-[10px] font-medium text-white">{rate}%</span>
                        </div>
                    ))}

                    {grid.values.map((row, ci) => (
                        <div key={`row-${ci}`} className="contents">
                            <div className="flex items-center justify-end gap-1 pr-2 text-[10px]">
                                <span className="text-[var(--color-muted)]">Conf</span>
                                <span className="font-medium text-white">
                                    {grid.confirmationRates[ci]}%
                                </span>
                            </div>
                            {row.map((cell, di) => {
                                const isCurrent = ci === currentCi && di === currentDi;
                                const confirmationRate = grid.confirmationRates[ci];
                                const deliveryRate = grid.deliveryRates[di];

                                if (cell === null) {
                                    return (
                                        <div
                                            key={`${ci}-${di}`}
                                            className="flex h-8 min-w-[28px] items-center justify-center rounded-sm bg-[var(--color-surface)] text-[9px] text-[var(--color-muted)]"
                                        >
                                            —
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={`${ci}-${di}`}
                                        className={`h-8 min-w-[28px] cursor-crosshair rounded-sm transition-transform hover:z-10 hover:scale-110 ${isCurrent ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--color-panel)]' : ''}`}
                                        style={{ backgroundColor: colorForValue(cell, min, max) }}
                                        onMouseEnter={e => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setHovered({
                                                confirmationRate,
                                                deliveryRate,
                                                value: cell,
                                                isCurrent,
                                                x: rect.left + rect.width / 2,
                                                y: rect.top,
                                            });
                                        }}
                                        onMouseLeave={() => setHovered(null)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-3 flex justify-between text-xs text-[var(--color-muted)]">
                <span>
                    Min:{' '}
                    {flat.length
                        ? formatMetricValue(min, valueKind, usdToLocalRate, currency).primary
                        : '—'}
                </span>
                <span>
                    Max:{' '}
                    {flat.length
                        ? formatMetricValue(max, valueKind, usdToLocalRate, currency).primary
                        : '—'}
                </span>
            </div>

            {hovered ? (
                <Tooltip
                    cell={hovered}
                    metricLabel={metricLabel}
                    valueKind={valueKind}
                    config={config}
                    scenarioNote={scenarioNote}
                />
            ) : null}
        </div>
    );
}
