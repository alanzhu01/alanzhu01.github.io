import * as Utils from '../utils/discrete.js';
import * as Binomial from "../math/binomial.js";

const nInput = document.getElementById("n");
const pInput = document.getElementById("p");
const xInput = document.getElementById("x");
const relSelect = document.getElementById("rel");
const pxOutput = document.getElementById("px");

const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");

let currentXValues = [];

async function updateStats(n, p) {
  const formula = formulaToggle.checked ? 1 : 0;
  const data = Binomial.binomialStats(n, p, formula);

  const meanNode = Utils.setMath("mean", data.mean);
  const varNode  = Utils.setMath("var", data.variance);
  const sdNode   = Utils.setMath("sd", data.sd);

  const pmfNode = Utils.setMath("pmf", data.pmf_latex);
  const mgfNode = Utils.setMath("mgf", data.mgf_latex);

  await Utils.typesetNodes([meanNode, varNode, sdNode, pmfNode, mgfNode]);
}

function normalizeN() {
  if (nInput.value.trim() === "") return false;

  const raw = Number(nInput.value);

  if (!Number.isFinite(raw)) return false;

  const n = Utils.roundInt(raw, 1, Infinity);
  nInput.value = n;

  if (xInput.value.trim() === "") {
    return true;
  }

  const x = Number(xInput.value);
  const xRound = Utils.roundInt(x, 0, n);
  xInput.value = xRound;

  return true;
}

function normalizeP() {
  if (pInput.value.trim() === "") return false;

  const raw = Number(pInput.value);
  if (!Number.isFinite(raw)) return false;

  const p = Utils.clamp(raw, 0, 1);
  pInput.value = p;

  return true;
}

function normalizeX() {
  if (xInput.value.trim() === "") return false;

  const n = Number(nInput.value);
  const raw = Number(xInput.value);

  if (!Number.isFinite(n) || !Number.isFinite(raw)) return false;

  const x = Utils.roundInt(raw, 0, n);
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

async function maybeUpdatePX() {
  const n = parseInt(nInput.value, 10);
  const p = parseFloat(pInput.value);
  const x = parseInt(xInput.value, 10);
  const rel = relSelect.value;

  if (!Number.isFinite(n) || !Number.isFinite(p) || !Number.isFinite(x) || p === 0 || p === 1) {
    pxOutput.value = "";
    return;
  }

  const data = Binomial.binomialProb(n, p, x, rel);
  pxOutput.value = data.prob;
}

async function maybeUpdateX() {
  const n = parseInt(nInput.value, 10);
  const p = parseFloat(pInput.value);
  const px = parseFloat(pxOutput.value);
  const rel = relSelect.value;

  if (!Number.isFinite(n) || !Number.isFinite(p) || !Number.isFinite(px) || p === 0 || p === 1) {
    xInput.value = "";
    return;
  }

  const data = Binomial.binomialInverse(n, p, px, rel);
  xInput.value = data.x;
  return data.x;
}

async function maybeGeneratePlot() {
  const n = parseInt(nInput.value, 10);
  const p = parseFloat(pInput.value);

  if (!Number.isFinite(n) || !Number.isFinite(p) || p === 0 || p === 1) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(n, p);

  const data = Binomial.binomialData(n, p);
  currentXValues = data.x;


  const mobile = Utils.isMobile();

  const baseFont = mobile ? 11 : 14;
  const axisTitleFont = mobile ? 12 : 16;
  const tickFont = mobile ? 10 : 12;
  const hoverFont = mobile ? 11 : 14;

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
      font: { size: baseFont, color: Utils.cssVar("--text-main") },
      paper_bgcolor: Utils.cssVar("--plot-bgcolor"),
      plot_bgcolor: Utils.cssVar("--plot-bgcolor"),
      hoverlabel: {
        bgcolor: Utils.cssVar("--header-bg"),
        bordercolor: Utils.cssVar("--plot-bordercolor"),
        font: { color: Utils.cssVar("--text-main"), size: hoverFont },
        align: "left"
      },
      xaxis: { 
        title: { text: "x", font: { size: axisTitleFont } },
        tickfont: { size: tickFont },
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
        title: { text: "P(X = x)", font: { size: axisTitleFont } },
        tickfont: { size: tickFont },
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main")
      },
      margin: mobile
      ? { t: 20, l: 50, r: 20, b: 60 }
      : { t: 50, l: 80, r: 40, b: 80 },
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

Utils.onBlurOrEnter(nInput, () => {
  if (!normalizeN()) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  maybeGeneratePlot();
  maybeUpdatePX();
});

Utils.onBlurOrEnter(pInput, () => {
  if (!normalizeP()) {
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
  const n = parseInt(nInput.value, 10);
  const p = parseFloat(pInput.value);
  if (Number.isFinite(n) && Number.isFinite(p)) updateStats(n, p);
});