import * as Utils from "../utils/hypothesis-test.js";
import * as ChiSquare from "../math/chi-square-test.js";

const alphaInput = document.getElementById("a");
const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");
const decisionBox = document.getElementById("decision-box");

const tabs = [...document.querySelectorAll(".hypothesis-tab")];
const h0Label = document.querySelector(".hypothesis-box label:first-child");
const h1Label = document.querySelector(".hypothesis-box label:last-child");

const rawDataBtn = document.getElementById("raw-data-btn");
const rawDataModal = document.getElementById("raw-data-modal");
const rawDataCancel = document.getElementById("raw-data-cancel");
const rawDataSubmit = document.getElementById("raw-data-submit");
const rawDataGrid = document.getElementById("raw-data-grid");
const rawDataRows = document.getElementById("raw-data-rows");
const rawDataCols = document.getElementById("raw-data-cols");
const rawDataError = document.getElementById("raw-data-error");

let mode = "independence";
let observedMatrix = null;
let rawGridValues = [];

function setError(input, message) {
  input.setCustomValidity(message);
  input.reportValidity();
}

function clearError(input) {
  input.setCustomValidity("");
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

function clampGridSize(value) {
  return Math.max(1, Math.min(8, Number(value) || 1));
}

function isIndependence() {
  return mode === "independence";
}

function isGoodnessOfFit() {
  return mode === "gof";
}


function validInputs() {
  const alpha = Number(alphaInput.value);

  if (!observedMatrix || !Number.isFinite(alpha) || alpha <= 0 || alpha >= 1) {
    return false;
  }

  if (isGoodnessOfFit()) {
    return (
      observedMatrix.length === 2 &&
      observedMatrix[0].length >= 2 &&
      observedMatrix[0].length <= 8
    );
  }

  return (
    observedMatrix &&
    observedMatrix.length >= 2 &&
    observedMatrix[0].length >= 2 &&
    Number.isFinite(alpha) &&
    alpha > 0 &&
    alpha < 1
  );
}

async function updateStats() {
  const formula = formulaToggle.checked ? 1 : 0;
  const alpha = parseFloat(alphaInput.value);

  const data = isGoodnessOfFit()
    ? ChiSquare.chisquareStatsGOF(observedMatrix, alpha, formula)
    : isIndependence()
      ? ChiSquare.chisquareStatsIndependence(observedMatrix, alpha, formula)
      : ChiSquare.chisquareStatsHomogeneity(observedMatrix, alpha, formula);

  const statNode = Utils.setMath("z-stat", data.test_stat ?? data.chi_stat ?? data.x2_stat);
  const pNode = Utils.setMath("p-value", data.p_value);
  const critNode = Utils.setMath("crit-value", data.crit_value);
  const decisionNode = Utils.setMath("decision", data.decision);
  const critRuleNode = Utils.setMath("crit-rule", data.crit_rule);
  const pRuleNode = Utils.setMath("p-rule", data.p_rule);

  await Utils.typesetNodes([
    statNode,
    pNode,
    critNode,
    decisionNode,
    critRuleNode,
    pRuleNode
  ]);
}

async function maybeGeneratePlot() {
  if (!validInputs()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  Utils.showOutputs({ plotEl, statsCol });

  await updateStats();

  const data = isGoodnessOfFit()
    ? ChiSquare.chisquareDataGOF(observedMatrix)
    : isIndependence()
      ? ChiSquare.chisquareDataIndependence(observedMatrix)
      : ChiSquare.chisquareDataHomogeneity(observedMatrix);

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
        x: data.shade_x,
        y: data.shade_y,
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
        title: "χ²",
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      yaxis: {
        title: "f(χ²)",
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

function updateHypotheses() {
  if (isIndependence()) {
    h0Label.innerHTML = "\\(H_0: \\text{The variables are independent}\\)";
    h1Label.innerHTML = "\\(H_1: \\text{The variables are not independent}\\)";
  } else if (isGoodnessOfFit()) {
    h0Label.innerHTML = "\\(H_0: \\text{The observed distribution fits the expected distribution}\\)";
    h1Label.innerHTML = "\\(H_1: \\text{The observed distribution does not fit the expected distribution}\\)";
  } else {
    h0Label.innerHTML = "\\(H_0: \\text{The population distributions are the same}\\)";
    h1Label.innerHTML = "\\(H_1: \\text{At least one population distribution is different}\\)";
  }

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([h0Label, h1Label]);
  }
}

tabs.forEach(tab => {
  tab.addEventListener("click", async () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    mode = tab.dataset.mode;

    updateHypotheses();
    hideDecision();

    await maybeGeneratePlot();
  });
});

function renderRawDataGrid() {
  const existingInputs = [...rawDataGrid.querySelectorAll("input")];

  rawGridValues = existingInputs.map(input => input.value);

  rawDataGrid.innerHTML = "";

  rawDataRows.max = 8;
  rawDataCols.max = 8;

  if (isGoodnessOfFit()) {
    rawDataRows.value = 2;
    rawDataRows.disabled = true;

    const cols = clampGridSize(rawDataCols.value);

    rawDataCols.value = cols;

    rawDataGrid.style.gridTemplateColumns =
      `90px repeat(${cols}, 72px)`;

    rawDataGrid.style.gridAutoRows = "34px";

    ["Observed", "Expected"].forEach((label, r) => {
      const rowLabel = document.createElement("div");

      rowLabel.className = "raw-data-row-label";
      rowLabel.textContent = label;

      rawDataGrid.appendChild(rowLabel);

      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;

        const input = document.createElement("input");

        input.type = "number";
        input.inputMode = "decimal";
        input.value = rawGridValues[i] ?? "";

        input.setAttribute(
          "aria-label",
          `${label} ${c + 1}`
        );

        rawDataGrid.appendChild(input);
      }
    });

    return;
  }

  rawDataRows.disabled = false;

  const rows = clampGridSize(rawDataRows.value);
  const cols = clampGridSize(rawDataCols.value);

  rawDataRows.value = rows;
  rawDataCols.value = cols;

  rawDataGrid.style.gridTemplateColumns =
    `repeat(${cols}, 72px)`;

  rawDataGrid.style.gridAutoRows = "34px";

  for (let i = 0; i < rows * cols; i++) {
    const input = document.createElement("input");

    input.type = "number";
    input.inputMode = "decimal";
    input.value = rawGridValues[i] ?? "";

    input.setAttribute(
      "aria-label",
      `Cell ${i + 1}`
    );

    rawDataGrid.appendChild(input);
  }
}

function openRawDataModal() {
  rawDataModal.classList.remove("hidden");
  rawDataModal.setAttribute("aria-hidden", "false");

  rawDataError.textContent = "";
  renderRawDataGrid();

  rawDataGrid.querySelector("input")?.focus();
}

function closeRawDataModal() {
  rawDataModal.classList.add("hidden");
  rawDataModal.setAttribute("aria-hidden", "true");

  rawDataError.textContent = "";
}

async function applyRawData() {
  const inputs = [...rawDataGrid.querySelectorAll("input")];
  const values = inputs.map(input => input.value.trim());

  if (values.some(value => value === "")) {
    rawDataError.textContent = "Please fill every cell before submitting.";
    return;
  }

  const numbers = values.map(Number);

  if (numbers.some(value => !Number.isFinite(value))) {
    rawDataError.textContent = "Every cell must contain a valid number.";
    return;
  }

  if (numbers.some(value => value < 0)) {
    rawDataError.textContent = "Counts cannot be negative.";
    return;
  }

  if (isGoodnessOfFit()) {
    const cols = clampGridSize(rawDataCols.value);

    if (cols < 2) {
      rawDataError.textContent = "Goodness of fit needs at least 2 categories.";
      return;
    }

    const observed = numbers.slice(0, cols);
    const expected = numbers.slice(cols, cols * 2);

    const observedTotal = observed.reduce((a, b) => a + b, 0);
    const expectedTotal = expected.reduce((a, b) => a + b, 0);

    if (Math.abs(observedTotal - expectedTotal) > 1e-10) {
      rawDataError.textContent =
        `Observed total (${observedTotal}) must equal expected total (${expectedTotal}).`;
      return;
    }

    observedMatrix = [observed, expected];
  } else {
    const rows = clampGridSize(rawDataRows.value);
    const cols = clampGridSize(rawDataCols.value);

    if (rows < 2 || cols < 2) {
      rawDataError.textContent = "Chi-square tests need at least a 2 × 2 table.";
      return;
    }

    observedMatrix = Array.from({ length: rows }, (_, r) =>
      numbers.slice(r * cols, r * cols + cols)
    );
  }

  rawGridValues = values;

  closeRawDataModal();
  hideDecision();

  await maybeGeneratePlot();
}

rawDataBtn.addEventListener("click", openRawDataModal);
rawDataCancel.addEventListener("click", closeRawDataModal);
rawDataSubmit.addEventListener("click", applyRawData);

rawDataRows.addEventListener("input", renderRawDataGrid);
rawDataCols.addEventListener("input", renderRawDataGrid);

rawDataModal.addEventListener("click", e => {
  if (e.target === rawDataModal) {
    closeRawDataModal();
  }
});

rawDataModal.addEventListener("keydown", async e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    await applyRawData();
  }

  if (e.key === "Escape") {
    closeRawDataModal();
  }
});

Utils.onBlurOrEnter(alphaInput, async () => {
  if (!normalizeAlpha()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  hideDecision();
  await maybeGeneratePlot();
});

formulaToggle.addEventListener("change", maybeGeneratePlot);

document.addEventListener("themechange", maybeGeneratePlot);

window.addEventListener("load", () => {
  updateHypotheses();

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise();
  }
});