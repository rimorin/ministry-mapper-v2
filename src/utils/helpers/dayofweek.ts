/**
 * Utility functions for working with day of week values
 * Follows JavaScript Date.getDay() format: Sunday=0, Monday=1, Tuesday=2, ..., Saturday=6
 * For this application we primarily use weekdays: Monday=1 through Friday=5
 */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday"
} as const;

export const DAY_NUMBERS = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
} as const;

export const DAY_ABBREVIATIONS = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
} as const;

/**
 * Convert day number to day name
 * @param dayNumber - Day number (1-5)
 * @returns Day name string
 */
export const getDayName = (dayNumber: DayOfWeek): string => {
  return DAY_NAMES[dayNumber];
};

/**
 * Convert day name to day number
 * @param dayName - Day name string
 * @returns Day number (1-5)
 */
export const getDayNumber = (dayName: keyof typeof DAY_NUMBERS): DayOfWeek => {
  return DAY_NUMBERS[dayName];
};

/**
 * Convert day number to abbreviated day name
 * @param dayNumber - Day number (1-5)
 * @returns Abbreviated day name
 */
export const getDayAbbreviation = (dayNumber: DayOfWeek): string => {
  return DAY_ABBREVIATIONS[dayNumber];
};

/**
 * Get all days as numbers
 * @returns Array of all day numbers [0, 1, 2, 3, 4, 5, 6]
 */
export const getAllDayNumbers = (): DayOfWeek[] => {
  return [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[];
};

/**
 * Get all day names
 * @returns Array of all day names
 */
export const getAllDayNames = (): string[] => {
  return Object.values(DAY_NAMES);
};

/**
 * Check if a number is a valid weekday (Monday-Friday)
 * @param day - Number to check
 * @returns True if valid weekday (1-5)
 */
export const isValidWeekday = (day: number): day is DayOfWeek => {
  return day >= 1 && day <= 5 && Number.isInteger(day);
};

/**
 * Get weekday numbers only (Monday-Friday)
 * @returns Array of weekday numbers [1, 2, 3, 4, 5]
 */
export const getWeekdayNumbers = (): DayOfWeek[] => {
  return [1, 2, 3, 4, 5] as DayOfWeek[];
};

/**
 * Get the next weekday
 * @param currentDay - Current day number
 * @returns Next weekday number (wraps from Friday to Monday)
 */
export const getNextWeekday = (currentDay: DayOfWeek): DayOfWeek => {
  return currentDay === 5 ? 1 : ((currentDay + 1) as DayOfWeek);
};

/**
 * Get the previous weekday
 * @param currentDay - Current day number
 * @returns Previous weekday number (wraps from Monday to Friday)
 */
export const getPreviousWeekday = (currentDay: DayOfWeek): DayOfWeek => {
  return currentDay === 1 ? 5 : ((currentDay - 1) as DayOfWeek);
};

/**
 * Sort an array of day numbers in week order
 * @param days - Array of day numbers to sort
 * @returns Sorted array in week order (Sunday first)
 */
export const sortDays = (days: DayOfWeek[]): DayOfWeek[] => {
  return [...days].sort((a, b) => a - b);
};

/**
 * Get current day of week for agent schedules (all days including weekends)
 * @returns Current day number (0=Sunday, 1=Monday, etc.)
 */
export const getCurrentWeekday = (): DayOfWeek => {
  const today = new Date();
  return today.getDay() as DayOfWeek;
}; /**
 * Get current day of week (including weekends)
 * @returns Current day number (0-6)
 */
export const getCurrentDayOfWeek = (): DayOfWeek => {
  const today = new Date();
  return today.getDay() as DayOfWeek;
};
