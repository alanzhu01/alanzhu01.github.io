import { fmt } from "./format.js";
const { jStat } = window;

function maybeCancel(symbol, condition) {
  if (symbol === "<") {
    return condition ? symbol : String.raw`\nless`;
  }
  return condition ? symbol : String.raw`\ngtr`;
}

export function oneSampleZData(xbar, sigma, n, mu0, alt) {
  if (sigma <= 0 || n <= 0) {
    return {
      x: [],
      y: [],
      z: null,
      shade_x_left: [],
      shade_y_left: [],
      shade_x_right: [],
      shade_y_right: []
    };
  }

  const z = (xbar - mu0) / (sigma / Math.sqrt(n));

  const x = [];
  const y = [];
  const shade_x_left = [];
  const shade_y_left = [];
  const shade_x_right = [];
  const shade_y_right = [];

  const steps = 1000;
  const start = -4;
  const end = 4;

  for (let i = 0; i < steps; i++) {
    const xi = start + (i / (steps - 1)) * (end - start);
    const yi = jStat.normal.pdf(xi, 0, 1);

    if (yi >= 5e-7) {
      x.push(xi);
      y.push(yi);

      let left = false;
      let right = false;

      if (alt === "lt") {
        left = xi <= z;
      } else if (alt === "gt") {
        right = xi >= z;
      } else {
        left = xi <= -Math.abs(z);
        right = xi >= Math.abs(z);
      }

      if (left) {
        shade_x_left.push(xi);
        shade_y_left.push(yi);
      }
      if (right) {
        shade_x_right.push(xi);
        shade_y_right.push(yi);
      }
    }
  }

  return {
    x,
    y,
    z: Number(z.toFixed(6)),
    shade_x_left,
    shade_y_left,
    shade_x_right,
    shade_y_right
  };
}

export function oneSampleZStats(
  xbar,
  sigma,
  n,
  mu0,
  alt,
  alpha,
  formula = false
) {
  if (sigma <= 0 || n <= 0 || !(alpha > 0 && alpha < 1)) {
    return {
      is_formula: false,
      z_stat: "—",
      p_value: "—",
      crit_value: "—",
      decision: "—",
      crit_rule: "—",
      p_rule: "—"
    };
  }

  const z = (xbar - mu0) / (sigma / Math.sqrt(n));

  let p;
  let zCrit;
  let reject;
  let critRule;
  let pLatex;
  let critLatex;

  if (alt === "lt") {
    p = jStat.normal.cdf(z, 0, 1);
    zCrit = jStat.normal.inv(alpha, 0, 1);
    reject = z < zCrit;
    const symbol = maybeCancel("<", reject);
    critRule = String.raw`${fmt(z)} ${symbol} ${fmt(zCrit)}`;
    pLatex = String.raw`p = P(Z \le z)`;
    critLatex = String.raw`z_{\alpha}`;
  } else if (alt === "gt") {
    p = 1 - jStat.normal.cdf(z, 0, 1);
    zCrit = jStat.normal.inv(1 - alpha, 0, 1);
    reject = z > zCrit;
    const symbol = maybeCancel(">", reject);
    critRule = String.raw`${fmt(z)} ${symbol} ${fmt(zCrit)}`;
    pLatex = String.raw`p = P(Z \ge z)`;
    critLatex = String.raw`z_{\alpha}`;
  } else {
    p = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));
    zCrit = jStat.normal.inv(1 - alpha / 2, 0, 1);
    reject = Math.abs(z) > zCrit;
    const symbol = maybeCancel(">", reject);
    critRule = String.raw`|${fmt(z)}| ${symbol} ${fmt(zCrit)}`;
    pLatex = String.raw`p = 2P(Z \ge |z|)`;
    critLatex = String.raw`z_{\alpha/2}`;
  }

  const pSymbol = maybeCancel("<", reject);
  const pRule = String.raw`${fmt(p)} ${pSymbol} ${fmt(alpha)}`;
  const decision = reject
    ? String.raw`\text{Reject } H_0`
    : String.raw`\text{Fail to reject } H_0`;

  if (formula) {
    let critRuleFormula;
    if (alt === "lt") {
      critRuleFormula = String.raw`z < z_{\alpha}`;
    } else if (alt === "gt") {
      critRuleFormula = String.raw`z > z_{\alpha}`;
    } else {
      critRuleFormula = String.raw`|z| > z_{\alpha/2}`;
    }

    return {
      is_formula: true,
      z_stat: String.raw`z=\frac{\bar{x}-\mu_0}{\sigma/\sqrt{n}}`,
      p_value: pLatex,
      crit_value: critLatex,
      decision,
      crit_rule: critRuleFormula,
      p_rule: String.raw`p < \alpha`
    };
  }

  return {
    is_formula: false,
    z_stat: fmt(z),
    p_value: (
      p < 0.001 ? String.raw`\text{Less than 0.001}`
      : fmt(p)
    ),
    crit_value: fmt(zCrit),
    decision,
    crit_rule: critRule,
    p_rule: pRule
  };
}

