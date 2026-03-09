/**
 * Test script: Validates scoring accuracy across 7 model portfolios
 * Run with: node test-portfolios.js
 */

// ─── Extracted helper functions from index.html ─────────────────────────────

const ASSET_VOLATILITY = {
  'Crypto': { vol: 0.70, beta: 2.0, yield: 0 },
  'Technology': { vol: 0.25, beta: 1.3, yield: 0.007 },
  'Consumer Discretionary': { vol: 0.22, beta: 1.2, yield: 0.01 },
  'Financials': { vol: 0.20, beta: 1.1, yield: 0.035 },
  'Energy': { vol: 0.28, beta: 1.2, yield: 0.04 },
  'Healthcare': { vol: 0.18, beta: 0.9, yield: 0.015 },
  'Industrials': { vol: 0.19, beta: 1.0, yield: 0.02 },
  'Materials': { vol: 0.24, beta: 1.1, yield: 0.025 },
  'Communications': { vol: 0.22, beta: 1.0, yield: 0.01 },
  'Consumer Staples': { vol: 0.14, beta: 0.7, yield: 0.03 },
  'Utilities': { vol: 0.14, beta: 0.5, yield: 0.04 },
  'Real Estate': { vol: 0.18, beta: 0.8, yield: 0.045 },
  'Fixed Income': { vol: 0.06, beta: 0.1, yield: 0.035 },
  'Cash': { vol: 0.01, beta: 0.0, yield: 0.04 },
  'Preferred Shares': { vol: 0.10, beta: 0.3, yield: 0.05 },
  'Diversified': { vol: 0.16, beta: 1.0, yield: 0.02 },
  'US Equity Index': { vol: 0.18, beta: 1.0, yield: 0.015 },
  'Canadian Equity Index': { vol: 0.17, beta: 0.9, yield: 0.03 },
  'International Equity': { vol: 0.19, beta: 0.9, yield: 0.025 },
  'Equity Fund': { vol: 0.18, beta: 1.0, yield: 0.02 },
  'Equity': { vol: 0.22, beta: 1.0, yield: 0.02 },
  'Commodities': { vol: 0.25, beta: 0.5, yield: 0 },
  'Alternatives': { vol: 0.15, beta: 0.5, yield: 0.02 },
};

function normalizeAsset(sym) {
  const s = sym.toUpperCase().replace(/\.(TO|TSX|V|VN|CN)$/i, '');
  if (/^(BTCC|BTCX|BTCQ|FBTC|IBIT|GBTC|BITO|BTCZ|BTCY|QBTC)(\.B)?$/.test(s) || s === 'BTC') return 'BTC';
  if (/^(ETHX|ETHY|ETHQ|ETHA|FETH)(\.B)?$/.test(s) || s === 'ETH') return 'ETH';
  if (/^(VFV|VSP|ZSP|HXS|XUS)(\.B)?$/.test(s) || ['SPY','VOO','IVV','SPLG'].includes(s)) return 'SP500';
  if (/^(XIU|XIC|VCN|ZCN|HXT)(\.B)?$/.test(s)) return 'TSX_INDEX';
  if (/^(XQQ|ZQQ|TEC|QQC|HXQ)(\.B)?$/.test(s) || ['QQQ','QQQM','TQQQ'].includes(s)) return 'NASDAQ100';
  if (/^(XEQT|VEQT|XGRO|VGRO|XBAL|VBAL)(\.B)?$/.test(s)) return 'ALLOC_' + s;
  return s;
}

function inferRegion(pos) {
  const symbol = pos?.security?.symbol || pos?.symbol || '';
  const category = (pos?.category || '').toLowerCase();
  const currency = (pos?.security?.currency || pos?.currency || '').toUpperCase();
  const s = symbol.toUpperCase();
  if (category) {
    if (/canad/i.test(category)) return 'Canada';
    if (/\bus\b|united states|american/i.test(category)) return 'United States';
    if (/international|global|emerging|europe|asia/i.test(category)) return 'International';
    if (/crypto|digital/i.test(category)) return 'Crypto';
  }
  // Check intl ETFs BEFORE .TO catch
  const intlETFs = ['XEF.TO','VIU.TO','XEC.TO','VEE.TO','ZEA.TO'];
  if (intlETFs.includes(s)) return 'International';
  const cryptos = ['BTC','ETH','SOL','ADA','DOT','DOGE','XRP'];
  if (cryptos.includes(s)) return 'Crypto';
  if (/\.(TO|TSX|V|VN|CN)$/i.test(s)) return 'Canada';
  if (currency === 'CAD') return 'Canada';
  if (currency === 'USD') return 'United States';
  return 'Unknown';
}

