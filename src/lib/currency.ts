export function localToUsdRate(usdToLocalRate: number): number {
    if (usdToLocalRate <= 0) {
        return 0;
    }
    return 1 / usdToLocalRate;
}

export function localToUsd(local: number, usdToLocalRate: number): number {
    const rate = localToUsdRate(usdToLocalRate);
    return Number((local * rate).toFixed(4));
}

export function usdToLocal(usd: number, usdToLocalRate: number): number {
    return Number((usd * usdToLocalRate).toFixed(2));
}

const LOCAL_FRACTION_DIGITS: Record<string, number> = {
    TND: 3,
};

export function formatLocal(amount: number, currency: string): string {
    if (currency === 'USD') {
        return formatUsd(amount);
    }
    const maximumFractionDigits = LOCAL_FRACTION_DIGITS[currency] ?? 0;
    return `${amount.toLocaleString(undefined, { maximumFractionDigits })} ${currency}`;
}

export function isUsdCurrency(currency: string): boolean {
    return currency === 'USD';
}

export function formatUsd(amount: number): string {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDualUsd(
    usd: number,
    usdToLocalRate: number,
    currency: string,
): { usd: string; local: string } {
    return {
        usd: formatUsd(usd),
        local: formatLocal(usdToLocal(usd, usdToLocalRate), currency),
    };
}
