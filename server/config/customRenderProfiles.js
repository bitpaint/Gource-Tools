/**
 * This file defines additional profiles for specific renderings
 */

// Function to get ISO date string for X days ago
function getDateXDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

// Function to get ISO date string for start of the current week (Sunday)
function getStartOfWeek() {
  const date = new Date();
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...
  date.setDate(date.getDate() - dayOfWeek);
  return date.toISOString().split('T')[0];
}

// Function to get ISO date string for start of the current month
function getStartOfMonth() {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

// Function to get ISO date string for start of the current year
function getStartOfYear() {
  const date = new Date();
  date.setMonth(0, 1);
  return date.toISOString().split('T')[0];
}

// -- Custom Render Profiles --
const customRenderProfiles = [
  {
    id: 'everything_1m',
    name: 'Everything in 1 min',
    description: 'Visualize the entire project history compressed into approximately 1 minute.',
    isDefault: true, // Mark this as the default profile
    isSystemProfile: true, // Cannot be edited or deleted by user
    settings: {
      // Key setting: Dynamic calculation based on project duration
      secondsPerDay: 'auto-60s', 
      // Sensible defaults for a quick overview
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      hide: ['date'], // Hide date for faster pace
      bloomMultiplier: 1.2,
      title: '{projectName} - Full History ({duration} min)',
      stopPosition: '1.0' // Ensure it plays till the end
    }
  },
  {
    id: 'last_week_1m',
    name: 'Last Week in 1 min',
    description: 'Visualize the last 7 days of activity compressed into approximately 1 minute.',
    isSystemProfile: true,
    settings: {
      // Key settings: Relative start date and dynamic speed
      startDate: 'relative-7d',
      secondsPerDay: 'auto-60s',
      // Other settings
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      title: '{projectName} - Last 7 Days ({duration} min)',
      stopPosition: '1.0'
    }
  },
  {
    id: 'last_month_1m',
    name: 'Last Month in 1 min',
    description: 'Visualize the last 30 days of activity compressed into approximately 1 minute.',
    isSystemProfile: true,
    settings: {
      startDate: 'relative-30d',
      secondsPerDay: 'auto-60s',
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      title: '{projectName} - Last 30 Days ({duration} min)',
      stopPosition: '1.0'
    }
  },
  {
    id: 'last_year_1m',
    name: 'Last Year in 1 min',
    description: 'Visualize the last 365 days of activity compressed into approximately 1 minute.',
    isSystemProfile: true,
    settings: {
      startDate: 'relative-365d',
      secondsPerDay: 'auto-60s',
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      title: '{projectName} - Last 365 Days ({duration} min)',
      stopPosition: '1.0'
    }
  }
];

module.exports = customRenderProfiles; 