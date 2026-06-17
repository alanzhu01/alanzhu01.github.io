import * as Utils from "../utils/hypothesis-test.js";
import * as FTest from "../math/f-test.js";

const s1Input = document.getElementById("s1");
const s2Input = document.getElementById("s2");
const n1Input = document.getElementById("n1");
const n2Input = document.getElementById("n2");
const alphaInput = document.getElementById("a");

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

function normalizeS1() {
  if (s1Input.value.trim() === "") return false;
  const raw = Number(s1Input.value);

  if (!Number.isFinite(raw) || raw <= 0) {
    setError(s1Input, "s₁² must be a positive real number");
    return false;
  }

  clearError(s1Input);
  return true;
}

function normalizeS2() {
  if (s2Input.value.trim() === "") return false;
  const raw = Number(s2Input.value);

  if (!Number.isFinite(raw) || raw <= 0) {
    setError(s2Input, "s₂² must be a positive real number");
    return false;
  }

  clearError(s2Input);
  return true;
}

function normalizeN1() {
  if (n1Input.value.trim() === "") return false;
  const raw = Number(n1Input.value);

  if (!Number.isFinite(raw) || raw <= 1 || !Number.isInteger(raw)) {
    setError(n1Input, "n₁ must be an integer greater than 1");
    return false;
  }

  clearError(n1Input);
  return true;
}

function normalizeN2() {
  if (n2Input.value.trim() === "") return false;
  const raw = Number(n2Input.value);

  if (!Number.isFinite(raw) || raw <= 1 || !Number.isInteger(raw)) {
    setError(n2Input, "n₂ must be an integer greater than 1");
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

async function updateStats(s1, s2, n1, n2) {
  const formula = formulaToggle.checked ? 1 : 0;
  const alpha = parseFloat(alphaInput.value);

  const data = FTest.oneSampleFStats(s1, s2, n1, n2, alpha, formula);

  const fNode = Utils.setMath("z-stat", data.f_stat);
  const pNode = Utils.setMath("p-value", data.p_value);
  const critNode = Utils.setMath("crit-value", data.crit_value);
  const decisionNode = Utils.setMath("decision", data.decision);
  const critRuleNode = Utils.setMath("crit-rule", data.crit_rule);
  const pRuleNode = Utils.setMath("p-rule", data.p_rule);

  await Utils.typesetNodes([
    fNode,
    pNode,
    critNode,
    decisionNode,
    critRuleNode,
    pRuleNode
  ]);
}

function validInputs() {
  const s1 = parseFloat(s1Input.value);
  const s2 = parseFloat(s2Input.value);
  const n1 = Number(n1Input.value);
  const n2 = Number(n2Input.value);
  const alpha = parseFloat(alphaInput.value);

  return (
    Number.isFinite(s1) &&
    Number.isFinite(s2) &&
    Number.isFinite(n1) &&
    Number.isFinite(n2) &&
    Number.isInteger(n1) &&
    Number.isInteger(n2) &&
    Number.isFinite(alpha) &&
    s1 > 0 &&
    s2 > 0 &&
    n1 > 1 &&
    n2 > 1 &&
    alpha > 0 &&
    alpha < 1
  );
}

async function maybeGeneratePlot() {
  if (!validInputs()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  const s1 = parseFloat(s1Input.value);
  const s2 = parseFloat(s2Input.value);
  const n1 = parseInt(n1Input.value);
  const n2 = parseInt(n2Input.value);

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(s1, s2, n1, n2);

  const data = FTest.oneSampleFData(s1, s2, n1, n2);
  const f = data.f;

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
        title: "F",
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      yaxis: {
        title: "f(F)",
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

Utils.onBlurOrEnter(s1Input, () => {
  if (!normalizeS1()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  maybeGeneratePlot();
  hideDecision();
});

Utils.onBlurOrEnter(s2Input, () => {
  if (!normalizeS2()) {
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

window.addEventListener("load", () => {
  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise();
  }
});

document.addEventListener("themechange", maybeGeneratePlot);
formulaToggle.addEventListener("change", maybeGeneratePlot);

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

async function applyRawData() {
  const group1 = parseRawData(rawDataInput1.value);
  const group2 = parseRawData(rawDataInput2.value);

  if (group1.length < 2 || group2.length < 2) {
    rawDataError.textContent = "Please enter at least one number for each sample.";
    return;
  }

  if (
    group1.some(v => !Number.isFinite(v)) ||
    group2.some(v => !Number.isFinite(v))
  ) {
    rawDataError.textContent = "Please enter only numbers separated by commas.";
    return;
  }

  s1Input.value = sampleVariance(group1);
  s2Input.value = sampleVariance(group2);
  n1Input.value = group1.length;
  n2Input.value = group2.length;

  closeRawDataModal();
  hideDecision();
  await maybeGeneratePlot();
}

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sampleVariance(values) {
  if (values.length < 2) return 0;

  const xbar = mean(values);
  const ss = values.reduce((sum, v) => sum + (v - xbar) ** 2, 0);
  return ss / (values.length - 1);
}

rawDataBtn.addEventListener("click", openRawDataModal);
rawDataCancel.addEventListener("click", closeRawDataModal);
rawDataSubmit.addEventListener("click", applyRawData);

[rawDataInput1, rawDataInput2].forEach(input => {
  input.addEventListener("keydown", async e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      await applyRawData();
    }

    if (e.key === "Escape") {
      closeRawDataModal();
    }
  });
});

rawDataModal.addEventListener("click", e => {
  if (e.target === rawDataModal) {
    closeRawDataModal();
  }
});