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

function mannWhitneyPmf(n1, n2) {
  const n = n1 + n2;

  if (n1 <= 0 || n2 <= 0) {
    return { u: [], p: [] };
  }

  const total = comb(n, n1);
  const minRankSum = (n1 * (n1 + 1)) / 2;
  const maxRankSum = (n1 * (2 * n - n1 + 1)) / 2;
  const maxU = n1 * n2;

  const dp = Array.from({ length: n1 + 1 }, () =>
    Array(maxRankSum + 1).fill(0)
  );
  dp[0][0] = 1;

  for (let rank = 1; rank <= n; rank++) {
    const upperK = Math.min(rank, n1);
    for (let k = upperK; k >= 1; k--) {
      for (let s = maxRankSum; s >= rank; s--) {
        dp[k][s] += dp[k - 1][s - rank];
      }
    }
  }

  const rankSumCounts = [];
  for (let s = minRankSum; s <= maxRankSum; s++) {
    rankSumCounts.push(dp[n1][s]);
  }

  const u = [];
  const p = [];

  for (let i = 0; i < rankSumCounts.length; i++) {
    const count = rankSumCounts[i];
    if (count > 0) {
      const uVal = i;
      u.push(uVal);
      p.push(count / total);
    }
  }

  return { u, p };
}

export function mannWhitneyData(n1, n2) {
  const { u, p } = mannWhitneyPmf(n1, n2);

  const x = [];
  const y = [];

  for (let i = 0; i < u.length; i++) {
    if (p[i] >= 5e-7) {
      x.push(u[i]);
      y.push(p[i]);
    }
  }

  return { x, y };
}

export function mannWhitneyProb(n1, n2, x, rel) {
  const { u, p } = mannWhitneyPmf(n1, n2);

  if (u.length === 0) {
    return { prob: fmt(0) };
  }

  let prob = 0;

  for (let i = 0; i < u.length; i++) {
    if (
      (rel === "eq" && u[i] === x) ||
      (rel === "le" && u[i] <= x) ||
      (rel === "ge" && u[i] >= x)
    ) {
      prob += p[i];
    }
  }

  return { prob: fmt(prob) };
}

export function mannWhitneyInverse(n1, n2, px, rel) {
  const { u, p } = mannWhitneyPmf(n1, n2);

  if (u.length === 0) {
    return { x: null };
  }

  if (rel === "le") {
    let cdf = 0;
    for (let i = 0; i < u.length; i++) {
      cdf += p[i];
      if (cdf >= px) {
        return { x: u[i] };
      }
    }
    return { x: u[u.length - 1] };
  }

  let sf = 0;
  for (let i = u.length - 1; i >= 0; i--) {
    sf += p[i];
    if (sf <= px) {
      return { x: u[i] };
    }
  }

  return { x: u[u.length - 1] };
}

export function mannWhitneyStats(n1, n2, formula = false) {
  const mean = (n1 * n2) / 2;
  const variance = (n1 * n2 * (n1 + n2 + 1)) / 12;
  const sd = Math.sqrt(variance);

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = \frac{n_1 n_2}{2}`,
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