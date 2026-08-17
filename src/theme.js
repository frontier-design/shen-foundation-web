import { css } from "styled-components";

export const colors = {
  black: "#121212",
  white: "#FFFFFF",
  gray: "#ACACAC",
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
};

export const theme = { colors, fonts, type, easing, duration };

export default theme;
