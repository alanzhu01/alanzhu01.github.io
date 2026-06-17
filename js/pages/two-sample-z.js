import * as Utils from '../utils/hypothesis-test.js';
import * as TwoSampleZ from "../math/two-sample-z.js";

const xbar1Input = document.getElementById("xbar1");
const xbar2Input = document.getElementById("xbar2");
const sigma1Input = document.getElementById("s1");
const sigma2Input = document.getElementById("s2");
const n1Input = document.getElementById("n1");
const n2Input = document.getElementById("n2");

const alphaInput = document.getElementById("a");
const mu0Input = document.getElementById("mu0");
const h1Input = document.getElementById("h1");
const altSelect = document.getElementById("h1-type");

const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");
const decisionBox = document.getElementById("decision-box");

const rawDataBtn = document.getElementById("raw-data-btn");
const rawDataModal = document.getElementById("raw-data-modal");

const rawDataInput1 = document.getElementById("raw-data-input-1");
const rawDataInput2 = document.getElementById("raw-data-input-2");

const rawDataSubmit = document.getElementById("raw-data-submit");
const rawDataCancel = document.getElementById("raw-data-cancel");
const rawDataError = document.getElementById("raw-data-error");


function setError(input, message) {
  input.setCustomValidity(message);
  input.reportValidity();
}

function clearError(input) {
  input.setCustomValidity("");
}

function normalizeXbar1() {
  if (xbar1Input.value.trim() === "") return false;

  const raw = Number(xbar1Input.value);

  if (!Number.isFinite(raw)) {
    setError(xbar1Input, "x̄₁ must be a real number");
    return false;
  }

  clearError(xbar1Input);
  return true;
}

function normalizeXbar2() {
  if (xbar2Input.value.trim() === "") return false;

  const raw = Number(xbar2Input.value);

  if (!Number.isFinite(raw)) {
    setError(xbar2Input, "x̄₂ must be a real number");
    return false;
  }

  clearError(xbar2Input);
  return true;
}

function normalizeSigma1() {
  if (sigma1Input.value.trim() === "") return false;

  const raw = Number(sigma1Input.value);

  if (!Number.isFinite(raw) || raw <= 0) {
    setError(sigma1Input, "σ₁ must be a positive real number");
    return false;
  }

  clearError(sigma1Input);
  return true;
}

function normalizeSigma2() {
  if (sigma2Input.value.trim() === "") return false;

  const raw = Number(sigma2Input.value);

  if (!Number.isFinite(raw) || raw <= 0) {
    setError(sigma2Input, "σ₂ must be a positive real number");
    return false;
  }

  clearError(sigma2Input);
  return true;
}

function normalizeN1() {
  if (n1Input.value.trim() === "") return false;

  const raw = Number(n1Input.value);

  if (!Number.isFinite(raw) || raw <= 0 || !Number.isInteger(raw)) {
    setError(n1Input, "n₁ must be a positive integer");
    return false;
  }

  clearError(n1Input);
  return true;
}

function normalizeN2() {
  if (n2Input.value.trim() === "") return false;

  const raw = Number(n2Input.value);

  if (!Number.isFinite(raw) || raw <= 0 || !Number.isInteger(raw)) {
    setError(n2Input, "n₂ must be a positive integer");
    return false;
  }

  clearError(n2Input);
  return true;
}

function normalizeAlpha() {
  if (alphaInput.value.trim() === "") return false;

  const raw = Number(alphaInput.value);

  if (!Number.isFinite(raw) || raw <= 0 || raw >= 1) {
    setError(alphaInput, "α must satisfy 0 < α < 1");
    return false;
  }

  clearError(alphaInput);
  return true;
}

function normalizeMu0() {
  if (mu0Input.value.trim() === "") return false;

  const raw = Number(mu0Input.value);

  if (!Number.isFinite(raw)) {
    setError(mu0Input, "μ must be a real number");
    return false;
  }

  clearError(mu0Input);
  return true;
}

function normalizeH1() {
  if (h1Input.value.trim() === "") return false;

  const raw = Number(h1Input.value);

  if (!Number.isFinite(raw)) {
    setError(h1Input, "μ must be a real number");
    return false;
  }

  clearError(h1Input);
  return true;
}

