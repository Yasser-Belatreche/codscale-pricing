import { localToUsd, localToUsdRate } from './currency';
import {
    buildCplEstimations,
    buildProfitRateGrid,
    buildSellingPriceRateGrid,
    buildSellingPriceScalars,
    computeProfitSnapshot,
    normalizeRate,
} from './calculate-profit-math';
import type {
    CalculateProfitEstimationEntry,
    CalculateProfitFeeInputs,
    CalculateProfitRateGrid,
    CalculateProfitResult,
    CalculateProfitSellingPricesByCpl,
    CalculatorInputs,
    CountryFeesConfig,
} from './types';

const WEIGHT_IN_GRAM = 1;
const FREE_SHIPPING = true;

function buildFeeInputs(config: CountryFeesConfig): CalculateProfitFeeInputs {
    const rate = config.usdToLocalRate;

    return {
        confirmation: {
            cancelled: localToUsd(config.confirmation.cancelled, rate),
            returned: localToUsd(config.confirmation.returned, rate),
            delivered: localToUsd(config.confirmation.delivered, rate),
        },
        fulfillment: {
            packaged: localToUsd(config.fulfillment.packaged, rate),
            returned: localToUsd(config.fulfillment.returned, rate),
            delivered: localToUsd(config.fulfillment.delivered, rate),
        },
        shipping: {
            codPercentage: config.shipping.codPercentage,
            tvaPercentage: config.shipping.tvaPercentage,
            deliveryRates: [
                {
                    home: localToUsd(config.shipping.home, rate),
                    return: localToUsd(config.shipping.return, rate),
                    maxWeightInKg: 999,
                    overweightTaxPerKg: 0,
                },
            ],
        },
    };
}

export interface CalculationContext {
    gridBaseInput: Omit<
        import('./types').CalculateProfitSnapshotInput,
        'confirmationRate' | 'deliveryRate'
    >;
    netLocalMultiplier: number;
    c: number;
    d: number;
    usdToLocalRate: number;
}

export function buildCalculationContext(
    inputs: CalculatorInputs,
    feesConfig: CountryFeesConfig,
): CalculationContext | null {
    const c = normalizeRate(inputs.confirmationRate);
    const d = normalizeRate(inputs.deliveryRate);
    if (c <= 0 || c > 1 || d <= 0 || d > 1) {
        return null;
    }

    if (feesConfig.usdToLocalRate <= 0) {
        return null;
    }

    const fees = buildFeeInputs(feesConfig);
    const netLocalMultiplier = 1 - fees.shipping.codPercentage / 100 - fees.shipping.tvaPercentage / 100;
    if (netLocalMultiplier <= 0) {
        return null;
    }

    return {
        gridBaseInput: {
            purchasePriceInUsd: inputs.purchasePriceInUsd,
            sellingPriceInLocal: inputs.sellingPriceInLocal,
            weightInGram: WEIGHT_IN_GRAM,
            freeShipping: FREE_SHIPPING,
            cpl: inputs.cpl,
            localToUsdRate: localToUsdRate(feesConfig.usdToLocalRate),
            fees,
        },
        netLocalMultiplier,
        c,
        d,
        usdToLocalRate: feesConfig.usdToLocalRate,
    };
}

export function calculateProfit(
    inputs: CalculatorInputs,
    feesConfig: CountryFeesConfig,
): CalculateProfitResult | null {
    const ctx = buildCalculationContext(inputs, feesConfig);
    if (!ctx) {
        return null;
    }

    const snapshot = computeProfitSnapshot({
        ...ctx.gridBaseInput,
        confirmationRate: ctx.c,
        deliveryRate: ctx.d,
    });

    if (!snapshot) {
        return null;
    }

    const sellingScalars = buildSellingPriceScalars(
        ctx.gridBaseInput,
        ctx.c,
        ctx.d,
        ctx.netLocalMultiplier,
    );

    const sellingPrices = Object.fromEntries(
        Object.entries(sellingScalars).map(([cplLabel, targets]) => [
            cplLabel,
            Object.fromEntries(
                Object.entries(targets).map(([target, value]) => [
                    target,
                    {
                        value,
                        rateGrid: {
                            confirmationRates: [],
                            deliveryRates: [],
                            values: [],
                        },
                    } satisfies CalculateProfitEstimationEntry,
                ]),
            ),
        ]),
    ) as CalculateProfitSellingPricesByCpl;

    return {
        roi: snapshot.roi,
        profit: snapshot.profit,
        fees: snapshot.fees,
        estimations: {
            cpl: buildCplEstimations(ctx.gridBaseInput, ctx.c, ctx.d),
            sellingPrices,
            rateGrid: buildProfitRateGrid(ctx.gridBaseInput),
        },
    };
}

export function buildSellingPriceGridForView(
    ctx: CalculationContext,
    cplScenario: string,
    target: string,
): CalculateProfitRateGrid {
    const scenarioCpl = Number.parseFloat(cplScenario.replace('$ CPL', ''));
    const targetProfitUsd = Number.parseInt(target.replace('$ Profit', ''), 10);
    return buildSellingPriceRateGrid(
        ctx.gridBaseInput,
        scenarioCpl,
        targetProfitUsd,
        ctx.netLocalMultiplier,
    );
}
