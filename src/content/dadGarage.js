// ============================================================================
// Dad's Garage — content config
// ============================================================================
//
// Edit this file to change what your kids read in the garage. No scene code
// needs to change.
//
// GARAGE_ITEMS — one entry per clickable object in the garage.
//   id     — internal key (must match the entry in HiddenWorldScene's items list)
//   bubble — speech-bubble text shown when the item is tapped. Use \n for line
//            breaks. Wrap quotes around speech-style lines if you like.
//
// The whiteboard's daily note does NOT live here. There is no per-room deck:
// every board in every secret room deals off the single shared list in
// src/content/dadNotes.js.

export const GARAGE_ITEMS = [
  {
    id: 'freezer',
    bubble: '"Steak, dumplings, ice cream, blueberries and bacon!"'
  },
  {
    id: 'rack',
    bubble: '"Snacks, laundry pods, and DRIED MANGO."'
  },
  {
    id: 'bins',
    bubble: "\"What's in them?! Especially mom's D BAGS bin.\""
  },
  {
    id: 'squat',
    bubble: '"Where Dad puts in work to stay strong!"'
  },
  {
    id: 'laptop',
    bubble: '"Where Dad built this game for you."'
  },
  {
    id: 'printer',
    bubble: '"Where Dad 3D prints toys for you."'
  },
  {
    id: 'stroller',
    bubble: '"This carried all three of you. It\'s still ready for one more trip."'
  },
  {
    id: 'bikes',
    bubble: '"You learned to ride on these bikes!"'
  },
  {
    id: 'ebike',
    bubble: '"Dad\'s cosmic transport plus a seat for an extra astronaut."'
  },
  {
    id: 'shoes',
    bubble: '"Speed for chasing you kids!"'
  }
];