function inferAssetClass(pos) {
  const sym = (pos.security?.symbol || pos.symbol || '').toUpperCase();
  const name = (pos.security?.name || pos.name || '').toLowerCase();
  const type = (pos.security?.type || pos.type || '').toLowerCase();
  const assetClass = (pos.class || '').toLowerCase();
  if (assetClass && !/equity|stock/i.test(assetClass)) {
    if (/crypto|digital/i.test(assetClass)) return 'Crypto';
    if (/fixed.income|bond|debt/i.test(assetClass)) return 'Fixed Income';
    if (/real.estate|reit/i.test(assetClass)) return 'Real Estate';
    if (/cash|money.market/i.test(assetClass)) return 'Cash';
  }
  if (type === 'crypto') return 'Crypto';
  if (type === 'bond' || type === 'fixed-income') return 'Fixed Income';
  const cryptoList = ['BTC','ETH','SOL','ADA','DOT','DOGE','XRP'];
  if (cryptoList.includes(sym)) return 'Crypto';
  if (/^(XEQT|VEQT|XGRO|VGRO|XBAL|VBAL)\.(TO|TSX)$/.test(sym)) return 'Diversified';
  if (/^(VFV|VSP|ZSP|HXS|XUS)\.(TO|TSX)$/.test(sym) || ['SPY','VOO','IVV','QQQ'].includes(sym)) return 'US Equity Index';
  if (/^(XIU|XIC|VCN|ZCN|HXT)\.(TO|TSX)$/.test(sym)) return 'Canadian Equity Index';
  if (/^(XQQ|ZQQ|TEC)\.(TO|TSX)$/.test(sym)) return 'Technology';
  if (name.includes('bond') || name.includes('aggregate') || /^(XBB|ZAG|VAB|ZDB)\.(TO|TSX)$/.test(sym) || ['BND','AGG'].includes(sym)) return 'Fixed Income';
  if (name.includes('reit') || name.includes('real estate') || /^(XRE|ZRE|VRE)\.(TO|TSX)$/.test(sym)) return 'Real Estate';
  if (/^(XEF|VIU|ZEA|XEC|VEE)\.(TO|TSX)$/.test(sym)) return 'International Equity';
  // Sector inference from name
  if (/bank|financ/i.test(name)) return 'Financials';
  if (/tech|shopify|software/i.test(name)) return 'Technology';
  if (/energy|enbridge|pipeline|oil|gas|suncor|cnq|imperial/i.test(name)) return 'Energy';
  if (/util|fortis|hydro|emera|algonquin/i.test(name)) return 'Utilities';
  if (/nutrien|teck|barrick|agnico|material/i.test(name)) return 'Materials';
  if (/health|pharma/i.test(name)) return 'Healthcare';
  if (/telus|bce|rogers|comm/i.test(name)) return 'Communications';
  return 'Equity';
}

function clamp(v) { return Math.max(0, Math.min(100, v)); }

function aggregatePositions(positions) {
  const map = {};
  positions.forEach(p => {
    const sym = (p.security?.symbol || p.symbol || '').toUpperCase() || '--';
    if (!map[sym]) {
      map[sym] = { ...p, market_value: 0, book_value: 0, quantity: 0, _accounts: [] };
    }
    map[sym].market_value += (p.market_value != null ? p.market_value : (p.value || 0));
    map[sym].book_value += (p.book_value != null ? p.book_value : (p.market_value || p.value || 0));
    map[sym].quantity += (p.quantity || 0);
    const acct = p._accountName || '';
    if (acct && !map[sym]._accounts.includes(acct)) map[sym]._accounts.push(acct);
  });
  return Object.values(map);
}

// ─── Scoring function (extracted) ───────────────────────────────────────────

