import { fmt } from "./format.js";

const { jStat } = window;

function maybeCancel(symbol, condition) {
  if (symbol === "<") {
    return condition ? symbol : String.raw`\nless`;
  }
  return condition ? symbol : String.raw`\ngtr`;
}

function tableTotals(observed) {
  const rows = observed.length;
  const cols = observed[0].length;

  const rowTotals = observed.map(row =>
    row.reduce((sum, value) => sum + value, 0)
  );

  const colTotals = Array.from({ length: cols }, (_, c) =>
    observed.reduce((sum, row) => sum + row[c], 0)
  );

  const total = rowTotals.reduce((sum, value) => sum + value, 0);

  return { rows, cols, rowTotals, colTotals, total };
}

function expectedCounts(observed) {
  const { rows, cols, rowTotals, colTotals, total } = tableTotals(observed);

  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) =>
      (rowTotals[r] * colTotals[c]) / total
    )
  );
}

function chiSquareTestStat(observed) {
  const expected = expectedCounts(observed);

  return observed.reduce((sum, row, r) => {
    return sum + row.reduce((innerSum, observedValue, c) => {
      const expectedValue = expected[r][c];
      return innerSum + ((observedValue - expectedValue) ** 2) / expectedValue;
    }, 0);
  }, 0);
}

function degreesOfFreedom(observed) {
  const rows = observed.length;
  const cols = observed[0].length;

  return (rows - 1) * (cols - 1);
}

function chiSquareData(observed) {
  const x2 = chiSquareTestStat(observed);
  const df = degreesOfFreedom(observed);

  return chiSquareDataFromValues(x2, df);
}

function chiSquareStats(observed, alpha, formula = 0) {
  const x2 = chiSquareTestStat(observed);
  const df = degreesOfFreedom(observed);

  return chiSquareStatsFromValues(x2, df, alpha, formula, true);
}


function gofTestStat(data) {
  const observed = data[0];
  const expected = data[1];

  return observed.reduce((sum, observedValue, i) => {
    const expectedValue = expected[i];
    return sum + ((observedValue - expectedValue) ** 2) / expectedValue;
  }, 0);
}

function gofDegreesOfFreedom(data) {
  return data[0].length - 1;
}

function gofData(data) {
  const x2 = gofTestStat(data);
  const df = gofDegreesOfFreedom(data);

  return chiSquareDataFromValues(x2, df);
}

function gofStats(data, alpha, formula = 0) {
  const x2 = gofTestStat(data);
  const df = gofDegreesOfFreedom(data);

  return chiSquareStatsFromValues(x2, df, alpha, formula, false);
}


function chiSquareDataFromValues(x2, df) {
  const x = [];
  const y = [];
  const shade_x = [];
  const shade_y = [];

  const steps = 1000;
  const start = 0;
  const end = Math.max(
    jStat.chisquare.inv(0.999, df),
    x2 * 1.25,
    df + 8 * Math.sqrt(2 * df)
  );

  for (let i = 0; i < steps; i++) {
    const xi = start + (i / (steps - 1)) * (end - start);
    const yi = jStat.chisquare.pdf(xi, df);

    if (Number.isFinite(yi) && yi >= 5e-7) {
      x.push(xi);
      y.push(yi);

      if (xi >= x2) {
        shade_x.push(xi);
        shade_y.push(yi);
      }
    }
  }

  return {
    x,
    y,
    x2: Number(x2.toFixed(6)),
    df,
    shade_x,
    shade_y
  };
}

function chiSquareStatsFromValues(x2, df, alpha, formula = 0, contingency = true) {
  const pValue = 1 - jStat.chisquare.cdf(x2, df);
  const critValue = jStat.chisquare.inv(1 - alpha, df);

  const reject = x2 > critValue;
  const pReject = pValue < alpha;

  const decision = reject
    ? "\\text{Reject } H_0"
    : "\\text{Fail to reject } H_0";

  const critRule = `${fmt(x2)} ${maybeCancel(">", reject)} ${fmt(critValue)}`;
  const pRule = `${fmt(pValue)} ${maybeCancel("<", pReject)} ${fmt(alpha)}`;

  if (formula) {
    return {
      x2_stat: contingency
        ? `\\chi^2 = \\sum \\frac{(O_{ij} - E_{ij})^2}{E_{ij}}`
        : `\\chi^2 = \\sum \\frac{(O_i - E_i)^2}{E_i}`,
      p_value: `p = \\mathbb{P}(\\chi^2_{${df}} \\ge \\chi^2)`,
      crit_value: `\\chi^2_{\\alpha, ${df}}`,
      decision,
      crit_rule: critRule,
      p_rule: pRule
    };
  }

  return {
    x2_stat: fmt(x2),
    p_value: fmt(pValue),
    crit_value: fmt(critValue),
    decision,
    crit_rule: `\\chi^2 > \\chi^2_{\\alpha, ${df}}`,
    p_rule: `p < \\alpha`
  };
}


export function chisquareDataIndependence(observed) {
  return chiSquareData(observed);
}

export function chisquareStatsIndependence(observed, alpha, formula = 0) {
  return chiSquareStats(observed, alpha, formula);
}

export function chisquareDataHomogeneity(observed) {
  return chiSquareData(observed);
}

export function chisquareStatsHomogeneity(observed, alpha, formula = 0) {
  return chiSquareStats(observed, alpha, formula);
}

export function chisquareDataGOF(data) {
  return gofData(data);
}

export function chisquareStatsGOF(data, alpha, formula = 0) {
  return gofStats(data, alpha, formula);
}