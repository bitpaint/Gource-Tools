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
  // -- Temporal Profiles --
  {
    id: 'last_24h',
    name: 'Last 24 Hours',
    description: 'Visualize activity from the last 24 hours',
    settings: { 
      secondsPerDay: 1, 
      timeScale: 1.5, 
      autoSkipSeconds: 0.1 
    },
    dynamicTimeCalculation: true, // Indicates this profile needs date calculation
    daysToInclude: 1,
    isTemporalProfile: true
  },
  {
    id: 'last_7d',
    name: 'Last 7 Days',
    description: 'Visualize activity from the last 7 days',
    settings: { 
      secondsPerDay: 10, 
      timeScale: 1.0, 
      autoSkipSeconds: 0.5 
    },
    dynamicTimeCalculation: true,
    daysToInclude: 7,
    isTemporalProfile: true
  },
  {
    id: 'last_30d',
    name: 'Last 30 Days',
    description: 'Visualize activity from the last 30 days',
    settings: { 
      secondsPerDay: 60, 
      timeScale: 1.0, 
      autoSkipSeconds: 1 
    },
    dynamicTimeCalculation: true,
    daysToInclude: 30,
    isTemporalProfile: true
  },
  {
    id: 'last_90d',
    name: 'Last 90 Days',
    description: 'Visualize activity from the last 90 days',
    settings: { 
      secondsPerDay: 180, 
      timeScale: 1.0, 
      autoSkipSeconds: 1 
    },
    dynamicTimeCalculation: true,
    daysToInclude: 90,
    isTemporalProfile: true
  },
  {
    id: 'last_365d',
    name: 'Last 365 Days',
    description: 'Visualize activity from the last 365 days',
    settings: { 
      secondsPerDay: 300, 
      timeScale: 0.8, 
      autoSkipSeconds: 1 
    },
    dynamicTimeCalculation: true,
    daysToInclude: 365,
    isTemporalProfile: true
  },
  {
    id: 'this_week',
    name: 'This Week (Since Sunday)',
    description: 'Visualize activity since the start of the current week (Sunday)',
    settings: { 
      secondsPerDay: 10, 
      timeScale: 1.0, 
      autoSkipSeconds: 0.5 
    },
    dynamicTimeCalculation: true,
    getStartDate: getStartOfWeek,
    isTemporalProfile: true
  },
  {
    id: 'this_month',
    name: 'This Month',
    description: 'Visualize activity since the start of the current month',
    settings: { 
      secondsPerDay: 60, 
      timeScale: 1.0, 
      autoSkipSeconds: 1 
    },
    dynamicTimeCalculation: true,
    getStartDate: getStartOfMonth,
    isTemporalProfile: true
  },
  {
    id: 'this_year',
    name: 'This Year',
    description: 'Visualize activity since the start of the current year',
    settings: { 
      secondsPerDay: 300, 
      timeScale: 0.8, 
      autoSkipSeconds: 1 
    },
    dynamicTimeCalculation: true,
    getStartDate: getStartOfYear,
    isTemporalProfile: true
  },
  
  // -- Thematic/Duration Profiles --
  {
    id: 'quick_overview_30s',
    name: 'Quick Overview (30s)',
    description: 'Fast-paced overview of the project activity, compressed into 30 seconds',
    settings: {
      secondsPerDay: -1, // Placeholder, will be calculated based on project duration
      outputFramerate: 30,
      timeScale: 2.0,
      autoSkipSeconds: 0.01, // Very fast skipping
      hide: ['filenames'],
      bloomMultiplier: 1.5,
      titleText: '{projectName} - Quick Overview',
      stopPosition: '1.0' // Ensure it plays till the end
    },
    targetDurationSeconds: 30,
    isTemporalProfile: false // This profile adjusts based on project duration, not a fixed past period
  },
  {
    id: 'everything_1m',
    name: 'Everything in 1min',
    description: 'Profile to visualize the entire project in 1 minute',
    settings: {
      secondsPerDay: -1, // Placeholder, calculated based on project duration
      outputFramerate: 30,
      timeScale: 1.5,
      autoSkipSeconds: 0.1,
      hide: ['date'],
      bloomMultiplier: 1.2,
      titleText: '{projectName} - Full History (1 min)',
      stopPosition: '1.0'
    },
    targetDurationSeconds: 60,
    isTemporalProfile: false // Based on the total duration of the project (first commit to last commit)
  },
];

module.exports = customRenderProfiles; 