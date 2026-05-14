import * as Utils from "../utils/hypothesis-test.js";
import * as TwoSampleT from "../math/two-sample-t.js";

const xbar1Input = document.getElementById("xbar1");
const xbar2Input = document.getElementById("xbar2");
const s1Input = document.getElementById("s1");
const s2Input = document.getElementById("s2");
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

const tabs = document.querySelectorAll(".hypothesis-tab");

let currentMode = "pooled";

function getModeFromTab(tab) {
  return tab.dataset.mode === "simple" ? "unpooled" : "pooled";
}

function getStatsFunction() {
  return currentMode === "pooled"
    ? TwoSampleT.twoSampleZStatsPooled
    : TwoSampleT.twoSampleZStatsUnpooled;
}

function getDataFunction() {
  return currentMode === "pooled"
    ? TwoSampleT.twoSampleZDataPooled
    : TwoSampleT.twoSampleZDataUnpooled;
}

async function updateStats(xbar1, xbar2, s1, s2, n1, n2, mu0, alt) {
  const formula = formulaToggle.checked ? 1 : 0;
  const alpha = parseFloat(alphaInput.value);

  const data = getStatsFunction()(
    xbar1,
    xbar2,
    s1,
    s2,
    n1,
    n2,
    mu0,
    alt,
    alpha,
    formula
  );

  const tNode = Utils.setMath("z-stat", data.z_stat ?? data.t_stat);
  const pNode = Utils.setMath("p-value", data.p_value);
  const critNode = Utils.setMath("crit-value", data.crit_value);
  const decisionNode = Utils.setMath("decision", data.decision);
  const critRuleNode = Utils.setMath("crit-rule", data.crit_rule);
  const pRuleNode = Utils.setMath("p-rule", data.p_rule);

  await Utils.typesetNodes([
    tNode,
    pNode,
    critNode,
    decisionNode,
    critRuleNode,
    pRuleNode
  ]);
}

function validInputs() {
  const xbar1 = parseFloat(xbar1Input.value);
  const xbar2 = parseFloat(xbar2Input.value);
  const s1 = parseFloat(s1Input.value);
  const s2 = parseFloat(s2Input.value);
  const n1 = parseInt(n1Input.value);
  const n2 = parseInt(n2Input.value);
  const mu0 = parseFloat(mu0Input.value);
  const alpha = parseFloat(alphaInput.value);

  return (
    Number.isFinite(xbar1) &&
    Number.isFinite(xbar2) &&
    Number.isFinite(s1) &&
    Number.isFinite(s2) &&
    Number.isFinite(n1) &&
    Number.isFinite(n2) &&
    Number.isFinite(mu0) &&
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

  const xbar1 = parseFloat(xbar1Input.value);
  const xbar2 = parseFloat(xbar2Input.value);
  const s1 = parseFloat(s1Input.value);
  const s2 = parseFloat(s2Input.value);
  const n1 = parseInt(n1Input.value);
  const n2 = parseInt(n2Input.value);
  const mu0 = parseFloat(mu0Input.value);
  const alt = altSelect.value;

  Utils.showOutputs({ plotEl, statsCol });

  await updateStats(xbar1, xbar2, s1, s2, n1, n2, mu0, alt);

  const data = getDataFunction()(xbar1, xbar2, s1, s2, n1, n2, mu0, alt);

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
      margin: { t: 50, l: 80, r: 40, b: 80 }
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

tabs.forEach(tab => {
  tab.addEventListener("click", async () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    currentMode = getModeFromTab(tab);

    hideDecision();
    await maybeGeneratePlot();
  });
});

[
  xbar1Input,
  xbar2Input,
  s1Input,
  s2Input,
  n1Input,
  n2Input,
  alphaInput,
  mu0Input
].forEach(input => {
  Utils.onBlurOrEnter(input, maybeGeneratePlot);
});

altSelect.addEventListener("change", maybeGeneratePlot);
formulaToggle.addEventListener("change", maybeGeneratePlot);
document.addEventListener("themechange", maybeGeneratePlot);

window.addEventListener("load", () => {
  const activeTab = document.querySelector(".hypothesis-tab.active");
  if (activeTab) currentMode = getModeFromTab(activeTab);

  document.getElementById("label-stat").textContent = "Test Statistic";
  if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
});

let syncing = false;

function syncInputs(source, target) {
  if (syncing) return;
  syncing = true;
  target.value = source.value;
  syncing = false;
}

Utils.onBlurOrEnter(mu0Input, () => syncInputs(mu0Input, h1Input));
Utils.onBlurOrEnter(h1Input, () => syncInputs(h1Input, mu0Input));

function hideDecision() {
  decisionBox.classList.add("masked");
  decisionBox.classList.remove("revealed");
}

function revealDecision() {
  decisionBox.classList.remove("masked");
  decisionBox.classList.add("revealed");
}

decisionBox.addEventListener("click", () => {
  decisionBox.classList.contains("masked") ? revealDecision() : hideDecision();
});

[
  xbar1Input,
  xbar2Input,
  s1Input,
  s2Input,
  n1Input,
  n2Input,
  alphaInput,
  mu0Input,
  h1Input
].forEach(input => {
  Utils.onBlurOrEnter(input, hideDecision);
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
    .filter(Boolean)
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
  const values1 = parseRawData(rawDataInput1.value);
  const values2 = parseRawData(rawDataInput2.value);

  if (values1.length < 2 || values2.length < 2) {
    rawDataError.textContent =
      "Please enter at least two numbers for each sample.";
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

  xbar1Input.value = mean(values1);
  xbar2Input.value = mean(values2);
  s1Input.value = sampleStdDev(values1);
  s2Input.value = sampleStdDev(values2);
  n1Input.value = values1.length;
  n2Input.value = values2.length;

  closeRawDataModal();
  hideDecision();

  await maybeGeneratePlot();
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