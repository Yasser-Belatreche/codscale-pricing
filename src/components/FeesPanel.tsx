import type { ReactNode } from 'react';
import { NumberInput } from './Inputs';
import { Panel } from './DualCurrency';
import type { CountryFeesConfig } from '../lib/types';
import { getCountryMeta } from '../lib/countries';

interface FeesPanelProps {
    fees: CountryFeesConfig;
    countryId: Parameters<typeof getCountryMeta>[0];
    onChange: (fees: CountryFeesConfig) => void;
}

function FeeGroup({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <h3 className="mb-3 text-xs font-medium text-white">{title}</h3>
            <div className="grid gap-3 sm:grid-cols-3">{children}</div>
        </div>
    );
}

export function FeesPanel({ fees, countryId, onChange }: FeesPanelProps) {
    const { currency } = getCountryMeta(countryId);

    const patch = (partial: Partial<CountryFeesConfig>) => {
        onChange({ ...fees, ...partial });
    };

    return (
        <Panel title="Service fees & exchange rate">
            <p className="mb-4 text-xs text-[var(--color-muted)]">
                Fees are entered in {currency}. They are converted to USD internally using the
                exchange rate below.
            </p>

            <div className="mb-4">
                <NumberInput
                    label={`Exchange rate (1 USD = ? ${currency})`}
                    value={fees.usdToLocalRate}
                    onChange={v => patch({ usdToLocalRate: v })}
                    suffix={currency}
                    step={countryId === 'lebanon' || countryId === 'iraq' ? 100 : 0.01}
                    min={0.0001}
                />
            </div>

            <div className="space-y-3">
                <FeeGroup title={`Confirmation fees (${currency})`}>
                    <NumberInput
                        label="Cancelled"
                        value={fees.confirmation.cancelled}
                        onChange={v =>
                            patch({
                                confirmation: { ...fees.confirmation, cancelled: v },
                            })
                        }
                        suffix={currency}
                    />
                    <NumberInput
                        label="Returned"
                        value={fees.confirmation.returned}
                        onChange={v =>
                            patch({
                                confirmation: { ...fees.confirmation, returned: v },
                            })
                        }
                        suffix={currency}
                    />
                    <NumberInput
                        label="Delivered"
                        value={fees.confirmation.delivered}
                        onChange={v =>
                            patch({
                                confirmation: { ...fees.confirmation, delivered: v },
                            })
                        }
                        suffix={currency}
                    />
                </FeeGroup>

                <FeeGroup title={`Fulfilment fees (${currency})`}>
                    <NumberInput
                        label="Packaged"
                        value={fees.fulfillment.packaged}
                        onChange={v =>
                            patch({
                                fulfillment: { ...fees.fulfillment, packaged: v },
                            })
                        }
                        suffix={currency}
                    />
                    <NumberInput
                        label="Returned"
                        value={fees.fulfillment.returned}
                        onChange={v =>
                            patch({
                                fulfillment: { ...fees.fulfillment, returned: v },
                            })
                        }
                        suffix={currency}
                    />
                    <NumberInput
                        label="Delivered"
                        value={fees.fulfillment.delivered}
                        onChange={v =>
                            patch({
                                fulfillment: { ...fees.fulfillment, delivered: v },
                            })
                        }
                        suffix={currency}
                    />
                </FeeGroup>

                <FeeGroup title={`Shipping fees (${currency})`}>
                    <NumberInput
                        label="Outbound (home)"
                        value={fees.shipping.home}
                        onChange={v =>
                            patch({
                                shipping: { ...fees.shipping, home: v },
                            })
                        }
                        suffix={currency}
                    />
                    <NumberInput
                        label="Return"
                        value={fees.shipping.return}
                        onChange={v =>
                            patch({
                                shipping: { ...fees.shipping, return: v },
                            })
                        }
                        suffix={currency}
                    />
                    <NumberInput
                        label="COD %"
                        value={fees.shipping.codPercentage}
                        onChange={v =>
                            patch({
                                shipping: { ...fees.shipping, codPercentage: v },
                            })
                        }
                        suffix="%"
                        step={0.1}
                    />
                    <NumberInput
                        label="TVA %"
                        value={fees.shipping.tvaPercentage}
                        onChange={v =>
                            patch({
                                shipping: { ...fees.shipping, tvaPercentage: v },
                            })
                        }
                        suffix="%"
                        step={0.1}
                    />
                </FeeGroup>
            </div>
        </Panel>
    );
}
