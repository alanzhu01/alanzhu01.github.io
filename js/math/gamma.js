import { fmt } from "./format.js";
const { jStat } = window;

function pdf(a, b, x) {
  if (x < 0) return 0;
  return jStat.gamma.pdf(x, a, b);
}

function cdf(a, b, x) {
  if (x < 0) return 0;
  return jStat.gamma.cdf(x, a, b);
}

function probGE(a, b, x) {
  if (x <= 0) return 1;
  return 1 - cdf(a, b, x);
}

export function gammaData(a, b) {
  const x = [];
  const y = [];

  const end = a * b + 4 * Math.sqrt(a) * b;
  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = (i / (steps - 1)) * end;
    const dens = pdf(a, b, val);
    if (dens >= 5e-4) {
      x.push(val);
      y.push(dens);
    }
  }

  return { x, y };
}

export function gammaProb(a, b, x, rel) {
  let prob;

  if (rel === "le") {
    prob = cdf(a, b, x);
  } else {
    prob = probGE(a, b, x);
  }

  return { prob: fmt(prob) };
}

export function gammaInverse(a, b, px, rel) {
  let x;

  if (rel === "le") {
    x = jStat.gamma.inv(px, a, b);
  } else {
    x = jStat.gamma.inv(1 - px, a, b);
  }

  return { x: Number(x.toFixed(6)) };
}

export function gammaStats(a, b, param, formula = false) {
  const bActual = param !== "b" ? 1 / b : b;

  const mean = a * bActual;
  const variance = a * (bActual ** 2);
  const sd = Math.sqrt(variance);

  const aDisplay = Number.isInteger(a) ? a : a;
  const bDisplay = Number.isInteger(b) ? b : b;

  if (param === "b") {
    if (formula) {
      return {
        is_formula: true,
        mean: String.raw`\mu = \alpha \beta`,
        variance: String.raw`\sigma^2 = \alpha \beta ^ 2`,
        sd: String.raw`\sigma = \sqrt{\alpha \beta ^ 2}`,
        pdf_latex: String.raw`f_X(x) = \left( \frac{1}{\Gamma(\alpha) \beta^\alpha} \right) x^{\alpha - 1} e^{-x / \beta}`,
        mgf_latex: String.raw`M(t) = (1-\beta t)^{-\alpha}`
      };
    }

    return {
      is_formula: false,
      mean: fmt(mean),
      variance: fmt(variance),
      sd: fmt(sd),
      pdf_latex:
        String.raw`f_X(x) = \left(` +
        (
          bDisplay === 1
            ? String.raw`\frac{1}{\gamma(${aDisplay})}`
            : aDisplay === 1
              ? String.raw`\frac{1}{\gamma(${aDisplay}) (${bDisplay})}`
              : String.raw`\frac{1}{\gamma(${aDisplay}) ${bDisplay}^{${aDisplay}}}`
        ) +
        String.raw`\right)` +
        (
          aDisplay === 2
            ? String.raw`x`
            : aDisplay === 1
              ? String.raw``
              : String.raw`x^{${aDisplay - 1}}`
        ) +
        (
          bDisplay !== 1
            ? String.raw`e^{-x / ${bDisplay}}`
            : String.raw`e^{-x}`
        ),
      mgf_latex: String.raw`M(t) = (1-${bDisplay} t)^{-${aDisplay}}`
    };
  }

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{\alpha}{\lambda}`,
      variance: String.raw`\sigma^2 = \frac{\alpha}{\lambda ^ 2}`,
      sd: String.raw`\sigma = \sqrt{\frac{\alpha}{\lambda ^ 2}}`,
      pdf_latex: String.raw`f_X(x) = \left( \frac{\lambda^\alpha}{\Gamma(\alpha)} \right) x^{\alpha - 1} e^{-\lambda x}`,
      mgf_latex: String.raw`M(t) = (1-\frac{t}{\lambda})^{-\alpha}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd),
    pdf_latex:
      String.raw`f_X(x) = \left(` +
      (
        bDisplay === 1
          ? String.raw`\frac{1}{\gamma(${aDisplay})}`
          : aDisplay === 1
            ? String.raw`\frac{${bDisplay}}{\gamma(${aDisplay})}`
            : String.raw`\frac{${bDisplay}^{${aDisplay}}}{\gamma(${aDisplay})}`
      ) +
      String.raw`\right)` +
      (
        aDisplay === 2
          ? String.raw`x`
          : aDisplay === 1
            ? String.raw``
            : String.raw`x^{${aDisplay - 1}}`
      ) +
      (
        bDisplay !== 1
          ? String.raw`e^{-${bDisplay}x}`
          : String.raw`e^{-x}`
      ),
    mgf_latex: String.raw`M(t) = (1-\frac{t}{${bDisplay}})^{-${aDisplay}}`
  };
}