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
    p_value: fmt(p),
    crit_value: fmt(zCrit),
    decision,
    crit_rule: critRule,
    p_rule: pRule
  };
}