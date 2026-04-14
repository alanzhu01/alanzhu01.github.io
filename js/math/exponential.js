import { fmt } from "./format.js";
const { jStat } = window;

function pdf(b, x) {
  if (x < 0) return 0;
  return jStat.exponential.pdf(x, 1 / b);
}

function cdf(b, x) {
  if (x < 0) return 0;
  return jStat.exponential.cdf(x, 1 / b);
}

function probGE(b, x) {
  if (x <= 0) return 1;
  return 1 - cdf(b, x);
}

export function exponentialData(b) {
  const x = [];
  const y = [];

  const end = 4 * b;
  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = (i / (steps - 1)) * end;
    const dens = pdf(b, val);
    if (dens >= 5e-4) {
      x.push(val);
      y.push(dens);
    }
  }

  return { x, y };
}

export function exponentialProb(b, x, rel) {
  let prob;

  if (rel === "le") {
    prob = cdf(b, x);
  } else {
    prob = probGE(b, x);
  }

  return { prob: fmt(prob) };
}

export function exponentialInverse(b, px, rel) {
  let x;

  if (rel === "le") {
    x = jStat.exponential.inv(px, 1 / b);
  } else {
    x = jStat.exponential.inv(1 - px, 1 / b);
  }

  return { x: Number(x.toFixed(6)) };
}

export function exponentialStats(b, param, formula = false) {
  const bActual = param !== "b" ? 1 / b : b;

  const mean = bActual;
  const variance = bActual ** 2;
  const sd = bActual;

  const bDisplay = Number.isInteger(b) ? b : b;

  if (param === "b") {
    if (formula) {
      return {
        is_formula: true,
        mean: String.raw`\mu = \beta`,
        variance: String.raw`\sigma^2 = \beta^2`,
        sd: String.raw`\sigma = \beta`,
        pdf_latex: String.raw`f_X(x) = \frac{1}{\beta}e^{-x/\beta}`,
        mgf_latex: String.raw`M(t) = \frac{1}{1-\beta t}`
      };
    }

    return {
      is_formula: false,
      mean: fmt(mean),
      variance: fmt(variance),
      sd: fmt(sd),
      pdf_latex:
        String.raw`f_X(x) =` +
        (bDisplay !== 1 ? String.raw`\frac{1}{${bDisplay}}` : String.raw``) +
        (bDisplay !== 1 ? String.raw`e^{-x/${bDisplay}}` : String.raw`e^{-x}`),
      mgf_latex:
        bDisplay !== 1
          ? String.raw`M(t) = \frac{1}{1-${bDisplay} t}`
          : String.raw`M(t) = \frac{1}{1-t}`
    };
  }

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{1}{\lambda}`,
      variance: String.raw`\sigma^2 = \frac{1}{\lambda^2}`,
      sd: String.raw`\sigma = \frac{1}{\lambda}`,
      pdf_latex: String.raw`f_X(x) = \lambda e^{-\lambda x}`,
      mgf_latex: String.raw`M(t) = \frac{\lambda}{\lambda-t}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pdf_latex:
      String.raw`f_X(x) =` +
      (bDisplay !== 1 ? String.raw`${bDisplay}` : String.raw``) +
      (bDisplay !== 1 ? String.raw`e^{-${bDisplay}x}` : String.raw`e^{-x}`),
    mgf_latex: String.raw`M(t) = \frac{${bDisplay}}{${bDisplay}-t}`
  };
}