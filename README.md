# EconSim — Game Economy Inflation Simulator

A browser-based tool for modeling MMO/open-world game economies. Tracks money supply, gold sources and sinks, player count decay, and gives you a live hyperinflation risk score across a configurable simulation window.

No backend needed. Drop the two files in a folder and open `index.html`.

---

## Why this exists

Most indie game devs don't think about inflation until players are complaining that gear costs 10x what it did at launch. By then it's usually too late to fix without a painful economic reset.

EconSim lets you stress-test your economy design *before* you ship — tweak gold sources, kill sinks, spike player count, and watch exactly when your economy tips into hyperinflation territory.

---

## Features

- **Live simulation charts** — CPI over time, money supply growth, inflow vs outflow comparison, player count arc, and a full risk score timeline
- **Hyperinflation risk scoring** — composite 0-100 score based on inflation rate, gold-per-player ratio, and sink/source balance
- **Configurable economy** — toggle individual sources (quests, mobs, dungeon bosses) and sinks (repair costs, auction fees, mount training) on and off
- **Player lifecycle modeling** — simulates the classic MMO launch curve: early spike, stabilization, and long-term churn
- **Event log** — flags notable days where economy crossed risk thresholds
- **Export** — download full simulation history as CSV or JSON for further analysis

---

## Files

```
econsim/
├── index.html    the dashboard (all charts + config UI)
└── engine.js     simulation engine (pure JS, no dependencies)
```

The engine has zero dependencies. The dashboard pulls Chart.js from cdnjs for rendering.

---

## Quick Start

1. Clone or download this repo
2. Open `index.html` in any modern browser
3. Adjust the config panel on the left
4. Hit **Run Simulation**

That's it. Works offline, no build step, no npm.

---

## How the Simulation Works

### Money Supply

Each day the engine calculates total gold entering and leaving the economy:

```
inflow  = sum of enabled sources × f(playerCount)
outflow = sum of enabled sinks   × f(playerCount)
moneySupply += inflow - outflow
```

The per-player multiplier scales logarithmically so doubling players doesn't double gold linearly (which is closer to how real MMO economies behave — high player counts don't proportionally increase farming efficiency).

### CPI (Consumer Price Index)

Based on a simplified Quantity Theory of Money:

```
MV = PQ

quantityFactor = (moneySupply × velocity) / nominalGDP
CPI = baseCPI × quantityFactor ^ elasticity
```

- `velocity` represents how fast gold changes hands (trading, AH, services)
- `elasticity` controls how strongly price levels react to money supply changes
- `nominalGDP` is a proxy for total economic output (playerCount × base output)

### Hyperinflation Risk Score

The risk score (0-100) is a composite of four signals:

| Signal | Max contribution |
|---|---|
| Daily inflation rate | 20 pts |
| Gold per player (wealth concentration) | 25 pts |
| Sink/source ratio | 20 pts |
| Time-weighted inflation persistence | 10 pts |

**Risk levels:**

| Score | Level |
|---|---|
| 0-14 | STABLE |
| 15-34 | LOW |
| 35-54 | MODERATE |
| 55-74 | HIGH |
| 75-100 | CRITICAL |

### Player Count Model

The engine uses a three-phase player model that mirrors typical MMO launch behavior:

- **Days 0-30:** exponential growth with weekly engagement oscillation (weekend spikes)
- **Days 30-90:** exponential decay from peak as hype fades
- **Days 90+:** settled retention curve bottoming out at ~30% of launch count

---

## Config Reference

| Parameter | What it does |
|---|---|
| Starting Player Count | Base population at day 0 |
| Simulation Days | How many days to run (30-730) |
| Player Growth Rate | Daily % chance a new player joins |
| Player Churn Rate | Daily % chance a player leaves |
| Money Velocity | How fast gold circulates (higher = more inflationary pressure) |
| Price Elasticity | How strongly prices react to supply changes |

**Sources** are gold-generating mechanics. Disabling one removes that inflow entirely.

**Sinks** consume gold. Disabling sinks is the fastest way to trigger hyperinflation — try turning off Repair Costs and Auction Fees at the same time and watch what happens.

---

## Export Format

### CSV

One row per simulated day with these columns:

```
day, playerCount, inflow, outflow, netFlow, moneySupply, cpi, inflationRate, sinkRatio, riskScore, riskLevel
```

### JSON

Full simulation dump including config used, per-day history array, and a summary object:

```json
{
  "config": { ... },
  "history": [ { "day": 0, "cpi": 100.0, ... }, ... ],
  "summary": {
    "finalCpi": 142.3,
    "cpiChange": 42.3,
    "peakRiskScore": 68,
    "peakRiskDay": 47,
    "avgInflationRate": 0.21,
    "daysAtHighRisk": 12,
    "finalRiskLevel": "MODERATE"
  }
}
```

---

## Scenarios worth testing

**Healthy economy**
Default settings. Sink/source ratio stays close to 1.0, CPI drifts up slowly, risk stays LOW/MODERATE.

**No sinks**
Disable all sinks. Gold accumulates with no drain. Risk hits CRITICAL within ~30-50 days depending on player count.

**High velocity + low elasticity**
Velocity 4.0+, elasticity 0.2. Gold moves fast but prices don't respond as aggressively. Useful for modeling economies with strong price controls.

**Small server**
100-500 players, high churn (8%+). Economy collapses fast when player count drops because you lose both sides of the market simultaneously.

**Late game inflation creep**
Run 365+ days with default settings. Even a healthy sink/source ratio will show gradual inflation from player count decline (fewer sinks active per unit of supply).

---

## Extending the engine

`engine.js` exports a single `EconomyEngine` object with these methods:

```js
EconomyEngine.createDefaultConfig()   // returns a fresh config object
EconomyEngine.runSimulation(config)   // returns { config, history, summary }
EconomyEngine.exportCsv(history)      // returns CSV string
EconomyEngine.exportJson(result)      // returns JSON string
```

To add a new source or sink, just add an entry to the `goldSources` or `goldSinks` object in `createDefaultConfig()`:

```js
goldSources: {
  craftingOrders: { baseRate: 40, perPlayerMultiplier: 0.7, enabled: true },
  ...
}
```

The engine picks it up automatically with no other changes needed.

---

## Limitations

This is a planning tool, not a production analytics system. A few things it doesn't model:

- Player segmentation (whales vs casuals have very different gold flows)
- Auction house price discovery (AH prices feed back into inflation differently than vendor prices)
- External gold sinks like cosmetic shops or season passes
- Item duplication exploits or bot farming (which are effectively unbounded sources)

For a real game you'd want to instrument actual transaction logs and feed those into a model like this rather than relying on the estimated base rates.

---

## License

MIT. Use it, fork it, ship it.
