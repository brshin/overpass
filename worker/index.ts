import { DEMO_PASS_MS, refreshPasses, refreshPassesDemo } from "./passes";
import { radio } from "./radio";

/** Flip to false for real Celestrak + SGP4 pass refresh. */
const DEMO_MODE = true;

const PASS_REFRESH_MS = DEMO_MODE
    ? Math.floor(DEMO_PASS_MS * 0.75) // renew before the 2‑min window ends (~90s)
    : 45 * 60 * 1000;
const RADIO_MS = 1000;

const refresh = DEMO_MODE ? refreshPassesDemo : refreshPasses;

console.log(DEMO_MODE ? "worker: DEMO_MODE on" : "worker: DEMO_MODE off (live passes)");

refresh();
setInterval(refresh, PASS_REFRESH_MS);

radio();
setInterval(radio, RADIO_MS);
