import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import theme from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import AppRouter from './routes/AppRouter';
import { NotificationProvider } from './components/ui/NotificationContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router>
        <NotificationProvider>
          <AppRouter />
        </NotificationProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
