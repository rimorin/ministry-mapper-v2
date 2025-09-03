import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DayOfWeek,
  DAY_NAMES,
  DAY_NUMBERS,
  DAY_ABBREVIATIONS,
  getDayName,
  getDayNumber,
  getDayAbbreviation,
  getAllDayNumbers,
  getAllDayNames,
  isValidWeekday,
  getWeekdayNumbers,
  getNextWeekday,
  getPreviousWeekday,
  sortDays,
  getCurrentWeekday,
  getCurrentDayOfWeek
} from "./dayofweek";

describe("dayofweek", () => {
  describe("Constants", () => {
    describe("DAY_NAMES", () => {
      it("should have correct day names mapping", () => {
        expect(DAY_NAMES[0]).toBe("Sunday");
        expect(DAY_NAMES[1]).toBe("Monday");
        expect(DAY_NAMES[2]).toBe("Tuesday");
        expect(DAY_NAMES[3]).toBe("Wednesday");
        expect(DAY_NAMES[4]).toBe("Thursday");
        expect(DAY_NAMES[5]).toBe("Friday");
        expect(DAY_NAMES[6]).toBe("Saturday");
      });

      it("should have all 7 days", () => {
        expect(Object.keys(DAY_NAMES)).toHaveLength(7);
      });
    });

    describe("DAY_NUMBERS", () => {
      it("should have correct day numbers mapping", () => {
        expect(DAY_NUMBERS.Sunday).toBe(0);
        expect(DAY_NUMBERS.Monday).toBe(1);
        expect(DAY_NUMBERS.Tuesday).toBe(2);
        expect(DAY_NUMBERS.Wednesday).toBe(3);
        expect(DAY_NUMBERS.Thursday).toBe(4);
        expect(DAY_NUMBERS.Friday).toBe(5);
        expect(DAY_NUMBERS.Saturday).toBe(6);
      });

      it("should have all 7 days", () => {
        expect(Object.keys(DAY_NUMBERS)).toHaveLength(7);
      });
    });

    describe("DAY_ABBREVIATIONS", () => {
      it("should have correct day abbreviations mapping", () => {
        expect(DAY_ABBREVIATIONS[0]).toBe("Sun");
        expect(DAY_ABBREVIATIONS[1]).toBe("Mon");
        expect(DAY_ABBREVIATIONS[2]).toBe("Tue");
        expect(DAY_ABBREVIATIONS[3]).toBe("Wed");
        expect(DAY_ABBREVIATIONS[4]).toBe("Thu");
        expect(DAY_ABBREVIATIONS[5]).toBe("Fri");
        expect(DAY_ABBREVIATIONS[6]).toBe("Sat");
      });

      it("should have all 7 days", () => {
        expect(Object.keys(DAY_ABBREVIATIONS)).toHaveLength(7);
      });
    });
  });

  describe("getDayName", () => {
    it("should return correct day name for valid day numbers", () => {
      expect(getDayName(0)).toBe("Sunday");
      expect(getDayName(1)).toBe("Monday");
      expect(getDayName(2)).toBe("Tuesday");
      expect(getDayName(3)).toBe("Wednesday");
      expect(getDayName(4)).toBe("Thursday");
      expect(getDayName(5)).toBe("Friday");
      expect(getDayName(6)).toBe("Saturday");
    });

    it("should work with all valid DayOfWeek values", () => {
      const allDays: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
      allDays.forEach((day) => {
        expect(typeof getDayName(day)).toBe("string");
        expect(getDayName(day).length).toBeGreaterThan(0);
      });
    });
  });

  describe("getDayNumber", () => {
    it("should return correct day number for valid day names", () => {
      expect(getDayNumber("Sunday")).toBe(0);
      expect(getDayNumber("Monday")).toBe(1);
      expect(getDayNumber("Tuesday")).toBe(2);
      expect(getDayNumber("Wednesday")).toBe(3);
      expect(getDayNumber("Thursday")).toBe(4);
      expect(getDayNumber("Friday")).toBe(5);
      expect(getDayNumber("Saturday")).toBe(6);
    });

    it("should be inverse of getDayName", () => {
      const allDays: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
      allDays.forEach((day) => {
        const dayName = getDayName(day);
        expect(getDayNumber(dayName as keyof typeof DAY_NUMBERS)).toBe(day);
      });
    });
  });

  describe("getDayAbbreviation", () => {
    it("should return correct abbreviation for valid day numbers", () => {
      expect(getDayAbbreviation(0)).toBe("Sun");
      expect(getDayAbbreviation(1)).toBe("Mon");
      expect(getDayAbbreviation(2)).toBe("Tue");
      expect(getDayAbbreviation(3)).toBe("Wed");
      expect(getDayAbbreviation(4)).toBe("Thu");
      expect(getDayAbbreviation(5)).toBe("Fri");
      expect(getDayAbbreviation(6)).toBe("Sat");
    });

    it("should return 3-character abbreviations", () => {
      const allDays: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
      allDays.forEach((day) => {
        expect(getDayAbbreviation(day)).toHaveLength(3);
      });
    });
  });

  describe("getAllDayNumbers", () => {
    it("should return all day numbers from 0 to 6", () => {
      const result = getAllDayNumbers();
      expect(result).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it("should return array of length 7", () => {
      expect(getAllDayNumbers()).toHaveLength(7);
    });

    it("should return a new array each time", () => {
      const result1 = getAllDayNumbers();
      const result2 = getAllDayNumbers();
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe("getAllDayNames", () => {
    it("should return all day names", () => {
      const result = getAllDayNames();
      expect(result).toEqual([
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ]);
    });

    it("should return array of length 7", () => {
      expect(getAllDayNames()).toHaveLength(7);
    });

    it("should return strings only", () => {
      getAllDayNames().forEach((name: string) => {
        expect(typeof name).toBe("string");
      });
    });
  });

  describe("isValidWeekday", () => {
    it("should return true for valid weekdays (1-5)", () => {
      expect(isValidWeekday(1)).toBe(true); // Monday
      expect(isValidWeekday(2)).toBe(true); // Tuesday
      expect(isValidWeekday(3)).toBe(true); // Wednesday
      expect(isValidWeekday(4)).toBe(true); // Thursday
      expect(isValidWeekday(5)).toBe(true); // Friday
    });

    it("should return false for weekends", () => {
      expect(isValidWeekday(0)).toBe(false); // Sunday
      expect(isValidWeekday(6)).toBe(false); // Saturday
    });

    it("should return false for invalid numbers", () => {
      expect(isValidWeekday(-1)).toBe(false);
      expect(isValidWeekday(7)).toBe(false);
      expect(isValidWeekday(1.5)).toBe(false); // Non-integer
      expect(isValidWeekday(NaN)).toBe(false);
      expect(isValidWeekday(Infinity)).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isValidWeekday(0.5)).toBe(false);
      expect(isValidWeekday(5.1)).toBe(false);
      expect(isValidWeekday(-0)).toBe(false);
    });
  });

  describe("getWeekdayNumbers", () => {
    it("should return weekday numbers (Monday-Friday)", () => {
      const result = getWeekdayNumbers();
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should return array of length 5", () => {
      expect(getWeekdayNumbers()).toHaveLength(5);
    });

    it("should return a new array each time", () => {
      const result1 = getWeekdayNumbers();
      const result2 = getWeekdayNumbers();
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe("getNextWeekday", () => {
    it("should return next weekday for Monday-Thursday", () => {
      expect(getNextWeekday(1)).toBe(2); // Monday -> Tuesday
      expect(getNextWeekday(2)).toBe(3); // Tuesday -> Wednesday
      expect(getNextWeekday(3)).toBe(4); // Wednesday -> Thursday
      expect(getNextWeekday(4)).toBe(5); // Thursday -> Friday
    });

    it("should wrap from Friday to Monday", () => {
      expect(getNextWeekday(5)).toBe(1); // Friday -> Monday
    });

    it("should handle weekend days (though not typical use case)", () => {
      expect(getNextWeekday(0)).toBe(1); // Sunday -> Monday
      expect(getNextWeekday(6)).toBe(7 as DayOfWeek); // Saturday -> would be 7, but cast as DayOfWeek
    });
  });

  describe("getPreviousWeekday", () => {
    it("should return previous weekday for Tuesday-Friday", () => {
      expect(getPreviousWeekday(2)).toBe(1); // Tuesday -> Monday
      expect(getPreviousWeekday(3)).toBe(2); // Wednesday -> Tuesday
      expect(getPreviousWeekday(4)).toBe(3); // Thursday -> Wednesday
      expect(getPreviousWeekday(5)).toBe(4); // Friday -> Thursday
    });

    it("should wrap from Monday to Friday", () => {
      expect(getPreviousWeekday(1)).toBe(5); // Monday -> Friday
    });

    it("should handle weekend days (though not typical use case)", () => {
      expect(getPreviousWeekday(0)).toBe(-1 as DayOfWeek); // Sunday -> would be -1, but cast as DayOfWeek
      expect(getPreviousWeekday(6)).toBe(5); // Saturday -> Friday
    });
  });

  describe("sortDays", () => {
    it("should sort days in ascending order", () => {
      const unsorted: DayOfWeek[] = [3, 1, 5, 0, 6, 2, 4];
      const result = sortDays(unsorted);
      expect(result).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it("should not modify the original array", () => {
      const original: DayOfWeek[] = [3, 1, 5];
      const result = sortDays(original);
      expect(original).toEqual([3, 1, 5]); // Original unchanged
      expect(result).toEqual([1, 3, 5]); // Result is sorted
    });

    it("should handle already sorted arrays", () => {
      const sorted: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
      const result = sortDays(sorted);
      expect(result).toEqual(sorted);
    });

    it("should handle empty arrays", () => {
      const result = sortDays([]);
      expect(result).toEqual([]);
    });

    it("should handle single element arrays", () => {
      const result = sortDays([3]);
      expect(result).toEqual([3]);
    });

    it("should handle duplicate values", () => {
      const withDuplicates: DayOfWeek[] = [1, 3, 1, 5, 3];
      const result = sortDays(withDuplicates);
      expect(result).toEqual([1, 1, 3, 3, 5]);
    });
  });

  describe("getCurrentWeekday", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return current day of week", () => {
      // Mock a specific date - Monday, January 1, 2024
      const mockDate = new Date("2024-01-01T12:00:00Z"); // Monday
      vi.setSystemTime(mockDate);

      const result = getCurrentWeekday();
      expect(result).toBe(1); // Monday
    });

    it("should return Sunday as 0", () => {
      // Mock Sunday, December 31, 2023
      const mockDate = new Date("2023-12-31T12:00:00Z"); // Sunday
      vi.setSystemTime(mockDate);

      const result = getCurrentWeekday();
      expect(result).toBe(0); // Sunday
    });

    it("should return Saturday as 6", () => {
      // Mock Saturday, January 6, 2024
      const mockDate = new Date("2024-01-06T12:00:00Z"); // Saturday
      vi.setSystemTime(mockDate);

      const result = getCurrentWeekday();
      expect(result).toBe(6); // Saturday
    });

    it("should return value between 0 and 6", () => {
      const result = getCurrentWeekday();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe("getCurrentDayOfWeek", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return current day of week", () => {
      // Mock a specific date - Friday, January 5, 2024
      const mockDate = new Date("2024-01-05T12:00:00Z"); // Friday
      vi.setSystemTime(mockDate);

      const result = getCurrentDayOfWeek();
      expect(result).toBe(5); // Friday
    });

    it("should be identical to getCurrentWeekday", () => {
      const mockDate = new Date("2024-01-03T12:00:00Z"); // Wednesday
      vi.setSystemTime(mockDate);

      expect(getCurrentDayOfWeek()).toBe(getCurrentWeekday());
    });

    it("should return value between 0 and 6", () => {
      const result = getCurrentDayOfWeek();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe("Integration tests", () => {
    it("should maintain consistency between name and number conversions", () => {
      getAllDayNumbers().forEach((dayNumber: DayOfWeek) => {
        const dayName = getDayName(dayNumber);
        const backToNumber = getDayNumber(dayName as keyof typeof DAY_NUMBERS);
        expect(backToNumber).toBe(dayNumber);
      });
    });

    it("should have consistent abbreviations", () => {
      getAllDayNumbers().forEach((dayNumber: DayOfWeek) => {
        const dayName = getDayName(dayNumber);
        const abbreviation = getDayAbbreviation(dayNumber);
        expect(abbreviation).toBe(dayName.substring(0, 3));
      });
    });

    it("should properly categorize weekdays vs weekends", () => {
      const weekdays = getWeekdayNumbers();
      const allDays = getAllDayNumbers();
      const weekends = allDays.filter(
        (day: DayOfWeek) => !weekdays.includes(day)
      );

      expect(weekends).toEqual([0, 6]); // Sunday and Saturday
      expect(weekdays).toEqual([1, 2, 3, 4, 5]); // Monday through Friday

      weekdays.forEach((day: DayOfWeek) => {
        expect(isValidWeekday(day)).toBe(true);
      });

      weekends.forEach((day: DayOfWeek) => {
        expect(isValidWeekday(day)).toBe(false);
      });
    });

    it("should handle weekday navigation correctly", () => {
      // Test full cycle Monday -> Friday -> Monday
      let currentDay: DayOfWeek = 1; // Monday
      const visited: DayOfWeek[] = [currentDay];

      // Navigate through weekdays
      for (let i = 0; i < 4; i++) {
        currentDay = getNextWeekday(currentDay);
        visited.push(currentDay);
      }

      expect(visited).toEqual([1, 2, 3, 4, 5]); // Monday through Friday

      // Next should wrap to Monday
      currentDay = getNextWeekday(currentDay);
      expect(currentDay).toBe(1); // Back to Monday
    });
  });

  describe("Type safety", () => {
    it("should work with DayOfWeek type", () => {
      const monday: DayOfWeek = 1;
      expect(getDayName(monday)).toBe("Monday");
      expect(getDayAbbreviation(monday)).toBe("Mon");
      expect(isValidWeekday(monday)).toBe(true);
    });

    it("should handle DayOfWeek arrays", () => {
      const weekdays: DayOfWeek[] = [1, 2, 3, 4, 5];
      const sorted = sortDays(weekdays);
      expect(sorted).toEqual(weekdays);
    });
  });
});
