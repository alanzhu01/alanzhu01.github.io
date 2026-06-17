import * as Utils from '../utils/hypothesis-test.js';
import * as TTest from "../math/one-sample-t.js";

const xbarInput = document.getElementById("xbar");
const sigmaInput = document.getElementById("s");
const nInput = document.getElementById("n");
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
const rawDataInput = document.getElementById("raw-data-input");
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


function normalizeXbar() {
  if (xbarInput.value.trim() === "") return false;

  const raw = Number(xbarInput.value);

  if (!Number.isFinite(raw)) {
    setError(xbarInput, "x̄ must be a real number");
    return false;
  }

  clearError(xbarInput);
  return true;
}

function normalizeSigma() {
  if (sigmaInput.value.trim() === "") return false;

  const raw = Number(sigmaInput.value);

  if (!Number.isFinite(raw) || raw <= 0) {
    setError(sigmaInput, "s must be a positive real number");
    return false;
  }

  clearError(sigmaInput);
  return true;
}

function normalizeN() {
  if (nInput.value.trim() === "") return false;

  const raw = Number(nInput.value);

  if (!Number.isFinite(raw) || raw <= 1 || !Number.isInteger(raw)) {
    setError(nInput, "n must be an integer greater than 1");
    return false;
  }

  clearError(nInput);
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

function normalizeAllInputs() {
  return (
    normalizeXbar() &&
    normalizeSigma() &&
    normalizeN() &&
    normalizeAlpha() &&
    normalizeMu0() &&
    normalizeH1()
  );
}


async function updateStats(xbar, sigma, n, mu0, alt) {
  const formula = formulaToggle.checked ? 1 : 0;
  const alpha = parseFloat(alphaInput.value);

  const data = TTest.oneSampleTStats(xbar, sigma, n, mu0, alt, alpha, formula);

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
  const xbar = parseFloat(xbarInput.value);
  const sigma = parseFloat(sigmaInput.value);
  const n = parseInt(nInput.value);
  const alpha = parseFloat(alphaInput.value);
  const mu0 = parseFloat(mu0Input.value);

  return (
    Number.isFinite(xbar) &&
    Number.isFinite(sigma) &&
    Number.isFinite(n) &&
    Number.isFinite(alpha) &&
    Number.isFinite(mu0) &&
    sigma > 0 &&
    n > 1 &&
    alpha > 0 &&
    alpha < 1
  );
}

async function maybeGeneratePlot() {
  if (!validInputs()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  const xbar = parseFloat(xbarInput.value);
  const sigma = parseFloat(sigmaInput.value);
  const n = parseInt(nInput.value);
  const mu0 = parseFloat(mu0Input.value);
  const alt = altSelect.value;

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(xbar, sigma, n, mu0, alt);

  const data = TTest.oneSampleTData(xbar, sigma, n, mu0, alt);

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
        title: "t",
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      yaxis: {
        title: "f(t)",
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

Utils.onBlurOrEnter(xbarInput, () => {
  if (!normalizeXbar()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(sigmaInput, () => {
  if (!normalizeSigma()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(nInput, () => {
  if (!normalizeN()) {
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

[
  xbarInput,
  sigmaInput,
  nInput,
  alphaInput
].forEach(input => {
  Utils.onBlurOrEnter(input, hideDecision);
});

altSelect.addEventListener("change", hideDecision);

function openRawDataModal() {
  rawDataModal.classList.remove("hidden");
  rawDataModal.setAttribute("aria-hidden", "false");
  rawDataError.textContent = "";
  rawDataInput.focus();
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
  const ss = values.reduce((sum, v) => sum + (v - xbar) ** 2, 0);
  return Math.sqrt(ss / (values.length - 1));
}

async function applyRawData() {
  const values = parseRawData(rawDataInput.value);

  if (values.length === 0) {
    rawDataError.textContent = "Please enter at least one number.";
    return;
  }

  if (values.some(v => !Number.isFinite(v))) {
    rawDataError.textContent = "Please enter only numbers separated by commas.";
    return;
  }

  const n = values.length;
  const xbar = mean(values);
  const sigma = sampleStdDev(values);

  xbarInput.value = xbar;
  sigmaInput.value = sigma;
  nInput.value = n;

  closeRawDataModal();
  hideDecision();
  await maybeGeneratePlot();
}

rawDataBtn.addEventListener("click", openRawDataModal);
rawDataCancel.addEventListener("click", closeRawDataModal);
rawDataSubmit.addEventListener("click", applyRawData);

rawDataInput.addEventListener("keydown", async (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    await applyRawData();
  }

  if (e.key === "Escape") {
    closeRawDataModal();
  }
});

rawDataModal.addEventListener("click", (e) => {
  if (e.target === rawDataModal) {
    closeRawDataModal();
  }
});