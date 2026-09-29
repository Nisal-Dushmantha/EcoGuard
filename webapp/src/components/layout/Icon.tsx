export type IconName = 'grid' | 'report' | 'radar' | 'pin' | 'arrow' | 'chevron' | 'menu' | 'logout' | 'refresh' | 'search' | 'alert' | 'route' | 'leaf' | 'close';
const paths: Record<IconName, string> = {
 grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 report:'M14 3H5v18h14V8l-5-5v5h5 M8 12h8 M8 16h6',
 radar:'M12 3a9 9 0 1 0 9 9 M12 7a5 5 0 1 0 5 5 M12 12l8-8 M12 12h.01',
 pin:'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 arrow:'M5 12h14 M14 7l5 5-5 5',chevron:'m9 5 7 7-7 7',menu:'M4 6h16 M4 12h16 M4 18h16',logout:'M9 4H4v16h5 M9 12h12 M16 7l5 5-5 5',refresh:'M20 7v5h-5 M4 17v-5h5 M5 7a8 8 0 0 1 14-1l1 6 M4 12l1 6a8 8 0 0 0 14-1',search:'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',alert:'m12 3 10 18H2L12 3 M12 9v5 M12 17h.01',route:'M6 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4 M18 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4 M8 6h8a4 4 0 0 1 0 8H8a2 2 0 0 0 0 4h8',leaf:'M4 20 17 7 M5 16C0 5 12 3 21 3c0 9-2 20-13 15',close:'m6 6 12 12 M6 18 18 6'
};
export function Icon({name,size=20}: {name:IconName;size?:number}) {return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>}
