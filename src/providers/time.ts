/**
 * Parses a UTC format date time string and returns the number of milliseconds between midnight,
 * January 1, 1970 Universal Coordinated Time (UTC) (or GMT) and the specified date.
 * @param value A UTC format date time string. For example: 2015-04-09T11:52:19Z
 * @returns The number of milliseconds between 1970.01.01 to the specified date.
 */
export function parseUTC(value: string): number {
  if (!value) {
    throw new Error('invalid UTC format time string');
  }

  if (value.length === 20) {
    // 2024-08-30T07:03:06Z
    if (value[4] !== '-' || value[7] !== '-' || value[10] !== 'T' || value[13] !== ':' || value[16] !== ':' || value[19] !== 'Z') {
      throw new Error('invalid UTC format date string');
    }
  } else if (value.length === 24) {
    // 2024-08-30T07:03:06.117Z
    if (value[4] !== '-' || value[7] !== '-' || value[10] !== 'T' || value[13] !== ':' || value[16] !== ':' || value[19] !== '.' || value[23] !== 'Z') {
      throw new Error('invalid UTC format date string');
    }
  } else {
    throw new Error('invalid UTC format time string');
  }

  const yearStr = value.slice(0, 4);
  const year = Number.parseInt(yearStr, 10);
  if (isNaN(year)) {
    throw new Error('invalid year string');
  }

  const monthStr = value.slice(5, 7);
  const month = Number.parseInt(monthStr, 10);
  if (isNaN(month)) {
    throw new Error('invalid month string');
  }

  if (month < 1 || month > 12) {
    throw new Error('invalid month value');
  }

  const dateStr = value.slice(8, 10);
  const date = Number.parseInt(dateStr, 10);
  if (isNaN(date)) {
    throw new Error('invalid date string');
  }

  if (date < 1 || date > 31) {
    throw new Error('invalid date value');
  }

  const hoursStr = value.slice(11, 13);
  const hours = Number.parseInt(hoursStr, 10);
  if (isNaN(hours)) {
    throw new Error('invalid hours string');
  }

  if (hours < 0 || hours > 24) {
    throw new Error('invalid hours value');
  }

  const minutesStr = value.slice(14, 16);
  const minutes = Number.parseInt(minutesStr, 10);
  if (isNaN(minutes)) {
    throw new Error('invalid minutes string');
  }

  if (minutes < 0 || minutes > 60) {
    throw new Error('invalid minutes value');
  }

  const secondsStr = value.slice(17, 19);
  const seconds = Number.parseInt(secondsStr, 10);
  if (isNaN(seconds)) {
    throw new Error('invalid seconds string');
  }

  if (seconds < 0 || seconds > 60) {
    throw new Error('invalid seconds value');
  }

  if (value.length === 24) {
    const msStr = value.slice(20, 23);
    const ms = Number.parseInt(msStr, 10);
    if (isNaN(ms)) {
      throw new Error('invalid ms string');
    }

    return Date.UTC(year, month - 1, date, hours, minutes, seconds, ms);
  }

  return Date.UTC(year, month - 1, date, hours, minutes, seconds);
}
