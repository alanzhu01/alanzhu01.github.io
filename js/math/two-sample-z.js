import { fmt } from "./format.js";
const { jStat } = window;

function maybeCancel(symbol, condition) {
  if (symbol === "<") {
    return condition ? symbol : String.raw`\nless`;
  }
  return condition ? symbol : String.raw`\ngtr`;
}

export function twoSampleZData(
  xbar1,
  xbar2,
  sigma1,
  sigma2,
  n1,
  n2,
  mu0,
  alt
) {
  if (sigma1 <= 0 || sigma2 <= 0 || n1 <= 0 || n2 <= 0) {
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

  const se = Math.sqrt((sigma1 ** 2) / n1 + (sigma2 ** 2) / n2);
  const z = ((xbar1 - xbar2) - mu0) / se;

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

export function twoSampleZStats(
  xbar1,
  xbar2,
  sigma1,
  sigma2,
  n1,
  n2,
  mu0,
  alt,
  alpha,
  formula = 0
) {
  const se = Math.sqrt((sigma1 ** 2) / n1 + (sigma2 ** 2) / n2);
  const z = ((xbar1 - xbar2) - mu0) / se;

  let pValue;
  let critValue;
  let decision;
  let critRule;
  let pRule;

  if (alt === "lt") {
    pValue = jStat.normal.cdf(z, 0, 1);
    critValue = jStat.normal.inv(alpha, 0, 1);

    const reject = z < critValue;
    const pReject = pValue < alpha;

    decision = reject
      ? "\\text{Reject } H_0"
      : "\\text{Fail to reject } H_0";

    critRule = `${fmt(z)} ${maybeCancel("<", reject)} ${fmt(critValue)}`;
    pRule = `${fmt(pValue)} ${maybeCancel("<", pReject)} ${fmt(alpha)}`;
  } else if (alt === "gt") {
    pValue = 1 - jStat.normal.cdf(z, 0, 1);
    critValue = jStat.normal.inv(1 - alpha, 0, 1);

    const reject = z > critValue;
    const pReject = pValue < alpha;

    decision = reject
      ? "\\text{Reject } H_0"
      : "\\text{Fail to reject } H_0";

    critRule = `${fmt(z)} ${maybeCancel(">", reject)} ${fmt(critValue)}`;
    pRule = `${fmt(pValue)} ${maybeCancel("<", pReject)} ${fmt(alpha)}`;
  } else {
    pValue = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));
    const crit = jStat.normal.inv(1 - alpha / 2, 0, 1);

    critValue = `${fmt(crit)}`;

    const reject = Math.abs(z) > crit;
    const pReject = pValue < alpha;

    decision = reject
      ? "\\text{Reject } H_0"
      : "\\text{Fail to reject } H_0";

    critRule = `\\vert ${fmt(z)} \\vert ${maybeCancel(">", reject)} ${fmt(crit)}`;
    pRule = `${fmt(pValue)} ${maybeCancel("<", pReject)} ${fmt(alpha)}`;
  }

  if (formula) {
    return {
      z_stat:
        `z = \\frac{(\\bar{x}_1 - \\bar{x}_2) - \\mu_0}` +
        `{\\sqrt{\\frac{\\sigma_1^2}{n_1} + \\frac{\\sigma_2^2}{n_2}}}`,
      p_value: `p = \\mathbb{P}(Z \\le z)`,
      crit_value: alt === "neq"
        ? `z_{\\alpha / 2}`
        : `z_{\\alpha}`,
      decision,
      crit_rule: critRule,
      p_rule: pRule
    };
  }

  return {
    z_stat: fmt(z),
    p_value: fmt(pValue),
    crit_value: typeof critValue === "number" ? fmt(critValue) : critValue,
    decision,
    crit_rule: alt === "lt" ? `z < z_{\\alpha}`
    : alt === "gt" ? `z > z_{\\alpha}`
    : `\\vert z \\vert > z_{\\alpha / 2}`,
    p_rule: `p < \\alpha`
  };
}

