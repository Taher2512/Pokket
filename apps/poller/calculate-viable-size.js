import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

config();

async function calculateViableOrderSize() {
  console.log("💰 ECONOMIC VIABILITY CALCULATOR");
  console.log("═".repeat(50));

  const solPrice = 230; // Approximate current SOL price in USD

  console.log("📊 COST BREAKDOWN ANALYSIS:");
  console.log("─".repeat(30));

  // Typical cross-chain costs
  const costs = {
    solanaFee: 0.00001 * solPrice, // ~$0.002
    ethereumGas: 15, // $15 for complex contract interaction
    resolverProfit: 0.03, // 3% profit margin
    riskBuffer: 0.02, // 2% risk buffer
  };

  console.log(`💸 Solana transaction fee: ~$${costs.solanaFee.toFixed(3)}`);
  console.log(`⛽ Ethereum gas (complex): ~$${costs.ethereumGas}`);
  console.log(`💰 Resolver profit (3%): Variable`);
  console.log(`🛡️ Risk buffer (2%): Variable`);

  const fixedCosts = costs.solanaFee + costs.ethereumGas;
  console.log(`\n🔧 Fixed costs: ~$${fixedCosts.toFixed(2)}`);

  // Calculate minimum viable order sizes
  const profitMargin = costs.resolverProfit + costs.riskBuffer; // 5% total
  const minOrderUSD = fixedCosts / (1 - profitMargin); // Break-even point

  console.log(`\n📈 MINIMUM VIABLE ORDER SIZES:`);
  console.log(`• Break-even: $${minOrderUSD.toFixed(2)}`);
  console.log(`• Conservative: $${(minOrderUSD * 1.5).toFixed(2)}`);
  console.log(`• Safe: $${(minOrderUSD * 2).toFixed(2)}`);

  const minSOL = minOrderUSD / solPrice;
  const conservativeSOL = (minOrderUSD * 1.5) / solPrice;
  const safeSOL = (minOrderUSD * 2) / solPrice;

  console.log(`\n🪙 IN SOL TERMS (at $${solPrice}):`);
  console.log(`• Break-even: ${minSOL.toFixed(4)} SOL`);
  console.log(`• Conservative: ${conservativeSOL.toFixed(4)} SOL`);
  console.log(`• Safe: ${safeSOL.toFixed(4)} SOL`);

  console.log(`\n❌ OUR CURRENT ORDERS:`);
  console.log(`• Amount: ~0.024 SOL (~$${(0.024 * solPrice).toFixed(2)})`);
  console.log(`• Status: TOO SMALL! Not profitable for resolvers`);

  console.log(`\n✅ RECOMMENDED TEST AMOUNT:`);
  const testSOL = Math.max(0.1, safeSOL);
  console.log(
    `• Test with: ${testSOL.toFixed(3)} SOL (~$${(testSOL * solPrice).toFixed(2)})`
  );
  console.log(`• This should be profitable for resolvers`);

  return testSOL;
}

calculateViableOrderSize().catch(console.error);
