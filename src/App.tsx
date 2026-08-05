import { useEffect, useMemo, useState } from 'react';
import {
    buildCalculationContext,
    buildSellingPriceGridForView,
    calculateProfit,
} from './lib/calculate';
import { COUNTRIES, getCountryMeta } from './lib/countries';
import { formatLocal, isUsdCurrency, usdToLocal } from './lib/currency';
import { profitTargetsUsd } from './lib/calculate-profit-math';
import { loadCalculatorState, loadFees, saveCalculatorState, saveFees } from './lib/storage';
import type {
    CalculatorInputs,
    CountryCalculatorValues,
    CountryFeesConfig,
    CountryId,
    HeatmapView,
} from './lib/types';
import { DualCurrency, DualCurrencyInline, Panel } from './components/DualCurrency';
import { FeesPanel } from './components/FeesPanel';
import { Heatmap } from './components/Heatmap';
import { NumberInput, SliderField } from './components/Inputs';

export default function App() {
    const [calculatorState, setCalculatorState] = useState(loadCalculatorState);
    const [allFees, setAllFees] = useState(loadFees);
    const [heatmapView, setHeatmapView] = useState<HeatmapView>({ type: 'profit' });
    const [cplTarget, setCplTarget] = useState('breakeven');
    const [sellingCpl, setSellingCpl] = useState('1.0$ CPL');
    const [sellingTarget, setSellingTarget] = useState('0$ Profit');

    const inputs: CalculatorInputs = {
        countryId: calculatorState.selectedCountry,
        ...calculatorState.byCountry[calculatorState.selectedCountry],
    };
    const country = getCountryMeta(inputs.countryId);
    const fees = allFees[inputs.countryId];

    useEffect(() => {
        saveCalculatorState(calculatorState);
    }, [calculatorState]);

    useEffect(() => {
        saveFees(allFees);
    }, [allFees]);

    const result = useMemo(
        () => calculateProfit(inputs, fees),
        [inputs, fees],
    );

    const ctx = useMemo(
        () => buildCalculationContext(inputs, fees),
        [inputs, fees],
    );

    const activeGrid = useMemo(() => {
        if (!result || !ctx) {
            return null;
        }
        if (heatmapView.type === 'profit') {
            return { grid: result.estimations.rateGrid, kind: 'usd' as const, title: 'Profit per delivered order' };
        }
        if (heatmapView.type === 'cpl') {
            const entry = result.estimations.cpl[heatmapView.target];
            return {
                grid: entry?.rateGrid,
                kind: 'usd' as const,
                title: `Max CPL for ${heatmapView.target}`,
            };
        }
        return {
            grid: buildSellingPriceGridForView(ctx, heatmapView.cplScenario, heatmapView.target),
            kind: 'local' as const,
            title: `Selling price at ${heatmapView.cplScenario} · ${heatmapView.target}`,
        };
    }, [result, ctx, heatmapView]);

    const patchInputs = (partial: Partial<CountryCalculatorValues>) => {
        setCalculatorState(prev => ({
            ...prev,
            byCountry: {
                ...prev.byCountry,
                [prev.selectedCountry]: {
                    ...prev.byCountry[prev.selectedCountry],
                    ...partial,
                },
            },
        }));
    };

    const switchCountry = (countryId: CountryId) => {
        setCalculatorState(prev => ({ ...prev, selectedCountry: countryId }));
    };

    const patchFees = (next: CountryFeesConfig) => {
        setAllFees(prev => ({ ...prev, [inputs.countryId]: next }));
    };

    const cplLocal = usdToLocal(inputs.cpl, fees.usdToLocalRate);
    const purchaseLocal = usdToLocal(inputs.purchasePriceInUsd, fees.usdToLocalRate);
    const isProfitable = (result?.profit ?? 0) >= 0;
    const profitTone = isProfitable ? 'positive' : 'negative';
    const feeBreakdownItems = result
        ? ([
              ['Marketing', result.fees.marketing],
              ['Confirmation', result.fees.confirmation],
              ['Fulfilment', result.fees.fulfillment],
              ['Shipping', result.fees.shipping],
              ['COD tax', result.fees.cod],
              ['TVA', result.fees.tva],
          ] as const)
        : [];
    const totalFeesPerDelivered = feeBreakdownItems.reduce((sum, [, amount]) => sum + amount, 0);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <header className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                    COD Scale
                </p>
                <h1 className="mt-1 text-3xl font-bold text-white">Profit Calculator</h1>
                <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
                    Interactive COD economics for Algeria, Libya, Iraq, and Lebanon. Adjust rates
                    and prices in real time — fees in local currency, profits in USD + local.
                </p>
            </header>

            <div className="mb-4 flex flex-wrap gap-2">
                {COUNTRIES.map(c => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => switchCountry(c.id as CountryId)}
                        className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                            inputs.countryId === c.id
                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-white'
                                : 'border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-muted)] hover:border-[var(--color-accent)]/50'
                        }`}
                    >
                        {c.flag} {c.name} ({c.currency})
                    </button>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <div className="space-y-4">
                    <Panel title="Product economics">
                        <div className="space-y-4">
                            <NumberInput
                                label="Purchase price"
                                value={inputs.purchasePriceInUsd}
                                onChange={v => patchInputs({ purchasePriceInUsd: v })}
                                suffix="USD"
                                step={0.01}
                            />
                            {!isUsdCurrency(country.currency) ? (
                                <p className="-mt-2 text-xs text-[var(--color-muted)]">
                                    ≈ {formatLocal(purchaseLocal, country.currency)}
                                </p>
                            ) : null}

                            <NumberInput
                                label="Selling price"
                                value={inputs.sellingPriceInLocal}
                                onChange={v => patchInputs({ sellingPriceInLocal: v })}
                                suffix={country.currency}
                                step={50}
                            />

                            <SliderField
                                label="CPL (cost per lead)"
                                value={inputs.cpl}
                                onChange={v => patchInputs({ cpl: v })}
                                min={0}
                                max={10}
                                step={0.1}
                                format={v => `$${v.toFixed(2)}`}
                                hint={
                                    isUsdCurrency(country.currency)
                                        ? undefined
                                        : `≈ ${formatLocal(cplLocal, country.currency)}`
                                }
                            />

                            <SliderField
                                label="Confirmation rate"
                                value={inputs.confirmationRate}
                                onChange={v => patchInputs({ confirmationRate: v })}
                                min={5}
                                max={95}
                                step={1}
                                format={v => `${v}%`}
                            />

                            <SliderField
                                label="Delivery rate"
                                value={inputs.deliveryRate}
                                onChange={v => patchInputs({ deliveryRate: v })}
                                min={5}
                                max={95}
                                step={1}
                                format={v => `${v}%`}
                            />
                        </div>
                    </Panel>

                    <FeesPanel fees={fees} countryId={inputs.countryId} onChange={patchFees} />
                </div>

                <div className="space-y-4">
                    {result ? (
                        <>
                            <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                                        <p className="text-xs text-[var(--color-muted)]">Profit / delivered</p>
                                        <DualCurrency
                                            usd={result.profit}
                                            usdToLocalRate={fees.usdToLocalRate}
                                            currency={country.currency}
                                            size="lg"
                                            tone={profitTone}
                                        />
                                    </div>
                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                                        <p className="text-xs text-[var(--color-muted)]">ROI</p>
                                        <p
                                            className={`text-2xl font-bold ${
                                                isProfitable
                                                    ? 'text-[var(--color-positive)]'
                                                    : 'text-[var(--color-negative)]'
                                            }`}
                                        >
                                            {(result.roi * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                                        <p className="text-xs text-[var(--color-muted)]">Breakeven CPL</p>
                                        <DualCurrency
                                            usd={result.estimations.cpl.breakeven.value}
                                            usdToLocalRate={fees.usdToLocalRate}
                                            currency={country.currency}
                                            size="lg"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                                        <p className="text-xs text-[var(--color-muted)]">Investment / delivered</p>
                                        <DualCurrency
                                            usd={result.investmentPerDelivered}
                                            usdToLocalRate={fees.usdToLocalRate}
                                            currency={country.currency}
                                            size="lg"
                                        />
                                        <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                                            Product cost + marketing
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                                        <p className="text-xs text-[var(--color-muted)]">Revenue / delivered</p>
                                        <DualCurrency
                                            usd={result.revenueBeforeAdsPerDelivered}
                                            usdToLocalRate={fees.usdToLocalRate}
                                            currency={country.currency}
                                            size="lg"
                                        />
                                        <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                                            Before ads, after other fees
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                                        <p className="text-xs text-[var(--color-muted)]">Real revenue / delivered</p>
                                        <DualCurrency
                                            usd={result.realRevenueAfterAdsPerDelivered}
                                            usdToLocalRate={fees.usdToLocalRate}
                                            currency={country.currency}
                                            size="lg"
                                        />
                                        <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                                            After ads & service fees
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Panel title="Fee breakdown (per delivered)">
                                <div className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                        Total fees
                                    </p>
                                    <DualCurrency
                                        usd={totalFeesPerDelivered}
                                        usdToLocalRate={fees.usdToLocalRate}
                                        currency={country.currency}
                                        size="lg"
                                    />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {feeBreakdownItems.map(([label, amount]) => (
                                        <div
                                            key={label}
                                            className="rounded-lg bg-[var(--color-surface)] px-3 py-2"
                                        >
                                            <p className="text-xs text-[var(--color-muted)]">{label}</p>
                                            <DualCurrencyInline
                                                usd={amount}
                                                usdToLocalRate={fees.usdToLocalRate}
                                                currency={country.currency}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Panel>

                            <Panel title="Sensitivity heatmaps">
                                <div className="mb-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setHeatmapView({ type: 'profit' })}
                                        className={`rounded-md px-3 py-1.5 text-xs ${
                                            heatmapView.type === 'profit'
                                                ? 'bg-[var(--color-accent)] text-white'
                                                : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                                        }`}
                                    >
                                        Profit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setHeatmapView({ type: 'cpl', target: cplTarget })
                                        }
                                        className={`rounded-md px-3 py-1.5 text-xs ${
                                            heatmapView.type === 'cpl'
                                                ? 'bg-[var(--color-accent)] text-white'
                                                : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                                        }`}
                                    >
                                        Max CPL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setHeatmapView({
                                                type: 'sellingPrice',
                                                cplScenario: sellingCpl,
                                                target: sellingTarget,
                                            })
                                        }
                                        className={`rounded-md px-3 py-1.5 text-xs ${
                                            heatmapView.type === 'sellingPrice'
                                                ? 'bg-[var(--color-accent)] text-white'
                                                : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                                        }`}
                                    >
                                        Selling price
                                    </button>
                                </div>

                                {heatmapView.type === 'cpl' ? (
                                    <select
                                        value={cplTarget}
                                        onChange={e => {
                                            setCplTarget(e.target.value);
                                            setHeatmapView({ type: 'cpl', target: e.target.value });
                                        }}
                                        className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white"
                                    >
                                        <option value="breakeven">Breakeven</option>
                                        {profitTargetsUsd()
                                            .filter(t => t > 0)
                                            .map(t => (
                                                <option key={t} value={`${t}$ Profit`}>
                                                    {t}$ Profit
                                                </option>
                                            ))}
                                    </select>
                                ) : null}

                                {heatmapView.type === 'sellingPrice' ? (
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        <select
                                            value={sellingCpl}
                                            onChange={e => {
                                                setSellingCpl(e.target.value);
                                                setHeatmapView({
                                                    type: 'sellingPrice',
                                                    cplScenario: e.target.value,
                                                    target: sellingTarget,
                                                });
                                            }}
                                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white"
                                        >
                                            {Object.keys(result.estimations.sellingPrices).map(k => (
                                                <option key={k} value={k}>
                                                    {k}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={sellingTarget}
                                            onChange={e => {
                                                setSellingTarget(e.target.value);
                                                setHeatmapView({
                                                    type: 'sellingPrice',
                                                    cplScenario: sellingCpl,
                                                    target: e.target.value,
                                                });
                                            }}
                                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white"
                                        >
                                            {profitTargetsUsd().map(t => (
                                                <option key={t} value={`${t}$ Profit`}>
                                                    {t}$ Profit
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                {activeGrid?.grid?.values?.length ? (
                                    <Heatmap
                                        grid={activeGrid.grid}
                                        title={activeGrid.title}
                                        metricLabel={
                                            heatmapView.type === 'profit'
                                                ? 'Profit per delivered'
                                                : heatmapView.type === 'cpl'
                                                  ? `Max CPL (${heatmapView.target})`
                                                  : 'Required selling price'
                                        }
                                        valueKind={activeGrid.kind}
                                        usdToLocalRate={fees.usdToLocalRate}
                                        currency={country.currency}
                                        currentConfirmation={inputs.confirmationRate}
                                        currentDelivery={inputs.deliveryRate}
                                        config={{
                                            countryName: country.name,
                                            currency: country.currency,
                                            usdToLocalRate: fees.usdToLocalRate,
                                            purchasePriceUsd: inputs.purchasePriceInUsd,
                                            sellingPriceLocal: inputs.sellingPriceInLocal,
                                            cplUsd: inputs.cpl,
                                        }}
                                        scenarioNote={
                                            heatmapView.type === 'cpl'
                                                ? `Profit target: ${heatmapView.target}`
                                                : heatmapView.type === 'sellingPrice'
                                                  ? `CPL scenario: ${heatmapView.cplScenario} · Target: ${heatmapView.target}`
                                                  : undefined
                                        }
                                    />
                                ) : null}
                            </Panel>

                            <Panel title="CPL targets at current rates">
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {(
                                        Object.entries(result.estimations.cpl) as [
                                            string,
                                            (typeof result.estimations.cpl)['breakeven'],
                                        ][]
                                    ).map(([key, entry]) => (
                                        <div
                                            key={key}
                                            className="rounded-lg bg-[var(--color-surface)] px-3 py-2"
                                        >
                                            <p className="text-xs text-[var(--color-muted)]">{key}</p>
                                            <DualCurrencyInline
                                                usd={entry.value}
                                                usdToLocalRate={fees.usdToLocalRate}
                                                currency={country.currency}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Panel>
                        </>
                    ) : (
                        <Panel title="Invalid configuration">
                            <p className="text-sm text-[var(--color-negative)]">
                                Check exchange rate, tax percentages, and rates (must be between 5%
                                and 95%).
                            </p>
                        </Panel>
                    )}
                </div>
            </div>
        </div>
    );
}