async function updateStats(
  xbar1,
  xbar2,
  sigma1,
  sigma2,
  n1,
  n2,
  mu0,
  alt
) {
  const formula = formulaToggle.checked ? 1 : 0;
  const alpha = parseFloat(alphaInput.value);

  const data = TwoSampleZ.twoSampleZStats(
    xbar1,
    xbar2,
    sigma1,
    sigma2,
    n1,
    n2,
    mu0,
    alt,
    alpha,
    formula
  );

  const zNode = Utils.setMath("z-stat", data.z_stat);
  const pNode = Utils.setMath("p-value", data.p_value);
  const critNode = Utils.setMath("crit-value", data.crit_value);
  const decisionNode = Utils.setMath("decision", data.decision);
  const critRuleNode = Utils.setMath("crit-rule", data.crit_rule);
  const pRuleNode = Utils.setMath("p-rule", data.p_rule);

  await Utils.typesetNodes([
    zNode,
    pNode,
    critNode,
    decisionNode,
    critRuleNode,
    pRuleNode
  ]);
}

function validInputs() {
  const xbar1 = Number(xbar1Input.value);
  const xbar2 = Number(xbar2Input.value);
  const sigma1 = Number(sigma1Input.value);
  const sigma2 = Number(sigma2Input.value);
  const n1 = Number(n1Input.value);
  const n2 = Number(n2Input.value);
  const alpha = Number(alphaInput.value);
  const mu0 = Number(mu0Input.value);

  return (
    Number.isFinite(xbar1) &&
    Number.isFinite(xbar2) &&
    Number.isFinite(sigma1) &&
    Number.isFinite(sigma2) &&
    Number.isFinite(n1) &&
    Number.isFinite(n2) &&
    Number.isFinite(alpha) &&
    Number.isFinite(mu0) &&
    Number.isInteger(n1) &&
    Number.isInteger(n2) &&
    sigma1 > 0 &&
    sigma2 > 0 &&
    n1 > 0 &&
    n2 > 0 &&
    alpha > 0 &&
    alpha < 1
  );
}

