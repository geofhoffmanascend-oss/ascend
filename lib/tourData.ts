export const PERSONAS = {
  marcus: { name: 'Marcus Silva', belt: 'black', stripes: 2, initials: 'MS', role: 'Instructor' },
  jordan: { name: 'Jordan Lee', belt: 'blue', stripes: 3, initials: 'JL', role: 'Student' },
  sam: { name: 'Sam Chen', belt: 'white', stripes: 0, initials: 'SC', role: 'Student (New)' },
  dana: { name: 'Dana Kim', belt: 'brown', stripes: 1, initials: 'DK', role: 'Instructor' },
}

export const TOUR_SCHEDULE = [
  { time: '6:00 AM', title: 'Morning No-Gi', type: 'nogi', instructor: 'Marcus', count: 8, registered: false },
  { time: '12:00 PM', title: 'Fundamentals', type: 'fundamentals', instructor: 'Dana', count: 12, registered: false },
  { time: '6:30 PM', title: 'Advanced Gi', type: 'gi', instructor: 'Marcus', count: 15, registered: false },
  { time: '7:30 PM', title: 'Competition Prep', type: 'competition_prep', instructor: 'Marcus', count: 6, registered: false },
]

export const TOUR_FORUM_POSTS = [
  { author: 'Marcus', belt: 'black', time: '2 days ago', content: "Great rolling session tonight. Focus on maintaining frames when defending mount — we'll drill this Thursday." },
  { author: 'Jordan', belt: 'blue', time: '1 day ago', content: 'Question on the hip escape — should my bottom knee be pointed up or out when bridging?' },
  { author: 'Sam', belt: 'white', time: '5 hours ago', content: "First week complete! Still getting lost in the positions but it's starting to click. 🥋" },
]

export const TOUR_DM_CONVERSATION = [
  { from: 'jordan', text: 'Hey Marcus, would it be possible to schedule a private lesson focused on leg lock defense?' },
  { from: 'marcus', text: "Absolutely. How does Saturday at 10am work? We'll spend the first half on heel hook awareness and finish with ashi garami entries." },
  { from: 'jordan', text: "Perfect, I'll put in the request now. Thanks!" },
  { from: 'marcus', text: 'Confirmed. See you then. Come ready to tap a lot 😄' },
]

export const TOUR_JOURNAL = {
  title: 'Evening Gi — Back Attacks',
  technique: "Worked back takes off failed single leg. Key detail: don't chase the seatbelt — establish the harness first, then secure the hooks.",
  goal: 'Improve back retention. Stop losing position when they peel the top hook.',
  energy: '8/10',
  focus: '9/10',
}

export const ADMIN_TOUR_STUDENTS = [
  { name: 'Alex Rivera', belt: 'white', stripes: 2, joined: '3 weeks ago', reflection: 'I started BJJ to get in shape and learn real self-defense. My biggest challenge is staying consistent with a busy work schedule.' },
  { name: 'Morgan Davis', belt: 'blue', stripes: 0, joined: '8 months ago', reflection: 'Goals: compete at the local tournament in March. Currently working on my guard passing.' },
  { name: 'Sam Chen', belt: 'white', stripes: 0, joined: 'Today', reflection: 'Just started! Hoping to find a new community and challenge myself physically and mentally.' },
]

export const ADMIN_STATS = {
  totalStudents: 47,
  sessionsThisWeek: 12,
  checkInsToday: 23,
  newSignupsThisMonth: 6,
}

export const ADMIN_FEEDBACK = [
  { student: 'Jordan Lee', sentiment: 'positive', text: 'Best class in months. The drilling sequence finally made guard passing click for me.', belt: 'blue' },
  { student: 'Alex Rivera', sentiment: 'concern', text: "Feeling a bit lost in advanced class — might not be the right level yet.", belt: 'white' },
  { student: 'Anonymous', sentiment: 'positive', text: 'Love the new no-gi curriculum. Much more systematic than before.', belt: null },
]
