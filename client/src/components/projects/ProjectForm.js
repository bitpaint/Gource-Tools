import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
  Button,
  Checkbox,
  Tooltip,
  Collapse,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon
} from '@mui/icons-material';

const ProjectForm = ({
  open,
  onClose,
  isEditing,
  currentProject,
  setCurrentProject,
  renderProfiles,
  savingProject,
  onSave,
  groupedRepositories,
  expandedOwners,
  onToggleOwnerExpanded,
  repoSearchQuery,
  setRepoSearchQuery,
  areAllOwnerReposSelected,
  areSomeOwnerReposSelected,
  onToggleAllOwnerRepos
}) => {
  // Filter repositories based on search query
  const filteredRepositories = Object.entries(groupedRepositories).reduce((acc, [owner, repos]) => {
    if (repoSearchQuery.trim() === '') {
      acc[owner] = repos;
      return acc;
    }
    
    const filteredRepos = repos.filter(repo => 
      repo.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(repoSearchQuery.toLowerCase())) ||
      repo.url?.toLowerCase().includes(repoSearchQuery.toLowerCase())
    );
    
    if (filteredRepos.length > 0) {
      acc[owner] = filteredRepos;
    }
    
    return acc;
  }, {});

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{isEditing ? 'Edit Project' : 'Create Project'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 2 }}>
          <TextField
            autoFocus
            id="name"
            label="Project Name"
            type="text"
            variant="outlined"
            value={currentProject.name}
            onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})}
            required
            sx={{ flex: 1 }}
          />
          
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel id="render-profile-label">Gource Config File</InputLabel>
            <Select
              labelId="render-profile-label"
              id="renderProfileId"
              value={currentProject.renderProfileId || ''}
              onChange={(e) => setCurrentProject({ ...currentProject, renderProfileId: e.target.value })}
              input={<OutlinedInput label="Gource Config File" />}
            >
              {renderProfiles.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  {profile.name} {profile.isSystemProfile && '(System)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="repositories-label">Repositories</InputLabel>
          <OutlinedInput
            label="Repositories"
            id="repositories-search"
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            }
            endAdornment={
              repoSearchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setRepoSearchQuery('')}
                    edge="end"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
            placeholder="Search repositories..."
            value={repoSearchQuery}
            onChange={(e) => setRepoSearchQuery(e.target.value)}
            sx={{ mb: 1 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {currentProject.repositories?.length || 0} repositories selected
            </Typography>
            {currentProject.repositories?.length > 0 && (
              <Button 
                size="small" 
                onClick={() => setCurrentProject({...currentProject, repositories: []})}
                color="error"
                variant="text"
                startIcon={<DeleteIcon fontSize="small" />}
              >
                Clear all
              </Button>
            )}
          </Box>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 1.5, 
              maxHeight: 400, 
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 1
            }}
          >
            {Object.keys(filteredRepositories).length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <SearchIcon color="disabled" sx={{ fontSize: 40, mb: 1, opacity: 0.7 }} />
                <Typography variant="body2" color="text.secondary">
                  {repoSearchQuery ? 'No repositories match your search' : 'Start typing to search repositories'}
                </Typography>
              </Box>
            ) : (
              <>
                {Object.entries(filteredRepositories).length > 1 && (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      {Object.values(filteredRepositories).flat().length} repositories found
                    </Typography>
                  </Box>
                )}
                {Object.entries(filteredRepositories).map(([owner, repos]) => (
                  <Box key={owner} sx={{ mb: 3 }}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        pb: 0.5,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleOwnerExpanded(owner);
                        }}
                      >
                        {expandedOwners[owner] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Tooltip title={areAllOwnerReposSelected(owner) ? "Deselect all repositories" : "Select all repositories"}>
                        <Checkbox
                          size="small"
                          onClick={(e) => onToggleAllOwnerRepos(owner, e)}
                          checked={areAllOwnerReposSelected(owner)}
                          indeterminate={areSomeOwnerReposSelected(owner)}
                          sx={{ ml: 0.5, mr: 0.5 }}
                        />
                      </Tooltip>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleOwnerExpanded(owner);
                        }}
                      >
                        {owner} ({repos.length})
                      </Typography>
                    </Box>
                    
                    <Collapse in={expandedOwners[owner] || false} timeout="auto">
                      {repos.map((repo) => (
                        <Box 
                          key={repo.id} 
                          sx={{ 
                            pl: 4, 
                            py: 0.8, 
                            display: 'flex', 
                            alignItems: 'center',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            },
                            cursor: 'pointer',
                            borderRadius: 1
                          }}
                          onClick={() => {
                            const currentRepos = [...(currentProject.repositories || [])];
                            const isSelected = currentRepos.includes(String(repo.id));
                            
                            if (isSelected) {
                              // Deselect
                              const index = currentRepos.indexOf(String(repo.id));
                              if (index !== -1) {
                                currentRepos.splice(index, 1);
                              }
                            } else {
                              // Select
                              if (!currentRepos.includes(String(repo.id))) {
                                currentRepos.push(String(repo.id));
                              }
                            }
                            
                            setCurrentProject({...currentProject, repositories: currentRepos});
                          }}
                        >
                          <FormControl onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={(currentProject.repositories || []).indexOf(String(repo.id)) > -1}
                              onChange={(e) => {
                                const currentRepos = [...(currentProject.repositories || [])];
                                if (e.target.checked) {
                                  if (currentRepos.indexOf(String(repo.id)) === -1) {
                                    currentRepos.push(String(repo.id));
                                  }
                                } else {
                                  const index = currentRepos.indexOf(String(repo.id));
                                  if (index !== -1) {
                                    currentRepos.splice(index, 1);
                                  }
                                }
                                setCurrentProject({...currentProject, repositories: currentRepos});
                              }}
                            />
                          </FormControl>
                          <Box sx={{ display: 'inline-block', ml: 1 }}>
                            <Typography variant="body1">{repo.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {repo.description || 'No description'}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Collapse>
                  </Box>
                ))}
              </>
            )}
          </Paper>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={savingProject}>Cancel</Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={!currentProject.name || !currentProject.repositories?.length || savingProject}
          startIcon={savingProject && <CircularProgress size={16} color="inherit" />}
        >
          {savingProject ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectForm; 