async function maybeGeneratePlot() {
  if (!validInputs()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  const xbar1 = parseFloat(xbar1Input.value);
  const xbar2 = parseFloat(xbar2Input.value);

  const sigma1 = parseFloat(sigma1Input.value);
  const sigma2 = parseFloat(sigma2Input.value);

  const n1 = parseInt(n1Input.value);
  const n2 = parseInt(n2Input.value);

  const mu0 = parseFloat(mu0Input.value);
  const alt = altSelect.value;

  Utils.showOutputs({ plotEl, statsCol });

  await updateStats(
    xbar1,
    xbar2,
    sigma1,
    sigma2,
    n1,
    n2,
    mu0,
    alt
  );

  const data = TwoSampleZ.twoSampleZData(
    xbar1,
    xbar2,
    sigma1,
    sigma2,
    n1,
    n2,
    mu0,
    alt
  );

  const z = data.z;

  Plotly.react(
    "plot",
    [
      {
        x: data.x,
        y: data.y,
        type: "scatter",
        mode: "lines",
        line: { color: Utils.cssVar("--plot-blue-bar"), width: 3 },
        fill: "tozeroy",
        fillcolor: Utils.cssVar("--plot-blue-fill"),
        hoverinfo: "skip"
      },
      {
        x: data.shade_x_left,
        y: data.shade_y_left,
        type: "scatter",
        mode: "lines",
        line: { color: Utils.cssVar("--plot-red-bar"), width: 3 },
        fill: "tozeroy",
        fillcolor: Utils.cssVar("--plot-red-fill"),
        hoverinfo: "skip"
      },
      {
        x: data.shade_x_right,
        y: data.shade_y_right,
        type: "scatter",
        mode: "lines",
        line: { color: Utils.cssVar("--plot-red-bar"), width: 3 },
        fill: "tozeroy",
        fillcolor: Utils.cssVar("--plot-red-fill"),
        hoverinfo: "skip"
      }
    ],
    {
      title: null,
      showlegend: false,
      hovermode: false,
      paper_bgcolor: Utils.cssVar("--plot-bgcolor"),
      plot_bgcolor: Utils.cssVar("--plot-bgcolor"),
      xaxis: {
        title: "z",
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      yaxis: {
        title: "f(z)",
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main")
      },
      margin: {
        t: 50,
        l: 80,
        r: 40,
        b: 80
      }
    },
    {
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false,
      dragmode: false,
      showAxisDragHandles: false,
      showAxisRangeEntryBoxes: false
    }
  );
}

Utils.onBlurOrEnter(xbar1Input, () => {
  if (!normalizeXbar1()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(xbar2Input, () => {
  if (!normalizeXbar2()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(sigma1Input, () => {
  if (!normalizeSigma1()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(sigma2Input, () => {
  if (!normalizeSigma2()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(n1Input, () => {
  if (!normalizeN1()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(n2Input, () => {
  if (!normalizeN2()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(alphaInput, () => {
  if (!normalizeAlpha()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(mu0Input, async () => {
  if (!normalizeMu0()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  syncInputs(mu0Input, h1Input);
  await maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(h1Input, async () => {
  if (!normalizeH1()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  syncInputs(h1Input, mu0Input);
  await maybeGeneratePlot();
  hideDecision();
});

altSelect.addEventListener("change", maybeGeneratePlot);

window.addEventListener("load", () => {
  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise();
  }
});

document.addEventListener("themechange", maybeGeneratePlot);

formulaToggle.addEventListener("change", maybeGeneratePlot);

let syncing = false;

function syncInputs(source, target) {
  if (syncing) return;

  syncing = true;
  target.value = source.value;
  syncing = false;
}

function hideDecision() {
  decisionBox.classList.add("masked");
  decisionBox.classList.remove("revealed");
}

function revealDecision() {
  decisionBox.classList.remove("masked");
  decisionBox.classList.add("revealed");
}

decisionBox.addEventListener("click", () => {
  if (decisionBox.classList.contains("masked")) {
    revealDecision();
  } else {
    hideDecision();
  }
});

altSelect.addEventListener("change", hideDecision);

function openRawDataModal() {
  rawDataModal.classList.remove("hidden");
  rawDataModal.setAttribute("aria-hidden", "false");

  rawDataError.textContent = "";

  rawDataInput1.focus();
}

function closeRawDataModal() {
  rawDataModal.classList.add("hidden");
  rawDataModal.setAttribute("aria-hidden", "true");

  rawDataError.textContent = "";
}

function parseRawData(text) {
  return text
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(Number);
}

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sampleStdDev(values) {
  if (values.length < 2) return 0;

  const xbar = mean(values);

  const ss = values.reduce(
    (sum, v) => sum + (v - xbar) ** 2,
    0
  );

  return Math.sqrt(ss / values.length);
}

async function applyRawData() {
  const values1 = parseRawData(rawDataInput1.value);
  const values2 = parseRawData(rawDataInput2.value);

  if (values1.length === 0 || values2.length === 0) {
    rawDataError.textContent =
      "Please enter at least one number for each sample.";
    return;
  }

  if (
    values1.some(v => !Number.isFinite(v)) ||
    values2.some(v => !Number.isFinite(v))
  ) {
    rawDataError.textContent =
      "Please enter only numbers separated by commas.";
    return;
  }

  const n1 = values1.length;
  const n2 = values2.length;

  const xbar1 = mean(values1);
  const xbar2 = mean(values2);

  const sigma1 = sampleStdDev(values1);
  const sigma2 = sampleStdDev(values2);

  xbar1Input.value = xbar1;
  xbar2Input.value = xbar2;

  sigma1Input.value = sigma1;
  sigma2Input.value = sigma2;

  n1Input.value = n1;
  n2Input.value = n2;

  closeRawDataModal();
  hideDecision();

  await maybeGeneratePlot();
}

rawDataBtn.addEventListener("click", openRawDataModal);

rawDataCancel.addEventListener("click", closeRawDataModal);

rawDataSubmit.addEventListener("click", applyRawData);

[rawDataInput1, rawDataInput2].forEach(input => {
  input.addEventListener("keydown", async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      await applyRawData();
    }

    if (e.key === "Escape") {
      closeRawDataModal();
    }
  });
});

rawDataModal.addEventListener("click", (e) => {
  if (e.target === rawDataModal) {
    closeRawDataModal();
  }
});