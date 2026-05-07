import { fmt } from "./format.js";
const { jStat } = window;

function maybeCancel(symbol, condition) {
  if (symbol === "<") {
    return condition ? symbol : String.raw`\nless`;
  }
  return condition ? symbol : String.raw`\ngtr`;
}

function orderVariances(s1, s2, n1, n2) {
  return s1 >= s2
    ? { top: s1, bottom: s2, nTop: n1, nBottom: n2 }
    : { top: s2, bottom: s1, nTop: n2, nBottom: n1 };
}

export function oneSampleFData(s1, s2, n1, n2) {
  if (s1 <= 0 || s2 <= 0 || n1 <= 1 || n2 <= 1) {
    return {
      x: [],
      y: [],
      f: null,
      shade_x_left: [],
      shade_y_left: [],
      shade_x_right: [],
      shade_y_right: []
    };
  }

  const ordered = orderVariances(s1, s2, n1, n2);
  const df1 = ordered.nTop - 1;
  const df2 = ordered.nBottom - 1;
  const f = ordered.top / ordered.bottom;

  const x = [];
  const y = [];
  const shade_x_left = [];
  const shade_y_left = [];
  const shade_x_right = [];
  const shade_y_right = [];

  const steps = 1000;
  const upper = Math.min(
    15,
    Math.max(
      4,
      f + 2,
      jStat.centralF.inv(0.975, df1, df2)
    )
  );

  for (let i = 0; i < steps; i++) {
    const xi = 0.0001 + (i / (steps - 1)) * upper;
    const yi = jStat.centralF.pdf(xi, df1, df2);

    if (yi >= 5e-7) {
      x.push(xi);
      y.push(yi);

      if (xi >= f) {
        shade_x_right.push(xi);
        shade_y_right.push(yi);
      }
    }
  }

  return {
    x,
    y,
    f: Number(f.toFixed(6)),
    shade_x_left,
    shade_y_left,
    shade_x_right,
    shade_y_right
  };
}

export function oneSampleFStats(
  s1,
  s2,
  n1,
  n2,
  alpha,
  formula = false
) {
  if (s1 <= 0 || s2 <= 0 || n1 <= 1 || n2 <= 1 || !(alpha > 0 && alpha < 1)) {
    return {
      is_formula: false,
      f_stat: "—",
      p_value: "—",
      crit_value: "—",
      decision: "—",
      crit_rule: "—",
      p_rule: "—"
    };
  }

  const ordered = orderVariances(s1, s2, n1, n2);
  const df1 = ordered.nTop - 1;
  const df2 = ordered.nBottom - 1;
  const f = ordered.top / ordered.bottom;

  const fCrit = jStat.centralF.inv(1 - alpha, df1, df2);
  const p = 1 - jStat.centralF.cdf(f, df1, df2);

  const reject = f > fCrit;

  const critRule = String.raw`${fmt(f)} ${maybeCancel(">", reject)} ${fmt(fCrit)}`;
  const pRule = String.raw`${fmt(p)} ${maybeCancel("<", reject)} ${fmt(alpha)}`;

  const decision = reject
    ? String.raw`\text{Reject } H_0`
    : String.raw`\text{Fail to reject } H_0`;

  if (formula) {
    return {
      is_formula: true,
      f_stat: String.raw`F=\frac{\max(s_1^2,s_2^2)}{\min(s_1^2,s_2^2)}`,
      p_value: String.raw`p=P(F\ge f)`,
      crit_value: String.raw`F_{1-\alpha,\,${df1},\,${df2}}`,
      decision,
      crit_rule: String.raw`F>F_{1-\alpha}`,
      p_rule: String.raw`p<\alpha`
    };
  }

  return {
    is_formula: false,
    f_stat: fmt(f),
    p_value: p < 0.001 ? String.raw`\text{Less than 0.001}` : fmt(p),
    crit_value: fmt(fCrit),
    decision,
    crit_rule: critRule,
    p_rule: pRule
  };
}