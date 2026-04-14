import { fmt } from "./format.js";

function wilcoxonSignedRankPmf(n) {
  if (n <= 0) {
    return { w: [], p: [] };
  }

  const maxW = (n * (n + 1)) / 2;
  const total = 2 ** n;

  const dp = Array(maxW + 1).fill(0);
  dp[0] = 1;

  for (let rank = 1; rank <= n; rank++) {
    for (let s = maxW; s >= rank; s--) {
      dp[s] += dp[s - rank];
    }
  }

  const w = [];
  const p = [];

  for (let i = 0; i <= maxW; i++) {
    const prob = dp[i] / total;
    if (prob > 0) {
      w.push(i);
      p.push(prob);
    }
  }

  return { w, p };
}

export function signedRankData(n) {
  const { w, p } = wilcoxonSignedRankPmf(n);

  const x = [];
  const y = [];

  for (let i = 0; i < w.length; i++) {
    if (p[i] >= 5e-7) {
      x.push(w[i]);
      y.push(p[i]);
    }
  }

  return { x, y };
}

export function signedRankProb(n, x, rel) {
  const { w, p } = wilcoxonSignedRankPmf(n);

  if (w.length === 0) {
    return { prob: fmt(0) };
  }

  let prob = 0;

  for (let i = 0; i < w.length; i++) {
    if (
      (rel === "eq" && w[i] === x) ||
      (rel === "le" && w[i] <= x) ||
      (rel === "ge" && w[i] >= x)
    ) {
      prob += p[i];
    }
  }

  return { prob: fmt(prob) };
}

export function signedRankInverse(n, px, rel) {
  const { w, p } = wilcoxonSignedRankPmf(n);

  if (w.length === 0) {
    return { x: null };
  }

  if (rel === "le") {
    let cdf = 0;
    for (let i = 0; i < w.length; i++) {
      cdf += p[i];
      if (cdf >= px) {
        return { x: w[i] };
      }
    }
    return { x: w[w.length - 1] };
  }

  let sf = 0;
  for (let i = w.length - 1; i >= 0; i--) {
    sf += p[i];
    if (sf <= px) {
      return { x: w[i] };
    }
  }

  return { x: w[w.length - 1] };
}

export function signedRankStats(n, formula = false) {
  const mean = (n * (n + 1)) / 4;
  const variance = (n * (n + 1) * (2 * n + 1)) / 24;
  const sd = Math.sqrt(variance);

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{n(n+1)}{4}`,
      variance: String.raw`\sigma^2 = \frac{n(n+1)(2n+1)}{24}`,
      sd: String.raw`\sigma = \sqrt{\frac{n(n+1)(2n+1)}{24}}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd)
  };
}