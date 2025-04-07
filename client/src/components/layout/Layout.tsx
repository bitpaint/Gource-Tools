import React from 'react';
import styled from 'styled-components';
import Navbar from './Navbar';
import Sidebar from '../layout/Sidebar';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100%;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 64px); /* Hauteur de l'écran moins la hauteur de la navbar */
`;

const SidebarWrapper = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const ContentWrapper = styled.main`
  flex: 1;
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.background};
  overflow-y: auto;
  height: 100%;
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutContainer>
      <Navbar />
      <MainContent>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout; 