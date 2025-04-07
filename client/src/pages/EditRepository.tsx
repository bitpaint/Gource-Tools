import React from 'react';
import { useParams } from 'react-router-dom';
import RepositoryForm from '../components/repositories/RepositoryForm';

const EditRepository: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Missing repository ID</div>;
  }
  
  return (
    <div>
      <h1>Edit Repository</h1>
      <p>Modify your Git repository details.</p>
      <RepositoryForm repositoryId={id} />
    </div>
  );
};

export default EditRepository; 