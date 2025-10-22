// Initialize Sentry error tracking FIRST
import { initializeSentry } from "./lib/sentry";
initializeSentry();

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
