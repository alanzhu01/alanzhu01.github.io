import { generateDistribution } from "../math/distribution-matching.js";

let allowedDistKeys = null;

let totalQuestions = 10;
let questionIndex = 0;
let correctCount = 0;
let score = 0;
let gameActive = false;

const startScreenEl = document.getElementById("start-menu");
const gameScreenEl = document.getElementById("game-screen");
const endScreenEl = document.getElementById("end-screen");

const questionCountEl = document.getElementById("question-count");

const scoreValEl = document.getElementById("score-val");
const qnumValEl = document.getElementById("qnum-val");
const qtotalValEl = document.getElementById("qtotal-val");

const finalScoreEl = document.getElementById("final-score");
const finalCorrectEl = document.getElementById("final-correct");
const finalTotalEl = document.getElementById("final-total");

const playAgainBtn = document.getElementById("play-again");
const startBtn = document.getElementById("start-btn");

const submitBtn = document.getElementById("submit-guess");
submitBtn.hidden = true;

const continueBtn = document.getElementById("continue-btn");
continueBtn.hidden = true;

function nearlyEqual(a, b, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function makeLabeledInput({ label, name, step = "any", tip = "" }) {
  const wrap = document.createElement("div");
  wrap.className = "param-field";

  const lab = document.createElement("label");
  lab.setAttribute("for", `param-${name}`);
  lab.innerHTML = `\\(${label}\\) =`;

  const tipWrap = document.createElement("div");
  tipWrap.className = "has-tip";

  const input = document.createElement("input");
  input.id = `param-${name}`;
  input.name = name;
  input.type = "number";
  input.step = step;
  input.autocomplete = "off";

  tipWrap.appendChild(input);

  if (tip) {
    const tipEl = document.createElement("div");
    tipEl.className = "tip";
    tipEl.textContent = tip;
    tipWrap.appendChild(tipEl);
  }

  wrap.appendChild(lab);
  wrap.appendChild(tipWrap);

  return { wrap, input };
}

const DISTRIBUTIONS = [
  {
    key: "binomial",
    label: "Binomial",
    params: [
      { key: "n", label: "n", type: "int", tip: "Number of trials" },
      { key: "p", label: "p", type: "float", tip: "Probability of success" }
    ]
  },
  {
    key: "geometric",
    label: "Geometric",
    params: [
      { key: "p", label: "p", type: "float", tip: "Probability of success" }
    ]
  },
  {
    key: "hypergeometric",
    label: "Hypergeometric",
    params: [
      { key: "N", label: "N", type: "int", tip: "Population size" },
      { key: "r", label: "r", type: "int", tip: "Number of successes" },
      { key: "n", label: "n", type: "int", tip: "Sample size" }
    ]
  },
  {
    key: "poisson",
    label: "Poisson",
    params: [
      { key: "l", label: "\\lambda", type: "float", tip: "Rate" }
    ]
  },
  {
    key: "negative-binomial",
    label: "Negative Binomial",
    params: [
      { key: "r", label: "r", type: "int", tip: "Number of successes" },
      { key: "p", label: "p", type: "float", tip: "Probability of success" }
    ]
  },
  {
    key: "uniform",
    label: "Uniform",
    params: [
      { key: "a", label: "a", type: "float", tip: "Minimum value" },
      { key: "b", label: "b", type: "float", tip: "Maximum value" }
    ]
  },
  {
    key: "normal",
    label: "Normal",
    params: [
      { key: "m", label: "\\mu", type: "float", tip: "Mean" },
      { key: "s", label: "\\sigma", type: "float", tip: "Standard deviation" }
    ]
  },
  {
    key: "exponential",
    label: "Exponential",
    params: [
      { key: "l", label: "\\lambda", type: "float", tip: "Rate" }
    ]
  },
  {
    key: "gamma",
    label: "Gamma",
    params: [
      { key: "a", label: "\\alpha", type: "int", tip: "Shape" },
      { key: "l", label: "\\lambda", type: "float", tip: "Rate" }
    ]
  },
  {
    key: "beta",
    label: "Beta",
    params: [
      { key: "a", label: "\\alpha", type: "float", tip: "Shape" },
      { key: "b", label: "\\beta", type: "float", tip: "Scale" }
    ]
  }
];

const DIST_BY_KEY = new Map(DISTRIBUTIONS.map(d => [d.key, d]));

let current = null;

const promptEl = document.getElementById("prompt-text");
const selectEl = document.getElementById("distribution-selection");
const paramsEl = document.getElementById("param-inputs");
const feedbackEl = document.getElementById("feedback");


function renderParameterInputs(distKey) {
  clearEl(paramsEl);

  if (!distKey || !DIST_BY_KEY.has(distKey)) {
    updateSubmitVisibility();
    return;
  }

  const dist = DIST_BY_KEY.get(distKey);

  dist.params.forEach(p => {
    const step = p.type === "int" ? "1" : "0.01";
    const { wrap } = makeLabeledInput({
      label: p.label,
      name: p.key,
      step,
      tip: p.tip || ""
    });
    paramsEl.appendChild(wrap);
  });

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetClear([paramsEl]);
    MathJax.typesetPromise([paramsEl]);
  }

  updateSubmitVisibility();
}


