"use client";
import { useTheme } from "@/hooks/use-theme";
import { SvgSun } from "./assets/sun";
import { SvgMoon } from "./assets/moon";

export const SwitchToggle = () => {
    const [theme, handleChange] = useTheme('light');
    return (
        <div className="container-switch relative z-10">
            <label className="switch">
                <input
                    className="checkbox"
                    type="checkbox"
                    onChange={handleChange}
                    checked={theme === 'dark'} />
                <span className="slider">
                    <SvgSun />
                    <SvgMoon />
                </span>
            </label>
        </div>
    )
}