import { fmt } from "./format.js";
const { jStat } = window;

function pdf(a, b, x) {
  if (x < 0 || x > 1) return 0;
  return jStat.beta.pdf(x, a, b);
}

function cdf(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return jStat.beta.cdf(x, a, b);
}

function probGE(a, b, x) {
  if (x <= 0) return 1;
  if (x >= 1) return 0;
  return 1 - cdf(a, b, x);
}

export function betaData(a, b) {
  const x = [];
  const y = [];

  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = i / (steps - 1);
    const dens = pdf(a, b, val);
    if (dens >= 5e-4) {
      x.push(val);
      y.push(dens);
    }
  }

  return { x, y };
}

export function betaProb(a, b, x, rel) {
  let prob;

  if (rel === "le") {
    prob = cdf(a, b, x);
  } else {
    prob = probGE(a, b, x);
  }

  return { prob: fmt(prob) };
}

export function betaInverse(a, b, px, rel) {
  let x;

  if (rel === "le") {
    x = jStat.beta.inv(px, a, b);
  } else {
    x = jStat.beta.inv(1 - px, a, b);
  }

  return { x: Number(x.toFixed(6)) };
}

export function betaStats(a, b, formula = false) {
  const mean = a / (a + b);
  const variance = (a * b) / ((a + b) ** 2 * (a + b + 1));
  const sd = Math.sqrt(variance);

  const aDisplay = Number.isInteger(a) ? a : a;
  const bDisplay = Number.isInteger(b) ? b : b;

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{\alpha}{\alpha + \beta}`,
      variance: String.raw`\sigma^2 = \frac{\alpha \beta}{(\alpha + \beta)^2 (\alpha + \beta + 1)}`,
      sd: String.raw`\sigma = \sqrt{\frac{\alpha \beta}{(\alpha + \beta)^2 (\alpha + \beta + 1)}}`,
      pdf_latex: String.raw`f_X(x) = \frac{\Gamma(\alpha+\beta)}{\Gamma(\alpha)\Gamma(\beta)} x^{\alpha-1}(1-x)^{\beta-1}`,
      mgf_latex: String.raw`\text{No simple closed form}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pdf_latex: String.raw`f_X(x) = \frac{\Gamma(${aDisplay + bDisplay})}{\Gamma(${aDisplay})\Gamma(${bDisplay})} x^{${aDisplay}-1}(1-x)^{${bDisplay}-1}`,
    mgf_latex: String.raw`\text{No simple closed form}`
  };
}