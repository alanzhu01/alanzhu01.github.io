import { fmt } from "./format.js";
const { jStat } = window;

function maybeCancel(symbol, condition) {
  if (symbol === "<") {
    return condition ? symbol : String.raw`\nless`;
  }
  return condition ? symbol : String.raw`\ngtr`;
}

function pooledDf(n1, n2) {
  return n1 + n2 - 2;
}

function pooledSe(s1, s2, n1, n2) {
  const sp2 =
    (((n1 - 1) * s1 ** 2) + ((n2 - 1) * s2 ** 2)) /
    (n1 + n2 - 2);

  return Math.sqrt(sp2 * (1 / n1 + 1 / n2));
}

function unpooledDf(s1, s2, n1, n2) {
  const a = s1 ** 2 / n1;
  const b = s2 ** 2 / n2;

  return ((a + b) ** 2) /
    ((a ** 2) / (n1 - 1) + (b ** 2) / (n2 - 1));
}

function unpooledSe(s1, s2, n1, n2) {
  return Math.sqrt((s1 ** 2) / n1 + (s2 ** 2) / n2);
}

function twoSampleTDataGeneric(
  xbar1,
  xbar2,
  s1,
  s2,
  n1,
  n2,
  mu0,
  alt,
  pooled
) {
  if (s1 <= 0 || s2 <= 0 || n1 <= 1 || n2 <= 1) {
    return {
      x: [],
      y: [],
      t: null,
      shade_x_left: [],
      shade_y_left: [],
      shade_x_right: [],
      shade_y_right: []
    };
  }

  const df = pooled ? pooledDf(n1, n2) : unpooledDf(s1, s2, n1, n2);
  const se = pooled ? pooledSe(s1, s2, n1, n2) : unpooledSe(s1, s2, n1, n2);
  const t = ((xbar1 - xbar2) - mu0) / se;

  const x = [];
  const y = [];
  const shade_x_left = [];
  const shade_y_left = [];
  const shade_x_right = [];
  const shade_y_right = [];

  const steps = 1000;
  const start = jStat.studentt.inv(0.0005, df);
  const end = jStat.studentt.inv(0.9995, df);

  for (let i = 0; i < steps; i++) {
    const xi = start + (i / (steps - 1)) * (end - start);
    const yi = jStat.studentt.pdf(xi, df);

    if (yi >= 5e-7) {
      x.push(xi);
      y.push(yi);

      let left = false;
      let right = false;

      if (alt === "lt") {
        left = xi <= t;
      } else if (alt === "gt") {
        right = xi >= t;
      } else {
        left = xi <= -Math.abs(t);
        right = xi >= Math.abs(t);
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
    t: Number(t.toFixed(6)),
    df: Number(df.toFixed(6)),
    shade_x_left,
    shade_y_left,
    shade_x_right,
    shade_y_right
  };
}

function twoSampleTStatsGeneric(
  xbar1,
  xbar2,
  s1,
  s2,
  n1,
  n2,
  mu0,
  alt,
  alpha,
  formula = 0,
  pooled
) {
  const df = pooled ? pooledDf(n1, n2) : unpooledDf(s1, s2, n1, n2);
  const se = pooled ? pooledSe(s1, s2, n1, n2) : unpooledSe(s1, s2, n1, n2);
  const t = ((xbar1 - xbar2) - mu0) / se;

  let pValue;
  let critValue;
  let decision;
  let critRule;
  let pRule;

  if (alt === "lt") {
    pValue = jStat.studentt.cdf(t, df);
    critValue = jStat.studentt.inv(alpha, df);

    const reject = t < critValue;
    const pReject = pValue < alpha;

    decision = reject
      ? "\\text{Reject } H_0"
      : "\\text{Fail to reject } H_0";

    critRule = `${fmt(t)} ${maybeCancel("<", reject)} ${fmt(critValue)}`;
    pRule = `${fmt(pValue)} ${maybeCancel("<", pReject)} ${fmt(alpha)}`;
  } else if (alt === "gt") {
    pValue = 1 - jStat.studentt.cdf(t, df);
    critValue = jStat.studentt.inv(1 - alpha, df);

    const reject = t > critValue;
    const pReject = pValue < alpha;

    decision = reject
      ? "\\text{Reject } H_0"
      : "\\text{Fail to reject } H_0";

    critRule = `${fmt(t)} ${maybeCancel(">", reject)} ${fmt(critValue)}`;
    pRule = `${fmt(pValue)} ${maybeCancel("<", pReject)} ${fmt(alpha)}`;
  } else {
    pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
    const crit = jStat.studentt.inv(1 - alpha / 2, df);

    critValue = `${fmt(crit)}`;

    const reject = Math.abs(t) > crit;
    const pReject = pValue < alpha;

    decision = reject
      ? "\\text{Reject } H_0"
      : "\\text{Fail to reject } H_0";

    critRule = `\\vert ${fmt(t)} \\vert ${maybeCancel(">", reject)} ${fmt(crit)}`;
    pRule = `${fmt(pValue)} ${maybeCancel("<", pReject)} ${fmt(alpha)}`;
  }

  if (formula) {
    return {
      z_stat: pooled
        ? `t = \\frac{(\\bar{x}_1 - \\bar{x}_2) - \\mu_0}{s_p\\sqrt{\\frac{1}{n_1} + \\frac{1}{n_2}}}`
        : `t = \\frac{(\\bar{x}_1 - \\bar{x}_2) - \\mu_0}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}}`,
      p_value: `p = \\mathbb{P}(T \\le t)`,
      crit_value: alt === "neq"
        ? `t_{\\alpha / 2,\\, df}`
        : `t_{\\alpha,\\, df}`,
      decision,
      crit_rule: critRule,
      p_rule: pRule
    };
  }

  return {
    z_stat: fmt(t),
    p_value: fmt(pValue),
    crit_value: typeof critValue === "number" ? fmt(critValue) : critValue,
    decision,
    crit_rule: alt === "lt" ? `t < t_{\\alpha}`
    : alt === "gt" ? `t > t_{\\alpha}`
    : `\\vert t \\vert > t_{\\alpha / 2}`,
    p_rule: `p < \\alpha`
  };
}

export function twoSampleZDataPooled(
  xbar1,
  xbar2,
  s1,
  s2,
  n1,
  n2,
  mu0,
  alt
) {
  return twoSampleTDataGeneric(
    xbar1,
    xbar2,
    s1,
    s2,
    n1,
    n2,
    mu0,
    alt,
    true
  );
}

export function twoSampleZDataUnpooled(
  xbar1,
  xbar2,
  s1,
  s2,
  n1,
  n2,
  mu0,
  alt
) {
  return twoSampleTDataGeneric(
    xbar1,
    xbar2,
    s1,
    s2,
    n1,
    n2,
    mu0,
    alt,
    false
  );
}

export function twoSampleZStatsPooled(
  xbar1,
  xbar2,
  s1,
  s2,
  n1,
  n2,
  mu0,
  alt,
  alpha,
  formula = 0
) {
  return twoSampleTStatsGeneric(
    xbar1,
    xbar2,
    s1,
    s2,
    n1,
    n2,
    mu0,
    alt,
    alpha,
    formula,
    true
  );
}

export function twoSampleZStatsUnpooled(
  xbar1,
  xbar2,
  s1,
  s2,
  n1,
  n2,
  mu0,
  alt,
  alpha,
  formula = 0
) {
  return twoSampleTStatsGeneric(
    xbar1,
    xbar2,
    s1,
    s2,
    n1,
    n2,
    mu0,
    alt,
    alpha,
    formula,
    false
  );
}