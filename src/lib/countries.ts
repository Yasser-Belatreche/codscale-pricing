import type { CountryFeesConfig, CountryId } from './types';

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
    { id: 'lebanon', name: 'Lebanon', currency: 'LBP', flag: '🇱🇧' },
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
        usdToLocalRate: 89500,
        confirmation: { cancelled: 9000, returned: 15000, delivered: 25000 },
        fulfillment: { packaged: 45000, returned: 35000, delivered: 18000 },
        shipping: { codPercentage: 0, tvaPercentage: 11, home: 300000, return: 150000 },
    },
};

export function getCountryMeta(id: CountryId): CountryMeta {
    return COUNTRIES.find(c => c.id === id) ?? COUNTRIES[0];
}
