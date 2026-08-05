import type {
    CalculateProfitCplEstimations,
    CalculateProfitEstimationEntry,
    CalculateProfitRateGrid,
    CalculateProfitSellingPricesByCpl,
    CalculateProfitSnapshot,
    CalculateProfitSnapshotInput,
    DeliveryRateRow,
} from './types';

export function normalizeRate(value: number): number {
    if (value > 1) {
        return value / 100;
    }
    return value;
}

export function perDeliveredMarketing(
    cplUsd: number,
    confirmationRate: number,
    deliveryRate: number,
): number {
    return cplUsd / (confirmationRate * deliveryRate);
}

export function perDeliveredConfirmation(
    cancelledUsd: number,
    returnedUsd: number,
    deliveredUsd: number,
    confirmationRate: number,
    deliveryRate: number,
): number {
    const returnRate = 1 - deliveryRate;
    const cancelledPerDelivered =
        ((1 - confirmationRate) * cancelledUsd) / (confirmationRate * deliveryRate);
    const returnedFeesForNonDelivered = returnRate * returnedUsd;
    return cancelledPerDelivered + returnedFeesForNonDelivered + deliveredUsd;
}

export function perDeliveredFulfillment(
    packagedUsdPerConfirmedOrder: number,
    returnedUsd: number,
    deliveredUsd: number,
    _confirmationRate: number,
    deliveryRate: number,
): number {
    const returnRate = 1 - deliveryRate;

    const packagingPerDelivered = packagedUsdPerConfirmedOrder / deliveryRate;
    return packagingPerDelivered + deliveredUsd + returnRate * returnedUsd;
}

export function perDeliveredShippingUsd(
    deliveryRates: DeliveryRateRow[],
    weightInGram: number,
    deliveryRate: number,
): number {
    if (deliveryRates.length === 0) {
        return 0;
    }
    const weightKg = weightInGram / 1000;
    const outboundCosts = deliveryRates.map(r => {
        const extraKg = Math.max(0, weightKg - r.maxWeightInKg);
        return r.home + extraKg * r.overweightTaxPerKg;
    });
    const averageOutbound = outboundCosts.reduce((sum, v) => sum + v, 0) / outboundCosts.length;
    const averageReturn =
        deliveryRates.reduce((sum, r) => sum + r.return, 0) / deliveryRates.length;
    const returnRate = 1 - deliveryRate;
    return averageOutbound + returnRate * averageReturn;
}

