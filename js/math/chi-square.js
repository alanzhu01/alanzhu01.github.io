import { fmt } from "./format.js";
const { jStat } = window;

function pdf(df, x) {
  if (x < 0) return 0;
  return jStat.chisquare.pdf(x, df);
}

function cdf(df, x) {
  if (x < 0) return 0;
  return jStat.chisquare.cdf(x, df);
}

function probGE(df, x) {
  if (x <= 0) return 1;
  return 1 - cdf(df, x);
}

export function chisquareData(df) {
  const x = [];
  const y = [];

  const end = df + 4 * Math.sqrt(2 * df);
  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = (i / (steps - 1)) * end;
    const dens = pdf(df, val);
    if (dens >= 5e-4) {
      x.push(val);
      y.push(dens);
    }
  }

  return { x, y };
}

export function chisquareProb(df, x, rel) {
  let prob;

  if (rel === "le") {
    prob = cdf(df, x);
  } else {
    prob = probGE(df, x);
  }

  return { prob: fmt(prob) };
}

export function chisquareInverse(df, px, rel) {
  let x;

  if (rel === "le") {
    x = jStat.chisquare.inv(px, df);
  } else {
    x = jStat.chisquare.inv(1 - px, df);
  }

  return { x: Number(x.toFixed(6)) };
}

export function chisquareStats(df, formula = false) {
  const mean = df;
  const variance = 2 * df;
  const sd = Math.sqrt(variance);

  const dfDisplay = Number.isInteger(df) ? df : df;

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \nu`,
      variance: String.raw`\sigma^2 = 2\nu`,
      sd: String.raw`\sigma = \sqrt{2\nu}`,
      pdf_latex: String.raw`f_X(x) = \frac{1}{2^{\nu/2}\Gamma(\nu/2)}x^{\nu/2-1}e^{-x/2}`,
      mgf_latex: String.raw`M(t) = (1-2t)^{-\nu/2}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pdf_latex: String.raw`f_X(x) = \frac{1}{2^(${dfDisplay}/2)\Gamma(${dfDisplay}/2)}x^{${dfDisplay}/2-1}e^{-x/2}`,
    mgf_latex: String.raw`M(t) = (1-2t)^{-${dfDisplay}/2}`
  };
}