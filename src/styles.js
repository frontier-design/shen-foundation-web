import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-weight: normal;
  }

  html, body {
    overflow-x: hidden;
  }

  body {
    font-family: system-ui, -apple-system, sans-serif;
  }
`;

export default GlobalStyle;
