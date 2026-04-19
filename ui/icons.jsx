// icons.jsx — single-weight line icons (Lucide-style)
// All 18px, stroke: currentColor, stroke-width 1.75.

const ICONS = {};

function makeIcon(path) {
  return function Icon({ size = 18, className = '', style = {} }) {
    return (
      <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
        className={className} style={style}
      >{path}</svg>
    );
  };
}

ICONS.Home = makeIcon(<><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></>);
ICONS.Building = makeIcon(<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/></>);
ICONS.Scale = makeIcon(<><path d="M12 3v18"/><path d="M4 7l4 10M20 7l-4 10"/><path d="M4 7l8-2 8 2"/><path d="M4 17h8M12 17h8"/></>);
ICONS.Compare = makeIcon(<><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="9" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="11" cy="18" r="1.5" fill="currentColor" stroke="none"/></>);
ICONS.Book = makeIcon(<><path d="M4 4a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2V4z"/><path d="M4 18a2 2 0 0 0 2 2h12"/></>);
ICONS.Import = makeIcon(<><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></>);
ICONS.Plus = makeIcon(<><path d="M12 5v14M5 12h14"/></>);
ICONS.Search = makeIcon(<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></>);
ICONS.More = makeIcon(<><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></>);
ICONS.Chevron = makeIcon(<><path d="M9 6l6 6-6 6"/></>);
ICONS.ChevronDown = makeIcon(<><path d="M6 9l6 6 6-6"/></>);
ICONS.ChevronUp = makeIcon(<><path d="M6 15l6-6 6 6"/></>);
ICONS.X = makeIcon(<><path d="M6 6l12 12M18 6L6 18"/></>);
ICONS.Check = makeIcon(<><path d="M5 12l5 5L20 7"/></>);
ICONS.Copy = makeIcon(<><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/></>);
ICONS.Trash = makeIcon(<><path d="M3 6h18"/><path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/><path d="M9 3h6v3H9z"/></>);
ICONS.Download = makeIcon(<><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></>);
ICONS.Upload = makeIcon(<><path d="M12 19V7"/><path d="M7 12l5-5 5 5"/><path d="M4 19h16"/></>);
ICONS.Save = makeIcon(<><path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v6h9V3"/></>);
ICONS.Info = makeIcon(<><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></>);
ICONS.Edit = makeIcon(<><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M19 3l2 2-11 11H8v-2z"/></>);
ICONS.Arrow = makeIcon(<><path d="M5 12h14M13 5l7 7-7 7"/></>);
ICONS.ArrowBack = makeIcon(<><path d="M19 12H5M11 5l-7 7 7 7"/></>);
ICONS.Undo = makeIcon(<><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6h-3"/></>);
ICONS.Redo = makeIcon(<><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0-6 6v0a6 6 0 0 0 6 6h3"/></>);
ICONS.Settings = makeIcon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3 1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7 1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></>);
ICONS.External = makeIcon(<><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/></>);
ICONS.Users = makeIcon(<><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="7" r="2.5"/><path d="M21 18c0-2.2-1.8-4-4-4"/></>);
ICONS.File = makeIcon(<><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/></>);
ICONS.Drop = makeIcon(<><path d="M12 20a7 7 0 0 1-7-7c0-5 7-10 7-10s7 5 7 10a7 7 0 0 1-7 7z"/></>);
ICONS.Filter = makeIcon(<><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>);
ICONS.Sun = makeIcon(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>);
ICONS.Moon = makeIcon(<><path d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></>);
ICONS.Sliders = makeIcon(<><path d="M4 6h7M14 6h6M4 12h3M10 12h10M4 18h12M18 18h2"/><circle cx="12" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/></>);
ICONS.Link = makeIcon(<><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>);
ICONS.Warn = makeIcon(<><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.01"/></>);

Object.assign(window, { ICONS });
