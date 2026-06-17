import * as Utils from "../utils/continuous.js";
import * as Bayes from "../math/bayesian.js";

const startMenuEl = document.getElementById("start-menu");
const bayesAppEl = document.getElementById("bayes-app");
const dataModelInput = document.getElementById("data-model");
const trueParameterInput = document.getElementById("true-parameter");
const randomizeParameterInput = document.getElementById("randomize-parameter");
const startBayesBtn = document.getElementById("start-bayes");

let selectedDataModel = "binomial";

const scenarioEl = document.getElementById("scenario-text");

const priorDistEl = document.getElementById("prior-dist");
const priorMeanEl = document.getElementById("prior-mean");
const priorCiEl = document.getElementById("prior-ci");
const priorVarEl = document.getElementById("prior-var");
const trueParamEl = document.getElementById("true-param");

const priorPlotEl = document.getElementById("prior-plot");

const alphaAnswerInput = document.getElementById("alpha-answer");
const betaAnswerInput = document.getElementById("beta-answer");

const submitBtn = document.getElementById("submit-answer");
const feedbackEl = document.getElementById("feedback");

const distLabelEl = document.getElementById("dist-label");
const meanLabelEl = document.getElementById("mean-label");
const varLabelEl = document.getElementById("var-label");
const ciLabelEl = document.getElementById("ci-label");

const trueParameterLabel = document.querySelector('label[for="true-parameter"]');

function setError(input, message) {
  input.setCustomValidity(message);
  input.reportValidity();
}

function clearError(input) {
  input.setCustomValidity("");
}

let showingPosterior = false;

let currentPriorAlpha = 2;
let currentPriorBeta = 2;
let current = null;

let totalRed = 0;
let totalBlue = 0;

const isMobile = window.innerWidth <= 480;

function updateControlsRowVisibility() {
  const controlsRow = submitBtn.closest(".controls-row");

  feedbackEl.classList.toggle(
    "empty",
    feedbackEl.textContent.trim() === ""
  );

  controlsRow.classList.toggle(
    "empty",
    submitBtn.hidden && feedbackEl.textContent.trim() === ""
  );
}

function setMath(el, value) {
  el.innerHTML = value ?? "—";
}

function normalizeTrueParameterInput() {
  if (trueParameterInput.value.trim() === "") {
    return false;
  }

  const raw = Number(trueParameterInput.value);

  if (!Number.isFinite(raw)) {
    setError(trueParameterInput, "Parameter must be a real number");
    return false;
  }

  const model = dataModelInput.value;

  if (model === "binomial") {
    if (raw <= 0 || raw >= 1) {
      setError(
        trueParameterInput,
        "p must satisfy 0 < p < 1"
      );
      return false;
    }
  } else {
    if (raw <= 0 || raw >= 100) {
      setError(
        trueParameterInput,
        "λ must satisfy 0 < λ < 100"
      );
      return false;
    }
  }

  clearError(trueParameterInput);
  return true;
}

function setFeedback(message, isCorrect = false) {
  feedbackEl.innerHTML = message;
  feedbackEl.classList.toggle("correct", isCorrect);
  updateControlsRowVisibility();

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetClear([feedbackEl]);
    MathJax.typesetPromise([feedbackEl]);
  }
}

function betaMean(alpha, beta) {
  return alpha / (alpha + beta);
}

function betaVariance(alpha, beta) {
  const sum = alpha + beta;
  return (alpha * beta) / (sum * sum * (sum + 1));
}

function formatNumber(x, digits = 4) {
  if (!Number.isFinite(Number(x))) return "—";
  return Number(x).toFixed(digits).replace(/\.?0+$/, "");
}

function formatBeta(alpha, beta) {
  return `Beta(${formatNumber(alpha)}, ${formatNumber(beta)})`;
}

function normalizePositiveIntegerInput(input) {
  if (input.value.trim() === "") return false;

  const raw = Number(input.value);
  if (!Number.isFinite(raw)) {
    input.value = "";
    return false;
  }

  const value = Utils.roundInt
    ? Utils.roundInt(raw, 0, Infinity)
    : Math.max(0, Math.round(raw));

  input.value = String(value);
  return true;
}

