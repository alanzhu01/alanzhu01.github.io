let SCENARIOS = null;
let SCENARIO_ITEMS = null;

async function loadData() {
  if (SCENARIOS && SCENARIO_ITEMS) return;

  const [scenariosRes, itemsRes] = await Promise.all([
    fetch("../../data/distribution-matching.json"),
    fetch("../../data/distribution-matching-items.json")
  ]);

  SCENARIOS = await scenariosRes.json();
  SCENARIO_ITEMS = await itemsRes.json();
}

function cleanParams(value, ndigits = 6) {
  if (Array.isArray(value)) {
    return value.map(v => cleanParams(v, ndigits));
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = cleanParams(v, ndigits);
    }
    return out;
  }

  if (typeof value === "number" && !Number.isInteger(value)) {
    const v2 = Number(value.toFixed(ndigits));
    return Number.isInteger(v2) ? parseInt(v2, 10) : v2;
  }

  return value;
}

function ordinal(n) {
  if (10 <= n % 100 && n % 100 <= 13) return `${n}th`;

  const suffix = {
    1: "st",
    2: "nd",
    3: "rd"
  }[n % 10] || "th";

  return `${n}${suffix}`;
}

function templateFields(template) {
  const matches = [...template.matchAll(/\{(.*?)\}/g)];
  return [...new Set(matches.map(m => m[1]))];
}

function randomChoice(arr, label = "unknown") {
  if (!Array.isArray(arr)) {
    throw new Error(
      `randomChoice expected an array for "${label}", got ${typeof arr}: ${JSON.stringify(arr)}`
    );
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSample(arr, count, label = "unknown") {
  if (!Array.isArray(arr)) {
    throw new Error(
      `randomSample expected an array for "${label}", got ${typeof arr}: ${JSON.stringify(arr)}`
    );
  }

  const copy = [...arr];
  const out = [];

  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }

  return out;
}

function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniform(min, max) {
  return Math.random() * (max - min) + min;
}

function getPath(obj, path) {
  return path.split(".").reduce((acc, part) => {
    if (acc == null) return undefined;
    if (/^\d+$/.test(part)) return acc[Number(part)];
    return acc[part];
  }, obj);
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    const nextPart = parts[i + 1];
    const shouldBeArray = /^\d+$/.test(nextPart);

    if (cur[part] == null) {
      cur[part] = shouldBeArray ? [] : {};
    }
    cur = cur[part];
  }

  const last = /^\d+$/.test(parts[parts.length - 1])
    ? Number(parts[parts.length - 1])
    : parts[parts.length - 1];

  cur[last] = value;
}

function fillTemplate(template, params) {
  return template.replace(/\{(.*?)\}/g, (_, key) => {
    const value = getPath(params, key);
    if (value === undefined || value === null) {
      throw new Error(`Missing template field: ${key}`);
    }
    return value;
  });
}

function makeSimpleWord(value) {
  return { singular: value, plural: value };
}

function makeStructuredChoice(value) {
  if (value && typeof value === "object" && "singular" in value && "plural" in value) {
    return value;
  }
  return makeSimpleWord(value);
}

function pickItem(field) {
  return randomChoice(SCENARIO_ITEMS[field], field);
}

function ensureTriple(params, rootKey, itemKey) {
  if (!params[rootKey]) {
    params[rootKey] = randomSample(SCENARIO_ITEMS[itemKey], 3, itemKey);
  }
  return params[rootKey];
}

function ensureNotChoice(params, kind = "generic") {
  if (params._notChoiceFlag !== undefined) {
    return params._notChoiceFlag;
  }

  const flag = Math.random() < 0.5;
  params._notChoiceFlag = flag;

  if (kind === "object_manufactured") {
    params.not_choice = flag ? "non-" : "";
  } else if (kind === "major_name") {
    params.not_choice = flag ? "not " : "";
  } else if (kind === "basketball_type") {
    params.not_choice = flag ? "missed" : "made";
  } else if (kind === "pizza_item_binomial") {
    params.not_choice = flag ? "do not " : "";
  } else if (kind === "pizza_item_waiting") {
    params.not_choice = flag ? "does not order" : "orders";
  } else if (kind === "medical_treatment") {
    params.not_choice = flag ? "un" : "";
  } else if (kind === "candies_binomial_hyper") {
    params.not_choice = flag ? "candies other than " : "";
  } else if (kind === "candies_waiting") {
    params.not_choice = flag ? "candy other than a " : "";
  } else if (kind === "fish") {
    params.not_choice = flag ? "fish other than " : "";
  } else if (kind === "movies_binomial") {
    params.not_choice = flag ? "do not " : "";
  } else if (kind === "movies_waiting") {
    params.not_choice = flag ? "does not prefer" : "prefers";
  } else if (kind === "music_binomial") {
    params.not_choice = flag ? "do not " : "";
  } else if (kind === "music_waiting") {
    params.not_choice = flag ? "does not prefer" : "prefers";
  } else {
    params.not_choice = flag ? "not " : "";
  }

  return flag;
}



