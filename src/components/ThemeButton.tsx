import type React from "react";
import { useCallback } from "react";

export default function ThemeButton(
  props: React.PropsWithChildren<{
    mode: "light" | "dark";
    className?: string;
    "aria-label"?: string;
  }>,
) {
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

  return (
    <button
      className={props.className}
      onClick={handleClick}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </button>
  );
}
