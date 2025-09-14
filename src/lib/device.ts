export function isAndroid(): boolean {
  const ua = navigator.userAgent || "";
  return /Android/i.test(ua);
}

export function isSamsung(): boolean {
  const ua = navigator.userAgent || "";
  return /SM-|Samsung|SAMSUNG|SMT/i.test(ua);
}

export function isSMT227U(): boolean {
  const ua = navigator.userAgent || "";
  return /SM-T227U/i.test(ua);
}