export function oneSampleZSimpleStats(
  xbar,
  sigma,
  n,
  mu0,
  mu1,
  alpha,
  formula = false
) {
  if (
    sigma <= 0 ||
    n <= 0 ||
    !(alpha > 0 && alpha < 1) ||
    !Number.isFinite(mu1) ||
    mu0 === mu1
  ) {
    return {
      is_formula: false,
      likelihood_ratio: "—",
      power: "—",
      xbar_cutoff: "—",
      decision: "—",
      lr_rule: "—",
      xbar_cutoff_rule: "—"
    };
  }

  const se = sigma / Math.sqrt(n);
  const direction = mu1 > mu0 ? "right" : "left";

  const cutoff =
    direction === "right"
      ? mu0 + jStat.normal.inv(1 - alpha, 0, 1) * se
      : mu0 + jStat.normal.inv(alpha, 0, 1) * se;

  const beta =
    direction === "right"
      ? jStat.normal.cdf(cutoff, mu1, se)
      : 1 - jStat.normal.cdf(cutoff, mu1, se);

  const power = 1 - beta;

  const likelihoodRatio =
    jStat.normal.pdf(xbar, mu1, se) /
    jStat.normal.pdf(xbar, mu0, se);

  const reject =
    direction === "right"
      ? xbar > cutoff
      : xbar < cutoff;

  const decision = reject
    ? String.raw`\text{Reject } H_0`
    : String.raw`\text{Fail to reject } H_0`;

  const lrCutoff =
    jStat.normal.pdf(cutoff, mu1, se) /
    jStat.normal.pdf(cutoff, mu0, se);

  if (formula) {
    return {
      is_formula: true,
      likelihood_ratio: String.raw`LR=\frac{f(\bar{x}\mid H_1)}{f(\bar{x}\mid H_0)}`,
      power: String.raw`\mathbb{P}(\text{Reject }H_0\mid H_1)=1-\beta`,
      xbar_cutoff: direction === "right"
        ? String.raw`\bar{x}_c=\mu_0+z_{1-\alpha}\frac{\sigma}{\sqrt{n}}`
        : String.raw`\bar{x}_c=\mu_0+z_{\alpha}\frac{\sigma}{\sqrt{n}}`,
      decision,
      lr_rule: String.raw`LR > LR_c`,
      xbar_cutoff_rule: direction === "right"
        ? String.raw`\bar{x}>\bar{x}_c`
        : String.raw`\bar{x}<\bar{x}_c`
    };
  }

  return {
    is_formula: false,
    likelihood_ratio: (
      likelihoodRatio > 100 ? String.raw`\text{Greater than 100}` 
      : likelihoodRatio < 0.001 ? String.raw`\text{Less than 0.001}`
      : fmt(likelihoodRatio)
    ),
    power: fmt(power),
    xbar_cutoff: fmt(cutoff),
    decision,
    lr_rule: String.raw`${fmt(likelihoodRatio)} ${maybeCancel(">", reject)} ${fmt(lrCutoff)}`,
    xbar_cutoff_rule: direction === "right"
      ? String.raw`${fmt(xbar)} ${maybeCancel(">", reject)} ${fmt(cutoff)}`
      : String.raw`${fmt(xbar)} ${maybeCancel("<", reject)} ${fmt(cutoff)}`
  };
}