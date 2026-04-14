import { fmt } from "./format.js";
const { jStat } = window;

function pmf(n, p, x) {
  if (!Number.isInteger(x) || x < 0 || x > n) return 0;
  return jStat.binomial.pdf(x, n, p);
}

function cdf(n, p, x) {
  if (x < 0) return 0;
  if (x >= n) return 1;
  return jStat.binomial.cdf(Math.floor(x), n, p);
}

function probGE(n, p, x) {
  if (x <= 0) return 1;
  if (x > n) return 0;
  return 1 - cdf(n, p, x - 1);
}

export function binomialData(n, p) {
  const x = [];
  const y = [];

  for (let k = 0; k <= n; k++) {
    const prob = pmf(n, p, k);
    if (prob >= 5e-7) {
      x.push(k);
      y.push(prob);
    }
  }

  return { x, y };
}

export function binomialProb(n, p, x, rel) {
  let prob;

  if (rel === "eq") {
    prob = pmf(n, p, x);
  } else if (rel === "le") {
    prob = cdf(n, p, x);
  } else {
    prob = probGE(n, p, x);
  }

  return { prob: fmt(prob) };
}

export function binomialInverse(n, p, px, rel) {
  if (rel === "le") {
    return { x: jStat.binomial.inv(px, n, p) };
  }

  for (let k = 0; k <= n; k++) {
    const tail = probGE(n, p, k);
    if (tail <= px) {
      return { x: k };
    }
  }

  return { x: n };
}

export function binomialStats(n, p, formula = false) {
  const mean = n * p;
  const variance = n * p * (1 - p);
  const sd = Math.sqrt(variance);

  const pDisplay = p === 1 ? 1 : p;
  const qDisplay = 1 - p;

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = np`,
      variance: String.raw`\sigma^2 = np(1-p)`,
      sd: String.raw`\sigma = \sqrt{np(1-p)}`,
      pmf_latex: String.raw`\mathbb{P}_{X}(x) = \binom{n}{x} p^x (1-p)^{n-x}`,
      mgf_latex: String.raw`M(t) = ((1-p)+pe^{t})^{n}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pmf_latex: String.raw`\mathbb{P}_{X}(x) = \binom{${n}}{x} (${pDisplay})^x (${qDisplay})^{${n}-x}`,
    mgf_latex:
      n !== 1
        ? String.raw`M(t) = (${qDisplay}+${pDisplay}e^{t})^{${n}}`
        : String.raw`M(t) = ${qDisplay}+${pDisplay}e^{t}`
  };
}