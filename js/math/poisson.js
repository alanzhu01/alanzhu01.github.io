import { fmt } from "./format.js";
const { jStat } = window;

function cleanNumber(value, digits = 3) {
  return Number(value.toFixed(digits)).toString();
}

const EPS = 1e-12;

function pmf(lambda, x) {
  if (!Number.isInteger(x) || x < 0) return 0;
  return jStat.poisson.pdf(x, lambda);
}

function cdf(lambda, x) {
  if (x < 0) return 0;
  return jStat.poisson.cdf(Math.floor(x), lambda);
}

function probGE(lambda, x) {
  if (x <= 0) return 1;
  return 1 - cdf(lambda, x - 1);
}

export function poissonData(lambda) {
  const x = [];
  const y = [];

  for (let k = 0; k < 1000; k++) {
    const prob = pmf(lambda, k);
    if (prob >= 5e-7) {
      x.push(k);
      y.push(prob);
    }
  }

  return { x, y };
}

export function poissonProb(lambda, x, rel) {
  let prob;

  if (rel === "eq") {
    prob = pmf(lambda, x);
  } else if (rel === "le") {
    prob = cdf(lambda, x);
  } else {
    prob = probGE(lambda, x);
  }

  return { prob: fmt(prob) };
}

export function poissonInverse(lambda, px, rel) {
  if (rel === "le") {
    for (let k = 0; k < 1000; k++) {
      const tail = probGE(lambda, k);
      if (cdf(lambda, k) + EPS >= px) {
        return { x: k };
      }
    }
  }

  for (let k = 0; k < 1000; k++) {
    if (probGE(lambda, k) <= px + EPS) {
      return { x: k };
    }
  }

  return { x: 999 };
}

export function poissonStats(lambda, formula = false) {
  const mean = lambda;
  const variance = lambda;
  const sd = Math.sqrt(lambda);

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\lambda`,
      variance: String.raw`\lambda`,
      sd: String.raw`\sqrt{\lambda}`,
      pmf_latex: String.raw`\mathbb{P}_{X}(x) = \frac{\lambda^x e^{-\lambda}}{x!}`,
      mgf_latex: String.raw`M(t) = e^{\lambda(e^{t}-1)}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pmf_latex: 
      lambda !== 1
        ? String.raw`\mathbb{P}(X = x) = \frac{${lambda}^x e^{-${lambda}}}{x!}`
        : String.raw`\mathbb{P}(X = x) = \frac{e^{-${lambda}}}{x!}`,
    mgf_latex: String.raw`M(t) = e^{${lambda}(e^{t}-1)}`
  };
}