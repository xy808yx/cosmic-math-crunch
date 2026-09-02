// ============================================================================
// Dad's Notes — ONE list, rotating across every secret room
// ============================================================================
//
// This is the whole thing. There is no per-room deck: every notice board in
// every secret room deals off this single list.
//   • the garage whiteboard   (Dad's Garage, W16)
//   • the playground board    (Playground, W18)
//   • the hot pot table board (Hot Pot Time, W19)
//
// Each morning the deck deals three DIFFERENT notes and pins one to each board
// for the day, so visiting all three rooms gives three new notes rather than the
// same line three times. Each board still pays its own +10 stardust once a day
// (30/day for all three). See PlayerProgress.claimDailyNoteForBoard.
//
// Every note is shown once before any repeat, in random order, reshuffling each
// cycle. At three a day that's about ten weeks of notes before anything comes
// back around. Add a line anywhere below and it joins the rotation immediately —
// the deck reshuffles automatically when the list length changes.
//
// The section headings are for reading and editing convenience ONLY. They have
// no effect on the game: notes are dealt from the whole list, not by section, so
// a note filed under "Your body" can just as easily land on the hot pot board.
//
// One constraint worth knowing: the GARAGE whiteboard letters its note directly
// onto a fixed 424x104 panel (the other two boards say "tap to read" and show
// the note in a popup). HiddenWorldScene shrinks the type to fit and, past the
// smallest size, trims with an ellipsis. Everything currently here fits — the
// longest note in the list is the horse story at 250 characters, which lands at
// 16px. Keep new notes at or under roughly that length and nothing gets cut off.

