import React from 'react';
import styled from 'styled-components';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { FaPlus, FaGithub, FaFolder, FaPlay, FaCog, FaExternalLinkAlt } from 'react-icons/fa';

const SidebarContainer = styled.aside`
  width: 250px;
  background-color: ${props => props.theme.colors.light};
  border-right: 1px solid ${props => props.theme.colors.borderColor};
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  min-height: 100%;
`;

const SidebarContent = styled.div`
  flex-grow: 1;
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  border-top: 1px solid ${props => props.theme.colors.borderColor};
  padding-top: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.md};
`;

const SidebarSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.small};
  color: ${props => props.theme.colors.dark};
  text-transform: uppercase;
  margin-bottom: ${props => props.theme.spacing.sm};
  padding-left: ${props => props.theme.spacing.sm};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitleText = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: ${props => props.theme.colors.dark};
`;

const AddButton = styled(RouterNavLink)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4CAF50; /* Vert */
  color: white;
  width: 24px;
  height: 24px;
  border-radius: ${props => props.theme.borderRadius.small};
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    background-color: #388E3C; /* Vert foncé */
    transform: scale(1.1);
  }
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

const ExternalLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
`;

const LinkIcon = styled.span`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  opacity: 0.8;
`;

const Sidebar: React.FC = () => {
  return (
    <SidebarContainer>
      <SidebarContent>
        <SidebarSection>
          <SectionTitle>
            <SectionTitleText>
              <SectionIcon><FaGithub /></SectionIcon>
              REPOS
            </SectionTitleText>
            <AddButton to="/repositories/add" title="Add Repository">
              <FaPlus size={12} />
            </AddButton>
          </SectionTitle>
          <NavLink to="/repositories" end className={({ isActive }) => isActive ? 'active' : ''}>
            All Repositories
          </NavLink>
        </SidebarSection>

        <SidebarSection>
          <SectionTitle>
            <SectionTitleText>
              <SectionIcon><FaFolder /></SectionIcon>
              PROJECTS
            </SectionTitleText>
            <AddButton to="/projects/create" title="Create Project">
              <FaPlus size={12} />
            </AddButton>
          </SectionTitle>
          <NavLink to="/projects" end className={({ isActive }) => isActive ? 'active' : ''}>
            All Projects
          </NavLink>
        </SidebarSection>

        <SidebarSection>
          <SectionTitle>
            <SectionTitleText>
              <SectionIcon><FaPlay /></SectionIcon>
              RENDERS
            </SectionTitleText>
            <AddButton to="/renders/create" title="Create Render">
              <FaPlus size={12} />
            </AddButton>
          </SectionTitle>
          <NavLink to="/renders" end className={({ isActive }) => isActive ? 'active' : ''}>
            All Renders
          </NavLink>
        </SidebarSection>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarSection>
          <SectionTitle>
            <SectionTitleText>
              <SectionIcon><FaCog /></SectionIcon>
              SETTINGS
            </SectionTitleText>
          </SectionTitle>
          <NavLink to="/settings/gource" className={({ isActive }) => isActive ? 'active' : ''}>
            Gource Settings
          </NavLink>
          <NavLink to="/settings/app" className={({ isActive }) => isActive ? 'active' : ''}>
            App Settings
          </NavLink>
        </SidebarSection>
        
        <SidebarSection>
          <ExternalLink 
            href="https://github.com/bitpaint/Gource-Tools" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <SectionIcon><FaGithub /></SectionIcon>
            GitHub
            <LinkIcon><FaExternalLinkAlt size={10} /></LinkIcon>
          </ExternalLink>
        </SidebarSection>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default Sidebar; 