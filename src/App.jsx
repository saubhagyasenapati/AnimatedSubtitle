import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import SubtitleRender from "./component/SubtitleRender";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <SubtitleRender />
    </>
  );
}

export default App;
