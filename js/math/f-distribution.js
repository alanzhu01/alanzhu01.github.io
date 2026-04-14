import { fmt } from "./format.js";
const { jStat } = window;

function pdf(d1, d2, x) {
  if (x < 0) return 0;
  return jStat.centralF.pdf(x, d1, d2);
}

function cdf(d1, d2, x) {
  if (x < 0) return 0;
  return jStat.centralF.cdf(x, d1, d2);
}

function probGE(d1, d2, x) {
  if (x <= 0) return 1;
  return 1 - cdf(d1, d2, x);
}

export function fData(d1, d2) {
  const x = [];
  const y = [];

  const mean = d2 > 2 ? d2 / (d2 - 2) : 1;
  const end = mean * 4;
  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = (i / (steps - 1)) * end;
    const dens = pdf(d1, d2, val);
    if (dens >= 5e-4) {
      x.push(val);
      y.push(dens);
    }
  }

  return { x, y };
}

export function fProb(d1, d2, x, rel) {
  let prob;

  if (rel === "le") {
    prob = cdf(d1, d2, x);
  } else {
    prob = probGE(d1, d2, x);
  }

  return { prob: fmt(prob) };
}

export function fInverse(d1, d2, px, rel) {
  let x;

  if (rel === "le") {
    x = jStat.centralF.inv(px, d1, d2);
  } else {
    x = jStat.centralF.inv(1 - px, d1, d2);
  }

  return { x: Number(x.toFixed(6)) };
}

export function fStats(d1, d2, formula = false) {
  const mean = d2 > 2 ? d2 / (d2 - 2) : NaN;
  const variance =
    d2 > 4
      ? (2 * d2 ** 2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) ** 2 * (d2 - 4))
      : NaN;
  const sd = Number.isFinite(variance) ? Math.sqrt(variance) : variance;

  const d1Display = Number.isInteger(d1) ? d1 : d1;
  const d2Display = Number.isInteger(d2) ? d2 : d2;

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{d_2}{d_2-2} \quad (d_2 > 2)`,
      variance: String.raw`\sigma^2 = \frac{2 d_2^2 (d_1 + d_2 - 2)}{d_1 (d_2 - 2)^2 (d_2 - 4)} \quad (d_2 > 4)`,
      sd: String.raw`\sigma = \sqrt{\frac{2 d_2^2 (d_1 + d_2 - 2)}{d_1 (d_2 - 2)^2 (d_2 - 4)}}`,
      pdf_latex: String.raw`f_X(x)=\frac{1}{B(d_1/2,d_2/2)}\left(\frac{d_1}{d_2}\right)^{d_1/2} x^{d_1/2-1}\left(1+\frac{d_1}{d_2}x\right)^{-(d_1+d_2)/2}`,
      mgf_latex: String.raw`\text{Does not exist}`
    };
  }

  return {
    is_formula: false,
    mean: Number.isFinite(mean) ? fmt(mean) : "undefined",
    variance: Number.isFinite(variance) ? fmt(variance) : "undefined",
    sd: Number.isFinite(sd) ? fmt(sd) : "undefined",
    pdf_latex: String.raw`f_X(x)=\frac{1}{B(${d1Display}/2,${d2Display}/2)}\left(\frac{${d1Display}}{${d2Display}}\right)^{${d1Display}/2} x^{${d1Display}/2-1}\left(1+\frac{${d1Display}}{${d2Display}}x\right)^{-\frac{${d1Display}+${d2Display}}{2}}`,
    mgf_latex: String.raw`\text{Does not exist}`
  };
}