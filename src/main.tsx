import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 전역 CSS가 있으면 사용
// import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
