export interface CalculateProfitFees {
    marketing: number;
    confirmation: number;
    fulfillment: number;
    shipping: number;
    cod: number;
    tva: number;
}

export interface DeliveryRateRow {
    home: number;
    return: number;
    maxWeightInKg: number;
    overweightTaxPerKg: number;
}

export interface CalculateProfitRateGrid {
    confirmationRates: number[];
    deliveryRates: number[];
    values: (number | null)[][];
}

export interface CalculateProfitEstimationEntry {
    value: number;
    rateGrid: CalculateProfitRateGrid;
}

export interface CalculateProfitCplEstimations {
    breakeven: CalculateProfitEstimationEntry;
    [profitUsdLabel: string]: CalculateProfitEstimationEntry;
}

export interface CalculateProfitEstimationScalars {
    [profitUsdLabel: string]: number;
}

export interface CalculateProfitSellingPricesByCpl {
    [cplLabel: string]: Record<string, CalculateProfitEstimationEntry>;
}

export interface CalculateProfitResult {
    roi: number;
    profit: number;
    investmentPerDelivered: number;
    revenueBeforeAdsPerDelivered: number;
    realRevenueAfterAdsPerDelivered: number;
    fees: CalculateProfitFees;
    estimations: {
        cpl: CalculateProfitCplEstimations;
        sellingPrices: CalculateProfitSellingPricesByCpl;
        rateGrid: CalculateProfitRateGrid;
    };
}

export interface CalculateProfitFeeInputs {
    confirmation: {
        cancelled: number;
        returned: number;
        delivered: number;
    };
    fulfillment: {
        packaged: number;
        returned: number;
        delivered: number;
    };
    shipping: {
        codPercentage: number;
        tvaPercentage: number;
        deliveryRates: DeliveryRateRow[];
    };
}

export interface CalculateProfitSnapshotInput {
    purchasePriceInUsd: number;
    sellingPriceInLocal: number;
    weightInGram: number;
    freeShipping: boolean;
    cpl: number;
    confirmationRate: number;
    deliveryRate: number;
    localToUsdRate: number;
    fees: CalculateProfitFeeInputs;
}

export interface CalculateProfitSnapshot {
    roi: number;
    profit: number;
    investmentPerDelivered: number;
    revenueBeforeAdsPerDelivered: number;
    realRevenueAfterAdsPerDelivered: number;
    fees: CalculateProfitFees;
    netRevenueUsd: number;
    fixedNonMarketingUsd: number;
}

export type CountryId = 'algeria' | 'libya' | 'iraq' | 'lebanon' | 'tunisia';

export interface CountryFeesConfig {
    usdToLocalRate: number;
    confirmation: {
        cancelled: number;
        returned: number;
        delivered: number;
    };
    fulfillment: {
        packaged: number;
        returned: number;
        delivered: number;
    };
    shipping: {
        codPercentage: number;
        tvaPercentage: number;
        home: number;
        return: number;
    };
}

export interface CountryCalculatorValues {
    purchasePriceInUsd: number;
    sellingPriceInLocal: number;
    cpl: number;
    confirmationRate: number;
    deliveryRate: number;
}

export interface CalculatorInputs extends CountryCalculatorValues {
    countryId: CountryId;
}

export type HeatmapView =
    | { type: 'profit' }
    | { type: 'cpl'; target: string }
    | { type: 'sellingPrice'; cplScenario: string; target: string };
