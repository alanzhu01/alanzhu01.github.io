import * as Utils from '../utils/continuous.js';
import * as Beta from "../math/beta.js";

const aInput = document.getElementById("a");
const bInput = document.getElementById("b");
const xInput = document.getElementById("x");
const relSelect = document.getElementById("rel");
const pxOutput = document.getElementById("px");

const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");

let currentXValues = [];
let currentYValues = [];

async function updateStats(a, b) {
  const formula = formulaToggle.checked ? 1 : 0;
  const data = Beta.betaStats(a, b, formula);

  const meanNode = Utils.setMath("mean", data.mean);
  const varNode  = Utils.setMath("var", data.variance);
  const sdNode   = Utils.setMath("sd", data.sd);

  const pdfNode = Utils.setMath("pdf", data.pdf_latex);
  const mgfNode = Utils.setMath("mgf", data.mgf_latex);

  await Utils.typesetNodes([meanNode, varNode, sdNode, pdfNode, mgfNode]);
}

function normalizeA() {
  if (aInput.value.trim() === "") return false;

  const raw = Number(aInput.value);

  if (!Number.isFinite(raw)) return false;
  
  const a = Utils.clamp(raw, 0, Infinity);
  aInput.value = a;
  return true;
}

function normalizeB() {
  if (bInput.value.trim() === "") return false;

  const raw = Number(bInput.value);

  if (!Number.isFinite(raw)) return false;
  
  const b = Utils.clamp(raw, 0, Infinity);
  bInput.value = b;
  return true;
}

function normalizeX() {
  if (xInput.value.trim() === "") return false;

  const raw = Number(xInput.value);

  if (!Number.isFinite(raw)) return false;
  
  const x = Utils.clamp(raw, 0, Infinity);
  xInput.value = x;
  return true;
}


function normalizePX() {
  if (pxOutput.value.trim() === "") return false;

  const raw = Number(pxOutput.value);
  if (!Number.isFinite(raw)) return false;

  const px = Utils.clamp(raw, 0, 0.9999999999);
  pxOutput.value = px;
  return true;
}

async function maybeUpdatePX() {
  const a = parseFloat(aInput.value);
  const b = parseFloat(bInput.value);
  const x = parseFloat(xInput.value);
  const rel = relSelect.value;

  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(x) || a <= 0 || b <= 0) {
    pxOutput.value = "";
    return;
  }

  const data = Beta.betaProb(a, b, x, rel);
  pxOutput.value = data.prob;
}

async function maybeUpdateX() {
  const a = parseFloat(aInput.value);
  const b = parseFloat(bInput.value);
  const px = parseFloat(pxOutput.value);
  const rel = relSelect.value;

  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(px) || a <= 0 || b <= 0) {
    xInput.value = "";
    return;
  }

  const data = Beta.betaInverse(a, b, px, rel);
  xInput.value = data.x;
  return data.x;
}

async function maybeGeneratePlot() {
  const a = parseFloat(aInput.value);
  const b = parseFloat(bInput.value);

  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(a, b);

  const data = Beta.betaData(a, b);
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

Utils.onBlurOrEnter(aInput, () => {
  if (!normalizeA()) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  maybeGeneratePlot();
  maybeUpdatePX();
});

Utils.onBlurOrEnter(bInput, () => {
  if (!normalizeB()) {
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
  const a = parseFloat(aInput.value);
  const b = parseFloat(bInput.value);
  if (Number.isFinite(a) && Number.isFinite(b)) updateStats(a, b);
});