function genValue(rootField, dist, params, template) {
  if (rootField === "not_choice") {
    if (params.object_manufactured) {
      ensureNotChoice(params, "object_manufactured");
    } else if (params.major_name) {
      ensureNotChoice(params, "major_name");
    } else if (params.basketball_type) {
      ensureNotChoice(params, "basketball_type");
    } else if (params.medical_treatment) {
      ensureNotChoice(params, "medical_treatment");
    } else if (params.pizza_item) {
      const waiting = dist === "geometric" || dist === "negative-binomial";
      ensureNotChoice(params, waiting ? "pizza_item_waiting" : "pizza_item_binomial");
    } else if (params.candies) {
      const kind = dist === "binomial" || dist === "hypergeometric"
        ? "candies_binomial_hyper"
        : "candies_waiting";
      ensureNotChoice(params, kind);
    } else if (params.fish) {
      ensureNotChoice(params, "fish");
    } else if (params.movies) {
      const kind = dist === "binomial" ? "movies_binomial" : "movies_waiting";
      ensureNotChoice(params, kind);
    } else if (params.music) {
      const kind = dist === "binomial" ? "music_binomial" : "music_waiting";
      ensureNotChoice(params, kind);
    } else {
      ensureNotChoice(params, "generic");
    }

    return params.not_choice;
  }

  if (rootField === "name") {
    return randomChoice(SCENARIO_ITEMS.name, "name");
  }

  if (rootField === "coin_flip") {
    return pickItem("coin_flip");
  }

  if (rootField === "dice_roll") {
    return randomChoice(SCENARIO_ITEMS.dice_roll, "dice_roll");
  }

  if (rootField === "object_manufactured") {
    return pickItem("object_manufactured");
  }

  if (rootField === "medical_treatment") {
    return pickItem("medical_treatment");
  }

  if (rootField === "basketball_type") {
    return pickItem("basketball_type");
  }

  if (rootField === "book_type") {
    return pickItem("book_type");
  }

  if (rootField === "deck_suit") {
    return pickItem("deck_suit");
  }

  if (rootField === "deck_value") {
    return pickItem("deck_value");
  }

  if (rootField === "fish_item") {
    return makeStructuredChoice(randomChoice(SCENARIO_ITEMS.fish_item, "fish_item"));
  }

  if (rootField === "candy_item") {
    return makeStructuredChoice(randomChoice(SCENARIO_ITEMS.candy_item, "candy_item"));
  }

  if (rootField === "movie_name") {
    return randomChoice(SCENARIO_ITEMS.movie_name, "movie_name");
  }

  if (rootField === "music_name") {
    return randomChoice(SCENARIO_ITEMS.music_name, "music_name");
  }

  if (rootField === "pizza_item") {
    return randomChoice(SCENARIO_ITEMS.pizza_item, "pizza_item");
  }

  if (rootField === "major_name") {
    return randomChoice(SCENARIO_ITEMS.major_name, "major_name");
  }

  if (rootField === "location_name") {
    return randomChoice(SCENARIO_ITEMS.location_name, "location_name");
  }

  if (rootField === "candies") {
    return randomSample(SCENARIO_ITEMS.candy_item, 3, "candy_item").map(makeStructuredChoice);
  }

  if (rootField === "fish") {
    return randomSample(SCENARIO_ITEMS.fish_item, 3, "fish_item").map(makeStructuredChoice);
  }

  if (rootField === "movies") {
    return randomSample(SCENARIO_ITEMS.movie_name, 3, "movie_name");
  }

  if (rootField === "music") {
    return randomSample(SCENARIO_ITEMS.music_name, 3, "music_name");
  }

  if (rootField === "choice") {
    if (params.candies) return randomChoice(params.candies);
    if (params.fish) return randomChoice(params.fish);
    if (params.movies) return randomChoice(params.movies);
    if (params.music) return randomChoice(params.music);
    return null;
  }

  if (dist === "binomial" || dist === "geometric" || dist === "negative-binomial") {
    if (rootField === "n") return randint(2, 100);

    if (rootField === "r_str") {
      const r = randint(2, 100);
      params.r = r;
      return ordinal(r);
    }

    if (rootField === "pct") {
      const pct = randint(1, 99);

      let notChoice = false;

      if (params.object_manufactured || template.includes("{object_manufactured.")) {
        if (!params.object_manufactured) {
          params.object_manufactured = pickItem("object_manufactured");
        }
        notChoice = ensureNotChoice(params, "object_manufactured");

      } else if (params.basketball_type || template.includes("{basketball_type.")) {
        if (!params.basketball_type) {
          params.basketball_type = pickItem("basketball_type");
        }
        notChoice = ensureNotChoice(params, "basketball_type");

      } else if (params.pizza_item || template.includes("{pizza_item}")) {
        if (!params.pizza_item) {
          params.pizza_item = randomChoice(SCENARIO_ITEMS.pizza_item, "pizza_item");
        }

        const waiting = dist === "geometric" || dist === "negative-binomial";
        notChoice = ensureNotChoice(
          params,
          waiting ? "pizza_item_waiting" : "pizza_item_binomial"
        );

      } else if (params.medical_treatment || template.includes("{medical_treatment.")) {
        if (!params.medical_treatment) {
          params.medical_treatment = pickItem("medical_treatment");
        }
        notChoice = ensureNotChoice(params, "medical_treatment");
      }

      params.p = notChoice ? 1 - pct / 100 : pct / 100;
      return pct;
    }

    if (rootField === "pct1") {
      const pct1 = randint(1, 50);
      const pct2 = randint(1, 99 - pct1);
      const pct3 = 100 - pct1 - pct2;

      params.pct2 = pct2;
      params.pct3 = pct3;

      const probs = [pct1, pct2, pct3].map(v => v / 100);
      const idx = randint(0, 2);

      if (params.candies || template.includes("{candies.")) {
        const candies = ensureTriple(params, "candies", "candy_item");
        params.choice = candies[idx];

        const kind = dist === "binomial" ? "candies_binomial_hyper" : "candies_waiting";
        const notChoice = ensureNotChoice(params, kind);
        params.p = notChoice ? 1 - probs[idx] : probs[idx];
      } else if (params.fish || template.includes("{fish.")) {
        const fish = ensureTriple(params, "fish", "fish_item");
        params.choice = fish[idx];

        const notChoice = ensureNotChoice(params, "fish");
        params.p = notChoice ? 1 - probs[idx] : probs[idx];
      } else if (params.movies || template.includes("{movies.")) {
        const movies = ensureTriple(params, "movies", "movie_name");
        params.choice = movies[idx];

        const kind = dist === "binomial" ? "movies_binomial" : "movies_waiting";
        const notChoice = ensureNotChoice(params, kind);
        params.p = notChoice ? 1 - probs[idx] : probs[idx];
      } else if (params.music || template.includes("{music.")) {
        const music = ensureTriple(params, "music", "music_name");
        params.choice = music[idx];

        const kind = dist === "binomial" ? "music_binomial" : "music_waiting";
        const notChoice = ensureNotChoice(params, kind);
        params.p = notChoice ? 1 - probs[idx] : probs[idx];
      }

      return pct1;
    }
  }

  if (dist === "hypergeometric") {
    if (rootField === "N") return randint(5, 100);

    if (rootField === "n") {
      if (params.N === undefined) {
        params.N = randint(5, 100);
      }
      return randint(2, params.N - 1);
    }

    if (rootField === "r_display") {
      const N = params.N ?? randint(5, 100);
      if (params.N === undefined) {
        params.N = N;
      }

      const rDisplay = randint(2, N - 1);

      let notChoice = false;

      if (params.object_manufactured || template.includes("{object_manufactured.")) {
        if (!params.object_manufactured) {
          params.object_manufactured = pickItem("object_manufactured");
        }
        notChoice = ensureNotChoice(params, "object_manufactured");

      } else if (params.major_name || template.includes("{major_name}")) {
        if (!params.major_name) {
          params.major_name = randomChoice(SCENARIO_ITEMS.major_name, "major_name");
        }
        notChoice = ensureNotChoice(params, "major_name");
      }

      params.r = notChoice ? N - rDisplay : rDisplay;
      return rDisplay;
    }

    if (rootField === "r1") {
      const r1 = randint(1, 50);
      const r2 = randint(1, 50);
      const r3 = randint(1, 50);

      params.r2 = r2;
      params.r3 = r3;
      params.N = r1 + r2 + r3;

      const counts = [r1, r2, r3];
      const idx = randint(0, 2);

      if (template.includes("{candies.")) {
        const candies = ensureTriple(params, "candies", "candy_item");
        params.choice = candies[idx];

        const notChoice = ensureNotChoice(params, "candies_binomial_hyper");
        params.r = notChoice ? counts[0] + counts[1] + counts[2] - counts[idx] : counts[idx];
      } else if (template.includes("{fish.")) {
        const fish = ensureTriple(params, "fish", "fish_item");
        params.choice = fish[idx];

        const notChoice = ensureNotChoice(params, "fish");
        params.r = notChoice ? counts[0] + counts[1] + counts[2] - counts[idx] : counts[idx];
      }

      return r1;
    }
  }

  if (dist === "poisson") {
    if (rootField === "l_display") {
      return Number(uniform(1, 100).toFixed(2));
    }

    if (rootField === "time_length") {
      const t = randint(1, 9);
      params.l = params.l_display * t;
      return t;
    }

    if (rootField === "time_plural") {
      return params.time_length === 1 ? "" : "s";
    }
  }

  if (dist === "uniform") {
    if (rootField === "a") return Number(uniform(1, 100).toFixed(2));

    if (rootField === "b") {
      return Number(uniform(params.a + 1, params.a + 100).toFixed(2));
    }
  }

  if (dist === "normal") {
    if (rootField === "m") return Number(uniform(1, 100).toFixed(2));
    if (rootField === "s") return Number(uniform(1, 50).toFixed(2));
  }

  if (dist === "exponential") {
    if (rootField === "l_display") {
      const lDisplay = Number(uniform(0.1, 10).toFixed(2));
      params.l = Number(lDisplay.toFixed(2));
      return lDisplay;
    }
  }

  if (dist === "gamma") {
    if (rootField === "l_display") {
      const lDisplay = Number(uniform(1, 100).toFixed(2));
      params.l = Number(lDisplay.toFixed(2));
      return lDisplay;
    }
    if (rootField === "a" || rootField === "a_display") {
      const a = randint(1, 100);
      params.a = a;
      return a;
    }
  }

  if (dist === "beta") {
    if (rootField === "a_display") {
      if (params.a !== undefined) return params.a;

      const aDisplay = randint(1, 99);
      params.a = aDisplay;
      return ordinal(aDisplay);
    }

    if (rootField === "b_display") {
      if (params.b !== undefined) return params.b;

      const a = params.a ?? randint(1, 99);
      if (params.a === undefined) {
        params.a = a;
      }

      const bDisplay = randint(a + 1, 100);
      params.b = bDisplay;
      return bDisplay;
    }
  }

  return null;
}

