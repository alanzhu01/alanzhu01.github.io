import * as Utils from '../utils/continuous.js';
import * as Normal from "../math/normal.js";

const mInput = document.getElementById("m");
const sInput = document.getElementById("s");
const xInput = document.getElementById("x");
const relSelect = document.getElementById("rel");
const pxOutput = document.getElementById("px");

const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");

let currentXValues = [];
let currentYValues = [];

async function updateStats(m, s) {
  const formula = formulaToggle.checked ? 1 : 0;
  const data = Normal.normalStats(m, s, formula);

  const meanNode = Utils.setMath("mean", data.mean);
  const varNode  = Utils.setMath("var", data.variance);
  const sdNode   = Utils.setMath("sd", data.sd);

  const pdfNode = Utils.setMath("pdf", data.pdf_latex);
  const mgfNode = Utils.setMath("mgf", data.mgf_latex);

  await Utils.typesetNodes([meanNode, varNode, sdNode, pdfNode, mgfNode]);
}

function normalizeM() {
  if (mInput.value.trim() === "") return false;

  const raw = Number(mInput.value);
  if (!Number.isFinite(raw)) return false;

  return true;
}

function normalizeS() {
  if (sInput.value.trim() === "") return false;

  const raw = Number(sInput.value);
  if (!Number.isFinite(raw)) return false;

  const s = Utils.clamp(raw, 0, Infinity);
  
  sInput.value = s;
  return true;
}

function normalizeX() {
  if (xInput.value.trim() === "") return false;

  const raw = Number(xInput.value);
  if (!Number.isFinite(raw)) return false;

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
  const m = parseFloat(mInput.value);
  const s = parseFloat(sInput.value);
  const x = parseFloat(xInput.value);
  const rel = relSelect.value;

  if (!Number.isFinite(m) || !Number.isFinite(s) || !Number.isFinite(x) || s <= 0) {
    pxOutput.value = "";
    return;
  }

  const data = Normal.normalProb(m, s, x, rel);
  pxOutput.value = data.prob;
}

async function maybeUpdateX() {
  const m = parseFloat(mInput.value);
  const s = parseFloat(sInput.value);
  const px = parseFloat(pxOutput.value);
  const rel = relSelect.value;

  if (!Number.isFinite(m) || !Number.isFinite(s) || !Number.isFinite(px)) {
    xInput.value = "";
    return;
  }

  const data = Normal.normalInverse(m, s, px, rel);
  xInput.value = data.x;
  return data.x;
}

async function maybeGeneratePlot() {
  const m = parseFloat(mInput.value);
  const s = parseFloat(sInput.value);

  if (!Number.isFinite(m) || !Number.isFinite(s) || s <= 0) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(m, s);

  const data = Normal.normalData(m, s);
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

Utils.onBlurOrEnter(mInput, () => {
  if (!normalizeM()) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  maybeGeneratePlot();
  maybeUpdatePX();
});

Utils.onBlurOrEnter(sInput, () => {
  if (!normalizeS()) {
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
  const m = parseFloat(mInput.value);
  const s = parseFloat(sInput.value);
  if (Number.isFinite(m) && Number.isFinite(s)) updateStats(m, s);
});