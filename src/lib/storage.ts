import { DEFAULT_FEES } from './countries';
import type { CalculatorInputs, CountryFeesConfig, CountryId } from './types';

const FEES_KEY = 'codscale-pricing-fees-v2';
const INPUTS_KEY = 'codscale-pricing-inputs';

function migrateFees(raw: Record<string, CountryFeesConfig>): Record<CountryId, CountryFeesConfig> {
    const base = structuredClone(DEFAULT_FEES);
    for (const countryId of Object.keys(base) as CountryId[]) {
        const stored = raw[countryId];
        if (!stored) {
            continue;
        }
        if ('usdToLocalRate' in stored && stored.usdToLocalRate > 0) {
            base[countryId] = { ...base[countryId], ...stored };
            continue;
        }
        const legacy = stored as CountryFeesConfig & { localToUsdRate?: number };
        if (legacy.localToUsdRate && legacy.localToUsdRate > 0) {
            base[countryId] = {
                ...base[countryId],
                ...stored,
                usdToLocalRate: 1 / legacy.localToUsdRate,
            };
        }
    }
    return base;
}

export function loadFees(): Record<CountryId, CountryFeesConfig> {
    try {
        const raw = localStorage.getItem(FEES_KEY);
        if (!raw) {
            return structuredClone(DEFAULT_FEES);
        }
        return migrateFees(JSON.parse(raw));
    } catch {
        return structuredClone(DEFAULT_FEES);
    }
}

export function saveFees(fees: Record<CountryId, CountryFeesConfig>): void {
    localStorage.setItem(FEES_KEY, JSON.stringify(fees));
}

const DEFAULT_INPUTS: CalculatorInputs = {
    countryId: 'algeria',
    purchasePriceInUsd: 5,
    sellingPriceInLocal: 2500,
    cpl: 1.5,
    confirmationRate: 60,
    deliveryRate: 70,
};

export function loadInputs(): CalculatorInputs {
    try {
        const raw = localStorage.getItem(INPUTS_KEY);
        if (!raw) {
            return DEFAULT_INPUTS;
        }
        return { ...DEFAULT_INPUTS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_INPUTS;
    }
}

export function saveInputs(inputs: CalculatorInputs): void {
    localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));
}