function generateScenario(dist, scenario) {
  const template = scenario.template;
  const needed = templateFields(template);
  const params = { ...(scenario.fixed_params || {}) };

  let unresolved = [...needed];
  let safety = 0;

  while (unresolved.length > 0 && safety < 100) {
    safety++;
    let progressed = false;

    for (const field of [...unresolved]) {
      if (getPath(params, field) !== undefined) {
        unresolved = unresolved.filter(f => f !== field);
        progressed = true;
        continue;
      }

      const rootField = field.split(".")[0];

      if (getPath(params, rootField) === undefined) {
        const value = genValue(rootField, dist, params, template);
        if (value !== null && value !== undefined) {
          setPath(params, rootField, value);
          progressed = true;
        }
      }

      if (getPath(params, field) !== undefined) {
        unresolved = unresolved.filter(f => f !== field);
        progressed = true;
      }
    }

    if (!progressed) {
      throw new Error(`Could not resolve fields: ${unresolved.join(", ")}`);
    }
  }

  return {
    prompt: fillTemplate(template, params),
    distribution: dist,
    params: cleanParams(params)
  };
}

export async function generateDistribution(allowed = "") {
  await loadData();

  const allKeys = Object.keys(SCENARIOS);

  let pool;
  if (allowed) {
    const requested = allowed.split(",").map(s => s.trim());
    pool = requested.filter(k => SCENARIOS[k]);
  } else {
    pool = allKeys;
  }

  const dist = randomChoice(pool);
  const scenario = randomChoice(SCENARIOS[dist]);

  return generateScenario(dist, scenario);
}