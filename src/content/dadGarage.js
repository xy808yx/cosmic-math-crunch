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
// DAILY_NOTES — strings shown on the workshop whiteboard, one per real-life
// day. Shown in random order, but every note appears once before any repeat.
// Once per day the kid taps it for +10 stardust.
// Add as many as you like; longer list = longer time before repeats.

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
    bubble: '"Where Dad puts in work to stay strong!."'
  },
  {
    id: 'laptop',
    bubble: '"Where Dad built this game for you"'
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
    bubble: '"Speed for chasing you kids"'
  }
];

// Daily Dad notes — one shown per real-life day on the workshop whiteboard.
// Tapped once per day for +10 stardust. Shown in random order, reshuffled each
// cycle, so every line gets seen before any repeats.
export const DAILY_NOTES = [
"Being brave doesn't mean you're not scared. It means you're scared and you do it anyway.",
"Don't rush. Slow and steady beats standing still every single time.",
"The best time to start something? Right now. Let's go.",
"You don't have to be better than anyone else. Just be better than yesterday-you.",
"Smart people ask great questions. Keep asking why.",
"You're going to mess up sometimes. That's not losing — that's learning.",
"Be the kid who's strong AND kind. The world needs both.",
"Your brain is like a muscle. Every hard thing you do makes it stronger.",
"Don't just watch the game. Get in there and play it.",
"The people who care about you will remember how you made them feel. Be warm.",
"You don't need a lot of stuff to be happy. You need people and adventures.",
"If someone's having a hard day, just be nice to them. That's enough.",
"Every single person you meet knows something you don't. Pay attention.",
"It's okay to not know the answer. Say 'I don't know' and then go find out.",
"Hard things feel impossible right before they click. Don't quit early.",
"Eat good food, move your body, read books. Everything else is bonus.",
"Nobody gets good at anything without practicing when it's boring. Nobody.",
"God gave you your own gifts. Don't waste time wishing for someone else's.",
"When you're frustrated, take a breath. Then try one more time.",
"The biggest adventures start with one small brave step.",
"Try lots of things while you're young. You'll find what fits.",
"A good friend is worth more than a hundred toys. Choose your people wisely.",
"If you want to go far in life, bring good people with you.",
"Rules aren't the opposite of freedom. They're how you earn it.",
"Dad didn't have all the answers either. I just never stopped looking.",
"Be curious about everything. Bored people aren't paying attention.",
"Standing up for what's right is hard. Do it anyway. – Dad",
"Listen more than you talk. Still waters run deep.",
"Some days are tough. That's okay. Tomorrow you get to try again.",
"I'm proud of you. Not for being perfect — for being you. – Dad",
];