async function newPrompt() {
  if (!gameActive) return;

  feedbackEl.textContent = "";
  submitBtn.disabled = false;
  continueBtn.hidden = true;
  submitBtn.hidden = true;

  setInputsDisabled(false);

  selectEl.value = "";
  renderParameterInputs("");
  setSubmitVisible(false);

  try {
    const allowed = allowedDistKeys?.length
      ? allowedDistKeys.join(",")
      : "";

    const data = await generateDistribution(allowed);

    current = {
      distKey: data.distribution,
      params: data.params
    };

    promptEl.textContent = data.prompt;

  } catch (err) {
    promptEl.textContent =
  `ERROR

  ${err?.message ?? "Unknown error"}

  STACK TRACE:
  ${err?.stack ?? "No stack trace available"}`;
  }
}

function readUserParams(distKey) {
  const dist = DIST_BY_KEY.get(distKey);
  const out = {};

  for (const p of dist.params) {
    const input = paramsEl.querySelector(`input[name="${p.key}"]`);
    const raw = input?.value;

    if (raw === "" || raw == null) {
      return { ok: false, error: "Please fill in all parameters." };
    }

    const num = Number(raw);
    if (!Number.isFinite(num)) {
      return { ok: false, error: "Parameters must be valid numbers." };
    }

    if (p.type === "int") {
      if (!Number.isInteger(num)) {
        return { ok: false, error: "Integer parameters must be whole numbers." };
      }
    }

    out[p.key] = num;
  }

  return { ok: true, values: out };
}

function formatParamsLatex(distKey, params) {
  const dist = DIST_BY_KEY.get(distKey);
  if (!dist) return "";

  return dist.params
    .map(p => {
      const v = params[p.key];
      return `\\(${p.label}=${v}\\)`;
    })
    .join(", ");
}

function setFeedback(html) {
  feedbackEl.innerHTML = html;

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetClear([feedbackEl]);
    MathJax.typesetPromise([feedbackEl]);
  }
}

function checkAnswer(selectedKey, userParams) {
  if (!current) return { correct: false, message: "No prompt loaded." };

  const correctKey = current.distKey;

  if (selectedKey !== correctKey) {
    const correctDist = DIST_BY_KEY.get(correctKey)?.label ?? correctKey;
    return {
      correct: false,
      message: `Your answer is <strong>incorrect</strong>. The correct distribution is <strong>${correctDist}</strong>(${formatParamsLatex(correctKey, current.params)}).`
    };
  }

  const dist = DIST_BY_KEY.get(selectedKey);

  for (const p of dist.params) {
    const key = p.key;

    const expected = Number(current.params[key]);
    const got = Number(userParams[key]);

    if (got === undefined) {
      const correctDist = dist.label;
      return {
        correct: false,
        message: `Your answer is <strong>incorrect</strong>. The correct distribution is <strong>${correctDist}</strong>(${formatParamsLatex(correctKey, current.params)}).`
      };
    }

    if (p.type === "int") {
      if (got !== expected) {
        return {
          correct: false,
          message: `Your answer is <strong>incorrect</strong>. The correct distribution is <strong>${dist.label}</strong>(${formatParamsLatex(correctKey, current.params)}).`
        };
      }
    } else {
      if (!nearlyEqual(got, expected)) {
        return {
          correct: false,
          message: `Your answer is <strong>incorrect</strong>. The correct distribution is <strong>${dist.label}</strong>(${formatParamsLatex(correctKey, current.params)}).`
        };
      }
    }
  }

  return { correct: true, message: "Your answer is <strong>correct</strong>!" };
}

