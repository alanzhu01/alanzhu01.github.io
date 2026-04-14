import { fmt } from "./format.js";
const { jStat } = window;

function pdf(mu, sigma, x) {
  return jStat.normal.pdf(x, mu, sigma);
}

function cdf(mu, sigma, x) {
  return jStat.normal.cdf(x, mu, sigma);
}

function probGE(mu, sigma, x) {
  return 1 - cdf(mu, sigma, x);
}

export function normalData(mu, sigma) {
  const x = [];
  const y = [];

  const range = 4 * sigma;
  const start = mu - range;
  const end = mu + range;

  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = start + (i / (steps - 1)) * (end - start);
    x.push(val);
    y.push(pdf(mu, sigma, val));
  }

  return { x, y };
}

export function normalProb(mu, sigma, x, rel) {
  let prob;

  if (rel === "le") {
    prob = cdf(mu, sigma, x);
  } else {
    prob = probGE(mu, sigma, x);
  }

  return { prob: fmt(prob) };
}

export function normalInverse(mu, sigma, px, rel) {
  let x;

  if (rel === "le") {
    x = jStat.normal.inv(px, mu, sigma);
  } else {
    x = jStat.normal.inv(1 - px, mu, sigma);
  }

  return { x: Number(x.toFixed(6)) };
}

export function normalStats(mu, sigma, formula = false) {
  const mean = mu;
  const variance = sigma ** 2;
  const sd = sigma;

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu`,
      variance: String.raw`\sigma^2`,
      sd: String.raw`\sigma`,
      pdf_latex: String.raw`f_X(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}`,
      mgf_latex: String.raw`M(t) = \exp\left(\mu t + \frac{1}{2}\sigma^2 t^2\right)`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pdf_latex: String.raw`f_X(x) = \frac{1}{${sigma}\sqrt{2\pi}} e^{-\frac{(x-${mu})^2}{2${sigma}^2}}`,
    mgf_latex: String.raw`M(t) = \exp(${mu}t + \frac{1}{2}${sigma ** 2}t^2)`
  };
}