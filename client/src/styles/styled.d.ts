import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      primaryLight: string;
      primaryDark: string;
      secondary: string;
      success: string;
      danger: string;
      warning: string;
      info: string;
      dark: string;
      light: string;
      background: string;
      white: string;
      text: string;
      textLight: string;
      borderColor: string;
      border: string;
      accent: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    borderRadius: {
      small: string;
      medium: string;
      large: string;
      round: string;
    };
    typography: {
      fontFamily: {
        main: string;
      };
      fontSize: {
        small: string;
        base: string;
        regular: string;
        medium: string;
        large: string;
        xl: string;
        xxl: string;
        xlarge: string;
        xxlarge: string;
      };
      fontWeight: {
        light: number;
        regular: number;
        medium: number;
        semiBold: number;
        bold: number;
      };
    };
    shadows: {
      small: string;
      medium: string;
      large: string;
      xl: string;
    };
    transitions: {
      fast: string;
      normal: string;
      slow: string;
    };
    breakpoints: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
  }
} 