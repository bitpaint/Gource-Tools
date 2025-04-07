import React from 'react';
import styled from 'styled-components';
import { NavLink as RouterNavLink } from 'react-router-dom';

const SidebarContainer = styled.aside`
  width: 250px;
  background-color: ${props => props.theme.colors.light};
  border-right: 1px solid ${props => props.theme.colors.borderColor};
  padding: ${props => props.theme.spacing.md};
`;

const SidebarSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.small};
  color: ${props => props.theme.colors.dark};
  text-transform: uppercase;
  margin-bottom: ${props => props.theme.spacing.sm};
  padding-left: ${props => props.theme.spacing.sm};
`;

const NavLink = styled(RouterNavLink)`
  display: block;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  border-radius: ${props => props.theme.borderRadius.small};
  margin-bottom: ${props => props.theme.spacing.xs};
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.borderColor};
    text-decoration: none;
  }

  &.active {
    background-color: ${props => props.theme.colors.dark};
    color: ${props => props.theme.colors.white};
  }
`;

const Sidebar: React.FC = () => {
  return (
    <SidebarContainer>
      <SidebarSection>
        <SectionTitle>Projects</SectionTitle>
        <NavLink to="/projects/create" className={({ isActive }) => isActive ? 'active' : ''}>
          Create Project
        </NavLink>
        <NavLink to="/projects" end className={({ isActive }) => isActive ? 'active' : ''}>
          Project List
        </NavLink>
      </SidebarSection>

      <SidebarSection>
        <SectionTitle>Repositories</SectionTitle>
        <NavLink to="/repositories/add" className={({ isActive }) => isActive ? 'active' : ''}>
          Add Repository
        </NavLink>
        <NavLink to="/repositories" end className={({ isActive }) => isActive ? 'active' : ''}>
          Repository List
        </NavLink>
      </SidebarSection>

      <SidebarSection>
        <SectionTitle>Visualizations</SectionTitle>
        <NavLink to="/renders/create" className={({ isActive }) => isActive ? 'active' : ''}>
          Create Render
        </NavLink>
        <NavLink to="/renders" end className={({ isActive }) => isActive ? 'active' : ''}>
          Render History
        </NavLink>
      </SidebarSection>
    </SidebarContainer>
  );
};

export default Sidebar; 