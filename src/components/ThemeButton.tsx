import type React from "react";
import { useCallback, useEffect, useState } from "react";

const determineCurrentMode = () => {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export default function ThemeButton(
  props: React.PropsWithChildren<{
    mode: "light" | "dark";
    className?: string;
    "aria-label"?: string;
  }>,
) {
  const [currentMode, setCurrentMode] = useState<"light" | "dark">();

  const handleClick = useCallback(() => {
    if (props.mode === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }

    if (props.mode === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    localStorage.setItem("theme", props.mode);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setCurrentMode(determineCurrentMode());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    setCurrentMode(determineCurrentMode());

    return () => observer.disconnect();
  }, [setCurrentMode]);

  return (
    <button
      className={props.className}
      onClick={handleClick}
      aria-selected={currentMode === props.mode}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </button>
  );
}
