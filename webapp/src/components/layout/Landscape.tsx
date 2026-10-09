import { useId } from 'react';
/** Decorative landscape illustration; does not represent geographic data. */
export function Landscape() {
 const id=useId();
 return <svg className="landscape" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
 <defs><linearGradient id={id} x2="0" y2="1"><stop stopColor="#bacbb1"/><stop offset="1" stopColor="#e4ddaf"/></linearGradient></defs>
 <path fill={`url(#${id})`} d="M0 0h1000v520H0z"/><circle cx="745" cy="126" r="56" fill="#f4edc8"/>
 <path d="M0 270 100 215 190 242 310 119 435 246 510 190 610 232 730 169 870 251 1000 201V520H0Z" fill="#809e86"/>
 <path d="m0 328 135-94 120 93 131-105 152 119 122-70 129 50 125-112 86 64v247H0Z" fill="#4f7862"/>
 <path d="M0 348Q130 275 274 370T520 366T760 319T1000 362V520H0Z" fill="#2c5945"/>
 <path d="M0 462Q160 327 345 433T680 414T1000 433V520H0Z" fill="#163f32"/>
 <path d="M1000 387Q700 348 647 428T390 520h180Q744 456 707 428T1000 410" fill="#bfd1ac" opacity=".55"/>
 <g fill="#173e30"><path d="M860 367h8v-87h-8z"/><path d="M806 285q0-28 35-27 7-33 36-22 43-5 46 35 32 27-11 38h-79q-36-2-27-24"/><path d="M917 414h6v-57h-6z"/><path d="M878 356q5-24 28-19 5-25 27-14 26 2 26 25 21 18-7 24h-60q-19-1-14-16"/></g>
 <g fill="#112f25" transform="translate(775 414)"><path d="M0 18q-7-16 5-23 13-10 33-3 16-13 29-2l9 7 3 26q-2 12-10 6l1-20-8 3-3 25h-9l-2-22H19l-2 22H8L5 16Z"/><path d="M4 2-9 15l2 3L8 8"/></g>
 <g fill="none" stroke="#e9eedb" opacity=".28"><path d="M490 54q40-20 83 0t88 0M525 70q38-19 76 0"/><circle cx="745" cy="126" r="75"/><circle cx="745" cy="126" r="92"/></g>
 </svg>
}
