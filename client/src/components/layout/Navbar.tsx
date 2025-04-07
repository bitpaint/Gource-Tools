import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const NavContainer = styled.nav`
  background-color: ${({ theme }) => theme.colors.dark};
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: center;
`;

const NavItem = styled.li<{ active: boolean }>`
  margin-right: 1.5rem;
  
  a {
    color: ${({ active, theme }) => active ? theme.colors.white : 'rgba(255, 255, 255, 0.7)'};
    text-decoration: none;
    font-weight: ${({ active }) => active ? 'bold' : 'normal'};
    padding: 0.5rem 0;
    position: relative;
    transition: color 0.2s;
    
    &:hover {
      color: ${({ theme }) => theme.colors.white};
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: ${({ active }) => active ? '100%' : '0'};
      height: 2px;
      background-color: ${({ theme }) => theme.colors.white};
      transition: width 0.2s;
    }
    
    &:hover::after {
      width: 100%;
    }
  }
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.white};
  text-decoration: none;
  margin-right: 2rem;
  display: flex;
  align-items: center;
  
  img {
    height: 32px;
    margin-right: 0.75rem;
  }
`;

const Navbar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  
  return (
    <NavContainer>
      <NavList>
        <Logo to="/">
          <img src="/gource-tools.png" alt="Gource Tools Logo" />
          Gource Tools
        </Logo>
        <NavItem active={path === '/repositories' || path.startsWith('/repositories/')}>
          <Link to="/repositories">Repositories</Link>
        </NavItem>
        <NavItem active={path === '/projects' || path.startsWith('/projects/')}>
          <Link to="/projects">Projects</Link>
        </NavItem>
        <NavItem active={path === '/settings'}>
          <Link to="/settings">Settings</Link>
        </NavItem>
      </NavList>
    </NavContainer>
  );
};

export default Navbar;