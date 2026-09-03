// Home Ground (Chapter 3): the eight places of one family Saturday, worlds 31
// to 38, drawn in the Paper Cutout style. Each module exports one world object
// { id, bgTop, bgBottom, drawHorizon, drawNode, emit }. The three art tables
// (WorldBackgrounds, WorldNodeArt, WorldAmbience) register these by id, so
// nothing else in the repo imports the world modules directly.

import { world31 } from './world31.js';
import { world32 } from './world32.js';
import { world33 } from './world33.js';
import { world34 } from './world34.js';
import { world35 } from './world35.js';
import { world36 } from './world36.js';
import { world37 } from './world37.js';
import { world38 } from './world38.js';

export const HOME_GROUND_WORLDS = {
  31: world31,
  32: world32,
  33: world33,
  34: world34,
  35: world35,
  36: world36,
  37: world37,
  38: world38
};
