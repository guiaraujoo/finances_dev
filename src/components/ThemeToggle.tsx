import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="shrink-0"
    >
      {isDark ? (
        <>
          <Sun className="mr-1.5 h-3.5 w-3.5" /> Claro
        </>
      ) : (
        <>
          <Moon className="mr-1.5 h-3.5 w-3.5" /> Escuro
        </>
      )}
    </Button>
  );
}