export const DAD_NOTES = [
  // ------------------------------------------------------------------
  // God
  // ------------------------------------------------------------------
  "God gave you your own gifts. Don't waste time wishing for someone else's.",
  "God doesn't ask you to win. He asks you to try.",
  "There's a room in your heart that only God belongs in. Don't fill it up with stuff.",
  "Next to what God wants, everything else gets smaller.",
  "God called Samuel, and Samuel said, \"Here I am.\" That's the whole answer. Be ready to say it.",
  "It's never luck. It's always God.",
  "A little bit of thinking can take you away from God. A lot of thinking brings you back.",
  "Before you set out on anything big, ask God's blessing on it.",
  "What good is it to win the whole world if you lose yourself?",
  "Put first things first and you get the second things thrown in. Put second things first and you lose both.",
  "If you wait for perfect weather, you'll never plant anything.",
  "Send your good out into the world like bread on the water. It comes back to you later, long after you forgot you sent it.",
  "Split what you have into seven parts, or even eight. You have no idea which way trouble is coming from.",
  "Plant in the morning and plant again in the evening. You never know which seed is the one that grows.",
  "We only get to walk through time one step at a time, in one direction. God sees the whole thing at once.",

  // ------------------------------------------------------------------
  // Looking up
  // ------------------------------------------------------------------
  "Make time for stargazing. The light landing in your eye tonight left those stars long before you were born.",
  "Take the whole life of the universe and squeeze it into one year. Humans don't show up until 10:30pm on December 31st. Everything in every history book happens in the last ten seconds.",
  "Either we're alone in the universe or we're not. Both of those are amazing, and both are a little bit scary.",
  "People once sailed across oceans and thought no challenge could ever be bigger. Now people sail between the stars.",
  "Airport arrivals gates are some of the happiest places on earth. If a hallway can be that happy, imagine the gates of heaven.",

  // ------------------------------------------------------------------
  // Starting, and not quitting
  // ------------------------------------------------------------------
  "Being brave doesn't mean you're not scared. It means you're scared and you do it anyway.",
  "Don't rush. Slow and steady beats standing still every single time.",
  "The best time to start something? Right now. Let's go.",
  "Hard things feel impossible right before they click. Don't quit early.",
  "Nobody gets good at anything without practicing when it's boring. Nobody.",
  "The biggest adventures start with one small brave step.",
  "Try lots of things while you're young. You'll find what fits.",
  "The best things grow slowly. Plant the seed, water it a little every day, and don't dig it up to check. Give it time.",
  "Don't be afraid of being slow. Be afraid of standing still.",
  "The best time to plant a tree was twenty years ago. The second best time is today.",
  "Next year you'll wish you had started today.",
  "How you spend your days is how you spend your life. Today counts.",
  "Sometimes you win. Sometimes you learn.",
  "You don't get to own being good at something. You rent it, and the rent is due every single day.",
  "One day you'll look back and the hardest years will turn out to be the ones you loved most.",
  "The best thing anyone ever does is fight a battle they're losing, and not lose it.",
  "No plan survives the first minute. Make one anyway, then change it.",
  "Plan for everything going smoothly and chaos will wreck you. Get ready for chaos and you'll do fine either way.",
  "Life keeps teaching you the same lesson until you finally learn it.",
  "Failing teaches you things winning never will. Don't dodge it completely.",
  "Things take way longer to happen than you think. Then they happen all at once.",
  "The first one to try something takes all the bumps. The second one gets the easy road. Go first anyway sometimes.",
  "Being first isn't the same as winning. If anyone can copy what you did, somebody will.",
  "It is much easier to grow up strong than to fix yourself later. What you do now is the cheap version.",

  // ------------------------------------------------------------------
  // Your body
  // ------------------------------------------------------------------
  "Eat good food, move your body, read books. Everything else is bonus.",
  "You only get one body. You can't swap it for a new one, so take care of it. It has to last your whole life.",
  "Your body goes everywhere you go. No one can ever take it away from you. So make it strong and worth carrying.",
  "Being strong and fast isn't a prize you win once. It's just part of taking good care of yourself, every day.",
  "Train your body and your brain. A strong person who can't think is only half a person. So is a smart person who's weak. Work on both.",
  "Doing something well beats doing it a lot. One great try is worth more than a hundred lazy ones.",
  "Learn to give everything you've got, all at once, when it really counts. Sometimes you go slow and save your energy. Sometimes you use all of it.",
  "Doing the work even when you don't feel like it is the hardest part. Most people give up right there. You don't have to.",
  "You don't have to do a hundred things. Pick the few that really matter, and do those really well.",
  "Rest is part of getting stronger, not the opposite. Your body gets stronger while you rest, not while you're tired out.",
  "Don't just trust how you feel. Trust what you can check and measure. Your body will say it's ready before it really is.",
  "You earn the next step. You don't get to skip ahead just because you want it now.",
  "Some pain means you're getting stronger. Some pain is a warning that something is wrong. Learn to tell them apart.",
  "When you get hurt or knocked down, don't just try to get back to where you were. Try to come back even stronger.",
  "Hard things help you grow, but only the right amount. Too little does nothing. Too much breaks you. The trick is finding the right amount.",
  "A lot of the time, the answer isn't doing more. It's stopping the thing that's hurting you.",
  "Win or lose, you're still you. A trophy can't make you better, and losing one can't make you worse. You're the same person either way.",
  "Learn to love the work, not just the winning. You get to do the work every day. Winning doesn't come every day.",
  "Be the boss of your own body. Listen to good coaches, but don't let anyone else make all your choices for you.",
  "How you do one thing is how you do everything. The way you train shows up in the way you live.",
  "The best kind of person trains their mind and their body. Strong enough to fight, smart enough not to have to.",
  "If the thinkers never fight and the fighters never think, you get cowards doing the thinking and fools doing the fighting.",
  "Try lots of sports while you're young. Most of the greatest athletes played all kinds of things before they picked one.",
  "The cure for anything is salt water: sweat, tears, or the sea.",
  "Nothing you buy will make you better. Everything you need to grow with is already inside you.",
  "Learn the rules really, really well. Then you'll know when to break them. Bruce Lee did both.",
  "Keep your plans quiet. Then when you move, move like thunder.",
  "If you want peace, be ready. Nobody picks on the prepared.",
  "There's a word, ascetic. It means somebody who can go without on purpose. Practise going without something you like. It makes you very hard to push around.",
  "Eat well, move your body, spend less than you make. Boring rules. Those three are what buy you a free life.",

  // ------------------------------------------------------------------
  // Thinking and learning
  // ------------------------------------------------------------------
  "Smart people ask great questions. Keep asking why.",
  "You're going to mess up sometimes. That's not losing — that's learning.",
  "Your brain is like a muscle. Every hard thing you do makes it stronger.",
  "Every single person you meet knows something you don't. Pay attention.",
  "It's okay to not know the answer. Say 'I don't know' and then go find out.",
  "Dad didn't have all the answers either. I just never stopped looking.",
  "Be curious about everything. Bored people aren't paying attention.",
  "Always ask, \"Why?\" and \"How do we know that?\" Don't believe something just because someone said it loudly or sounded sure.",
  "Saying \"I don't know\" feels bad for a second. Understanding something feels good forever. Pick understanding over being right.",
  "You don't really have an opinion until you can argue the other side better than they can.",
  "Start out certain and you'll end up confused. Start out unsure and you'll end up certain.",
  "Not knowing feels uncomfortable. Being totally sure about everything is worse.",
  "Judge a person by their questions, not their answers.",
  "If you think you have all the answers, you didn't understand the questions.",
  "You have to learn an awful lot before you find out how little you know.",
  "The farther you travel, the less you realize you know.",
  "More mistakes come from being stubborn than from being confused.",
  "People were once completely certain the earth was flat. Being sure is not the same as being right.",
  "What a wise person believes at the start, a fool believes at the end.",
  "To get smarter, add something every day. To get wiser, take something away every day.",
  "A full cup can't hold any more tea. Come to new things with an empty cup.",
  "Everyone wants a better memory. Almost nobody practices letting things go.",
  "You mostly see what you were already looking for. So look for good things.",
  "Learning something new always stings your pride a little. That's why little kids learn fast and proud grown-ups don't learn at all.",
  "A screen full of numbers looks like the truth. It's only the answers to the questions somebody chose to ask.",
  "Don't mix up the map with the actual place.",
  "If your brain were simple enough for you to understand it, you'd be too simple to understand it.",
  "Every time you practise something your brain builds a path for it, and quietly takes apart the paths you stopped using. Use it or lose it, literally.",
  "People who speak different languages notice different things. Learning another language hands you a second way of thinking.",
  "Some questions answer themselves the moment you actually say them out loud.",
  "Winners all win in different ways. Losers pretty much all lose the same way. So learn how not to lose first.",

  // ------------------------------------------------------------------
  // Being a person worth being
  // ------------------------------------------------------------------
  "You don't have to be better than anyone else. Just be better than yesterday-you.",
  "Be the kid who's strong AND kind. The world needs both.",
  "Rules aren't the opposite of freedom. They're how you earn it.",
  "Standing up for what's right is hard. Do it anyway. – Dad",
  "Tell the truth, even when it gets you in trouble. A lie starts small but keeps growing. The truth is easier in the end, even when it's hard right now.",
  "Keep your word. If you said you'd do something, do it. Do it even when it's hard, and even when no one is watching.",
  "Some mistakes you can fix. A few you can never undo. Be brave with the ones you can fix, and very careful with the ones you can't.",
  "Don't do something just because everyone else is. The crowd is often wrong. Think for yourself, and be willing to go your own way.",
  "Learn to do real things. Learn to fix, build, carry, and help. A person who can do things is never helpless.",
  "Beating yourself is the best win there is.",
  "There's nothing great about being better than somebody else. Being better than who you were is the real thing.",
  "Don't try to be successful. Try to be worth something.",
  "Everybody has it in them to be really good or really bad. You pick, every day.",
  "Be true to yourself. Always.",
  "Rule your mind or it will rule you.",
  "It's only embarrassing if you're embarrassed.",
  "A good person is free even in chains. A wicked king is a slave to every bad habit he's got.",
  "The two most important days of your life are the day you were born and the day you find out why.",
  "Don't do something just to look important, or to be liked, or for money alone.",
  "People who go chasing power usually shouldn't have it.",
  "There are three ways to get ahead: be first, be smarter, or cheat. Never cheat.",
  "I went looking everywhere for myself. Turns out I was the traveler AND the place I was going.",
  "Somebody has to watch out for everyone else. Be the one who notices when a person is missing, and goes out in the dark to find them.",
  "Some things break when you shake them. A few things actually get stronger. Be the second kind.",
  "Check yourself before you wreck yourself. Look in the mirror first, not last.",
  "Getting a lot done and being good are two different scorecards. Make sure you're winning the one that counts.",
  "An enemy is easier to handle than a traitor. Someone who was on your side and turned does more damage than someone who was never with you.",

  // ------------------------------------------------------------------
  // Worry, and what's yours to carry
  // ------------------------------------------------------------------
  "When you're frustrated, take a breath. Then try one more time.",
  "Some days are tough. That's okay. Tomorrow you get to try again.",
  "You can't always control what happens. You can only control what you do next. When something goes wrong, don't stay angry. Ask, \"Okay, what do I do now?\"",
  "We suffer way more in our imagination than we ever do in real life.",
  "Between what happens to you and what you do about it, there's a gap. That gap is where you're free.",
  "Don't let the future bother you. When it shows up, you'll meet it with the same good sense you have today.",
  "Don't let somebody who upset you live rent free in your head.",
  "Your mind is like a bowl of water. Shake it and everything looks shaky. It isn't. Let it settle, then look.",
  "When things go wrong, a kid blames everybody else. Growing up means blaming yourself instead. Being wise means you don't need to blame anyone.",
  "Not every problem needs a hard answer. Sometimes the easy one is the right one.",
  "Not knowing what happens next is exactly what makes you free.",
  "Don't get so comfortable with the world that you stop caring, and don't get so upset with it that you give up.",
  "You are the only person who has been with you your whole life. Learn to be good company for yourself.",

  // ------------------------------------------------------------------
  // People
  // ------------------------------------------------------------------
  "The people who care about you will remember how you made them feel. Be warm.",
  "If someone's having a hard day, just be nice to them. That's enough.",
  "A good friend is worth more than a hundred toys. Choose your people wisely.",
  "If you want to go far in life, bring good people with you.",
  "Listen more than you talk. Still waters run deep.",
  "I'm proud of you. Not for being perfect — for being you. – Dad",
  "Be kind to people who can't give you anything back. The way you treat someone smaller or weaker shows who you really are.",
  "Family is the team that never quits on you. Be there for them, and they'll be there for you.",
  "Be hard on the problem and soft on the person.",
  "If you want to go fast, go alone. If you want to go far, go together.",
  "Everyone you meet is you, living a different life with different ideas. Be kind to them.",
  "The friends you have right now might be the best ones you ever get. Treat them like it.",
  "Even if you grow apart from someone, you still grew up side by side. Your roots stay tangled forever.",
  "Say what you think once, clearly. If they still don't agree, drop it. Saying it again won't help.",
  "Make deals that are fair to both sides. Lopsided deals fall apart. You learn a lot about a person from their first offer.",
  "Don't take everything an older person tells you. Fools grow old too.",
  "Every job has its own secret language. Sometimes that's on purpose, to keep you out. Ask them to say it plainly.",
  "Some jobs you should only take because you're called to them. Never just for the money.",
  "Being free isn't only about nobody bossing you around. It's about not needing to boss anyone either.",
  "People will forget what you said and they'll forget what you did. They will never forget how you made them feel.",
  "Kids don't do what you tell them. They do what they watch you do.",
  "People are wired differently from each other. Figuring out how somebody is built is most of how you get along with them.",
  "Pick your friends on purpose, not just because they happened to be sitting next to you.",
  "Now that anybody can become anything, people worry MORE about where they rank, not less. Don't play that game.",
  "Some people feel at home in a crowd the way a bird feels at home in the air. You can be far from home and everywhere at home at the same time.",

  // ------------------------------------------------------------------
  // Money and stuff
  // ------------------------------------------------------------------
  "You don't need a lot of stuff to be happy. You need people and adventures.",
  "Find out how little you actually need to be happy. Knowing that number makes you free.",
  "Happiness isn't getting more. It's learning to enjoy less.",
  "Price is what you pay. Value is what you get. They are not the same thing.",
  "It's fine to have money. Just keep it in your house and not in your heart.",
  "Money should work for you. Don't spend your life working for it.",
  "People chase money and stuff their whole lives. Nothing on this earth beats being carefree.",
  "Ask for things to do, not things to own. Never get so old that you only watch the game instead of playing it.",
  "Don't care about something more than it's actually worth.",
  "Everybody who ever lived was busy with something. Where are they all now? Don't spend your life chasing things that won't matter.",
  "Ads and apps are built to make you want things. Notice when somebody is selling to you.",
  "Ask what something costs in time, not just in money.",
  "It wasn't my thinking that won. It was my sitting still. Being right AND sitting tight is rare.",
  "Never put everything into one thing. Split it up. You don't get to know ahead of time which one works out.",
  "Save enough that you can politely say \"no thank you\" to anything you don't want to do. That is what money is actually for.",
  "A wolf is just a dog that never took the free food. Be careful what comfort costs you.",
  "When people stop trusting whoever is in charge of the money, they go and buy something real, like gold. Trust is worth something you can measure.",

  // ------------------------------------------------------------------
  // Going places
  // ------------------------------------------------------------------
  "Read ten thousand books. Walk ten thousand miles. You need both.",
  "Travel changes the way you feel about the whole planet.",
  "Once you've met people from a place, it stops being a name on a map. It gets much harder to wish them harm.",
  "Skip the fancy resorts full of people trying hard to relax. Go to villages. Sit with the locals and learn how to do nothing when there's nothing to do.",
  "Don't let a line on a map decide who you are.",
  "Once you cross an ocean, you're always on the wrong side of it. Part of you stays behind.",
  "The Welsh have a word, hiraeth. It means missing a home you can't go back to. Some feelings need their own word.",
  "The words you know are the size of your world. Go learn more words.",

  // ------------------------------------------------------------------
  // Time and attention
  // ------------------------------------------------------------------
  "Don't just watch the game. Get in there and play it.",
  "Being busy isn't the same as being alive. Make time to just be here.",
  "Stop planning and worrying for one minute and look around you. That minute is your life too.",
  "When it's time to work, work. When it's time to play, play. Don't smear them together.",
  "Good teachers are worth more than anything you can buy. Never be cheap about learning.",
  "Short is harder than long. \"Sorry for the long letter, I didn't have time to write a short one.\"",
  "Stories let you make the mistake and learn the lesson without getting hurt. That's what books are for.",
  "Four things never come back: the word you said, the arrow you shot, the day that passed, and the chance you didn't take.",
  "Not everything that can be counted counts, and not everything that counts can be counted.",
  "Big clever civilizations fall apart by forgetting the obvious things. Don't forget the obvious things.",
  "Be careful what you wish for. Getting it will change you into the kind of person who could get it.",
  "In the middle of winter, I found an invincible summer inside me.",
  "An old man's horse ran off. \"Bad luck,\" said the neighbours. It came back with a second horse. \"Good luck!\" His son rode it and broke his leg. \"Bad luck!\" Then the army came for every healthy young man, and his son stayed home. You never really know.",
  "Love the world enough to want to fix it, and see it clearly enough to know it needs fixing.",
  "When you're doing something that matters, it's okay to tell people to wait.",
  "Some things you learn from your parents on purpose. Some you pick up by accident. Both of them count."
];

// The notice boards that deal off the list above. They share the list and the
// deck; each keeps its own once-per-day stardust claim. Must match
// GameData.DAD_NOTE_BOARDS.
export const NOTE_BOARDS = ['garage', 'playground', 'hotpot'];
