import { useState, useEffect } from "react";
import { Palette } from "lucide-react";
import { THEMES } from "../themes";

export function ThemeSelector() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") ?? "midnight"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const current = THEMES.find((t) => t.id === theme);

  return (
    <div className="theme-selector">
      <Palette size={14} />
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.icon} {t.name}
          </option>
        ))}
      </select>
      {current && <span className="theme-icon">{current.icon}</span>}
    </div>
  );
}
