import { fmt } from "./format.js";

const { jStat } = window;

let trueP = null;
let hasStarted = false;

const BINOMIAL_SCENARIOS = [
  {
    intro: (n, red) =>
      `You find a candy machine with red and blue candies, and you want to estimate the true proportion of red candies in the machine.\n\nYou dispense ${n} candies and ${red} of them are red.`,
    next: (n, red) =>
      `You dispense another ${n} candies and ${red} of them are red.`
  },
  {
    intro: (n, made) =>
      `You are watching a professional basketball player make free throws, and you want to estimate the basketball player's true free throw percentage.\n\nThey shoot ${n} free throws and make ${made}.`,
    next: (n, made) =>
      `They shoot another ${n} free throws and make ${made}.`
  },
  {
    intro: (n, defective) =>
      `You are inspecting light bulbs produced at a factory, and you want to estimate the true defect rate of light bulbs.\n\nYou inspect ${n} bulbs and find ${defective} defective.`,
    next: (n, defective) =>
      `You inspect another ${n} bulbs and find ${defective} defective.`
  }
];

const POISSON_SCENARIOS = [
  {
    intro: (sum, n) =>
      `You are counting the number of calls arriving at a call center each hour, and you want to estimate the true arrival rate of calls.\n\nYou observe ${sum} calls arrive over ${n} hours.`,
    next: (sum, n) =>
      `You observe another ${sum} calls arrive over ${n} hours.`
  },
  {
    intro: (sum, n) =>
      `You are tracking the number of patients arriving at an emergency room each hour, and you want to estimate the true arrival rate of patients.\n\nYou observe ${sum} patients arrival over ${n} hours.`,
    next: (sum, n) =>
      `You observe another ${sum} patient arrivals over ${n} hours.`
  },
  {
    intro: (sum, n) =>
      `You are monitoring the number of cars arriving at a toll booth each minute, and you want to estimate the true arrival rate of cars.\n\nYou observe ${sum} cars arrive over ${n} minutes.`,
    next: (sum, n) =>
      `You observe another ${sum} cars arrive over ${n} minutes.`
  }
];

let currentBinomialScenario = null;
let currentPoissonScenario = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function betaMean(a, b) {
  return a / (a + b);
}

function betaPdf(a, b, x) {
  if (x < 0 || x > 1) return 0;
  return jStat.beta.pdf(x, a, b);
}

function betaCdf(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return jStat.beta.cdf(x, a, b);
}

export function betaData(a, b) {
  const x = [];
  const y = [];
  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = i / (steps - 1);
    const dens = betaPdf(a, b, val);

    if (Number.isFinite(dens) && dens >= 5e-4) {
      x.push(val);
      y.push(dens);
    }
  }

  return { x, y };
}

export function betaProbability(a, b, x, rel = "ge") {
  let prob;

  if (rel === "le") {
    prob = betaCdf(a, b, x);
  } else {
    prob = 1 - betaCdf(a, b, x);
  }

  return prob;
}

export function betaCredibleInterval(a, b, level = 0.95) {
  const tail = (1 - level) / 2;

  return {
    lower: jStat.beta.inv(tail, a, b),
    upper: jStat.beta.inv(1 - tail, a, b)
  };
}

export function posteriorParams(priorAlpha, priorBeta, heads, tails) {
  return {
    posteriorAlpha: priorAlpha + heads,
    posteriorBeta: priorBeta + tails
  };
}

function binomialSample(n, p) {
  let successes = 0;

  for (let i = 0; i < n; i++) {
    if (Math.random() < p) successes++;
  }

  return successes;
}

export function generateBayesianBinomialScenario(priorAlpha = 2, priorBeta = 2, options = {}) {
  const trueP = options.randomize
    ? Math.random()
    : Number(options.trueP);

  const n = randInt(5, 20);
  const red = binomialSample(n, trueP);
  const blue = n - red;

  const { posteriorAlpha, posteriorBeta } = posteriorParams(
    priorAlpha,
    priorBeta,
    red,
    blue
  );

  if (!hasStarted) {
    currentBinomialScenario = choice(BINOMIAL_SCENARIOS);
  }

  const selectedScenario = currentBinomialScenario;

  const scenario = !hasStarted
    ? selectedScenario.intro(n, red)
    : selectedScenario.next(n, red);

  hasStarted = true;

  return {
    scenario,
    priorAlpha,
    priorBeta,
    heads: red,
    tails: blue,
    red,
    blue,
    n,
    posteriorAlpha,
    posteriorBeta,
    trueP
  };
}


function gammaMean(a, b) {
  return a / b; // rate parameterization
}

function gammaVariance(a, b) {
  return a / (b * b);
}

function gammaPdf(a, b, x) {
  if (x < 0) return 0;
  return jStat.gamma.pdf(x, a, 1 / b);
}

function gammaCdf(a, b, x) {
  if (x <= 0) return 0;
  return jStat.gamma.cdf(x, a, 1 / b);
}

export function gammaProbability(a, b, x, rel = "ge") {
  const prob = gammaCdf(a, b, x);
  return rel === "le" ? prob : 1 - prob;
}

export function gammaCredibleInterval(a, b, level = 0.95) {
  const tail = (1 - level) / 2;

  return {
    lower: jStat.gamma.inv(tail, a, 1 / b),
    upper: jStat.gamma.inv(1 - tail, a, 1 / b)
  };
}

export function gammaData(a, b) {
  const x = [];
  const y = [];
  const mean = gammaMean(a, b);
  const sd = Math.sqrt(gammaVariance(a, b));
  const maxX = Math.max(5, mean + 5 * sd);
  const steps = 1000;

  for (let i = 0; i < steps; i++) {
    const val = (i / (steps - 1)) * maxX;
    const dens = gammaPdf(a, b, val);

    if (Number.isFinite(dens) && dens >= 5e-4) {
      x.push(val);
      y.push(dens);
    }
  }

  return { x, y };
}

function poissonSample(lambda) {
  let l = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= Math.random();
  } while (p > l);

  return k - 1;
}

function randomLambda() {
  return 0.25 + Math.random() * 9.75;
}

export function generateBayesianPoissonScenario(priorAlpha = 2, priorBeta = 2, options = {}) {
  const lambda = options.randomize ? randomLambda() : Number(options.trueP);

  if (!hasStarted) {
    const generatedPrior = generateGammaPriorFromHiddenData(lambda);
    priorAlpha = generatedPrior.priorAlpha;
    priorBeta = generatedPrior.priorBeta;
  }

  const n = randInt(2, 6);

  const observations = Array.from({ length: n }, () => poissonSample(lambda));
  const sum = observations.reduce((a, b) => a + b, 0);

  const posteriorAlpha = priorAlpha + sum;
  const posteriorBeta = priorBeta + n;

  if (!hasStarted) {
    currentPoissonScenario = choice(POISSON_SCENARIOS);
  }

  const selectedScenario = currentPoissonScenario;

  const scenario = !hasStarted
    ? selectedScenario.intro(sum, n)
    : selectedScenario.next(sum, n);

  hasStarted = true;

  return {
    scenario,
    priorAlpha,
    priorBeta,
    observations,
    sum,
    n,
    posteriorAlpha,
    posteriorBeta,
    trueP: lambda
  };
}

function generateGammaPriorFromHiddenData(trueLambda) {
  const hiddenHours = 1;
  const hiddenSum = Array.from(
    { length: hiddenHours },
    () => poissonSample(trueLambda)
  ).reduce((a, b) => a + b, 0);

  return {
    priorAlpha: hiddenSum || 1,
    priorBeta: hiddenHours
  };
}