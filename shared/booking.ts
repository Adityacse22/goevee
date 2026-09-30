/** Build a local-time booking window, including sessions crossing midnight. */
export function bookingWindow(date: string, time: string, hours: number, now = Date.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(?::\d{2})?$/.test(time)) throw new Error('Choose a valid booking date and time.');
  const start = new Date(`${date}T${time.length === 5 ? time + ':00' : time}`);
  const [year, month, day] = date.split('-').map(Number);
  if (!Number.isFinite(start.getTime()) || start.getFullYear() !== year || start.getMonth() + 1 !== month || start.getDate() !== day) throw new Error('Choose a valid booking date and time.');
  if (start.getTime() <= now) throw new Error('Choose a start time in the future.');
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) throw new Error('Choose a duration between 0 and 24 hours.');
  return { startTime: start.toISOString(), endTime: new Date(start.getTime() + hours * 3600000).toISOString() };
}
