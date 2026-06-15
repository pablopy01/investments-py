import { describe, it, expect } from "vitest";
import {
  getEasterSunday,
  isParaguayHoliday,
  isBusinessDay,
  getNextBusinessDay,
  getFirstBusinessDayOfMonth,
} from "../../src/context/PortfolioContext";

describe("getEasterSunday", () => {
  it("should calculate Easter Sunday for 2024 (March 31)", () => {
    const easter = getEasterSunday(2024);
    expect(easter.getFullYear()).toBe(2024);
    expect(easter.getMonth()).toBe(2);
    expect(easter.getDate()).toBe(31);
  });

  it("should calculate Easter Sunday for 2025 (April 20)", () => {
    const easter = getEasterSunday(2025);
    expect(easter.getFullYear()).toBe(2025);
    expect(easter.getMonth()).toBe(3);
    expect(easter.getDate()).toBe(20);
  });

  it("should calculate Easter Sunday for 2026 (April 5)", () => {
    const easter = getEasterSunday(2026);
    expect(easter.getFullYear()).toBe(2026);
    expect(easter.getMonth()).toBe(3);
    expect(easter.getDate()).toBe(5);
  });

  it("should always return a Sunday", () => {
    for (let year = 2020; year <= 2030; year++) {
      const easter = getEasterSunday(year);
      expect(easter.getDay()).toBe(0);
    }
  });
});

describe("isParaguayHoliday", () => {
  it("should return true for Ano Nuevo (Jan 1)", () => {
    expect(isParaguayHoliday(new Date(2026, 0, 1))).toBe(true);
  });

  it("should return true for Dia del Trabajador (May 1)", () => {
    expect(isParaguayHoliday(new Date(2026, 4, 1))).toBe(true);
  });

  it("should return true for Independencia Nacional (May 14)", () => {
    expect(isParaguayHoliday(new Date(2026, 4, 14))).toBe(true);
  });

  it("should return true for Independencia Nacional (May 15)", () => {
    expect(isParaguayHoliday(new Date(2026, 4, 15))).toBe(true);
  });

  it("should return true for Paz del Chaco (Jun 12)", () => {
    expect(isParaguayHoliday(new Date(2026, 5, 12))).toBe(true);
  });

  it("should return true for Fundacion de Asuncion (Aug 15)", () => {
    expect(isParaguayHoliday(new Date(2026, 7, 15))).toBe(true);
  });

  it("should return true for Batalla de Boqueron (Sep 29)", () => {
    expect(isParaguayHoliday(new Date(2026, 8, 29))).toBe(true);
  });

  it("should return true for Virgen de Caacupe (Dec 8)", () => {
    expect(isParaguayHoliday(new Date(2026, 11, 8))).toBe(true);
  });

  it("should return true for Navidad (Dec 25)", () => {
    expect(isParaguayHoliday(new Date(2026, 11, 25))).toBe(true);
  });

  it("should return false for a regular day (Mar 15)", () => {
    expect(isParaguayHoliday(new Date(2026, 2, 15))).toBe(false);
  });

  it("should handle Holy Thursday 2026 (April 2)", () => {
    expect(isParaguayHoliday(new Date(2026, 3, 2))).toBe(true);
  });

  it("should handle Good Friday 2026 (April 3)", () => {
    expect(isParaguayHoliday(new Date(2026, 3, 3))).toBe(true);
  });

  it("should handle Holy Thursday 2025 (April 17)", () => {
    expect(isParaguayHoliday(new Date(2025, 3, 17))).toBe(true);
  });

  it("should handle Good Friday 2025 (April 18)", () => {
    expect(isParaguayHoliday(new Date(2025, 3, 18))).toBe(true);
  });
});

describe("isBusinessDay", () => {
  it("should return true for a regular weekday (Monday)", () => {
    expect(isBusinessDay(new Date(2026, 2, 16))).toBe(true);
  });

  it("should return false for Saturday", () => {
    expect(isBusinessDay(new Date(2026, 2, 14))).toBe(false);
  });

  it("should return false for Sunday", () => {
    expect(isBusinessDay(new Date(2026, 2, 15))).toBe(false);
  });

  it("should return false for fixed holidays", () => {
    expect(isBusinessDay(new Date(2026, 4, 1))).toBe(false);
    expect(isBusinessDay(new Date(2026, 11, 25))).toBe(false);
  });

  it("should return false for Easter-based holidays", () => {
    expect(isBusinessDay(new Date(2026, 3, 3))).toBe(false);
  });
});

describe("getNextBusinessDay", () => {
  it("should return same day if already a business day", () => {
    const result = getNextBusinessDay(new Date(2026, 2, 16));
    expect(result.getDate()).toBe(16);
    expect(result.getMonth()).toBe(2);
  });

  it("should skip Saturday to Monday", () => {
    const result = getNextBusinessDay(new Date(2026, 2, 14));
    expect(result.getDate()).toBe(16);
    expect(result.getDay()).toBe(1);
  });

  it("should skip Sunday to Monday", () => {
    const result = getNextBusinessDay(new Date(2026, 2, 15));
    expect(result.getDate()).toBe(16);
    expect(result.getDay()).toBe(1);
  });

  it("should skip holiday to next business day", () => {
    const result = getNextBusinessDay(new Date(2026, 4, 1));
    expect(result.getDate()).toBe(4);
    expect(result.getDay()).toBe(1);
  });

  it("should skip holiday on Friday to Monday", () => {
    const result = getNextBusinessDay(new Date(2026, 4, 15));
    expect(result.getDate()).toBe(18);
    expect(result.getDay()).toBe(1);
  });
});

describe("getFirstBusinessDayOfMonth", () => {
  it("should return 2nd if 1st is Sunday", () => {
    const result = getFirstBusinessDayOfMonth(2026, 2);
    expect(result.getDate()).toBe(2);
    expect(result.getDay()).toBe(1);
  });

  it("should return 1st if it is a weekday", () => {
    const result = getFirstBusinessDayOfMonth(2026, 3);
    expect(result.getDate()).toBe(1);
    expect(result.getDay()).toBe(3);
  });

  it("should skip holiday to next business day", () => {
    const result = getFirstBusinessDayOfMonth(2026, 4);
    expect(result.getDate()).toBe(4);
    expect(result.getDay()).toBe(1);
  });

  it("should handle January correctly (holiday on 1st)", () => {
    const result = getFirstBusinessDayOfMonth(2026, 0);
    expect(result.getDate()).toBe(2);
    expect(result.getDay()).toBe(5);
  });

  it("should handle December correctly", () => {
    const result = getFirstBusinessDayOfMonth(2026, 11);
    expect(result.getDate()).toBe(1);
    expect(result.getDay()).toBe(2);
  });

  it("should handle February in leap year", () => {
    const result = getFirstBusinessDayOfMonth(2024, 1);
    expect(result.getDate()).toBe(1);
    expect(result.getDay()).toBe(4);
  });
});
