import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaGithub, FaCog, FaExclamationTriangle, FaKey, FaInfoCircle } from 'react-icons/fa';
import { useGitHubToken } from '../ui/GitHubTokenContext';

const NavContainer = styled.nav`
  background-color: ${({ theme }) => theme.colors.dark};
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  height: 64px; /* Hauteur fixe pour le calcul dans le MainContent */
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: center;
`;

const NavItem = styled.li<{ $active: boolean }>`
  margin-right: 1.5rem;
  
  a {
    color: ${({ $active, theme }) => $active ? theme.colors.white : 'rgba(255, 255, 255, 0.7)'};
    text-decoration: none;
    font-weight: ${({ $active }) => $active ? 'bold' : 'normal'};
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
      width: ${({ $active }) => $active ? '100%' : '0'};
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

const RightLinks = styled.div`
  display: flex;
  align-items: center;
`;

const RightNavItem = styled.div<{ $active?: boolean }>`
  margin-left: 1.5rem;
  display: flex;
  align-items: center;
  
  a {
    color: ${({ $active, theme }) => $active ? theme.colors.white : 'rgba(255, 255, 255, 0.7)'};
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.2s;
    
    &:hover {
      color: ${({ theme }) => theme.colors.white};
    }
  }
`;

const TokenAlertButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  color: #333;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e5e5e5;
  }
  
  svg {
    color: #0366d6;
  }
`;

const Navbar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const { hasToken } = useGitHubToken();
  
  return (
    <NavContainer>
      <NavList>
        <Logo to="/">
          <img src="/gource-tools.png" alt="Gource Tools Logo" />
          Gource Tools
        </Logo>
        <NavItem $active={path === '/repositories' || path.startsWith('/repositories/')}>
          <Link to="/repositories">REPOS</Link>
        </NavItem>
        <NavItem $active={path === '/projects' || path.startsWith('/projects/')}>
          <Link to="/projects">PROJECTS</Link>
        </NavItem>
        <NavItem $active={path === '/renders' || path.startsWith('/renders/')}>
          <Link to="/renders">RENDERS</Link>
        </NavItem>
      </NavList>
      <RightLinks>
        {!hasToken && (
          <TokenAlertButton to="/settings">
            <FaInfoCircle />
            GITHUB TOKEN
          </TokenAlertButton>
        )}
        <RightNavItem $active={path === '/settings' || path.startsWith('/settings/')}>
          <Link to="/settings">
            <FaCog />
            SETTINGS
          </Link>
        </RightNavItem>
        <RightNavItem>
          <a href="https://github.com/bitpaint/Gource-Tools" target="_blank" rel="noopener noreferrer">
            <FaGithub />
            GITHUB
          </a>
        </RightNavItem>
      </RightLinks>
    </NavContainer>
  );
};

export default Navbar;