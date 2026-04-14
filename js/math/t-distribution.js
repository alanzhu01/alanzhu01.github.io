import { fmt } from "./format.js";
const { jStat } = window;

function pdf(df, x) {
  return jStat.studentt.pdf(x, df);
}

function cdf(df, x) {
  return jStat.studentt.cdf(x, df);
}

function probGE(df, x) {
  return 1 - cdf(df, x);
}

export function studenttData(df) {
  const x = [];
  const y = [];

  const end = 4;
  const start = -4;
  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = start + (i / (steps - 1)) * (end - start);
    const dens = pdf(df, val);
    if (dens >= 5e-4) {
      x.push(val);
      y.push(dens);
    }
  }

  return { x, y };
}

export function studenttProb(df, x, rel) {
  let prob;

  if (rel === "le") {
    prob = cdf(df, x);
  } else {
    prob = probGE(df, x);
  }

  return { prob: fmt(prob) };
}

export function studenttInverse(df, px, rel) {
  let x;

  if (rel === "le") {
    x = jStat.studentt.inv(px, df);
  } else {
    x = jStat.studentt.inv(1 - px, df);
  }

  return { x: Number(x.toFixed(6)) };
}

export function studenttStats(df, formula = false) {
  const mean = df > 1 ? 0 : NaN;
  const variance = df > 2 ? df / (df - 2) : df > 1 ? Infinity : NaN;
  const sd = Number.isFinite(variance) ? Math.sqrt(variance) : variance;

  const dfDisplay = Number.isInteger(df) ? df : df;

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = 0 \quad (\nu > 1)`,
      variance: String.raw`\sigma^2 = \frac{\nu}{\nu-2} \quad (\nu > 2)`,
      sd: String.raw`\sigma = \sqrt{\frac{\nu}{\nu-2}} \quad (\nu > 2)`,
      pdf_latex: String.raw`f_X(x) = \frac{\Gamma\left(\frac{\nu+1}{2}\right)}{\sqrt{\nu\pi}\,\Gamma\left(\frac{\nu}{2}\right)}\left(1+\frac{x^2}{\nu}\right)^{-\frac{\nu+1}{2}}`,
      mgf_latex: String.raw`\text{Does Not Exist}`
    };
  }

  return {
    is_formula: false,
    mean: Number.isFinite(mean) ? fmt(mean) : "undefined",
    variance: Number.isFinite(variance) ? fmt(variance) : (variance === Infinity ? "infinite" : "undefined"),
    sd: Number.isFinite(sd) ? fmt(sd) : (sd === Infinity ? "infinite" : "undefined"),
    pdf_latex: String.raw`f_X(x) = \frac{\Gamma\left(\frac{${dfDisplay}+1}{2}\right)}{\sqrt{${dfDisplay}\pi}\,\Gamma\left(\frac{${dfDisplay}}{2}\right)}\left(1+\frac{x^2}{${dfDisplay}}\right)^{-\frac{${dfDisplay}+1}{2}}`,
    mgf_latex: String.raw`\text{Does Not Exist}`
  };
}