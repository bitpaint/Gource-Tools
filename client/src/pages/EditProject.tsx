import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectForm from '../components/projects/ProjectForm';

const EditProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Missing project ID</div>;
  }
  
  return (
    <div>
      <h1>Edit Project</h1>
      <p>Modify your project details.</p>
      <ProjectForm projectId={id} />
    </div>
  );
};

export default EditProject; 