import { DefaultTheme } from 'styled-components';

const theme: DefaultTheme = {
  colors: {
    primary: '#333333',
    primaryLight: '#555555',
    primaryDark: '#111111',
    secondary: '#666666',
    success: '#444444',
    danger: '#777777',
    warning: '#888888',
    info: '#999999',
    dark: '#222222',
    light: '#f5f5f5',
    background: '#f8f9fa',
    white: '#ffffff',
    text: '#333333',
    textLight: '#666666',
    borderColor: '#e0e0e0',
    border: '#e0e0e0'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem',
    round: '50%'
  },
  typography: {
    fontFamily: {
      main: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif"
    },
    fontSize: {
      small: '0.875rem',
      base: '1rem',
      regular: '1rem',
      medium: '1.125rem',
      large: '1.25rem',
      xl: '1.5rem',
      xxl: '2rem',
      xlarge: '1.75rem',
      xxlarge: '2.5rem'
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700
    }
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    medium: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
    large: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
    xl: '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)'
  },
  transitions: {
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.5s'
  },
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px'
  }
};

export default theme; 