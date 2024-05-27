import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import SubtitleRender from "./component/SubtitleRender";
import SubtitleContainer from "./component/SubtitleContainer";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
    <SubtitleContainer/>
    </>
  );
}

export default App;
