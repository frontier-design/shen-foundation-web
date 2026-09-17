import { css } from "styled-components";

export const colors = {
  black: "#121212",
  white: "#FFFFFF",
  gray: "#ACACAC",
  accent: "#ACACAC",
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

export const aspect = {
  landscape: "4 / 3",
  portrait: "3 / 4",
};

export const type = {
  navLink: css`
    font-family: ${fonts.body};
    font-size: 20px;
    line-height: 1;
    letter-spacing: -0.02em;

    @media (min-width: 1500px) {
      font-size: clamp(20px, 1.33vw, 34px);
    }
  `,
  navDescription: css`
    font-family: ${fonts.body};
    font-size: 14px;
    line-height: 1.5;
    letter-spacing: -0.02em;
    text-wrap: pretty;

    @media (min-width: 1500px) {
      font-size: clamp(14px, 0.93vw, 22px);
    }
  `,
  displayLarge: css`
    font-family: ${fonts.display};
    font-size: clamp(44px, 6.6vw, 90px);
    line-height: 0.95;
    letter-spacing: -0.05em;
    text-transform: uppercase;
    text-wrap: pretty;

    @media (min-width: 1500px) {
      font-size: clamp(90px, 6vw, 148px);
    }
  `,
  titleLarge: css`
    font-family: ${fonts.body};
    font-size: clamp(30px, 3.6vw, 45px);
    line-height: 1.1;
    letter-spacing: -0.05em;
    text-wrap: pretty;

    @media (min-width: 1500px) {
      font-size: clamp(45px, 3vw, 58px);
    }
  `,
  gridTitle: css`
    font-family: ${fonts.display};
    font-size: clamp(34px, 4.4vw, 58px);
    line-height: 0.95;
    letter-spacing: -0.05em;
    text-transform: uppercase;
    line-height: 1.1;
    text-wrap: pretty;

    @media (min-width: 1500px) {
      font-size: clamp(58px, 3.87vw, 94px);
    }
  `,
  gridSubtitle: css`
    font-family: ${fonts.body};
    font-size: clamp(22px, 2.2vw, 32px);
    line-height: 1.1;
    letter-spacing: -0.05em;
    text-wrap: pretty;

    @media (min-width: 1500px) {
      font-size: clamp(32px, 2.13vw, 40px);
    }
  `,
  caption: css`
    font-family: ${fonts.body};
    font-size: 18px;
    line-height: 1.35;
    letter-spacing: -0.05em;
    text-wrap: pretty;

    @media (max-width: 768px) {
      font-size: 16px;
    }

    @media (min-width: 1500px) {
      font-size: clamp(18px, 1.2vw, 23px);
    }
  `,
  body: css`
    font-family: ${fonts.body};
    font-size: 18px;
    line-height: 1.5;
    letter-spacing: -0.05em;
    text-wrap: pretty;

    @media (max-width: 768px) {
      font-size: 16px;
    }

    @media (min-width: 1500px) {
      font-size: clamp(18px, 1.2vw, 23px);
    }
  `,
};

export const theme = { colors, fonts, type, easing, duration };

export default theme;
