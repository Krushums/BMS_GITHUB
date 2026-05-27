import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

type PreviewMode = "laptop" | "phone";

type PreviewModeContextValue = {
  mode: PreviewMode;
  setMode: (mode: PreviewMode) => void;
  toggleMode: () => void;
};

const PreviewModeContext = createContext<PreviewModeContextValue | null>(null);

export function PreviewModeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<PreviewMode>("laptop");

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((currentMode) => (currentMode === "phone" ? "laptop" : "phone"))
    }),
    [mode]
  );

  return <PreviewModeContext.Provider value={value}>{children}</PreviewModeContext.Provider>;
}

export function usePreviewMode() {
  const context = useContext(PreviewModeContext);

  if (!context) {
    throw new Error("usePreviewMode must be used inside PreviewModeProvider");
  }

  return context;
}
