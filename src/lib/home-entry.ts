// A navigation intent, not a once-per-session intro: every Home click can replay.
let requested = false;

export function requestHomeEntry() { requested = true; }
export function consumeHomeEntry() {
  const pending = requested;
  requested = false;
  return pending;
}
