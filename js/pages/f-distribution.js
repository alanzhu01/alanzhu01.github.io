import * as Utils from '../utils/continuous.js';
import * as F from "../math/f-distribution.js";

const n1Input = document.getElementById("n1");
const n2Input = document.getElementById("n2");
const xInput = document.getElementById("x");
const relSelect = document.getElementById("rel");
const pxOutput = document.getElementById("px");

const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");

let currentXValues = [];
let currentYValues = [];

function setError(input, message) {
  input.setCustomValidity(message);
  input.reportValidity();
}

function clearError(input) {
  input.setCustomValidity("");
}

async function updateStats(n1, n2) {
  const formula = formulaToggle.checked ? 1 : 0;
  const data = F.fStats(n1, n2, formula);

  const meanNode = Utils.setMath("mean", data.mean);
  const varNode  = Utils.setMath("var", data.variance);
  const sdNode   = Utils.setMath("sd", data.sd);

  const pdfNode = Utils.setMath("pdf", data.pdf_latex);
  const mgfNode = Utils.setMath("mgf", data.mgf_latex);

  await Utils.typesetNodes([meanNode, varNode, sdNode, pdfNode, mgfNode]);
}

function normalizeN1() {
  if (n1Input.value.trim() === "") return false;

  const raw = Number(n1Input.value);

  if (!Number.isFinite(raw)) {
    setError(n1Input, "ν₁ must be a positive real number");
    return false;
  }

  if (raw <= 0) {
    setError(n1Input, "ν₁ must be a positive real number");
    return false;
  }

  clearError(n1Input);
  return true;
}

function normalizeN2() {
  if (n2Input.value.trim() === "") return false;

  const raw = Number(n2Input.value);

  if (!Number.isFinite(raw)) {
    setError(n2Input, "ν₂ must be a positive real number");
    return false;
  }

  if (raw <= 0) {
    setError(n2Input, "ν₂ must be a positive real number");
    return false;
  }

  clearError(n2Input);
  return true;
}

function normalizeX() {
  if (xInput.value.trim() === "") return false;

  const raw = Number(xInput.value);

  if (!Number.isFinite(raw)) {
    setError(xInput, "x must be a nonnegative real number");
    return false;
  }

  if (raw < 0) {
    setError(xInput, "x must be a nonnegative real number");
    return false;
  }

  clearError(xInput);
  return true;
}

function normalizePX() {
  if (pxOutput.value.trim() === "") return false;

  const raw = Number(pxOutput.value);

  if (!Number.isFinite(raw)) {
    setError(pxOutput, "Probability must satisfy 0 < p < 1");
    return false;
  }

  if (raw <= 0 || raw >= 1) {
    setError(pxOutput, "Probability must satisfy 0 < p < 1");
    return false;
  }

  clearError(pxOutput);
  return true;
}

async function maybeUpdatePX() {
  const n1 = parseFloat(n1Input.value);
  const n2 = parseFloat(n2Input.value);
  const x = parseFloat(xInput.value);
  const rel = relSelect.value;

  if (!Number.isFinite(n1) || !Number.isFinite(n2) || !Number.isFinite(x) || n1 <= 0 || n2 <= 0) {
    pxOutput.value = "";
    return;
  }

  const data = F.fProb(n1, n2, x, rel);
  pxOutput.value = data.prob;
}

async function maybeUpdateX() {
  const n1 = parseFloat(n1Input.value);
  const n2 = parseFloat(n2Input.value);
  const px = parseFloat(pxOutput.value);
  const rel = relSelect.value;

  if (!Number.isFinite(n1) || !Number.isFinite(n2) || !Number.isFinite(px) || n1 <= 0 || n2 <= 0) {
    xInput.value = "";
    return;
  }

  const data = F.fInverse(n1, n2, px, rel);
  xInput.value = data.x;
  return data.x;
}

async function maybeGeneratePlot() {
  const n1 = parseFloat(n1Input.value);
  const n2 = parseFloat(n2Input.value);

  if (!Number.isFinite(n1) || !Number.isFinite(n2) || n1 <= 0 || n2 <= 0) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(n1, n2);

  const data = F.fData(n1, n2);
  currentXValues = data.x;
  currentYValues = data.y;

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
        fillcolor: { color: Utils.cssVar("--plot-blue-bar"), width: 3 },
        hoverinfo: "skip"
      },
      {
        x: [],
        y: [],
        type: "scatter",
        mode: "lines",
        line: { color: Utils.cssVar("--plot-red-bar"), width: 3 },
        fill: "tozeroy",
        line: { color: Utils.cssVar("--plot-red-bar"), width: 3 },
        hoverinfo: "skip"
      }
    ], 
    {
      title: null,
      showlegend: false,
      hovermode: "closest",
      paper_bgcolor: Utils.cssVar("--plot-bgcolor"),
      plot_bgcolor: Utils.cssVar("--plot-bgcolor"),
      xaxis: { 
        title: "x",
        showgrid: false,
        fixedrange: true,
        tickmode: "auto",
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      yaxis: { 
        title: "f(x)",
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main")
      },
      shapes: [],
      margin: {
        t: 50,
        l: 80,
        r: 80,
        b: 80
      },
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

  Utils.updatePlotHighlight({ currentXValues, currentYValues, xInput, relSelect });
}

Utils.onBlurOrEnter(n1Input, () => {
  if (!normalizeN1()) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  maybeGeneratePlot();
  maybeUpdatePX();
});

Utils.onBlurOrEnter(n2Input, () => {
  if (!normalizeN2()) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  maybeGeneratePlot();
  maybeUpdatePX();
});

Utils.onBlurOrEnter(xInput, () => {
  if (!normalizeX()) {
    pxOutput.value = "";
    return;
  }

  maybeUpdatePX();
  Utils.updatePlotHighlight({ currentXValues, currentYValues, xInput, relSelect });
});

Utils.onBlurOrEnter(pxOutput, async () => {
  if (!normalizePX()) {
    xInput.value = "";
    return;
  }

  await maybeUpdateX();
  Utils.updatePlotHighlight({ currentXValues, currentYValues, xInput, relSelect });
});

relSelect.addEventListener("change", () => { 
  maybeUpdatePX(); 
  Utils.updatePlotHighlight({ currentXValues, currentYValues, xInput, relSelect }); 
});

window.addEventListener("load", () => {
  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise();
  }
});

document.addEventListener("themechange", () => { 
  maybeGeneratePlot(); 
});

formulaToggle.addEventListener("change", () => {
  const n1 = parseFloat(n1Input.value);
  const n2 = parseFloat(n2Input.value);
  if (Number.isFinite(n1) && Number.isFinite(n2)) updateStats(n1, n2);
});