submitBtn.addEventListener("click", () => {
  if (!gameActive) return;

  const selectedKey = selectEl.value;

  if (!selectedKey) {
    feedbackEl.textContent = "Pick a distribution first.";
    return;
  }

  if (!DIST_BY_KEY.has(selectedKey)) {
    feedbackEl.textContent = "Unknown distribution selection.";
    return;
  }

  const read = readUserParams(selectedKey);
  if (!read.ok) {
    feedbackEl.textContent = read.error;
    return;
  }

  const result = checkAnswer(selectedKey, read.values);
  setFeedback(result.message);

  if (result.correct) {
    correctCount++;
    score++;
  }

  updateScorebar();

  submitBtn.disabled = true;
  setSubmitVisible(false);
  setInputsDisabled(true);
  continueBtn.hidden = false;
});

startBtn.addEventListener("click", async () => {
  startErrorEl.textContent = "";

  const selected = getSelectedDistKeys();
  if (selected.length === 0) {
    startErrorEl.textContent = "Select at least one distribution.";
    return;
  }

  allowedDistKeys = selected;
  await startGame();
});

const checklistEl = document.getElementById("dist-checklist");
const startErrorEl = document.getElementById("start-error");
const selectAllBtn = document.getElementById("select-all");
const selectNoneBtn = document.getElementById("select-none");

function renderChecklist() {
  clearEl(checklistEl);

  for (const d of DISTRIBUTIONS) {
    const row = document.createElement("label");
    row.className = "check-row";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = d.key;
    cb.checked = true;

    const text = document.createElement("span");
    text.textContent = d.label;

    row.appendChild(cb);
    row.appendChild(text);
    checklistEl.appendChild(row);
  }
}

function getSelectedDistKeys() {
  const boxes = checklistEl.querySelectorAll('input[type="checkbox"]');
  return Array.from(boxes)
    .filter(b => b.checked)
    .map(b => b.value);
}

selectAllBtn.addEventListener("click", () => {
  checklistEl.querySelectorAll('input[type="checkbox"]').forEach(b => (b.checked = true));
});

selectNoneBtn.addEventListener("click", () => {
  checklistEl.querySelectorAll('input[type="checkbox"]').forEach(b => (b.checked = false));
});

renderChecklist();

function updateScorebar() {
  scoreValEl.textContent = String(score);
  qnumValEl.textContent = String(Math.min(questionIndex + 1, totalQuestions));
  qtotalValEl.textContent = String(totalQuestions);
}

function showStart() {
  startScreenEl.hidden = false;
  gameScreenEl.hidden = true;
  endScreenEl.hidden = true;
  gameActive = false;
}

function showGame() {
  startScreenEl.hidden = true;
  gameScreenEl.hidden = false;
  endScreenEl.hidden = true;
}

function showEnd() {
  startScreenEl.hidden = true;
  gameScreenEl.hidden = true;
  endScreenEl.hidden = false;

  finalScoreEl.textContent = String(score);
  finalCorrectEl.textContent = String(correctCount);
  finalTotalEl.textContent = String(totalQuestions);

  gameActive = false;
}

async function startGame() {
  totalQuestions = Number(questionCountEl.value || 10);
  questionIndex = 0;
  correctCount = 0;
  score = 0;
  gameActive = true;

  updateScorebar();
  showGame();
  await newPrompt();
}

async function nextQuestionOrEnd() {
  questionIndex++;

  if (questionIndex >= totalQuestions) {
    showEnd();
    return;
  }

  updateScorebar();
  await newPrompt();
}

playAgainBtn.addEventListener("click", () => {
  showStart();
});

showStart();

function setSubmitVisible(isVisible) {
  submitBtn.hidden = !isVisible;
}

function allParamsFilled() {
  const inputs = paramsEl.querySelectorAll('input[type="number"]');
  if (inputs.length === 0) return false;

  return Array.from(inputs).every(inp => inp.value.trim() !== "");
}

function updateSubmitVisibility() {
  const hasDist = !!selectEl.value;
  setSubmitVisible(hasDist && allParamsFilled());
}

paramsEl.addEventListener("input", (e) => {
  if (e.target.matches('input[type="number"]')) {
    updateSubmitVisibility();
  }
});

selectEl.addEventListener("change", e => {
  renderParameterInputs(e.target.value);
  updateSubmitVisibility();
});

continueBtn.addEventListener("click", async () => {
  if (!gameActive) return;

  continueBtn.hidden = true;
  setFeedback("");
  await nextQuestionOrEnd();
});

function setInputsDisabled(disabled) {
  selectEl.disabled = disabled;
  paramsEl.querySelectorAll('input[type="number"]').forEach(i => (i.disabled = disabled));
}