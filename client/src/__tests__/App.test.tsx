// Test frontend avec Vitest + Testing Library
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

describe('App', () => {
  it('affiche le menu principal', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/repositories/i)).toBeInTheDocument();
    expect(screen.getByText(/projects/i)).toBeInTheDocument();
  });
});
