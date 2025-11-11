import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import auto-save logs (only in development)
if (import.meta.env.DEV) {
  import("./lib/auto-save-logs");
}

createRoot(document.getElementById("root")!).render(<App />);
