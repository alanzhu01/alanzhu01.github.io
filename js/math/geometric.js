import { fmt } from "./format.js";

function pmf(p, x) {
  if (!Number.isInteger(x) || x < 1) return 0;
  return p * ((1 - p) ** (x - 1));
}

function cdf(p, x) {
  if (x < 1) return 0;
  return 1 - ((1 - p) ** Math.floor(x));
}

function probGE(p, x) {
  if (x <= 1) return 1;
  return (1 - p) ** (x - 1);
}

export function geometricData(p) {
  const x = [];
  const y = [];

  for (let k = 1; k < 1000; k++) {
    const prob = pmf(p, k);
    if (prob >= 5e-4) {
      x.push(k);
      y.push(prob);
    }
  }

  return { x, y };
}

export function geometricProb(p, x, rel) {
  let prob;

  if (rel === "eq") {
    prob = pmf(p, x);
  } else if (rel === "le") {
    prob = cdf(p, x);
  } else {
    prob = probGE(p, x);
  }

  return { prob: fmt(prob) };
}

export function geometricInverse(p, px, rel) {
  if (rel === "le") {
    for (let k = 1; k < 1000; k++) {
      if (cdf(p, k) >= px) {
        return { x: k };
      }
    }
    return { x: 999 };
  }

  for (let k = 1; k < 1000; k++) {
    if (probGE(p, k) <= px) {
      return { x: k };
    }
  }

  return { x: 999 };
}

export function geometricStats(p, formula = false) {
  const mean = 1 / p;
  const variance = (1 - p) / (p ** 2);
  const sd = Math.sqrt(variance);

  const pDisplay = p === 1 ? 1 : p;
  const qDisplay = 1 - p;

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{1}{p}`,
      variance: String.raw`\sigma^2 = \frac{1-p}{p^2}`,
      sd: String.raw`\sigma = \sqrt{\frac{1-p}{p^2}}`,
      pmf_latex: String.raw`\mathbb{P}_{X}(x) = p(1-p)^{x-1}`,
      mgf_latex: String.raw`M(t) = \frac{pe^{t}}{1-(1-p)e^{t}}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pmf_latex: String.raw`\mathbb{P}_{X}(x) = ${pDisplay} (${qDisplay})^{x-1}`,
    mgf_latex: String.raw`M(t) = \frac{${pDisplay}e^{t}}{1-${qDisplay}e^{t}}`
  };
}