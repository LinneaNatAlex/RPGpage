// Felles RPG-kalenderlogikk for hele appen
// 1 RPG day = 12 real hours
export const RPG_EPOCH = new Date(2025, 8, 8, 0, 0, 0, 0); // Sept 8, 2025, 00:00 (første RPG-dag)
export const HOURS_PER_RPG_DAY = 12;
export const DAYS_PER_WEEK = 7;
export const MONTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Leap year for RPG (hvert 4. RPG-år)
export function isRPGLeapYear(rpgYear) {
  return rpgYear % 4 === 0;
}

// Få antall dager i måned for et gitt RPG-år
export function getRPGMonthLength(monthIdx, rpgYear) {
  if (monthIdx === 1) return isRPGLeapYear(rpgYear) ? 29 : 28;
  return MONTHS[monthIdx];
}

// Returner info om RPG-uke, dag, måned osv for en gitt IRL-dato
export function getRPGCalendar(now = new Date()) {
  const msPerRPGDay = HOURS_PER_RPG_DAY * 60 * 60 * 1000;
  const diffMs = now - RPG_EPOCH;
  const rpgDayNum = Math.floor(diffMs / msPerRPGDay) + 1;
  
  // Finn hvilken uke siden start (mandag-basert)
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 = mandag
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);
  
  // Finn start-mandag (RPG_EPOCH)
  const startMonday = new Date(RPG_EPOCH);
  const startDayOfWeek = RPG_EPOCH.getDay() === 0 ? 6 : RPG_EPOCH.getDay() - 1;
  startMonday.setDate(RPG_EPOCH.getDate() - startDayOfWeek);
  startMonday.setHours(0, 0, 0, 0);
  
  // Beregn antall uker siden start
  const weeksSinceStart = Math.floor((monday - startMonday) / (7 * 24 * 60 * 60 * 1000));
  
  // Hver uke = 1 måned, hver 12 måneder = 1 år
  const rpgYear = Math.floor(weeksSinceStart / 12) + 1;
  const rpgMonth = (weeksSinceStart % 12) + 1;
  
  // Finn dag i måned basert på hvilken dag i uken det er
  const dayOfMonth = Math.floor((rpgDayNum - 1) % 31) + 1;
  // Bygg uke-array
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  
  // Fordel RPG-dager for denne måneden på IRL-uken
  // Siden hver uke = 1 måned, deler vi månedens dager på 7 dager
  const daysInMonth = getRPGMonthLength(rpgMonth - 1, rpgYear); // rpgMonth er 1-indexed
  const base = Math.floor(daysInMonth / 7);
  const rest = daysInMonth % 7;
  let rpgDaysThisWeek = [];
  let dayCounter = 1;
  for (let i = 0; i < 7; i++) {
    let daysThisDay = base + (i < rest ? 1 : 0);
    let start = dayCounter;
    let end = start + daysThisDay - 1;
    if (end > daysInMonth) end = daysInMonth;
    rpgDaysThisWeek.push({ start, end });
    dayCounter = end + 1;
  }
  return {
    rpgYear,
    rpgMonth, // rpgMonth er allerede 1-indexed
    rpgDayOfMonth: dayOfMonth,
    rpgDayNum,
    weekDates,
    rpgDaysThisWeek,
  };
}

// Sjekk om bursdag faller i denne IRL-dagens RPG-dager (for synkronisering)
export function isBirthdayToday(birthdayMonth, birthdayDay, now = new Date()) {
  const { rpgMonth, rpgDaysThisWeek } = getRPGCalendar(now);
  // Finn hvilken dag i IRL-uken det er
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const rpgRange = rpgDaysThisWeek[dayOfWeek];
  return (
    birthdayMonth === rpgMonth &&
    birthdayDay >= rpgRange.start &&
    birthdayDay <= rpgRange.end
  );
}
