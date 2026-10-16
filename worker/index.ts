import { refreshPasses } from "./passes";
import { radio } from "./radio";

const PASS_REFRESH_MS = 45 * 60 * 1000; // 45 minutes
const RADIO_MS = 1000;

refreshPasses();
setInterval(refreshPasses, PASS_REFRESH_MS);

radio();
setInterval(radio, RADIO_MS);