export function profitTargetsUsd(): number[] {
    return [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
}

export function cplScenarioKeys(): number[] {
    const keys: number[] = [];
    for (let i = 1; i <= 20; i += 1) {
        keys.push(Number((i * 0.5).toFixed(1)));
    }
    return keys;
}

export function rateGridPercents(): number[] {
    const rates: number[] = [];
    for (let i = 0; i < 20; i += 1) {
        rates.push(i * 5);
    }
    return rates;
}

export function computeProfitSnapshot(
    input: CalculateProfitSnapshotInput,
): CalculateProfitSnapshot | null {
    const c = input.confirmationRate;
    const d = input.deliveryRate;
    if (c <= 0 || c > 1 || d <= 0 || d > 1) {
        return null;
    }

    const codPct = input.fees.shipping.codPercentage;
    const tvaPct = input.fees.shipping.tvaPercentage;
    const netLocalMultiplier = 1 - codPct / 100 - tvaPct / 100;
    if (netLocalMultiplier <= 0) {
        return null;
    }

    const confirmationPerDelivered = perDeliveredConfirmation(
        input.fees.confirmation.cancelled,
        input.fees.confirmation.returned,
        input.fees.confirmation.delivered,
        c,
        d,
    );
    const fulfillmentPerDelivered = perDeliveredFulfillment(
        input.fees.fulfillment.packaged,
        input.fees.fulfillment.returned,
        input.fees.fulfillment.delivered,
        c,
        d,
    );
    const shippingPerDelivered = input.freeShipping
        ? perDeliveredShippingUsd(input.fees.shipping.deliveryRates, input.weightInGram, d)
        : 0;

    const fixedNonMarketingUsd =
        confirmationPerDelivered + fulfillmentPerDelivered + shippingPerDelivered;
    const marketingPerDelivered = perDeliveredMarketing(input.cpl, c, d);

    const sellingLocal = input.sellingPriceInLocal;
    const netLocal = sellingLocal * netLocalMultiplier;
    const netRevenueUsd = netLocal * input.localToUsdRate;

    const codLocal = sellingLocal * (codPct / 100);
    const tvaLocal = sellingLocal * (tvaPct / 100);
    const codUsd = codLocal * input.localToUsdRate;
    const tvaUsd = tvaLocal * input.localToUsdRate;

    const profit = Number(
        (
            netRevenueUsd -
            input.purchasePriceInUsd -
            marketingPerDelivered -
            confirmationPerDelivered -
            fulfillmentPerDelivered -
            shippingPerDelivered
        ).toFixed(2),
    );

    const investmentPerDelivered = Number(
        (input.purchasePriceInUsd + marketingPerDelivered).toFixed(2),
    );

    const revenueBeforeAdsPerDelivered = Number(
        (
            netRevenueUsd -
            confirmationPerDelivered -
            fulfillmentPerDelivered -
            shippingPerDelivered
        ).toFixed(2),
    );

    const realRevenueAfterAdsPerDelivered = Number(
        (
            netRevenueUsd -
            marketingPerDelivered -
            confirmationPerDelivered -
            fulfillmentPerDelivered -
            shippingPerDelivered
        ).toFixed(2),
    );

    const roi =
        input.purchasePriceInUsd > 0
            ? Number((profit / (input.purchasePriceInUsd + marketingPerDelivered)).toFixed(4))
            : 0;

    return {
        roi,
        profit,
        investmentPerDelivered,
        revenueBeforeAdsPerDelivered,
        realRevenueAfterAdsPerDelivered,
        fees: {
            marketing: Number(marketingPerDelivered.toFixed(2)),
            confirmation: Number(confirmationPerDelivered.toFixed(2)),
            fulfillment: Number(fulfillmentPerDelivered.toFixed(2)),
            shipping: Number(shippingPerDelivered.toFixed(2)),
            cod: Number(codUsd.toFixed(2)),
            tva: Number(tvaUsd.toFixed(2)),
        },
        netRevenueUsd,
        fixedNonMarketingUsd,
    };
}

export function buildRateGrid(
    baseInput: Omit<CalculateProfitSnapshotInput, 'confirmationRate' | 'deliveryRate'>,
    resolveValue: (snapshot: CalculateProfitSnapshot, c: number, d: number) => number | null,
    options?: { cpl?: number },
): CalculateProfitRateGrid {
    const confirmationRates = rateGridPercents();
    const deliveryRates = rateGridPercents();
    const values: (number | null)[][] = [];

    for (const confirmationPercent of confirmationRates) {
        const row: (number | null)[] = [];
        const c = confirmationPercent / 100;
        for (const deliveryPercent of deliveryRates) {
            const d = deliveryPercent / 100;
            const snapshot = computeProfitSnapshot({
                ...baseInput,
                cpl: options?.cpl ?? baseInput.cpl,
                confirmationRate: c,
                deliveryRate: d,
            });
            row.push(snapshot ? resolveValue(snapshot, c, d) : null);
        }
        values.push(row);
    }

    return { confirmationRates, deliveryRates, values };
}

export function buildCplEstimations(
    baseInput: Omit<CalculateProfitSnapshotInput, 'confirmationRate' | 'deliveryRate'>,
    currentC: number,
    currentD: number,
): CalculateProfitCplEstimations {
    const currentSnapshot = computeProfitSnapshot({
        ...baseInput,
        confirmationRate: currentC,
        deliveryRate: currentD,
    });
    const out: Record<string, CalculateProfitEstimationEntry> = {};

    for (const targetProfitUsd of profitTargetsUsd()) {
        const key = targetProfitUsd === 0 ? 'breakeven' : `${targetProfitUsd}$ Profit`;
        const value =
            currentSnapshot === null
                ? 0
                : Number(
                      (
                          currentC *
                          currentD *
                          (currentSnapshot.netRevenueUsd -
                              baseInput.purchasePriceInUsd -
                              currentSnapshot.fixedNonMarketingUsd -
                              targetProfitUsd)
                      ).toFixed(2),
                  );
        const rateGrid = buildRateGrid(baseInput, (snapshot, c, d) =>
            Number(
                (
                    c *
                    d *
                    (snapshot.netRevenueUsd -
                        baseInput.purchasePriceInUsd -
                        snapshot.fixedNonMarketingUsd -
                        targetProfitUsd)
                ).toFixed(2),
            ),
        );
        out[key] = { value, rateGrid };
    }

    return out as CalculateProfitCplEstimations;
}

export function buildSellingPriceScalars(
    baseInput: Omit<CalculateProfitSnapshotInput, 'confirmationRate' | 'deliveryRate' | 'cpl'>,
    currentC: number,
    currentD: number,
    netLocalMultiplier: number,
): Record<string, Record<string, number>> {
    const currentSnapshot = computeProfitSnapshot({
        ...baseInput,
        cpl: 0,
        confirmationRate: currentC,
        deliveryRate: currentD,
    });
    const out: Record<string, Record<string, number>> = {};
    const fixedNonMarketingUsd = currentSnapshot?.fixedNonMarketingUsd ?? 0;

    for (const scenarioCpl of cplScenarioKeys()) {
        const row: Record<string, number> = {};
        const marketing = scenarioCpl / (currentC * currentD);

        for (const targetProfitUsd of profitTargetsUsd()) {
            const key = `${targetProfitUsd}$ Profit`;
            const netNeededUsd =
                baseInput.purchasePriceInUsd +
                marketing +
                fixedNonMarketingUsd +
                targetProfitUsd;
            row[key] = Number(
                (
                    netNeededUsd <= 0
                        ? 0
                        : netNeededUsd / (netLocalMultiplier * baseInput.localToUsdRate)
                ).toFixed(2),
            );
        }
        out[`${scenarioCpl}$ CPL`] = row;
    }

    return out;
}

export function buildSellingPriceRateGrid(
    baseInput: Omit<CalculateProfitSnapshotInput, 'confirmationRate' | 'deliveryRate' | 'cpl'>,
    scenarioCpl: number,
    targetProfitUsd: number,
    netLocalMultiplier: number,
): CalculateProfitRateGrid {
    return buildRateGrid(
        { ...baseInput, cpl: scenarioCpl },
        (snapshot, c, d) => {
            const scenarioMarketing = scenarioCpl / (c * d);
            const scenarioNetNeededUsd =
                baseInput.purchasePriceInUsd +
                scenarioMarketing +
                snapshot.fixedNonMarketingUsd +
                targetProfitUsd;
            return Number(
                (
                    scenarioNetNeededUsd <= 0
                        ? 0
                        : scenarioNetNeededUsd /
                          (netLocalMultiplier * baseInput.localToUsdRate)
                ).toFixed(2),
            );
        },
    );
}

export function buildSellingPriceEstimations(
    baseInput: Omit<CalculateProfitSnapshotInput, 'confirmationRate' | 'deliveryRate' | 'cpl'>,
    currentC: number,
    currentD: number,
    netLocalMultiplier: number,
): CalculateProfitSellingPricesByCpl {
    const currentSnapshot = computeProfitSnapshot({
        ...baseInput,
        cpl: 0,
        confirmationRate: currentC,
        deliveryRate: currentD,
    });
    const out: CalculateProfitSellingPricesByCpl = {};

    for (const scenarioCpl of cplScenarioKeys()) {
        const row: Record<string, CalculateProfitEstimationEntry> = {};
        const marketing = scenarioCpl / (currentC * currentD);
        const fixedNonMarketingUsd = currentSnapshot?.fixedNonMarketingUsd ?? 0;

        for (const targetProfitUsd of profitTargetsUsd()) {
            const key = `${targetProfitUsd}$ Profit`;
            const netNeededUsd =
                baseInput.purchasePriceInUsd +
                marketing +
                fixedNonMarketingUsd +
                targetProfitUsd;
            const value = Number(
                (
                    netNeededUsd <= 0
                        ? 0
                        : netNeededUsd / (netLocalMultiplier * baseInput.localToUsdRate)
                ).toFixed(2),
            );
            const rateGrid = buildRateGrid(
                { ...baseInput, cpl: scenarioCpl },
                (snapshot, c, d) => {
                    const scenarioMarketing = scenarioCpl / (c * d);
                    const scenarioNetNeededUsd =
                        baseInput.purchasePriceInUsd +
                        scenarioMarketing +
                        snapshot.fixedNonMarketingUsd +
                        targetProfitUsd;
                    return Number(
                        (
                            scenarioNetNeededUsd <= 0
                                ? 0
                                : scenarioNetNeededUsd /
                                  (netLocalMultiplier * baseInput.localToUsdRate)
                        ).toFixed(2),
                    );
                },
            );
            row[key] = { value, rateGrid };
        }
        out[`${scenarioCpl}$ CPL`] = row;
    }

    return out;
}

export function buildProfitRateGrid(
    baseInput: Omit<CalculateProfitSnapshotInput, 'confirmationRate' | 'deliveryRate'>,
): CalculateProfitRateGrid {
    return buildRateGrid(baseInput, snapshot => snapshot.profit);
}
