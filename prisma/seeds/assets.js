const assets = [
  {
    symbol: "VET",
    name: "VeChain",
    contractAddress: "0x0000000000000000000000000000000000000000",
    network: "VECHAIN",
    coingeckoId: "vechain",
    decimals: 18,
  },
  {
    symbol: "VTHO",
    name: "VeThor Token",
    contractAddress: "0x0000000000000000000000000000456e65726779",
    network: "VECHAIN",
    coingeckoId: "vethor-token",
    decimals: 18,
  },
  {
    symbol: "B3TR",
    name: "VeBetterDAO",
    contractAddress: "0x5ef79995FE8a89e0812330E4378eB2660ceDe699",
    network: "VECHAIN",
    coingeckoId: "vebetterdao",
    decimals: 18,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    contractAddress: "0x0000000000000000000000000000000000000000",
    network: "ETHEREUM",
    coingeckoId: "ethereum",
    decimals: 18,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    network: "ETHEREUM",
    coingeckoId: "tether",
    decimals: 6,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    network: "ETHEREUM",
    coingeckoId: "usd-coin",
    decimals: 6,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    contractAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
    network: "ETHEREUM",
    coingeckoId: "dai",
    decimals: 18,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    contractAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    network: "ETHEREUM",
    coingeckoId: "bitcoin",
    decimals: 8,
  },
  {
    symbol: "EUR",
    name: "Euro",
    contractAddress: "0x0000000000000000000000000000000000000001",
    network: "FIAT",
    coingeckoId: "euro",
    decimals: 2,
  },
  {
    symbol: "GBP",
    name: "British Pound",
    contractAddress: "0x0000000000000000000000000000000000000002",
    network: "FIAT",
    coingeckoId: "british-pound",
    decimals: 2,
  },
  {
    symbol: "USD",
    name: "United States Dollar",
    contractAddress: "0x00000000000000000000000000000000000000003",
    network: "FIAT",
    coingeckoId: "united-states-dollar",
    decimals: 2,
  },
];

async function seedAssets(prisma) {
  console.log('Start seeding assets...');
  
  for (const asset of assets) {
    const result = await prisma.asset.upsert({
      where: {
        symbol_network: {
          symbol: asset.symbol,
          network: asset.network,
        },
      },
      update: {},
      create: asset,
    });
    console.log(`Created asset ${result.symbol} (${result.network})`);
  }
}

module.exports = seedAssets; 