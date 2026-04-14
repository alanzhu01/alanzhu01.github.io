import { fmt } from "./format.js";

function comb(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k)) return 0;
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return Math.round(result);
}

function wilcoxonRankSumPmf(n1, n2) {
  const n = n1 + n2;

  if (n1 <= 0 || n2 <= 0) {
    return { w: [], p: [] };
  }

  const total = comb(n, n1);
  const minW = (n1 * (n1 + 1)) / 2;
  const maxW = (n1 * (2 * n - n1 + 1)) / 2;

  const dp = Array.from({ length: n1 + 1 }, () =>
    Array(maxW + 1).fill(0)
  );
  dp[0][0] = 1;

  for (let rank = 1; rank <= n; rank++) {
    const upperK = Math.min(rank, n1);
    for (let k = upperK; k >= 1; k--) {
      for (let s = maxW; s >= rank; s--) {
        dp[k][s] += dp[k - 1][s - rank];
      }
    }
  }

  const w = [];
  const p = [];

  for (let sum = minW; sum <= maxW; sum++) {
    const prob = dp[n1][sum] / total;
    if (prob > 0) {
      w.push(sum);
      p.push(prob);
    }
  }

  return { w, p };
}

export function rankSumData(n1, n2) {
  const { w, p } = wilcoxonRankSumPmf(n1, n2);

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

export function rankSumProb(n1, n2, x, rel) {
  const { w, p } = wilcoxonRankSumPmf(n1, n2);

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

export function rankSumInverse(n1, n2, px, rel) {
  const { w, p } = wilcoxonRankSumPmf(n1, n2);

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

export function rankSumStats(n1, n2, formula = false) {
  const n = n1 + n2;
  const mean = (n1 * (n + 1)) / 2;
  const variance = (n1 * n2 * (n + 1)) / 12;
  const sd = Math.sqrt(variance);

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{n_1(n_1+n_2+1)}{2}`,
      variance: String.raw`\sigma^2 = \frac{n_1 n_2 (n_1+n_2+1)}{12}`,
      sd: String.raw`\sigma = \sqrt{\frac{n_1 n_2 (n_1+n_2+1)}{12}}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd)
  };
}