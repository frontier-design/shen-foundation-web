import { createGlobalStyle } from "styled-components";
import BallPill from "./assets/fonts/BallPill.woff2";
import PPWriter from "./assets/fonts/PP-Writer.woff2";
import { colors, fonts } from "./theme.js";

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: "BallPill";
    src: url(${BallPill}) format("woff2");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "PP Writer";
    src: url(${PPWriter}) format("woff2");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

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
    font-family: ${fonts.body};
    color: ${colors.black};
    background-color: ${colors.white};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${fonts.display};
    font-weight: normal;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
  }

  img, svg, video {
    display: block;
    max-width: 100%;
  }
`;

export default GlobalStyle;
