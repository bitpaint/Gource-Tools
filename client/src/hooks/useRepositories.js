import { useState, useEffect, useCallback } from 'react';
import { repositoriesApi } from '../api/api';
import { toast } from 'react-toastify';

const useRepositories = () => {
  const [repositories, setRepositories] = useState([]);
  const [groupedRepositories, setGroupedRepositories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRepositories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await repositoriesApi.getAll();
      
      if (Array.isArray(response.data)) {
        setRepositories(response.data);
        
        // Group repositories by owner
        const grouped = response.data.reduce((acc, repo) => {
          const owner = repo.owner || 'unknown';
          if (!acc[owner]) {
            acc[owner] = [];
          }
          acc[owner].push(repo);
          return acc;
        }, {});
        
        setGroupedRepositories(grouped);
      } else {
        setError('Invalid repositories data received');
        setRepositories([]);
        setGroupedRepositories({});
      }
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError('Failed to load repositories');
      toast.error('Failed to load repositories');
      setRepositories([]);
      setGroupedRepositories({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  // Update a single repository, regenerate its log, and refresh data
  const updateRepository = async (repositoryId) => {
    try {
      await repositoriesApi.update(repositoryId);
      await fetchRepositories(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error updating repository:', error);
      toast.error('Failed to update repository');
      return false;
    }
  };

  // Update multiple repositories in parallel with batched execution
  const updateRepositories = async (repositoryIds) => {
    if (!repositoryIds || repositoryIds.length === 0) {
      return false;
    }

    try {
      // Process in batches of 5 for controlled parallelism
      const batchSize = 5;
      const batches = [];
      
      // Create batches
      for (let i = 0; i < repositoryIds.length; i += batchSize) {
        batches.push(repositoryIds.slice(i, i + batchSize));
      }
      
      // Process batches sequentially, but repositories within batch in parallel
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Show progress of batch processing
        if (batches.length > 1) {
          toast.info(`Processing batch ${i+1}/${batches.length} (${batch.length} repositories)`, {
            autoClose: 2000
          });
        }
        
        // Process current batch in parallel
        await Promise.all(batch.map(repoId => updateRepository(repoId)));
      }
      
      await fetchRepositories(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error updating repositories:', error);
      toast.error('Failed to update some repositories');
      return false;
    }
  };

  return {
    repositories,
    groupedRepositories,
    loading,
    error,
    fetchRepositories,
    updateRepository,
    updateRepositories
  };
};

export default useRepositories; 