import { fmt } from "./format.js";
const { jStat } = window;

function lowerBound(N, K, n) {
  return Math.max(0, n - (N - K));
}

function upperBound(N, K, n) {
  return Math.min(n, K);
}

function pmf(N, K, n, x) {
  const lo = lowerBound(N, K, n);
  const hi = upperBound(N, K, n);

  if (!Number.isInteger(x) || x < lo || x > hi) return 0;
  return jStat.hypgeom.pdf(x, N, K, n);
}

function cdf(N, K, n, x) {
  const lo = lowerBound(N, K, n);
  const hi = upperBound(N, K, n);

  if (x < lo) return 0;
  if (x >= hi) return 1;
  return jStat.hypgeom.cdf(Math.floor(x), N, K, n);
}

function probGE(N, K, n, x) {
  const lo = lowerBound(N, K, n);
  const hi = upperBound(N, K, n);

  if (x <= lo) return 1;
  if (x > hi) return 0;
  return 1 - cdf(N, K, n, x - 1);
}

export function hypergeometricData(N, K, n) {
  const x = [];
  const y = [];

  const lo = lowerBound(N, K, n);
  const hi = upperBound(N, K, n);

  for (let k = lo; k <= hi; k++) {
    const prob = pmf(N, K, n, k);
    if (prob >= 5e-7) {
      x.push(k);
      y.push(prob);
    }
  }

  return { x, y };
}

export function hypergeometricProb(N, K, n, x, rel) {
  let prob;

  if (rel === "eq") {
    prob = pmf(N, K, n, x);
  } else if (rel === "le") {
    prob = cdf(N, K, n, x);
  } else {
    prob = probGE(N, K, n, x);
  }

  return { prob: fmt(prob) };
}

export function hypergeometricInverse(N, K, n, px, rel) {
  const lo = lowerBound(N, K, n);
  const hi = upperBound(N, K, n);

  if (rel === "le") {
    for (let k = lo; k <= hi; k++) {
      if (cdf(N, K, n, k) >= px) {
        return { x: k };
      }
    }
    return { x: hi };
  }

  for (let k = lo; k <= hi; k++) {
    if (probGE(N, K, n, k) <= px) {
      return { x: k };
    }
  }

  return { x: hi };
}

export function hypergeometricStats(N, K, n, formula = false) {
  const mean = (n * K) / N;
  const variance =
    N > 1
      ? n * (K / N) * (1 - K / N) * ((N - n) / (N - 1))
      : 0;
  const sd = Math.sqrt(variance);

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = n\frac{K}{N}`,
      variance: String.raw`\sigma^2 = n\frac{K}{N}\left(1-\frac{K}{N}\right)\frac{N-n}{N-1}`,
      sd: String.raw`\sigma = \sqrt{n\frac{K}{N}\left(1-\frac{K}{N}\right)\frac{N-n}{N-1}}`,
      pmf_latex: String.raw`\mathbb{P}_{X}(x)=\frac{\binom{K}{x}\binom{N-K}{n-x}}{\binom{N}{n}}`,
      mgf_latex: String.raw`\text{No Closed Form}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pmf_latex: String.raw`\mathbb{P}_{X}(x)=\frac{\binom{${K}}{x}\binom{${N - K}}{${n}-x}}{\binom{${N}}{${n}}}`,
    mgf_latex: String.raw`\text{No Closed Form}`
  };
}