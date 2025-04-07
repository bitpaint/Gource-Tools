import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  html, body, #root {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${props => props.theme.typography.fontFamily.main};
    font-size: ${props => props.theme.typography.fontSize.base};
    color: ${props => props.theme.colors.text};
    background-color: ${props => props.theme.colors.background};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }
  
  button, input, select, textarea {
    font-family: inherit;
    font-size: inherit;
  }
  
  a {
    color: inherit;
    text-decoration: none;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: ${props => props.theme.spacing.md};
    font-weight: ${props => props.theme.typography.fontWeight.bold};
    line-height: 1.2;
  }

  h1 {
    font-size: ${props => props.theme.typography.fontSize.xxlarge};
  }

  h2 {
    font-size: ${props => props.theme.typography.fontSize.xlarge};
  }

  h3 {
    font-size: ${props => props.theme.typography.fontSize.large};
  }

  p {
    margin-bottom: ${props => props.theme.spacing.md};
  }

  a {
    color: ${props => props.theme.colors.primary};
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