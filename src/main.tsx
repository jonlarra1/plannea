import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { initLogging } from "./app/logging";
import "./styles.css";

initLogging();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
