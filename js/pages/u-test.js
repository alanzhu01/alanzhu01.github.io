import * as Utils from '../utils/discrete.js';
import * as Binomial from "../math/u-test.js";

const n1Input = document.getElementById("n1");
const n2Input = document.getElementById("n2");
const xInput = document.getElementById("x");
const relSelect = document.getElementById("rel");
const pxOutput = document.getElementById("px");

const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");

let currentXValues = [];

async function updateStats(n1, n2) {
  const formula = formulaToggle.checked ? 1 : 0;
  const data = Binomial.mannWhitneyStats(n1, n2, formula);

  const meanNode = Utils.setMath("mean", data.mean);
  const varNode  = Utils.setMath("var", data.variance);
  const sdNode   = Utils.setMath("sd", data.sd);

  await Utils.typesetNodes([meanNode, varNode, sdNode]);
}

function normalizeN1() {
  if (n1Input.value.trim() === "") return false;

  const raw = Number(n1Input.value);

  if (!Number.isFinite(raw)) return false;

  const n1 = Utils.roundInt(raw, 1, Infinity);
  n1Input.value = n1;

  if (xInput.value.trim() === "") {
    return true;
  }

  const x = Number(xInput.value);
  const n2 = Number(n2Input.value);

  const xRound = Utils.roundInt(x, 0, n1 * n2);
  xInput.value = xRound;

  return true;
}

function normalizeN2() {
  if (n2Input.value.trim() === "") return false;

  const raw = Number(n2Input.value);

  if (!Number.isFinite(raw)) return false;

  const n2 = Utils.roundInt(raw, 1, Infinity);
  n2Input.value = n2;

  if (xInput.value.trim() === "") {
    return true;
  }

  const x = Number(xInput.value);
  const n1 = Number(n1Input.value);

  const xRound = Utils.roundInt(x, 0, n1 * n2);
  xInput.value = xRound;

  return true;
}

function normalizeX() {
  if (xInput.value.trim() === "") return false;

  const n1 = Number(n1Input.value);
  const n2 = Number(n2Input.value);
  const raw = Number(xInput.value);

  if (!Number.isFinite(n1) || !Number.isFinite(n2) || !Number.isFinite(raw)) return false;

  const xRound = Utils.roundInt(raw, 0, n1 * n2);
  xInput.value = xRound;
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
  const n1 = parseInt(n1Input.value, 10);
  const n2 = parseInt(n2Input.value, 10);
  const x = parseInt(xInput.value, 10);
  const rel = relSelect.value;

  if (!Number.isFinite(n1) || !Number.isFinite(n2) || !Number.isFinite(x)) {
    pxOutput.value = "";
    return;
  }

  const data = Binomial.mannWhitneyProb(n1, n2, x, rel);
  pxOutput.value = data.prob;
}

async function maybeUpdateX() {
  const n1 = parseInt(n1Input.value, 10);
  const n2 = parseInt(n2Input.value, 10);
  const px = parseFloat(pxOutput.value, 10);
  const rel = relSelect.value;

  if (!Number.isFinite(n1) || !Number.isFinite(n2) || !Number.isFinite(px)) {
    xInput.value = "";
    return;
  }

  const data = Binomial.mannWhitneyInverse(n1, n2, px, rel);
  xInput.value = data.x;
  return data.x;
}

async function maybeGeneratePlot() {
  const n1 = parseInt(n1Input.value, 10);
  const n2 = parseInt(n2Input.value, 10);

  if (!Number.isFinite(n1) || !Number.isFinite(n2)) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(n1, n2);

  const data = Binomial.mannWhitneyData(n1, n2);
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
        hovertemplate: "P(U=%{x}) = %{y:.6f}<extra></extra>"
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
        title: { text: "u", font: { size: axisTitleFont } },
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
        title: { text: "P(U = u)", font: { size: axisTitleFont } },
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
  const n1 = parseInt(n1Input.value, 10);
  const n2 = parseInt(n2Input.value, 10);
  if (Number.isFinite(n1) && Number.isFinite(n2)) updateStats(n1, n2);
});