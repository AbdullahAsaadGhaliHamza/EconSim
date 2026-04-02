# EconSim

<img width="1920" height="1080" alt="EconSim" src="https://github.com/user-attachments/assets/554f43fb-10c3-448a-a930-92ba080fde19" />

Game Economy Inflation Simulator

A lightweight browser tool for simulating MMO and open world game economies. It models money supply, gold sources and sinks, player lifecycle, and calculates a live hyperinflation risk score.

No backend required. Open `index.html` and run it locally.

---

## Why

Most game economies break slowly and silently. Prices creep up, gold accumulates, and eventually everything becomes inflated beyond repair.

EconSim helps you catch that early. You can simulate different scenarios and see exactly when your economy becomes unstable.

---

## Features

- Real time charts for CPI, money supply, inflow vs outflow, player count, and risk score  
- Hyperinflation risk scoring from 0 to 100  
- Toggleable gold sources and sinks  
- Player lifecycle simulation with growth, decay, and long term retention  
- Event log for risk spikes  
- Export results as CSV or JSON  

---

## Files

```
econsim/
├── index.html
└── engine.js
```

- `index.html` contains the UI and charts  
- `engine.js` contains the simulation logic  

No dependencies in the engine. The UI uses Chart.js from CDN.

---

## Quick Start

1. Download or clone the repo  
2. Open `index.html` in your browser  
3. Adjust settings  
4. Click Run Simulation  

Works offline. No build step required.

---

## Simulation Overview

### Money Supply

Each day:

```
inflow  = sources × f(playerCount)
outflow = sinks   × f(playerCount)
moneySupply += inflow - outflow
```

Scaling is logarithmic so player growth does not linearly multiply gold generation.

---

### CPI

Based on a simplified quantity theory model:

```
MV = PQ

quantityFactor = (moneySupply × velocity) / nominalGDP
CPI = baseCPI × quantityFactor ^ elasticity
```

- velocity controls how fast gold moves  
- elasticity controls price sensitivity  
- nominalGDP is based on player output  

---

### Risk Score

Composite score from 0 to 100:

- Inflation rate  
- Gold per player  
- Sink to source ratio  
- Inflation persistence  

| Score | Level |
|------|------|
| 0-14 | Stable |
| 15-34 | Low |
| 35-54 | Moderate |
| 55-74 | High |
| 75-100 | Critical |

---

### Player Model

- Days 0 to 30: growth phase with weekly spikes  
- Days 30 to 90: decline from peak  
- Day 90+: stabilized population  

---

## Config

Key parameters:

- Starting Player Count  
- Simulation Days  
- Growth Rate  
- Churn Rate  
- Money Velocity  
- Price Elasticity  

Sources generate gold.  
Sinks remove gold.

Disabling sinks will quickly push the system into high risk.

---

## Export

### CSV

```
day, playerCount, inflow, outflow, netFlow, moneySupply, cpi, inflationRate, sinkRatio, riskScore, riskLevel
```

### JSON

Includes config, full history, and summary stats.

---

## Scenarios

- Default setup: balanced economy  
- No sinks: rapid inflation  
- High velocity: fast circulation pressure  
- Small server: unstable market  
- Long term run: gradual inflation buildup  

---

## Extending

Core API:

```js
EconomyEngine.createDefaultConfig()
EconomyEngine.runSimulation(config)
EconomyEngine.exportCsv(history)
EconomyEngine.exportJson(result)
```

To add a source or sink, update `createDefaultConfig()`:

```js
goldSources: {
  craftingOrders: { baseRate: 40, perPlayerMultiplier: 0.7, enabled: true }
}
```

No additional changes required.

---

## Limitations

- No player segmentation  
- No auction house dynamics  
- No external monetization sinks  
- No exploit or bot modeling  

This is a design tool, not a live analytics system.

---

## License

MIT