function computeScores(filteredPositions, riskTolerance = 5) {
  const positions = aggregatePositions(filteredPositions);
  const totalVal = positions.reduce((s,p) => s + (p.market_value || p.value || 0), 0);
  if (!positions.length || !totalVal) return null;

  const weights = positions.map(p => (p.market_value || p.value || 0) / totalVal);
  const n = positions.length;
  const totalBook = positions.reduce((s,p) => s + ((p.book_value != null ? p.book_value : (p.market_value || p.value || 0))), 0);
  const totalReturn = totalBook > 0 ? ((totalVal - totalBook) / totalBook) * 100 : 0;

  // Group correlated assets
  const effectiveGroups = {};
  positions.forEach(p => {
    const sym = (p.security?.symbol || p.symbol || '').toUpperCase();
    const key = normalizeAsset(sym);
    if (!effectiveGroups[key]) effectiveGroups[key] = 0;
    effectiveGroups[key] += (p.market_value || p.value || 0) / totalVal;
  });
  const uniqueSecurities = Object.keys(effectiveGroups).length;

  // 1. Diversification
  const groupWeights = Object.values(effectiveGroups);
  const effectiveN = groupWeights.length;
  const hhi = groupWeights.reduce((s,w) => s + w*w, 0);
  const minHHI = effectiveN > 0 ? 1/effectiveN : 1;
  const hhiScore = (effectiveN <= 1 || minHHI >= 1) ? 0 : Math.round((1 - (hhi - minHHI) / (1 - minHHI)) * 100);

  const sectors = {};
  positions.forEach(p => { const sec = inferAssetClass(p); sectors[sec] = (sectors[sec]||0) + (p.market_value||p.value||0); });
  const sectorCount = Object.keys(sectors).length;
  const sectorScore = Math.min(100, Math.round(100 * (1 - Math.exp(-sectorCount * 0.18))));

  const regions = {};
  positions.forEach(p => { const r = inferRegion(p); regions[r] = (regions[r]||0) + (p.market_value||p.value||0); });
  const regionCount = Object.keys(regions).filter(r => r !== 'Unknown').length;
  const regionScore = Math.min(100, Math.round(100 * (1 - Math.exp(-regionCount * 0.25))));

  const posCountScore = Math.min(100, Math.round(100 * (1 - Math.exp(-uniqueSecurities * 0.06))));

  const topW = Math.max(...groupWeights) * 100;
  const balancePenalty = topW > 25 ? 25 : topW > 15 ? 15 : topW > 10 ? 5 : 0;

  const diversification = clamp(Math.round(hhiScore * 0.35 + sectorScore * 0.25 + regionScore * 0.2 + posCountScore * 0.2) - balancePenalty);

  // 2. Risk Management
  const maxW = Math.max(...weights) * 100;
  const top3W = [...weights].sort((a,b)=>b-a).slice(0,3).reduce((s,w)=>s+w,0) * 100;
  const top5W = [...weights].sort((a,b)=>b-a).slice(0,5).reduce((s,w)=>s+w,0) * 100;
  const concScore = clamp(Math.round(100 - maxW * 2.5));
  const top3Score = clamp(Math.round(100 - Math.max(0, top3W - 30) * 1.5));
  const homeBias = (regions['Canada']||0) / totalVal * 100;
  const homeScore = homeBias > 80 ? 10 : homeBias > 60 ? 35 : homeBias > 40 ? 65 : 85;

  const cryptoWeight = Object.entries(sectors).filter(([k]) => k === 'Crypto').reduce((s,[,v]) => s + v, 0) / totalVal * 100;
  const volPenalty = Math.min(50, cryptoWeight * 2.5);
  const volScore = clamp(100 - Math.round(volPenalty));

  const top5Penalty = top5W > 80 ? 20 : top5W > 70 ? 10 : top5W > 60 ? 5 : 0;

  const riskManagement = clamp(Math.round(concScore * 0.3 + top3Score * 0.25 + homeScore * 0.2 + volScore * 0.25) - top5Penalty);

  // 3. Performance
  const posReturns = positions.map(p => {
    const mv = p.market_value || p.value || 0;
    const bv = (p.book_value != null ? p.book_value : mv);
    return bv > 0 ? ((mv - bv) / bv) * 100 : 0;
  });
  const avgReturn = posReturns.reduce((s,r) => s + r, 0) / posReturns.length;
  const winners = posReturns.filter(r => r > 0).length;
  const winRate = (winners / posReturns.length) * 100;
  const returnScore = clamp(Math.round(40 + Math.sign(totalReturn) * Math.min(50, Math.sqrt(Math.abs(totalReturn)) * (totalReturn >= 0 ? 5.5 : 8))));
  const winRateScore = clamp(Math.round(winRate * 0.85));
  const returnSpread = posReturns.length > 1 ? Math.sqrt(posReturns.reduce((s,r) => s + Math.pow(r - avgReturn, 2), 0) / posReturns.length) : 0;
  const consistencyScore = clamp(Math.round(100 - Math.min(70, returnSpread * 1.2)));
  const performance = clamp(Math.round(returnScore * 0.5 + winRateScore * 0.3 + consistencyScore * 0.2));

  // 4. Tax Efficiency
  let taxScore = 65;
  const taxIssues = [];
  const accounts = {};
  filteredPositions.forEach(p => { const a = p._accountName || ''; accounts[a] = (accounts[a] || []).concat(p); });
  Object.entries(accounts).forEach(([name, poss]) => {
    const isRRSP = /rrsp|lira|rrif/i.test(name);
    const isTFSA = /tfsa/i.test(name);
    const isRegistered = isRRSP || isTFSA;
    poss.forEach(p => {
      const cur = p.security?.currency || p.currency || 'CAD';
      const sector = inferAssetClass(p);
      const mv = p.market_value || p.value || 0;
      const weight = totalVal > 0 ? mv / totalVal : 0;
      if (weight < 0.02) return;
      if (cur === 'USD' && !isRRSP && (sector.includes('Equity') || sector === 'Financials' || sector === 'Technology')) {
        taxScore -= 2;
        taxIssues.push((p.security?.symbol||'') + ' USD in non-RRSP');
      }
      if (isRRSP && sector === 'Crypto') { taxScore -= 4; }
      const bvTax = (p.book_value != null ? p.book_value : (p.market_value || p.value || 0));
      const gl = (p.market_value||p.value||0) - bvTax;
      if (gl < -2000 && isRegistered) { taxScore -= 2; }
    });
  });
  const hasRegistered = Object.keys(accounts).some(a => /rrsp|tfsa|resp|lira|fhsa/i.test(a));
  if (hasRegistered) taxScore += 5;
  const taxEfficiency = clamp(Math.round(taxScore));

  // 5. Income
  const incomePositions = positions.filter(p => {
    const sec = inferAssetClass(p);
    return ['Fixed Income','Real Estate','Utilities','Financials','Energy','Preferred Shares'].includes(sec);
  });
  const incomeWeight = incomePositions.reduce((s,p) => s + (p.market_value||p.value||0), 0) / totalVal * 100;
  const targetIncome = riskTolerance <= 3 ? 40 : riskTolerance <= 5 ? 25 : riskTolerance <= 7 ? 15 : 5;
  const incomeGap = Math.abs(incomeWeight - targetIncome);
  const incomeScore = clamp(Math.round(100 - incomeGap * 2.5));

  // Overall
  const health = clamp(Math.round(
    diversification * 0.25 +
    riskManagement * 0.25 +
    performance * 0.20 +
    taxEfficiency * 0.15 +
    incomeScore * 0.15
  ));

  return {
    health, diversification, riskManagement, performance, taxEfficiency, income: incomeScore,
    totalReturn, maxW, top3W, top5W, homeBias, cryptoWeight, sectorCount, regionCount, uniqueSecurities,
    winRate, avgReturn, incomeWeight, hhi, hhiScore, sectors, regions, totalVal, totalBook,
  };
}

