import React from 'react';
import styled from 'styled-components';
import Navbar from './Navbar';
import Sidebar from '../layout/Sidebar';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
`;

const ContentWrapper = styled.main`
  flex: 1;
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.background};
  overflow-y: auto;
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutContainer>
      <Navbar />
      <MainContent>
        <Sidebar />
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout; 