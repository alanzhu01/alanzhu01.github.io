import * as Utils from '../utils/discrete.js';
import * as Hypergeometric from "../math/hypergeometric.js";

const MInput = document.getElementById("M");
const nInput = document.getElementById("n");
const NInput = document.getElementById("N");
const xInput = document.getElementById("x");
const relSelect = document.getElementById("rel");
const pxOutput = document.getElementById("px");

const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");

let currentXValues = [];

async function updateStats(M, n, N) {
  const formula = formulaToggle.checked ? 1 : 0;
  const data = Hypergeometric.hypergeometricStats(M, n, N, formula);

  const meanNode = Utils.setMath("mean", data.mean);
  const varNode  = Utils.setMath("var", data.variance);
  const sdNode   = Utils.setMath("sd", data.sd);

  const pmfNode = Utils.setMath("pmf", data.pmf_latex);
  const mgfNode = Utils.setMath("mgf", data.mgf_latex);

  await Utils.typesetNodes([meanNode, varNode, sdNode, pmfNode, mgfNode]);
}


function normalizeM() {
  if (MInput.value.trim() === "") return false;

  const raw = Number(MInput.value);

  if (!Number.isFinite(raw)) return false;

  const M = Utils.roundInt(raw, 1, Infinity);
  MInput.value = M;

  return true;
}

function normalizen() {
  if (nInput.value.trim() === "") return false;

  const raw = Number(nInput.value);
  const M = Number(MInput.value);

  if (!Number.isFinite(M) || !Number.isFinite(raw)) return false;

  const n = Utils.roundInt(raw, 0, M);
  nInput.value = n;
  return true;
}

function normalizeN() {
  if (NInput.value.trim() === "") return false;

  const raw = Number(NInput.value);
  const M = Number(MInput.value);

  if (!Number.isFinite(M) || !Number.isFinite(raw)) return false;

  const N = Utils.roundInt(raw, 0, M);
  NInput.value = N;
  return true;
}

function normalizeX() {
  if (xInput.value.trim() === "") return false;

  const M = Number(MInput.value);
  const n = Number(nInput.value);
  const N = Number(NInput.value);
  const raw = Number(xInput.value);

  if (!Number.isFinite(M) || !Number.isFinite(n) || !Number.isFinite(N) || !Number.isFinite(raw)) return false;

  const x = Utils.roundInt(raw, Math.max(0, N + n - M), Math.min(n, N));
  xInput.value = x;
  return true;
}

function normalizePX() {
  if (pxOutput.value.trim() === "") return false;

  const raw = Number(pxOutput.value);
  if (!Number.isFinite(raw)) return false;

  const px = Utils.clamp(raw, 0, 1);
  pxOutput.value = px;
  return true;
}

async function maybeUpdateX() {
  const M = parseInt(MInput.value, 10);
  const n = parseInt(nInput.value, 10);
  const N = parseInt(NInput.value, 10);
  const px = parseFloat(pxOutput.value, 10);
  const rel = relSelect.value;

  if (!Number.isFinite(M) || !Number.isFinite(N) || !Number.isFinite(n) || !Number.isFinite(px)) {
    xInput.value = "";
    return;
  }

  const data = Hypergeometric.hypergeometricInverse(M, n, N, px, rel);
  xInput.value = data.x;
  return data.x;
}

async function maybeUpdatePX() {
  const M = parseInt(MInput.value, 10);
  const n = parseInt(nInput.value, 10);
  const N = parseInt(NInput.value, 10);
  const x = parseInt(xInput.value, 10);
  const rel = relSelect.value;

  if (!Number.isFinite(M) || !Number.isFinite(n) || !Number.isFinite(N) || !Number.isFinite(x)) {
    pxOutput.value = "";
    return;
  }

  const data = Hypergeometric.hypergeometricProb(M, n, N, x, rel)
  pxOutput.value = data.prob;
}

async function maybeGeneratePlot() {
  const M = parseInt(MInput.value, 10);
  const n = parseInt(nInput.value, 10);
  const N = parseInt(NInput.value, 10);

  if (!Number.isFinite(M) || !Number.isFinite(n) || !Number.isFinite(N)) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }
  
  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(M, n, N);

  const data = Hypergeometric.hypergeometricData(M, n, N);
  currentXValues = data.x;

  Plotly.react(
      "plot", 
      [
        {
          x: data.x,
          y: data.y,
          type: "bar",
          marker: {
            color: Utils.barColors(
              data.x,
              parseInt(xInput.value, 10),
              relSelect.value
              )
          },
          hovertemplate: "P(X=%{x}) = %{y:.6f}<extra></extra>"
        }
      ], 
      {
        title: null,
        hovermode: "closest",
        paper_bgcolor: Utils.cssVar("--plot-bgcolor"),
        plot_bgcolor: Utils.cssVar("--plot-bgcolor"),
        hoverlabel: {
          bgcolor: Utils.cssVar("--header-bg"),
          bordercolor: Utils.cssVar("--plot-bordercolor"),
          font: { color: Utils.cssVar("--text-main"), size: 14 },
          align: "left"
        },
        xaxis: { 
          title: "x",
          showgrid: false,
          fixedrange: true,
  
          tickmode: "auto",
          dtick: 1,
          tickformat: "d",
          color: Utils.cssVar("--text-main"),
          linecolor: Utils.cssVar("--text-main"),
          tickcolor: Utils.cssVar("--text-main")
        },
        yaxis: { 
          title: "P(X = x)",
          showgrid: false,
          fixedrange: true,
          color: Utils.cssVar("--text-main"),
          linecolor: Utils.cssVar("--text-main"),
          tickcolor: Utils.cssVar("--text-main")
        },
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
  }

Utils.onBlurOrEnter(MInput, () => {
  if (!normalizeM()) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  normalizen();
  normalizeN();
  normalizeX();

  maybeGeneratePlot();
  maybeUpdatePX();
});

Utils.onBlurOrEnter(nInput, () => {
  if (!normalizen()) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  normalizeX();

  maybeGeneratePlot();
  maybeUpdatePX();
});

Utils.onBlurOrEnter(NInput, () => {
  if (!normalizeN()) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  normalizeX();

  maybeGeneratePlot();
  maybeUpdatePX();
});

Utils.onBlurOrEnter(xInput, () => {
  if (!normalizeX()) {
    pxOutput.value = "";
    return;
  }

  maybeUpdatePX();
  Utils.updatePlotHighlight({ currentXValues, xInput, relSelect });
});

Utils.onBlurOrEnter(pxOutput, async () => {
  if (!normalizePX()) {
    xInput.value = "";
    return;
  }

  if (relSelect.value === "eq") {
    relSelect.value = "le";
  }

  const x = await maybeUpdateX();
  if (Number.isFinite(x)) {
    await maybeUpdatePX();
  }
  
  Utils.updatePlotHighlight({ currentXValues, xInput, relSelect });
});

relSelect.addEventListener("change", () => { 
  maybeUpdatePX(); 
  Utils.updatePlotHighlight({ currentXValues, xInput, relSelect }); 
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
  const M = parseInt(MInput.value, 10);
  const n = parseInt(nInput.value, 10);
  const N = parseInt(NInput.value, 10);
  if (Number.isFinite(M) && Number.isFinite(N) && Number.isFinite(n)) updateStats(M, n, N);
});