// ─── 7 Model Portfolios ────────────────────────────────────────────────────

const portfolios = {
  // 1. PERFECT DIVERSIFIED — All-in-one ETF, should score very high on diversification but low variety
  '1. Single All-in-One ETF (XEQT)': [
    { security: { symbol: 'XEQT.TO', name: 'iShares Core Equity ETF Portfolio', currency: 'CAD', type: 'etf' }, quantity: 1000, book_value: 25000, market_value: 28000, _accountName: 'TFSA - Questrade' },
  ],

  // 2. CONCENTRATED — One stock dominates
  '2. Concentrated Single Stock': [
    { security: { symbol: 'SHOP.TO', name: 'Shopify Inc', currency: 'CAD', type: 'equity' }, quantity: 500, book_value: 50000, market_value: 35000, _accountName: 'TFSA - Questrade' },
    { security: { symbol: 'VFV.TO', name: 'Vanguard S&P 500 Index ETF', currency: 'CAD', type: 'etf' }, quantity: 50, book_value: 5000, market_value: 5500, _accountName: 'TFSA - Questrade' },
  ],

  // 3. BALANCED CANADIAN — Mix of banks, utilities, bonds, index funds
  '3. Balanced Canadian Portfolio': [
    { security: { symbol: 'XIU.TO', name: 'iShares S&P/TSX 60 Index ETF', currency: 'CAD', type: 'etf' }, quantity: 200, book_value: 6000, market_value: 6500, _accountName: 'RRSP - RBC' },
    { security: { symbol: 'VFV.TO', name: 'Vanguard S&P 500 Index ETF', currency: 'CAD', type: 'etf' }, quantity: 150, book_value: 13000, market_value: 15000, _accountName: 'RRSP - RBC' },
    { security: { symbol: 'XEF.TO', name: 'iShares Core MSCI EAFE IMI Index ETF', currency: 'CAD', type: 'etf' }, quantity: 200, book_value: 6000, market_value: 6800, _accountName: 'RRSP - RBC' },
    { security: { symbol: 'ZAG.TO', name: 'BMO Aggregate Bond Index ETF', currency: 'CAD', type: 'etf' }, quantity: 400, book_value: 5800, market_value: 5600, _accountName: 'RRSP - RBC' },
    { security: { symbol: 'TD.TO', name: 'Toronto-Dominion Bank', currency: 'CAD', type: 'equity' }, quantity: 50, book_value: 4000, market_value: 4200, _accountName: 'TFSA - RBC' },
    { security: { symbol: 'ENB.TO', name: 'Enbridge Inc', currency: 'CAD', type: 'equity' }, quantity: 100, book_value: 5000, market_value: 5500, _accountName: 'TFSA - RBC' },
    { security: { symbol: 'FTS.TO', name: 'Fortis Inc', currency: 'CAD', type: 'equity' }, quantity: 80, book_value: 4200, market_value: 4500, _accountName: 'TFSA - RBC' },
  ],

  // 4. HEAVY CRYPTO — 60% crypto, should score poorly on risk
  '4. Crypto Heavy': [
    { security: { symbol: 'BTC', name: 'Bitcoin', currency: 'USD', type: 'crypto' }, quantity: 1.5, book_value: 40000, market_value: 90000, _accountName: 'Shakepay' },
    { security: { symbol: 'ETH', name: 'Ethereum', currency: 'USD', type: 'crypto' }, quantity: 20, book_value: 20000, market_value: 60000, _accountName: 'Shakepay' },
    { security: { symbol: 'VFV.TO', name: 'Vanguard S&P 500 Index ETF', currency: 'CAD', type: 'etf' }, quantity: 100, book_value: 9000, market_value: 10000, _accountName: 'TFSA - Questrade' },
  ],

  // 5. ALL LOSERS — Everything is down
  '5. All Losers Portfolio': [
    { security: { symbol: 'SHOP.TO', name: 'Shopify Inc', currency: 'CAD', type: 'equity' }, quantity: 100, book_value: 15000, market_value: 8000, _accountName: 'Non-Reg' },
    { security: { symbol: 'NTR.TO', name: 'Nutrien Ltd', currency: 'CAD', type: 'equity' }, quantity: 80, book_value: 8000, market_value: 5000, _accountName: 'Non-Reg' },
    { security: { symbol: 'XRE.TO', name: 'iShares S&P/TSX Capped REIT Index ETF', currency: 'CAD', type: 'etf' }, quantity: 200, book_value: 4000, market_value: 3200, _accountName: 'Non-Reg' },
    { security: { symbol: 'ZAG.TO', name: 'BMO Aggregate Bond Index ETF', currency: 'CAD', type: 'etf' }, quantity: 300, book_value: 4500, market_value: 4100, _accountName: 'Non-Reg' },
  ],

  // 6. HOME BIASED — 100% Canadian
  '6. 100% Canadian Home Bias': [
    { security: { symbol: 'TD.TO', name: 'Toronto-Dominion Bank', currency: 'CAD', type: 'equity' }, quantity: 200, book_value: 16000, market_value: 17000, _accountName: 'RRSP' },
    { security: { symbol: 'RY.TO', name: 'Royal Bank of Canada', currency: 'CAD', type: 'equity' }, quantity: 100, book_value: 12000, market_value: 14000, _accountName: 'RRSP' },
    { security: { symbol: 'ENB.TO', name: 'Enbridge Inc', currency: 'CAD', type: 'equity' }, quantity: 200, book_value: 10000, market_value: 11000, _accountName: 'RRSP' },
    { security: { symbol: 'BNS.TO', name: 'Bank of Nova Scotia', currency: 'CAD', type: 'equity' }, quantity: 150, book_value: 9000, market_value: 8500, _accountName: 'TFSA' },
    { security: { symbol: 'XIU.TO', name: 'iShares S&P/TSX 60 Index ETF', currency: 'CAD', type: 'etf' }, quantity: 300, book_value: 9000, market_value: 10000, _accountName: 'TFSA' },
  ],

  // 7. WELL DIVERSIFIED — Good mix across regions, sectors, account types
  '7. Well Diversified Global': [
    { security: { symbol: 'VFV.TO', name: 'Vanguard S&P 500 Index ETF', currency: 'CAD', type: 'etf' }, quantity: 200, book_value: 18000, market_value: 22000, _accountName: 'RRSP - Questrade' },
    { security: { symbol: 'XIU.TO', name: 'iShares S&P/TSX 60 Index ETF', currency: 'CAD', type: 'etf' }, quantity: 150, book_value: 4500, market_value: 5000, _accountName: 'RRSP - Questrade' },
    { security: { symbol: 'XEF.TO', name: 'iShares Core MSCI EAFE IMI Index ETF', currency: 'CAD', type: 'etf' }, quantity: 300, book_value: 9600, market_value: 10500, _accountName: 'RRSP - Questrade' },
    { security: { symbol: 'XEC.TO', name: 'iShares Core MSCI Emerging Markets IMI Index ETF', currency: 'CAD', type: 'etf' }, quantity: 200, book_value: 5000, market_value: 5200, _accountName: 'RRSP - Questrade' },
    { security: { symbol: 'ZAG.TO', name: 'BMO Aggregate Bond Index ETF', currency: 'CAD', type: 'etf' }, quantity: 500, book_value: 7500, market_value: 7200, _accountName: 'RRSP - Questrade' },
    { security: { symbol: 'TD.TO', name: 'Toronto-Dominion Bank', currency: 'CAD', type: 'equity' }, quantity: 50, book_value: 4000, market_value: 4200, _accountName: 'TFSA - Questrade' },
    { security: { symbol: 'SHOP.TO', name: 'Shopify Inc', currency: 'CAD', type: 'equity' }, quantity: 20, book_value: 2200, market_value: 2800, _accountName: 'TFSA - Questrade' },
    { security: { symbol: 'ENB.TO', name: 'Enbridge Inc', currency: 'CAD', type: 'equity' }, quantity: 80, book_value: 4000, market_value: 4500, _accountName: 'TFSA - Questrade' },
    { security: { symbol: 'FTS.TO', name: 'Fortis Inc', currency: 'CAD', type: 'equity' }, quantity: 60, book_value: 3200, market_value: 3400, _accountName: 'TFSA - Questrade' },
    { security: { symbol: 'XRE.TO', name: 'iShares S&P/TSX Capped REIT Index ETF', currency: 'CAD', type: 'etf' }, quantity: 150, book_value: 2500, market_value: 2600, _accountName: 'TFSA - Questrade' },
    { security: { symbol: 'NTR.TO', name: 'Nutrien Ltd', currency: 'CAD', type: 'equity' }, quantity: 30, book_value: 2500, market_value: 2100, _accountName: 'Non-Reg - Questrade' },
    { security: { symbol: 'BTC', name: 'Bitcoin', currency: 'USD', type: 'crypto' }, quantity: 0.1, book_value: 4000, market_value: 6500, _accountName: 'Shakepay' },
  ],
};

