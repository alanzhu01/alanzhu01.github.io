import { fmt } from "./format.js";

function comb(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k)) return 0;
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return result;
}

function runsPmf(n1, n2) {
  const total = comb(n1 + n2, n1);
  const maxR = 2 * Math.min(n1, n2) + (n1 !== n2 ? 1 : 0);

  const rVals = [];
  const probs = [];

  for (let r = 2; r <= maxR; r++) {
    let p = 0;

    if (r % 2 === 0) {
      const k = r / 2;
      if (1 <= k && k <= Math.min(n1, n2)) {
        p =
          (2 *
            comb(n1 - 1, k - 1) *
            comb(n2 - 1, k - 1)) /
          total;
      }
    } else {
      const k = (r - 1) / 2;
      p =
        (comb(n1 - 1, k) * comb(n2 - 1, k - 1) +
          comb(n1 - 1, k - 1) * comb(n2 - 1, k)) /
        total;
    }

    if (p > 0) {
      rVals.push(r);
      probs.push(p);
    }
  }

  return { r: rVals, p: probs };
}

export function runsData(n1, n2) {
  const { r, p } = runsPmf(n1, n2);

  const x = [];
  const y = [];

  for (let i = 0; i < r.length; i++) {
    if (p[i] >= 5e-7) {
      x.push(r[i]);
      y.push(p[i]);
    }
  }

  return { x, y };
}

export function runsProb(n1, n2, x, rel) {
  const { r, p } = runsPmf(n1, n2);

  if (r.length === 0) {
    return { prob: fmt(0) };
  }

  let prob = 0;

  for (let i = 0; i < r.length; i++) {
    if (
      (rel === "eq" && r[i] === x) ||
      (rel === "le" && r[i] <= x) ||
      (rel === "ge" && r[i] >= x)
    ) {
      prob += p[i];
    }
  }

  return { prob: fmt(prob) };
}

export function runsInverse(n1, n2, px, rel) {
  const { r, p } = runsPmf(n1, n2);

  if (r.length === 0) {
    return { x: null };
  }

  if (rel === "le") {
    let cdf = 0;
    for (let i = 0; i < r.length; i++) {
      cdf += p[i];
      if (cdf >= px) {
        return { x: r[i] };
      }
    }
    return { x: r[r.length - 1] };
  }

  let sf = 0;
  for (let i = r.length - 1; i >= 0; i--) {
    sf += p[i];
    if (sf <= px) {
      return { x: r[i] };
    }
  }

  return { x: r[r.length - 1] };
}

export function runsStats(n1, n2, formula = false) {
  const n = n1 + n2;
  const mean = 1 + (2 * n1 * n2) / n;
  const variance =
    (2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) /
    (n ** 2 * (n - 1));
  const sd = Math.sqrt(variance);

  if (formula) {
    return {
      is_formula: true,
      mean: String.raw`\mu = 1 + \frac{2n_1 n_2}{n_1+n_2}`,
      variance: String.raw`\sigma^2 = \frac{2n_1 n_2(2n_1 n_2 - n_1 - n_2)}{(n_1+n_2)^2 (n_1+n_2-1)}`,
      sd: String.raw`\sigma = \sqrt{\frac{2n_1 n_2(2n_1 n_2 - n_1 - n_2)}{(n_1+n_2)^2 (n_1+n_2-1)}}`
    };
  }

  return {
    is_formula: false,
    mean: fmt(mean),
    variance: fmt(variance),
    sd: fmt(sd)
  };
}