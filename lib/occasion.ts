export type OccasionInfo = {
  occasionName: string;
  badgeText: string;
  suggestionCopy: string;
  templates: string[];
};

const LOOKAHEAD_DAYS = 45;

function daysUntil(target: Date, from: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = target.setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0);
  return Math.ceil(diff / msPerDay);
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number) {
  const first = new Date(year, month, 1);
  const shift = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + shift + (nth - 1) * 7);
}

function nextDate(month: number, day: number, now: Date) {
  const year = now.getFullYear();
  const thisYear = new Date(year, month, day);
  return thisYear >= now ? thisYear : new Date(year + 1, month, day);
}

function withYear(candidate: Date, now: Date) {
  return candidate >= now ? candidate : new Date(candidate.getFullYear() + 1, candidate.getMonth(), candidate.getDate());
}

export function getUpcomingOccasion(now = new Date()): OccasionInfo {
  const year = now.getFullYear();

  const events: Array<{ date: Date; info: OccasionInfo }> = [
    {
      date: nextDate(1, 14, now),
      info: {
        occasionName: "Valentine's Day",
        badgeText: "Valentine's is coming",
        suggestionCopy: "Create something personal and heartfelt.",
        templates: [
          "Romantic watercolor portrait with warm candlelight",
          "Elegant floral artwork with soft blush tones",
        ],
      },
    },
    {
      date: withYear(nthWeekdayOfMonth(year, 4, 0, 2), now), // second Sunday May
      info: {
        occasionName: "Mother's Day",
        badgeText: "Mother's Day is coming",
        suggestionCopy: "Make something thoughtful and personal.",
        templates: [
          "Soft pastel floral keepsake design for Mum",
          "Heartwarming family portrait in painterly style",
        ],
      },
    },
    {
      date: withYear(nthWeekdayOfMonth(year, 5, 0, 3), now), // third Sunday June
      info: {
        occasionName: "Father's Day",
        badgeText: "Father's Day is coming",
        suggestionCopy: "Create a gift they'll keep forever.",
        templates: [
          "Classic vintage illustration celebrating Dad",
          "Warm family scene with subtle retro tones",
        ],
      },
    },
    {
      date: nextDate(9, 31, now),
      info: {
        occasionName: "Halloween",
        badgeText: "Halloween is coming",
        suggestionCopy: "Try something playful and spooky.",
        templates: [
          "Friendly spooky cartoon scene with pumpkins",
          "Cozy autumn night illustration with warm glow",
        ],
      },
    },
    {
      date: nextDate(11, 25, now),
      info: {
        occasionName: "Christmas",
        badgeText: "Christmas is coming",
        suggestionCopy: "Create a keepsake they'll unwrap with a smile.",
        templates: [
          "Photoreal festive family scene with warm lights",
          "Cozy winter watercolor with soft holiday palette",
        ],
      },
    },
  ];

  const upcoming = events
    .map((event) => ({ ...event, inDays: daysUntil(new Date(event.date), now) }))
    .filter((event) => event.inDays >= 0 && event.inDays <= LOOKAHEAD_DAYS)
    .sort((a, b) => a.inDays - b.inDays)[0];

  if (upcoming) return upcoming.info;

  return {
    occasionName: "Birthday",
    badgeText: "Create for any occasion",
    suggestionCopy: "Birthday, thank-you, and anniversary gifts always work.",
    templates: [
      "Elegant birthday illustration with soft festive lighting",
      "Minimal modern keepsake art with warm neutral palette",
    ],
  };
}

