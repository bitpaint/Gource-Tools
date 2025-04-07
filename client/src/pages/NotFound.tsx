import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const NotFoundContainer = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
`;

const NotFoundTitle = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.xxlarge};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const NotFoundText = styled.p`
  font-size: ${props => props.theme.typography.fontSize.large};
  margin-bottom: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.secondary};
`;

const HomeLink = styled(Link)`
  display: inline-block;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.small};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const NotFound: React.FC = () => {
  return (
    <NotFoundContainer>
      <NotFoundTitle>404</NotFoundTitle>
      <NotFoundText>The page you are looking for does not exist.</NotFoundText>
      <HomeLink to="/">Back to Home</HomeLink>
    </NotFoundContainer>
  );
};

export default NotFound; 