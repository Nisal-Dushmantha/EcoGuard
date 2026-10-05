export type IconName =
  | 'grid'
  | 'report'
  | 'radar'
  | 'pin'
  | 'arrow'
  | 'chevron'
  | 'menu'
  | 'logout'
  | 'refresh'
  | 'search'
  | 'alert'
  | 'route'
  | 'leaf'
  | 'close'
  | 'map'
  | 'shield'
  | 'paw'
  | 'bell'
  | 'activity'
  | 'battery'
  | 'signal'
  | 'check'
  | 'info'
  | 'crosshair'
  | 'layers'
  | 'filter'
  | 'play'
  | 'pause'
  | 'user'
  | 'settings'
  | 'plus';

const paths: Record<IconName, string> = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  report: 'M14 3H5v18h14V8l-5-5v5h5 M8 12h8 M8 16h6',
  radar: 'M12 3a9 9 0 1 0 9 9 M12 7a5 5 0 1 0 5 5 M12 12l8-8 M12 12h.01',
  pin: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  arrow: 'M5 12h14 M14 7l5 5-5 5',
  chevron: 'm9 5 7 7-7 7',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  logout: 'M9 4H4v16h5 M9 12h12 M16 7l5 5-5 5',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M5 7a8 8 0 0 1 14-1l1 6 M4 12l1 6a8 8 0 0 0 14-1',
  search: 'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  alert: 'm12 3 10 18H2L12 3 M12 9v5 M12 17h.01',
  route: 'M6 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4 M18 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4 M8 6h8a4 4 0 0 1 0 8H8a2 2 0 0 0 0 4h8',
  leaf: 'M4 20 17 7 M5 16C0 5 12 3 21 3c0 9-2 20-13 15',
  close: 'm6 6 12 12 M6 18 18 6',
  map: 'M1 6v15l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v15 M16 6v15',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  paw: 'M12 13c-2.5 0-4.5 1.8-4.5 4 0 1.5 1 2.5 2.5 2.5h4c1.5 0 2.5-1 2.5-2.5 0-2.2-2-4-4.5-4z M6.5 10.5c.8 0 1.5-.9 1.5-2s-.7-2-1.5-2-1.5.9-1.5 2 .7 2 1.5 2z M10 7.5c.8 0 1.5-.9 1.5-2s-.7-2-1.5-2-1.5.9-1.5 2 .7 2 1.5 2z M14 7.5c.8 0 1.5-.9 1.5-2s-.7-2-1.5-2-1.5.9-1.5 2 .7 2 1.5 2z M17.5 10.5c.8 0 1.5-.9 1.5-2s-.7-2-1.5-2-1.5.9-1.5 2 .7 2 1.5 2z',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  battery: 'M1 6h18v12H1z M23 10v4',
  signal: 'M2 20h.01 M7 20v-4 M12 20v-8 M17 20v-12 M22 20V4',
  check: 'm4 12 5 5L20 6',
  info: 'M12 16v-4 M12 8h.01 M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0z',
  crosshair: 'M12 2v4 M12 18v4 M2 12h4 M18 12h4 M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
  layers: 'M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  play: 'm5 3 14 9-14 9V3z',
  pause: 'M6 4h4v16H6z M14 4h4v16h-4z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  plus: 'M12 5v14 M5 12h14',
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.radar} />
    </svg>
  );
}
