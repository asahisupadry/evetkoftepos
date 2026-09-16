/* Evet Kofte POS — icons.js
   Small hand-authored stroke icon set (24x24, currentColor). No external assets. */

const Icons = (() => {
  const S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const svg = (body, vb) => `<svg viewBox="${vb || '0 0 24 24'}" ${S}>${body}</svg>`;

  return {
    home: svg(`<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/>`),
    tabs: svg(`<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15 20c0-2.4 1.6-4.3 3.5-4.6"/>`),
    receipt: svg(`<path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.6V3Z"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"/>`),
    reports: svg(`<path d="M4 20V10M11 20V4M18 20v-7"/><path d="M3 20h18"/>`),
    menu: svg(`<path d="M4 6h16M4 12h16M4 18h10"/>`),
    gear: svg(`<circle cx="12" cy="12" r="3.1"/><path d="M12 3.5v2.4M12 18.1v2.4M4.6 7.1l2.1 1.2M17.3 15.7l2.1 1.2M4.6 16.9l2.1-1.2M17.3 8.3l2.1-1.2M2.5 12h2.4M19.1 12h2.4"/>`),
    logout: svg(`<path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9"/><path d="M15 16l4-4-4-4"/><path d="M19 12H9"/>`),
    plus: svg(`<path d="M12 5v14M5 12h14"/>`),
    x: svg(`<path d="M6 6l12 12M18 6 6 18"/>`),
    trash: svg(`<path d="M4 7h16"/><path d="M9 7V5.2C9 4.5 9.6 4 10.3 4h3.4c.7 0 1.3.5 1.3 1.2V7"/><path d="M6.5 7l.7 12a1.6 1.6 0 0 0 1.6 1.5h6.4a1.6 1.6 0 0 0 1.6-1.5L17.5 7"/><path d="M10 11v6M14 11v6"/>`),
    edit: svg(`<path d="M4 20h4.2L19 9.2a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8V20Z"/><path d="M13.5 6.5l4 4"/>`),
    check: svg(`<path d="M4.5 12.5l5 5 10-10"/>`),
    clock: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>`),
    calendar: svg(`<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>`),
    chevronRight: svg(`<path d="M9 5l7 7-7 7"/>`),
    chevronLeft: svg(`<path d="M15 5l-7 7 7 7"/>`),
    search: svg(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>`),
    lock: svg(`<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>`),
    print: svg(`<path d="M7 8.5V4h10v4.5"/><rect x="4.5" y="8.5" width="15" height="8" rx="1.5"/><path d="M7 14.5h10V20H7Z"/>`),
    cloud: svg(`<path d="M7.5 18.5a4.2 4.2 0 0 1-.6-8.35A5.4 5.4 0 0 1 17.3 8.9 4 4 0 0 1 16.6 18.5H7.5Z"/><path d="M12 12.2v5.3M9.7 15l2.3-2.3 2.3 2.3"/>`),
    warning: svg(`<path d="M12 4 3 20h18Z"/><path d="M12 10v4.2M12 17v.1"/>`),
    plate: svg(`<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>`),
    tray: svg(`<rect x="3.5" y="7" width="17" height="12" rx="2"/><path d="M8 7V5.5h8V7"/><path d="M8.5 12h1.5M14 12h1.5M8.5 15.5h7"/>`),
    cup: svg(`<path d="M6.5 8h11l-1 8.5a2.5 2.5 0 0 1-2.5 2.2h-4a2.5 2.5 0 0 1-2.5-2.2Z"/><path d="M17.5 9.5h1.3a2 2 0 0 1 0 4h-1.9"/><path d="M9 5.5c0-1 .8-1 .8-2M12 5.5c0-1 .8-1 .8-2"/>`),
    wallet: svg(`<rect x="3.5" y="6.5" width="17" height="12" rx="2"/><path d="M16.5 12.5h2.2M3.5 10h17"/>`),
    minus: svg(`<path d="M5 12h14"/>`),
    user: svg(`<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>`),
    building: svg(`<path d="M12 4 21 9v11H3V9Z"/><path d="M9 20v-5h6v5"/><path d="M9 12h.01M12 12h.01M15 12h.01M9 9h.01M12 9h.01M15 9h.01"/>`),
    mail: svg(`<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 6.5l8 6.5 8-6.5"/>`),
    download: svg(`<path d="M12 4v11M8 11.5l4 4 4-4"/><path d="M4.5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5"/>`),
    arrowRight: svg(`<path d="M4 12h16M14 6l6 6-6 6"/>`),
    grid: svg(`<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.4"/>`),
    spinner: svg(`<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" stroke-dasharray="2 2"/>`),
    box: svg(`<path d="M3.5 8 12 4l8.5 4v9L12 21l-8.5-4Z"/><path d="M3.5 8 12 12l8.5-4M12 12v9"/>`),
  };
})();

window.Icons = Icons;
