// A broad device-class hint for visual context, not a verified competitive rule.
// Prefer the device's browser identity over viewport size: resizing a PC window
// must not turn an existing score into a "phone" score.
export const detectRunPlatform = (nav = typeof navigator === 'undefined' ? null : navigator) => {
  if (!nav) return null
  const agent = typeof nav.userAgent === 'string' ? nav.userAgent : ''

  // Includes tablets and modern iPads that advertise themselves as Macs.
  if (/iPhone|iPad|iPod|Android|Windows Phone|Mobile|Tablet/i.test(agent) ||
    (/Macintosh/i.test(agent) && nav.maxTouchPoints > 1) ||
    nav.userAgentData?.mobile === true) return 'mobile'

  if (nav.userAgentData?.mobile === false ||
    /Windows NT|Macintosh|Mac OS X|Linux|X11|CrOS/i.test(agent)) return 'desktop'

  return null
}
