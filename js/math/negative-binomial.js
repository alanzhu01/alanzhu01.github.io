import { fmt } from "./format.js";
const { jStat } = window;

function pmf(r, p, x) {
  if (!Number.isInteger(x) || x < 0) return 0;
  return jStat.negbin.pdf(x, r, p);
}

function cdf(r, p, x) {
  if (x < 0) return 0;
  return jStat.negbin.cdf(Math.floor(x), r, p);
}

function probGE(r, p, x) {
  if (x <= 0) return 1;
  return 1 - cdf(r, p, x - 1);
}

export function negbinData(r, p) {
  const x = [];
  const y = [];

  for (let k = 0; k < 1000; k++) {
    const prob = pmf(r, p, k);
    if (prob >= 5e-7) {
      x.push(k);
      y.push(prob);
    }
  }

  return { x, y };
}

export function negbinProb(r, p, x, rel) {
  let prob;

  if (rel === "eq") {
    prob = pmf(r, p, x);
  } else if (rel === "le") {
    prob = cdf(r, p, x);
  } else {
    prob = probGE(r, p, x);
  }

  return { prob: fmt(prob) };
}

export function negbinInverse(r, p, px, rel) {
  if (rel === "le") {
    return { x: jStat.negbin.inv(px, r, p) };
  }

  for (let k = 0; k < 1000; k++) {
    const tail = probGE(r, p, k);
    if (tail <= px) {
      return { x: k };
    }
  }

  return { x: 999 };
}

export function negbinStats(r, p, formula = false) {
  const mean = (r * (1 - p)) / p;
  const variance = (r * (1 - p)) / (p ** 2);
  const sd = Math.sqrt(variance);

  const pDisplay = p === 1 ? 1 : p;
  const qDisplay = 1 - p;

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{r(1-p)}{p}`,
      variance: String.raw`\sigma^2 = \frac{r(1-p)}{p^2}`,
      sd: String.raw`\sigma = \sqrt{\frac{r(1-p)}{p^2}}`,
      pmf_latex: String.raw`\mathbb{P}_{X}(x) = \binom{x+r-1}{x}(1-p)^x p^r`,
      mgf_latex: String.raw`M(t) = \left(\frac{p}{1-(1-p)e^t}\right)^r`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pmf_latex: String.raw`\mathbb{P}_{X}(x) = \binom{x+${r}-1}{x} (${qDisplay})^x (${pDisplay})^{${r}}`,
    mgf_latex: String.raw`M(t) = \left(\frac{${pDisplay}}{1-${qDisplay}e^t}\right)^{${r}}`
  };
}