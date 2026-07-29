import type { CountryCalculatorValues, CountryFeesConfig, CountryId } from './types';

export interface CountryMeta {
    id: CountryId;
    name: string;
    currency: string;
    flag: string;
}

export const COUNTRIES: CountryMeta[] = [
    { id: 'algeria', name: 'Algeria', currency: 'DZD', flag: '🇩🇿' },
    { id: 'libya', name: 'Libya', currency: 'LYD', flag: '🇱🇾' },
    { id: 'iraq', name: 'Iraq', currency: 'IQD', flag: '🇮🇶' },
    { id: 'lebanon', name: 'Lebanon', currency: 'USD', flag: '🇱🇧' },
];

export const DEFAULT_FEES: Record<CountryId, CountryFeesConfig> = {
    algeria: {
        usdToLocalRate: 135,
        confirmation: { cancelled: 15, returned: 25, delivered: 40 },
        fulfillment: { packaged: 65, returned: 50, delivered: 25 },
        shipping: { codPercentage: 2, tvaPercentage: 19, home: 450, return: 220 },
    },
    libya: {
        usdToLocalRate: 4.85,
        confirmation: { cancelled: 0.5, returned: 1, delivered: 1.5 },
        fulfillment: { packaged: 2.5, returned: 2, delivered: 1 },
        shipping: { codPercentage: 0, tvaPercentage: 0, home: 20, return: 10 },
    },
    iraq: {
        usdToLocalRate: 1310,
        confirmation: { cancelled: 150, returned: 250, delivered: 400 },
        fulfillment: { packaged: 650, returned: 500, delivered: 250 },
        shipping: { codPercentage: 0, tvaPercentage: 0, home: 4000, return: 2000 },
    },
    lebanon: {
        usdToLocalRate: 1,
        confirmation: { cancelled: 0.1, returned: 0.2, delivered: 0.3 },
        fulfillment: { packaged: 0.5, returned: 0.4, delivered: 0.2 },
        shipping: { codPercentage: 0, tvaPercentage: 11, home: 3.5, return: 1.5 },
    },
};

export function getCountryMeta(id: CountryId): CountryMeta {
    return COUNTRIES.find(c => c.id === id) ?? COUNTRIES[0];
}

export const DEFAULT_CALCULATOR_VALUES: Record<CountryId, CountryCalculatorValues> = {
    algeria: {
        purchasePriceInUsd: 5,
        sellingPriceInLocal: 2500,
        cpl: 1.5,
        confirmationRate: 60,
        deliveryRate: 70,
    },
    libya: {
        purchasePriceInUsd: 5,
        sellingPriceInLocal: 90,
        cpl: 1.5,
        confirmationRate: 60,
        deliveryRate: 70,
    },
    iraq: {
        purchasePriceInUsd: 5,
        sellingPriceInLocal: 6500,
        cpl: 1.5,
        confirmationRate: 60,
        deliveryRate: 70,
    },
    lebanon: {
        purchasePriceInUsd: 5,
        sellingPriceInLocal: 25,
        cpl: 1.5,
        confirmationRate: 60,
        deliveryRate: 70,
    },
};
