import { DEFAULT_CALCULATOR_VALUES, DEFAULT_FEES } from './countries';
import type {
    CalculatorInputs,
    CountryCalculatorValues,
    CountryFeesConfig,
    CountryId,
} from './types';

const FEES_KEY = 'codscale-pricing-fees-v2';
const INPUTS_KEY = 'codscale-pricing-inputs-v2';
const LEGACY_INPUTS_KEY = 'codscale-pricing-inputs';

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

interface StoredCalculatorState {
    selectedCountry: CountryId;
    byCountry: Record<CountryId, CountryCalculatorValues>;
}

function migrateLegacyInputs(): StoredCalculatorState | null {
    try {
        const raw = localStorage.getItem(LEGACY_INPUTS_KEY);
        if (!raw) {
            return null;
        }
        const legacy = JSON.parse(raw) as CalculatorInputs;
        const values: CountryCalculatorValues = {
            purchasePriceInUsd: legacy.purchasePriceInUsd,
            sellingPriceInLocal: legacy.sellingPriceInLocal,
            cpl: legacy.cpl,
            confirmationRate: legacy.confirmationRate,
            deliveryRate: legacy.deliveryRate,
        };
        const byCountry = structuredClone(DEFAULT_CALCULATOR_VALUES);
        byCountry[legacy.countryId ?? 'algeria'] = values;
        return {
            selectedCountry: legacy.countryId ?? 'algeria',
            byCountry,
        };
    } catch {
        return null;
    }
}

function normalizeCalculatorState(raw: Partial<StoredCalculatorState>): StoredCalculatorState {
    const base = structuredClone(DEFAULT_CALCULATOR_VALUES);
    const byCountry = { ...base };

    if (raw.byCountry) {
        for (const countryId of Object.keys(base) as CountryId[]) {
            const stored = raw.byCountry[countryId];
            if (stored) {
                byCountry[countryId] = { ...base[countryId], ...stored };
            }
        }
    }

    return {
        selectedCountry: raw.selectedCountry ?? 'algeria',
        byCountry,
    };
}

export function loadCalculatorState(): StoredCalculatorState {
    try {
        const raw = localStorage.getItem(INPUTS_KEY);
        if (raw) {
            return normalizeCalculatorState(JSON.parse(raw));
        }
        const legacy = migrateLegacyInputs();
        if (legacy) {
            return legacy;
        }
    } catch {
        // fall through
    }

    return {
        selectedCountry: 'algeria',
        byCountry: structuredClone(DEFAULT_CALCULATOR_VALUES),
    };
}

export function saveCalculatorState(state: StoredCalculatorState): void {
    localStorage.setItem(INPUTS_KEY, JSON.stringify(state));
}

export function toCalculatorInputs(state: StoredCalculatorState): CalculatorInputs {
    return {
        countryId: state.selectedCountry,
        ...state.byCountry[state.selectedCountry],
    };
}