function updateSubmitVisibility() {
  submitBtn.hidden =
    alphaAnswerInput.value.trim() === "" ||
    betaAnswerInput.value.trim() === "";

  updateControlsRowVisibility();
}

function readUserAnswer() {
  const alpha = Number(alphaAnswerInput.value);
  const beta = Number(betaAnswerInput.value);

  if (!Number.isFinite(alpha) || !Number.isFinite(beta)) {
    return { ok: false, error: "Please enter valid numbers." };
  }

  return { ok: true, alpha, beta };
}

function getCredibleInterval(alpha, beta, level = 0.95) {
  if (typeof Bayes.betaCredibleInterval === "function") {
    return Bayes.betaCredibleInterval(alpha, beta, level);
  }

  const tail = (1 - level) / 2;
  return {
    lower: jStat.beta.inv(tail, alpha, beta),
    upper: jStat.beta.inv(1 - tail, alpha, beta)
  };
}

function getPriorProbability(alpha, beta, threshold = 0.5, rel = "ge") {
  if (typeof Bayes.betaProbability === "function") {
    return Bayes.betaProbability(alpha, beta, threshold, rel);
  }

  const cdf = jStat.beta.cdf(threshold, alpha, beta);
  return rel === "ge" ? 1 - cdf : cdf;
}

function getBetaCurve(alpha, beta) {
  if (typeof Bayes.betaData === "function") {
    return Bayes.betaData(alpha, beta);
  }

  const x = [];
  const y = [];

  for (let i = 0; i <= 200; i++) {
    const val = i / 200;
    x.push(val);

    if (val === 0 || val === 1) {
      y.push(0);
    } else {
      y.push(jStat.beta.pdf(val, alpha, beta));
    }
  }

  return { x, y };
}

