# Web3 Asset Dashboard

A clean, production-ready Web3 dApp that allows users to connect their wallet, view native balances, ERC-20 tokens, and NFTs across Ethereum, Polygon, and BNB Chain.

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi v2, Viem, RainbowKit
- **Data**: Alchemy SDK

## Setup Instructions

### Prerequisites
- Node.js 18+ (20+ recommended)
- NPM or Yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your keys:
   - `NEXT_PUBLIC_ALCHEMY_API_KEY`: Get from [Alchemy Dashboard](https://dashboard.alchemy.com/)
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)

### Running Locally

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Extensibility Notes

### Adding More Chains
1. Open `src/lib/config.ts` and add the chain from `wagmi/chains`.
2. Open `src/services/AlchemyProvider.ts` and update `CHAIN_TO_NETWORK` map to include the new chain ID and its corresponding Alchemy Network.

### Adding More Asset Types
1. Update `WalletAssets` interface in `src/services/types.ts`.
2. Fetch the new data in `AlchemyDataService.getAssets`.
3. Add a new tab/section in `AssetDashboard.tsx` to display it.

### Switching Data Providers
1. Create a new class implementing `IBlockchainDataService` (e.g., `MoralisDataService`).
2. Update the instantiation in `AssetDashboard.tsx` (or inject via context).
