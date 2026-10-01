export type GreetingData = {
  greeting: string
  subcopy: string
  formattedDate: string
}

export function getTimeBasedGreeting(now: Date = new Date()): GreetingData {
  const hours = now.getHours()

  const formattedDate = now
    .toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()

  if (hours >= 5 && hours < 12) {
    return {
      greeting: 'Good morning',
      subcopy: "Ready for a productive day? Here's what's happening across ThoorigAI Infotech.",
      formattedDate,
    }
  } else if (hours >= 12 && hours < 17) {
    return {
      greeting: 'Good afternoon',
      subcopy: "Keep up the momentum. Here's what's happening across ThoorigAI Infotech.",
      formattedDate,
    }
  } else if (hours >= 17 && hours < 22) {
    return {
      greeting: 'Good evening',
      subcopy: "Wrapping up today's sessions. Here's what's happening across ThoorigAI Infotech.",
      formattedDate,
    }
  } else {
    return {
      greeting: 'Good evening',
      subcopy: 'Reviewing after-hours academy operations and records.',
      formattedDate,
    }
  }
}