function renderBetaPlot(alpha, beta, phase = "Prior", previousPrior = null) {
  const mainData = getBetaCurve(alpha, beta);
  const mean = betaMean(alpha, beta);
  const trueP = current?.trueP;
  const yMax = Math.max(...mainData.y);

  const traces = [];

  traces.push({
    x: mainData.x,
    y: mainData.y,
    type: "scatter",
    mode: "lines",
    name: isMobile ? `${phase}` : `${phase} distribution`,
    line: {
      color: Utils.cssVar("--plot-blue-bar"),
      width: 3
    },
    fill: "tozeroy",
    fillcolor: Utils.cssVar("--plot-blue-bar"),
    hoverinfo: "skip"
  });

  if (phase === "Posterior" && previousPrior) {
    const priorData = getBetaCurve(previousPrior.alpha, previousPrior.beta);

    traces.push({
      x: priorData.x,
      y: priorData.y,
      type: "scatter",
      mode: "lines",
      name: "Prior distribution",
      line: {
        color: "black",
        width: 3,
        dash: "dashdot"
      },
      hoverinfo: "skip"
    });
  }

  if (trueP != null) {
    traces.push({
      x: [trueP, trueP],
      y: [0, yMax],
      type: "scatter",
      mode: "lines",
      name: isMobile ? "True" : "True parameter",
      line: {
        color: "black",
        width: 3
      },
      hoverinfo: "skip"
    });
  }

  traces.push({
    x: [mean, mean],
    y: [0, yMax],
    type: "scatter",
    mode: "lines",
    name: isMobile ? "Mean" : `${phase} mean`,
    line: {
      color: "black",
      width: 3,
      dash: "dash"
    },
    hoverinfo: "skip"
  });

  Plotly.react(
    "prior-plot",
    traces,
    {
      title: null,
      showlegend: true,
      legend: {
        orientation: "h",
        x: 0.5,
        xanchor: "center",
        y: isMobile ? -0.6 : -0.3,
        font: {
          size: isMobile ? 10 : 14
        },
        itemwidth: isMobile ? 30 : 40
      },
      margin: {
        t: isMobile ? 20 : 50,
        l: isMobile ? 35 : 80,
        r: isMobile ? 15 : 80,
        b: isMobile ? 65 : 110
      },
      hovermode: "closest",
      paper_bgcolor: Utils.cssVar("--plot-bgcolor"),
      plot_bgcolor: Utils.cssVar("--plot-bgcolor"),
      xaxis: {
        title: "p",
        range: [0, 1],
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      yaxis: {
        title: "",
        range: [0, yMax * 1.1],
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      margin: {
        t: 50,
        l: 80,
        r: 80,
        b: 110
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

function renderBetaInfo(alpha, beta, label = "Prior") {
  const ci = getCredibleInterval(alpha, beta, 0.95);

  distLabelEl.textContent = `${label} Distribution`;
  meanLabelEl.textContent = `${label} Mean`;
  varLabelEl.textContent = `${label} Variance`;

  setMath(priorCiEl, `\\((${formatNumber(ci.lower)}, ${formatNumber(ci.upper)})\\)`);
  setMath(priorDistEl, `\\(\\mathrm{Beta}(${formatNumber(alpha)}, ${formatNumber(beta)})\\)`);
  setMath(priorMeanEl, `\\(${formatNumber(betaMean(alpha, beta))}\\)`);
  setMath(priorVarEl, `\\(${formatNumber(betaVariance(alpha, beta))}\\)`);

  if (current?.trueP != null) {
    setMath(trueParamEl, `\\(${formatNumber(current.trueP)}\\)`);
  }

  renderBetaPlot(alpha, beta, label);

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetClear([priorDistEl, priorMeanEl, priorVarEl, priorCiEl, trueParamEl]);
    MathJax.typesetPromise([priorDistEl, priorMeanEl, priorVarEl, priorCiEl, trueParamEl]);
  }
}

function gammaMean(alpha, beta) {
  return alpha / beta;
}

function gammaVariance(alpha, beta) {
  return alpha / (beta * beta);
}

function getGammaCurve(alpha, beta) {
  return Bayes.gammaData(alpha, beta);
}

function getGammaCredibleInterval(alpha, beta, level = 0.95) {
  return Bayes.gammaCredibleInterval(alpha, beta, level);
}

function renderGammaPlot(alpha, beta, phase = "Prior", previousPrior = null) {
  const mainData = getGammaCurve(alpha, beta);
  const mean = gammaMean(alpha, beta);
  const trueLambda = current?.trueP;
  const yMax = Math.max(...mainData.y);
  const xMax = Math.max(
    ...mainData.x,
    trueLambda ?? 0
  ) * 1.1;

  const traces = [];

  traces.push({
    x: mainData.x,
    y: mainData.y,
    type: "scatter",
    mode: "lines",
    name: isMobile ? `${phase}` : `${phase} distribution`,
    line: {
      color: Utils.cssVar("--plot-blue-bar"),
      width: 3
    },
    fill: "tozeroy",
    fillcolor: Utils.cssVar("--plot-blue-bar"),
    hoverinfo: "skip"
  });

  if (phase === "Posterior" && previousPrior) {
    const priorData = getGammaCurve(previousPrior.alpha, previousPrior.beta);

    traces.push({
      x: priorData.x,
      y: priorData.y,
      type: "scatter",
      mode: "lines",
      name: "Prior distribution",
      line: {
        color: "black",
        width: 3,
        dash: "dashdot"
      },
      hoverinfo: "skip"
    });
  }

  if (trueLambda != null) {
    traces.push({
      x: [trueLambda, trueLambda],
      y: [0, yMax],
      type: "scatter",
      mode: "lines",
      name: "True λ",
      line: {
        color: "black",
        width: 3
      },
      hoverinfo: "skip"
    });
  }

  traces.push({
    x: [mean, mean],
    y: [0, yMax],
    type: "scatter",
    mode: "lines",
    name: isMobile ? "Mean" : `${phase} mean`,
    line: {
      color: "black",
      width: 3,
      dash: "dash"
    },
    hoverinfo: "skip"
  });

  Plotly.react(
    "prior-plot",
    traces,
    {
      title: null,
      showlegend: true,
      legend: {
        orientation: "h",
        x: 0.5,
        xanchor: "center",
        y: isMobile ? -0.6 : -0.3,
        font: {
          size: isMobile ? 10 : 14
        },
        itemwidth: isMobile ? 30 : 40
      },
      margin: {
        t: isMobile ? 20 : 50,
        l: isMobile ? 35 : 80,
        r: isMobile ? 15 : 80,
        b: isMobile ? 65 : 110
      },
      paper_bgcolor: Utils.cssVar("--plot-bgcolor"),
      plot_bgcolor: Utils.cssVar("--plot-bgcolor"),
      xaxis: {
        title: "λ",
        range: [0, xMax],
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      yaxis: {
        title: "",
        range: [0, yMax * 1.1],
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      margin: {
        t: 50,
        l: 80,
        r: 80,
        b: 110
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

function renderGammaInfo(alpha, beta, label = "Prior") {
  const ci = getGammaCredibleInterval(alpha, beta, 0.95);

  distLabelEl.textContent = `${label} Distribution`;
  meanLabelEl.textContent = `${label} Mean`;
  varLabelEl.textContent = `${label} Variance`;

  setMath(priorCiEl, `\\((${formatNumber(ci.lower)}, ${formatNumber(ci.upper)})\\)`);
  setMath(priorDistEl, `\\(\\mathrm{Gamma}(${formatNumber(alpha)}, ${formatNumber(beta)})\\)`);
  setMath(priorMeanEl, `\\(${formatNumber(gammaMean(alpha, beta))}\\)`);
  setMath(priorVarEl, `\\(${formatNumber(gammaVariance(alpha, beta))}\\)`);

  if (current?.trueP != null) {
    setMath(trueParamEl, `\\(${formatNumber(current.trueP)}\\)`);
  }

  renderGammaPlot(alpha, beta, label);

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetClear([priorDistEl, priorMeanEl, priorVarEl, priorCiEl, trueParamEl]);
    MathJax.typesetPromise([priorDistEl, priorMeanEl, priorVarEl, priorCiEl, trueParamEl]);
  }
}

function clearAnswerState() {
  alphaAnswerInput.value = "";
  betaAnswerInput.value = "";
  submitBtn.hidden = true;
  submitBtn.disabled = false;
  setFeedback("");
  updateControlsRowVisibility();
}

async function loadScenario() {
  clearAnswerState();

  try {
    const config = window.bayesStartConfig ?? {};
    const model = config.dataModel ?? "binomial";

    let data;

    if (model === "poisson") {
      data = await Bayes.generateBayesianPoissonScenario(
        currentPriorAlpha,
        currentPriorBeta,
        {
          trueP: config.trueParameter,
          randomize: config.randomize
        }
      );
    } else {
      data = await Bayes.generateBayesianBinomialScenario(
        currentPriorAlpha,
        currentPriorBeta,
        {
          trueP: config.trueParameter,
          randomize: config.randomize
        }
      );
    }

    current = {
      ...data,
      priorAlpha: Number(data.priorAlpha),
      priorBeta: Number(data.priorBeta),
      posteriorAlpha: Number(data.posteriorAlpha),
      posteriorBeta: Number(data.posteriorBeta),
      trueP: Number(data.trueP)
    };

    currentPriorAlpha = current.priorAlpha;
    currentPriorBeta = current.priorBeta;

    scenarioEl.textContent = current.scenario;

    showingPosterior = false;
    submitBtn.textContent = "Submit";

    if (model === "binomial") {
      renderBetaInfo(currentPriorAlpha, currentPriorBeta, "Prior");
    } else {
      renderGammaInfo(currentPriorAlpha, currentPriorBeta, "Prior");
    }

    if (window.MathJax?.typesetPromise) {
      MathJax.typesetPromise();
    }
  } catch (err) {
    scenarioEl.textContent = `Could not generate a Bayesian scenario. ${err?.message ?? ""}`;
  }
}

function checkAnswer() {
  if (!current) return;

  if (showingPosterior) {
    currentPriorAlpha = current.posteriorAlpha;
    currentPriorBeta = current.posteriorBeta;

    alphaAnswerInput.disabled = false;
    betaAnswerInput.disabled = false;

    loadScenario();
    return;
  }

  const read = readUserAnswer();
  if (!read.ok) {
    setFeedback(read.error);
    return;
  }

  const correctAlpha = current.posteriorAlpha;
  const correctBeta = current.posteriorBeta;

  const alphaCorrect = read.alpha === correctAlpha;
  const betaCorrect = read.beta === correctBeta;

  if (alphaCorrect && betaCorrect) {
    showingPosterior = true;

    if (selectedDataModel === "binomial") {
      renderBetaInfo(correctAlpha, correctBeta, "Posterior");
      renderBetaPlot(correctAlpha, correctBeta, "Posterior", {
        alpha: currentPriorAlpha,
        beta: currentPriorBeta
      });
    } else {
      renderGammaInfo(correctAlpha, correctBeta, "Posterior");
      renderGammaPlot(correctAlpha, correctBeta, "Posterior", {
        alpha: currentPriorAlpha,
        beta: currentPriorBeta
      });
    }

    submitBtn.textContent = "Continue";
    alphaAnswerInput.disabled = true;
    betaAnswerInput.disabled = true;

    setFeedback("Correct! This is the posterior distribution.", true);
    return;
  }

  const posteriorName =
    selectedDataModel === "binomial" ? "\\text{Beta}" : "\\text{Gamma}";

  setFeedback(
    `Not quite, the posterior should be \\(${posteriorName}(${correctAlpha}, ${formatNumber(correctBeta)})\\).`
  );
}

Utils.onBlurOrEnter(alphaAnswerInput, () => {
  normalizePositiveIntegerInput(alphaAnswerInput);
  updateSubmitVisibility();
});

Utils.onBlurOrEnter(betaAnswerInput, () => {
  normalizePositiveIntegerInput(betaAnswerInput);
  updateSubmitVisibility();
});

alphaAnswerInput.addEventListener("input", updateSubmitVisibility);
betaAnswerInput.addEventListener("input", updateSubmitVisibility);

submitBtn.addEventListener("click", checkAnswer);

randomizeParameterInput.addEventListener("change", () => {
  const isRandom = randomizeParameterInput.checked;

  trueParameterInput.disabled = isRandom;

  if (isRandom) {
    trueParameterInput.value = "";
  }
});

startBayesBtn.addEventListener("click", () => {
  selectedDataModel = dataModelInput.value;

  if (
    trueParameterInput.value.trim() === "" &&
    !randomizeParameterInput.checked
  ) {
    setError(
      trueParameterInput,
      "Please fill in a parameter or check randomize parameter"
    );
    return;
  }

  if (
    !randomizeParameterInput.checked &&
    !normalizeTrueParameterInput()
  ) {
    return;
  }

  const manualParam = Number(trueParameterInput.value);

  if (!randomizeParameterInput.checked && !Number.isFinite(manualParam)) {
    setFeedback("Please enter a valid true parameter.");
    return;
  }

  window.bayesStartConfig = {
    dataModel: selectedDataModel,
    trueParameter: randomizeParameterInput.checked
      ? (
          selectedDataModel === "binomial"
            ? Math.random()
            : 1 + Math.random() * 9
        )
      : manualParam,
    randomize: false
  };

  startMenuEl.hidden = true;
  bayesAppEl.hidden = false;

  loadScenario();

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise();
  }
});

window.addEventListener("load", () => {
  trueParameterInput.disabled = randomizeParameterInput.checked;

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise();
  }
});

document.addEventListener("themechange", () => {
  if (!current) return;

  if (selectedDataModel === "binomial") {
    if (showingPosterior) {
      renderBetaPlot(current.posteriorAlpha, current.posteriorBeta, "Posterior", {
        alpha: currentPriorAlpha,
        beta: currentPriorBeta
      });
    } else {
      renderBetaPlot(currentPriorAlpha, currentPriorBeta, "Prior");
    }
  } else {
    if (showingPosterior) {
      renderGammaPlot(current.posteriorAlpha, current.posteriorBeta, "Posterior", {
        alpha: currentPriorAlpha,
        beta: currentPriorBeta
      });
    } else {
      renderGammaPlot(currentPriorAlpha, currentPriorBeta, "Prior");
    }
  }
});

function updateParameterLabel() {
  const model = dataModelInput.value;

  trueParameterLabel.innerHTML =
    model === "binomial"
      ? `<strong>Parameter:</strong> \\( p = \\)`
      : `<strong>Parameter:</strong> \\( \\lambda = \\)`;

  if (model === "binomial") {
    trueParameterInput.max = 1;
  } else {
    trueParameterInput.max = 100;
  }

  normalizeTrueParameterInput();

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([trueParameterLabel]);
  }
}

dataModelInput.addEventListener("change", updateParameterLabel);
updateParameterLabel();

Utils.onBlurOrEnter(trueParameterInput, () => {
  normalizeTrueParameterInput();
});