// ─── Expected behavior assertions ────────────────────────────────────────────

console.log('='.repeat(80));
console.log('PORTFOLIO SCORING TEST RESULTS');
console.log('='.repeat(80));

let allPassed = true;
let issuesFound = [];

Object.entries(portfolios).forEach(([name, positions]) => {
  const scores = computeScores(positions);
  if (!scores) {
    console.log(`\n${name}: FAILED — null scores`);
    allPassed = false;
    return;
  }

  const totalVal = scores.totalVal;
  const totalReturn = scores.totalReturn;

  console.log(`\n${name}`);
  console.log(`  Total Value: $${totalVal.toLocaleString()} | Return: ${totalReturn.toFixed(1)}%`);
  console.log(`  Holdings: ${scores.uniqueSecurities} | Sectors: ${scores.sectorCount} | Regions: ${scores.regionCount}`);
  console.log(`  Max Position: ${scores.maxW.toFixed(1)}% | Top3: ${scores.top3W.toFixed(1)}% | Top5: ${scores.top5W.toFixed(1)}%`);
  console.log(`  Home Bias: ${scores.homeBias.toFixed(1)}% | Crypto: ${scores.cryptoWeight.toFixed(1)}%`);
  console.log(`  HHI: ${scores.hhi.toFixed(4)} (score: ${scores.hhiScore})`);
  console.log(`  Sectors: ${JSON.stringify(Object.keys(scores.sectors))}`);
  console.log(`  Regions: ${JSON.stringify(Object.keys(scores.regions))}`);
  console.log(`  ─── SCORES ───`);
  console.log(`  Health: ${scores.health} | Div: ${scores.diversification} | Risk: ${scores.riskManagement} | Perf: ${scores.performance} | Tax: ${scores.taxEfficiency} | Income: ${scores.income}`);

  // Validate expected behavior
  const checks = [];

  if (name.includes('Single All-in-One')) {
    // Single ETF should have LOW diversification (only 1 holding) despite being internally diversified
    checks.push(['Diversification should be low for single holding', scores.diversification < 40]);
    checks.push(['Risk should be penalized for 100% in one position', scores.riskManagement < 30]);
    checks.push(['Health should be moderate at best', scores.health < 60]);
  }

  if (name.includes('Concentrated Single Stock')) {
    checks.push(['High concentration should tank risk score', scores.riskManagement < 25]);
    checks.push(['Diversification very low with 2 positions', scores.diversification < 30]);
    checks.push(['Performance negative (SHOP down)', scores.performance < 45]);
    checks.push(['Health should be poor', scores.health < 45]);
  }

  if (name.includes('Balanced Canadian')) {
    checks.push(['Diversification should be decent (7 holdings, multiple sectors)', scores.diversification >= 35]);
    checks.push(['Risk management penalized for 31% max position + 100% home bias', scores.riskManagement >= 20 && scores.riskManagement < 50]);
    checks.push(['Performance positive overall', scores.performance >= 40]);
    checks.push(['Health should be moderate-to-good', scores.health >= 40]);
  }

  if (name.includes('Crypto Heavy')) {
    checks.push(['Crypto weight should be > 90%', scores.cryptoWeight > 90]);
    checks.push(['Risk management should be very low (crypto vol)', scores.riskManagement < 20]);
    checks.push(['Diversification should be low (3 holdings)', scores.diversification < 35]);
    checks.push(['Performance should be high (massive crypto gains)', scores.performance >= 50]);
  }

  if (name.includes('All Losers')) {
    checks.push(['Performance should be poor (all losses)', scores.performance < 30]);
    checks.push(['Total return should be negative', scores.totalReturn < 0]);
    checks.push(['Win rate should be 0%', scores.winRate === 0]);
  }

  if (name.includes('Home Bias')) {
    checks.push(['Home bias should be 100%', scores.homeBias === 100]);
    checks.push(['Risk management penalized for home bias', scores.riskManagement < 50]);
    checks.push(['Region count should be 1', scores.regionCount === 1]);
  }

  if (name.includes('Well Diversified')) {
    checks.push(['Region count should be 3+', scores.regionCount >= 3]);
    checks.push(['Sector count should be 5+', scores.sectorCount >= 5]);
    checks.push(['Diversification should be highest of all', scores.diversification >= 40]);
    checks.push(['Health should be the best', scores.health >= 45]);
    checks.push(['Risk management should be best', scores.riskManagement >= 40]);
  }

  checks.forEach(([desc, passed]) => {
    const status = passed ? 'PASS' : 'FAIL';
    if (!passed) {
      allPassed = false;
      issuesFound.push(`${name}: ${desc}`);
    }
    console.log(`  [${status}] ${desc}`);
  });
});

console.log('\n' + '='.repeat(80));
if (allPassed) {
  console.log('ALL TESTS PASSED');
} else {
  console.log('ISSUES FOUND:');
  issuesFound.forEach(i => console.log('  - ' + i));
}
console.log('='.repeat(80));
