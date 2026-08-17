import { css } from "styled-components";

export const colors = {
  black: "#121212",
  white: "#FFFFFF",
  gray: "#ACACAC",
  accent: "#5FB926",
};

export const fonts = {
  display: "'BallPill', system-ui, sans-serif",
  body: "'PP Writer', Georgia, 'Times New Roman', serif",
};

export const easing = {
  reveal: "cubic-bezier(0.16, 1, 0.3, 1)",
  gsapReveal: "M0,0 C0.16,1 0.3,1 1,1",
};

export const duration = {
  fast: 0.4,
  base: 0.6,
  slow: 0.9,
};

export const type = {
  navLink: css`
    font-family: ${fonts.body};
    font-size: 20px;
    line-height: 1;
    letter-spacing: -0.02em;
  `,
  navDescription: css`
    font-family: ${fonts.body};
    font-size: 14px;
    line-height: 1.5;
    letter-spacing: -0.02em;
  `,
  displayLarge: css`
    font-family: ${fonts.display};
    font-size: clamp(44px, 7.5vw, 120px);
    line-height: 0.95;
    letter-spacing: -0.05em;
    text-transform: uppercase;
  `,
  titleLarge: css`
    font-family: ${fonts.body};
    font-size: clamp(30px, 4.4vw, 64px);
    line-height: 1.1;
    letter-spacing: -0.05em;
  `,
  caption: css`
    font-family: ${fonts.body};
    font-size: 20px;
    line-height: 1.35;
    letter-spacing: -0.05em;
  `,
};

export const theme = { colors, fonts, type, easing, duration };

export default theme;
