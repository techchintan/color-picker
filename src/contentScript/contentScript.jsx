import "./contentScript.css";
import { createRoot } from "react-dom/client";
import React from "react";

const App = () => {
  return (
    <div className="customeNode">
      <button>React Component</button>
    </div>
  );
};

let div = document.createElement("div");
document.body.appendChild(div);
const root = createRoot(div);
root.render(<App />);
