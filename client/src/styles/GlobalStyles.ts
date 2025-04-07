import { createGlobalStyle } from 'styled-components';
import theme from './theme';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.regular};
    color: ${theme.colors.text};
    background-color: ${theme.colors.background};
    line-height: 1.5;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: ${theme.spacing.md};
    font-weight: ${theme.typography.fontWeight.bold};
    line-height: 1.2;
  }

  h1 {
    font-size: ${theme.typography.fontSize.xxlarge};
  }

  h2 {
    font-size: ${theme.typography.fontSize.xlarge};
  }

  h3 {
    font-size: ${theme.typography.fontSize.large};
  }

  p {
    margin-bottom: ${theme.spacing.md};
  }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  button {
    cursor: pointer;
  }
`;

export default GlobalStyles; 