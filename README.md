# COD Scale Profit Calculator

Interactive COD profit calculator for Algeria, Libya, Iraq, and Lebanon.

## Features

- Real-time profit, ROI, and fee breakdown
- Sliders for CPL, confirmation rate, and delivery rate
- Service fees entered in **local currency** (converted to USD via exchange rate)
- Configurable exchange rate per country (`1 USD = X local`)
- Dual-currency outputs (USD + local) for all USD-denominated values
- 20×20 sensitivity heatmaps (profit, max CPL, selling price)
- Fees and inputs persisted in `localStorage` per browser session

## Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm run build
```

Connect the repo to Vercel — framework preset: **Vite**, output directory: `dist`.

Or:

```bash
npx vercel
```

## Fixed assumptions

- Free shipping: always on
- Weight: 1g (no overweight tax)
- Math mirrors `codscale-backend` `calculate-profit-math.ts`
