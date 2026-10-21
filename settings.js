/* =====================================================================
   ✏️  EDIT HERE: names and every little text on the site.

   {her} and {me} are replaced with the two names automatically
   ({Her} / {Me} gives a capital first letter).

   The passwords are NOT in this file on purpose. Anyone can read the
   files of a website, so the passwords live safely in Firebase instead
   (see SETUP.md, step 3).
   ===================================================================== */
const SETTINGS = {
  herName: 'bubu',          // the white bear (her)
  myName:  'dudu',          // the brown bear (you)

  // the two Firebase login accounts (they never receive any email)
  herAccount: 'bubu@example.com',
  myAccount:  'dudu@example.com',

  texts: {
    siteTitle:     '{her} & {me}',
    herPill:       'for the girl i adore',
    herTitle:      'hi {her}, my love ♡',
    herSubtitle:   'a little world, made for you',
    myPill:        "{me}'s corner",
    myTitle:       'hi {me} ♡',
    mySubtitle:    'write something sweet for {her}',
    wrongPassword: "hmm, that's not it 🥺",
    noLetters:     'no new letters right now… {me} is probably planning something 👀',
    tapToOpen:     'tap to open ♡',
    sent:          'sealed & sent to {her} ♡',

    // on the envelope
    envelopeDate:    'for {her} ♡',
    envelopeMorning: 'good morning ☀️',
    envelopeNight:   'sweet dreams 🌙',

    // date invitation answers
    yesButton:  'yes, I’d love to ♡',
    yesClicked: 'yeah!! 💖',
    yesHappy:   '{me} is very happy!! ♡',
    noButton:   'no 🙈',
    noTryAgain: 'try again 🥺',
    noGiveUp:   'okayyyy..... some other time then 🥺',

    // good morning / good night answers
    morningReply: 'good morning {me} ☀️',
    morningAfter: 'have the best day {her} ♡',
    nightReply:   'good night {me} 🌙',
    nightAfter:   'sweet dreams {her} ♡',
  },

  // quick-pick openers in your letter panel
  openers: {
    date:    ['Wanna go on a date?', 'Hey you…', 'I have a little question…', '{Her}, are you free?', 'Guess what 👀'],
    morning: ['Good morning, {her} ☀️', 'Rise and shine ♡', 'Morning, sleepyhead', 'Hope you slept well ♡'],
    night:   ['Good night, {her} 🌙', 'Sweet dreams ♡', 'Sleep tight', 'Night night ✨'],
  },

  // placeholder text in the message box for each kind of letter
  placeholders: {
    date:    "Saturday picnic in the park, I'll bring strawberries 🍓",
    morning: 'Have the best day today, I’m so proud of you ♡',
    night:   'Thank you for today. Dream of us ♡',
  },
};
