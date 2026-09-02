// ============================================================================
// Hot Pot Time — content config (Chapter 3 secret room, World 19)
// ============================================================================
//
// Edit this file to change what your kids read at the hot pot line. No scene
// code needs to change.
//
// HOTPOT_ITEMS — one entry per clickable object in the room.
//   id     — internal key (must match the entry in HiddenWorldScene's items list)
//   bubble — speech-bubble text shown when the item is tapped. Use \n for line
//            breaks. Wrap quotes around speech-style lines if you like.
//
// The objects follow the REAL self-serve order, left to right, top to bottom:
// grab a bowl → walk the ingredient line → weigh it at the scale → pick a broth
// and a spice level → take a number tag → build your sauce → sit at the table →
// free cone on the way out.
//
// The table board's daily note does NOT live here. There is no per-room deck:
// every board in every secret room deals off the single shared list in
// src/content/dadNotes.js.

export const HOTPOT_ITEMS = [
  {
    id: 'bowls',
    bubble: '"Grab a pot and some tongs!"'
  },
  {
    id: 'line',
    bubble: '"Yum! so many choices, don\'t forget the noodles at the end!"'
  },
  {
    id: 'scale',
    bubble: '"Awesome, what drink do they have today?"'
  },
  {
    id: 'broth',
    bubble: '"Which soup will you choose?"'
  },
  {
    id: 'tag',
    bubble: '"We got a great number, bring it back to the table!"'
  },
  {
    id: 'sauce',
    bubble: '"Garlic, Cilantro, Soy Sauce, Sesame, what else?"'
  },
  {
    id: 'table',
    bubble: '"It\'s nice to sit together as a family"'
  },
  {
    id: 'cone',
    bubble: '"What is your favorite flavor?"'
  }
];
