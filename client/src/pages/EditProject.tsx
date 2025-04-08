import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectForm from '../components/projects/ProjectForm';

const EditProject: React.FC = () => {
  const { projectIdOrSlug } = useParams<{ projectIdOrSlug: string }>();
  
  if (!projectIdOrSlug) {
    return <div>Missing project ID</div>;
  }
  
  return (
    <div>
      <h1>Edit Project</h1>
      <p>Modify your project details.</p>
      <ProjectForm projectId={projectIdOrSlug} />
    </div>
  );
};

export default EditProject; 