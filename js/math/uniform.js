import { fmt } from "./format.js";
const { jStat } = window;

function pdf(a, b, x) {
  if (x < a || x > b) return 0;
  return 1 / (b - a);
}

function cdf(a, b, x) {
  if (x < a) return 0;
  if (x >= b) return 1;
  return (x - a) / (b - a);
}

function probGE(a, b, x) {
  if (x <= a) return 1;
  if (x >= b) return 0;
  return (b - x) / (b - a);
}

export function uniformData(a, b) {
  const x = [];
  const y = [];

  const range = b - a;

  const start = a - 0.15 * range;
  const end = b + 0.15 * range;

  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = start + (i / (steps - 1)) * (end - start);
    x.push(val);
    y.push(pdf(a, b, val));
  }

  return { x, y };
}

export function uniformProb(a, b, x, rel) {
  let prob;

  if (rel === "le") {
    prob = cdf(a, b, x);
  } else {
    prob = probGE(a, b, x);
  }

  return { prob: fmt(prob) };
}

export function uniformInverse(a, b, px, rel) {
  let x;

  if (rel === "le") {
    x = a + px * (b - a);
  } else {
    x = b - px * (b - a);
  }

  return { x: Number(x.toFixed(6)) };
}

export function uniformStats(a, b, formula = false) {
  const mean = (a + b) / 2;
  const variance = ((b - a) ** 2) / 12;
  const sd = Math.sqrt(variance);

  const aDisplay = Number.isInteger(a) ? a : a;
  const bDisplay = Number.isInteger(b) ? b : b;

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{1}{2}(a+b)`,
      variance: String.raw`\sigma^2 = \frac{1}{12}(b-a)^2`,
      sd: String.raw`\sigma = \sqrt{\frac{1}{12}(b-a)^2}`,
      pdf_latex: String.raw`f_X(x) = \frac{1}{b-a}`,
      mgf_latex: String.raw`M(t) = \frac{e^{tb}-e^{ta}}{t(b-a)}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pdf_latex:
      b - a === 1
        ? String.raw`f_X(x) = 1`
        : String.raw`f_X(x) = \frac{1}{${b - a}}`,
    mgf_latex: String.raw`M(t) = \frac{e^{${bDisplay}t}-e^{${aDisplay}t}}{${b - a}t}`
  };
}