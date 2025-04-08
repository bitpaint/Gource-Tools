import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaGithub, FaFolder, FaPlay, FaCheck, FaHdd, FaCode, FaVideo, FaArrowRight, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface QuickStartProps {
  projectCount: number;
  repositoryCount: number;
  renderCount: number;
}

const QuickStartContainer = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.small};
  margin-bottom: ${props => props.theme.spacing.xl};
  width: 100%;
  transition: all 0.3s ease-in-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const Title = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.large};
  margin-bottom: 0;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textLight};
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.theme.colors.dark};
  }
`;

const ContentArea = styled.div<{ $isOpen: boolean }>`
  overflow: hidden;
  max-height: ${props => props.$isOpen ? '500px' : '0'};
  opacity: ${props => props.$isOpen ? '1' : '0'};
  transition: all 0.4s ease-in-out;
  margin-top: ${props => props.$isOpen ? props.theme.spacing.md : '0'};
`;

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const StepsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-bottom: ${props => props.theme.spacing.lg};
  
  &::before {
    content: '';
    position: absolute;
    height: 2px;
    background-color: ${props => props.theme.colors.borderColor};
    top: 2rem;
    left: 2rem;
    right: 2rem;
    z-index: 1;
  }
`;

const ProgressBar = styled.div<{ $progress: number }>`
  position: absolute;
  height: 2px;
  background-color: #4CAF50;
  top: 2rem;
  left: 2rem;
  width: ${props => (props.$progress * (100 - (4 * 2)))}%;
  z-index: 2;
  transition: width 0.5s ease-in-out;
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 3;
  width: 25%;
`;

const StepIcon = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: ${props => props.$completed ? '#4CAF50' : props.$active ? props.theme.colors.light : props.theme.colors.borderColor};
  color: ${props => props.$completed ? 'white' : props.$active ? props.theme.colors.dark : props.theme.colors.textLight};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  margin-bottom: ${props => props.theme.spacing.sm};
  border: 2px solid ${props => props.$completed ? '#4CAF50' : props.$active ? props.theme.colors.dark : 'transparent'};
  transition: all 0.3s ease-in-out;
`;

const StepTitle = styled.div<{ $active: boolean; $completed: boolean }>`
  font-weight: ${props => (props.$active || props.$completed) ? props.theme.typography.fontWeight.bold : props.theme.typography.fontWeight.regular};
  color: ${props => props.$completed ? '#4CAF50' : props.$active ? props.theme.colors.dark : props.theme.colors.textLight};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StepDescription = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: ${props => props.theme.typography.fontSize.small};
  text-align: center;
  max-width: 150px;
`;

const ActionButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4CAF50;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.small};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  text-decoration: none;
  transition: background-color 0.2s;
  margin-top: ${props => props.theme.spacing.md};
  align-self: center;

  &:hover {
    background-color: #388E3C;
    text-decoration: none;
  }
`;

const StatusSummary = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: ${props => props.theme.typography.fontSize.small};
  margin-left: 1rem;
`;

const QuickStart: React.FC<QuickStartProps> = ({ projectCount, repositoryCount, renderCount }) => {
  // État pour contrôler l'ouverture/fermeture
  const [isOpen, setIsOpen] = useState(true);
  
  // Sauvegarder l'état dans le localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('quickStartIsOpen');
    if (savedState !== null) {
      setIsOpen(savedState === 'true');
    }
  }, []);
  
  // Mettre à jour le localStorage quand l'état change
  useEffect(() => {
    localStorage.setItem('quickStartIsOpen', isOpen.toString());
  }, [isOpen]);
  
  // Fonction pour basculer l'état
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  // Déterminer l'étape active en fonction des données
  let activeStep = 1;
  if (repositoryCount > 0) activeStep = 2;
  if (projectCount > 0 && repositoryCount > 0) activeStep = 3;
  if (renderCount > 0) activeStep = 5; // Complété
  
  // Calculer le progrès pour la barre de progression (0 à 1)
  const progress = (activeStep - 1) / 4;
  
  // Déterminer le bouton d'action à afficher
  let actionButtonPath = "/repositories/add";
  let actionButtonText = "Add a Repository";
  
  if (activeStep === 2) {
    actionButtonPath = "/projects/create";
    actionButtonText = "Create a Project";
  } else if (activeStep === 3) {
    actionButtonPath = "/projects";
    actionButtonText = "View Projects";
  } else if (activeStep === 4) {
    actionButtonPath = "/renders/create";
    actionButtonText = "Create a Render";
  }
  
  // Texte de résumé de statut
  let statusText = "";
  if (activeStep === 1) {
    statusText = "Start by adding a repository";
  } else if (activeStep === 2) {
    statusText = "Repository added. Create a project next.";
  } else if (activeStep === 3) {
    statusText = "Project created. Manage your projects.";
  } else if (activeStep === 4) {
    statusText = "Ready to render visualization.";
  } else if (activeStep === 5) {
    statusText = "All steps completed!";
  }
  
  return (
    <QuickStartContainer>
      <Header onClick={toggleOpen}>
        <Title>
          <FaPlay />
          Quick Start Guide
          <StatusSummary>{statusText}</StatusSummary>
        </Title>
        <ToggleButton>
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </ToggleButton>
      </Header>
      
      <ContentArea $isOpen={isOpen}>
        <StepContainer>
          <StepsWrapper>
            <ProgressBar $progress={progress} />
            
            <Step $active={activeStep === 1} $completed={activeStep > 1}>
              <StepIcon $active={activeStep === 1} $completed={activeStep > 1}>
                {activeStep > 1 ? <FaCheck /> : <FaGithub />}
              </StepIcon>
              <StepTitle $active={activeStep === 1} $completed={activeStep > 1}>
                Copy a Repo
              </StepTitle>
              <StepDescription>
                Add or clone a Git repository
              </StepDescription>
            </Step>
            
            <Step $active={activeStep === 2} $completed={activeStep > 2}>
              <StepIcon $active={activeStep === 2} $completed={activeStep > 2}>
                {activeStep > 2 ? <FaCheck /> : <FaFolder />}
              </StepIcon>
              <StepTitle $active={activeStep === 2} $completed={activeStep > 2}>
                Create a Project
              </StepTitle>
              <StepDescription>
                Create a project to organize repositories
              </StepDescription>
            </Step>
            
            <Step $active={activeStep === 3} $completed={activeStep > 3}>
              <StepIcon $active={activeStep === 3} $completed={activeStep > 3}>
                {activeStep > 3 ? <FaCheck /> : <FaCode />}
              </StepIcon>
              <StepTitle $active={activeStep === 3} $completed={activeStep > 3}>
                Configure Gource
              </StepTitle>
              <StepDescription>
                Customize visualization settings
              </StepDescription>
            </Step>
            
            <Step $active={activeStep === 4} $completed={activeStep > 4}>
              <StepIcon $active={activeStep === 4} $completed={activeStep > 4}>
                {activeStep > 4 ? <FaCheck /> : <FaVideo />}
              </StepIcon>
              <StepTitle $active={activeStep === 4} $completed={activeStep > 4}>
                Render
              </StepTitle>
              <StepDescription>
                Generate and export visualizations
              </StepDescription>
            </Step>
          </StepsWrapper>
          
          {activeStep < 5 && (
            <ActionButton to={actionButtonPath}>
              {actionButtonText} <FaArrowRight />
            </ActionButton>
          )}
        </StepContainer>
      </ContentArea>
    </QuickStartContainer>
  );
};

export default QuickStart; 