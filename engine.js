const EconomyEngine = (() => {

  function createDefaultConfig() {
    return {
      ticksPerDay: 24,
      startingPlayerCount: 1000,
      playerGrowthRate: 0.02,
      playerChurnRate: 0.01,

      goldSources: {
        questRewards: { baseRate: 50, perPlayerMultiplier: 1.0, enabled: true },
        mobDrops: { baseRate: 30, perPlayerMultiplier: 1.2, enabled: true },
        vendorSales: { baseRate: 15, perPlayerMultiplier: 0.8, enabled: true },
        dungeonBoss: { baseRate: 200, perPlayerMultiplier: 0.3, enabled: true },
        dailyLogin: { baseRate: 10, perPlayerMultiplier: 1.0, enabled: false },
      },

      goldSinks: {
        repairCosts: { baseRate: 20, perPlayerMultiplier: 1.0, enabled: true },
        auctionFees: { baseRate: 25, perPlayerMultiplier: 0.9, enabled: true },
        mountTraining: { baseRate: 5, perPlayerMultiplier: 0.4, enabled: true },
        skillRespec: { baseRate: 8, perPlayerMultiplier: 0.5, enabled: true },
        guildHall: { baseRate: 12, perPlayerMultiplier: 0.3, enabled: false },
      },

      baseCpi: 100,
      elasticity: 0.65,
      velocityFactor: 1.8,
      simulationDays: 180,
    };
  }

  function calcSourceInflow(sources, playerCount) {
    let total = 0;
    for (const key in sources) {
      const s = sources[key];
      if (!s.enabled) continue;
      total += s.baseRate * (1 + s.perPlayerMultiplier * Math.log10(playerCount + 1));
    }
    return total * playerCount;
  }

  function calcSinkOutflow(sinks, playerCount) {
    let total = 0;
    for (const key in sinks) {
      const s = sinks[key];
      if (!s.enabled) continue;
      total += s.baseRate * (1 + s.perPlayerMultiplier * Math.log10(playerCount + 1));
    }
    return total * playerCount;
  }

  function calcPlayerCount(day, config) {
    const base = config.startingPlayerCount;
    const growth = config.playerGrowthRate;
    const churn = config.playerChurnRate;
    const net = growth - churn;

    if (day < 30) {
      return Math.floor(base * Math.pow(1 + net, day) * (1 + 0.3 * Math.sin(day / 7)));
    }
    if (day < 90) {
      const peak = base * Math.pow(1 + net, 30) * 1.3;
      const decay = Math.exp(-0.005 * (day - 30));
      return Math.floor(peak * decay * (1 + 0.1 * Math.sin(day / 14)));
    }
    const settled = base * Math.pow(1 + net * 0.4, day);
    return Math.floor(Math.max(settled, base * 0.3) * (1 + 0.05 * Math.sin(day / 10)));
  }

  function runSimulation(config = createDefaultConfig()) {
    const ticks = config.simulationDays;
    const history = [];

    let moneySupply = config.startingPlayerCount * 500;
    let cpi = config.baseCpi;
    let prevCpi = config.baseCpi;

    for (let day = 0; day < ticks; day++) {
      const playerCount = calcPlayerCount(day, config);
      const inflow = calcSourceInflow(config.goldSources, playerCount);
      const outflow = calcSinkOutflow(config.goldSinks, playerCount);

      const netFlow = inflow - outflow;
      moneySupply = Math.max(0, moneySupply + netFlow);

      const velocity = config.velocityFactor * (1 + 0.1 * Math.sin(day / 30));
      const nominalGdp = playerCount * 100;
      const quantityFactor = nominalGdp > 0 ? (moneySupply * velocity) / nominalGdp : 1;

      const prevCpiSmooth = prevCpi;
      cpi = config.baseCpi * Math.pow(quantityFactor, config.elasticity);

      const inflationRate = prevCpiSmooth > 0 ? ((cpi - prevCpiSmooth) / prevCpiSmooth) * 100 : 0;
      prevCpi = cpi;

      const sinkRatio = outflow > 0 ? outflow / inflow : 0;
      const riskScore = calcHyperinflationRisk(inflationRate, moneySupply, playerCount, sinkRatio, day);

      history.push({
        day,
        playerCount,
        inflow: Math.round(inflow),
        outflow: Math.round(outflow),
        netFlow: Math.round(netFlow),
        moneySupply: Math.round(moneySupply),
        cpi: parseFloat(cpi.toFixed(2)),
        inflationRate: parseFloat(inflationRate.toFixed(3)),
        sinkRatio: parseFloat(sinkRatio.toFixed(4)),
        riskScore: parseFloat(riskScore.toFixed(2)),
        riskLevel: getRiskLabel(riskScore),
      });
    }

    return { config, history, summary: buildSummary(history) };
  }

  function calcHyperinflationRisk(inflationRate, moneySupply, playerCount, sinkRatio, day) {
    let score = 0;

    if (inflationRate > 5) score += 20;
    else if (inflationRate > 2) score += 10;
    else if (inflationRate > 0) score += 3;
    else if (inflationRate < -2) score += 5;

    const goldPerPlayer = playerCount > 0 ? moneySupply / playerCount : 0;
    if (goldPerPlayer > 50000) score += 25;
    else if (goldPerPlayer > 20000) score += 15;
    else if (goldPerPlayer > 8000) score += 7;

    if (sinkRatio < 0.4) score += 20;
    else if (sinkRatio < 0.6) score += 10;
    else if (sinkRatio < 0.8) score += 5;
    else if (sinkRatio > 1.5) score += 8;

    if (day > 60 && inflationRate > 3) score += 10;
    if (day > 120 && inflationRate > 1.5) score += 8;

    return Math.min(score, 100);
  }

  function getRiskLabel(score) {
    if (score >= 75) return "CRITICAL";
    if (score >= 55) return "HIGH";
    if (score >= 35) return "MODERATE";
    if (score >= 15) return "LOW";
    return "STABLE";
  }

  function buildSummary(history) {
    const last = history[history.length - 1];
    const first = history[0];
    const maxRisk = history.reduce((m, h) => h.riskScore > m.riskScore ? h : m, history[0]);
    const maxInflation = history.reduce((m, h) => h.inflationRate > m.inflationRate ? h : m, history[0]);
    const avgInflation = history.reduce((s, h) => s + h.inflationRate, 0) / history.length;

    const hyperDays = history.filter(h => h.riskLevel === "CRITICAL" || h.riskLevel === "HIGH").length;

    return {
      finalMoneySupply: last.moneySupply,
      finalCpi: last.cpi,
      finalPlayerCount: last.playerCount,
      cpiChange: parseFloat(((last.cpi - first.cpi) / first.cpi * 100).toFixed(2)),
      peakRiskDay: maxRisk.day,
      peakRiskScore: maxRisk.riskScore,
      peakInflationDay: maxInflation.day,
      peakInflationRate: maxInflation.inflationRate,
      avgInflationRate: parseFloat(avgInflation.toFixed(3)),
      daysAtHighRisk: hyperDays,
      finalRiskLevel: last.riskLevel,
    };
  }

  function exportCsv(history) {
    const headers = Object.keys(history[0]).join(",");
    const rows = history.map(h => Object.values(h).join(","));
    return [headers, ...rows].join("\n");
  }

  function exportJson(result) {
    return JSON.stringify(result, null, 2);
  }

  return {
    createDefaultConfig,
    runSimulation,
    exportCsv,
    exportJson,
    getRiskLabel,
  };
})();

if (typeof module !== "undefined") module.exports = EconomyEngine;
