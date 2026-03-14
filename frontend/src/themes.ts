export interface Theme {
  id: string;
  name: string;
  icon: string;
}

export const THEMES: Theme[] = [
  { id: "midnight",      name: "Midnight",       icon: "🌑" },
  { id: "solarized",     name: "Solarized",      icon: "☀️" },
  { id: "solarized-dark",name: "Solarized Dark", icon: "🌙" },
  { id: "catppuccin",    name: "Catppuccin",     icon: "🐱" },
  { id: "dracula",       name: "Dracula",        icon: "🧛" },
  { id: "nord",          name: "Nord",           icon: "🏔️" },
  { id: "trading",       name: "Trading",        icon: "📈" },
  { id: "matrix",        name: "Matrix",         icon: "💊" },
  { id: "sunset",        name: "Sunset",         icon: "🌅" },
  { id: "cyberpunk",     name: "Cyberpunk",      icon: "⚡" },
  { id: "coffee",        name: "Coffee",         icon: "☕" },
];
