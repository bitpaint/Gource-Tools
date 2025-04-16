import React from 'react';
import {
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Typography,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  RotateRight as RefreshIcon,
  RotateRight,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon
} from '@mui/icons-material';

const ProjectList = ({ 
  projects, 
  repositories,
  renderProfiles,
  expandedProjects,
  projectSearchQuery,
  onToggleExpand,
  onEditProject,
  onRegenerateGourceLogs,
  onRenderProject,
  onOpenDeleteDialog,
  onOpenRemoveRepoDialog
}) => {
  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    projectSearchQuery.trim() === '' ||
    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  const getRepositoriesForProject = (repoIds) => {
    if (!repoIds || repoIds.length === 0) {
      return [];
    }
    
    return repositories.filter(repo => repoIds.includes(repo.id));
  };

  const getProfileName = (profileId) => {
    if (!profileId) {
      return 'Default';
    }
    
    const profile = renderProfiles.find(p => p.id === profileId);
    return profile ? profile.name : 'Default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Difference in milliseconds
    const diffMs = now - date;
    
    // Convert to seconds, minutes, hours, days
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHours = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHours / 24);
    const diffWeeks = Math.round(diffDays / 7);
    const diffMonths = Math.round(diffDays / 30);
    const diffYears = Math.round(diffDays / 365);
    
    // Format based on difference
    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffWeeks < 4) {
      return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Name</TableCell>
            <TableCell>Repos</TableCell>
            <TableCell>Gource Config</TableCell>
            <TableCell>Last Update</TableCell>
            <TableCell>Last Render</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                No projects found. Create one to get started.
              </TableCell>
            </TableRow>
          ) : (
            filteredProjects.map((project) => (
              <React.Fragment key={project.id}>
                <TableRow 
                  sx={{ 
                    '& > *': { borderBottom: 'unset' },
                    cursor: 'pointer' 
                  }}
                  onClick={() => onToggleExpand(project.id)}
                >
                  <TableCell>
                    <IconButton size="small">
                      {expandedProjects[project.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {project.name}
                  </TableCell>
                  <TableCell>{project.repositories?.length || 0}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getProfileName(project.renderProfileId)} 
                      size="small" 
                      color={project.renderProfileId ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={project.lastModified ? new Date(project.lastModified).toLocaleString() : 'Never updated'}>
                      <span>{formatDate(project.lastModified)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={project.lastRendered ? new Date(project.lastRendered).toLocaleString() : 'Never rendered'}>
                      <span>{formatDate(project.lastRendered)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProject(project.id);
                      }}
                      size="small"
                      title="Edit Project"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegenerateGourceLogs(project.id);
                      }}
                      size="small"
                      title="Update Project"
                    >
                      <RefreshIcon />
                    </IconButton>
                    <IconButton
                      color="info"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRenderProject(project.id);
                      }}
                      size="small"
                      title="Render Project"
                    >
                      <RotateRight />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDeleteDialog(project);
                      }}
                      size="small"
                      title="Delete Project"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={expandedProjects[project.id]} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        {getRepositoriesForProject(project.repositories).length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No repositories in this project.
                          </Typography>
                        ) : (
                          <List>
                            {getRepositoriesForProject(project.repositories).map((repo) => (
                              <ListItem key={repo.id}>
                                <ListItemText
                                  primary={repo.name}
                                  secondary={repo.description || 'No description'}
                                />
                                <ListItemSecondaryAction>
                                  <IconButton 
                                    edge="end" 
                                    color="error"
                                    onClick={() => onOpenRemoveRepoDialog(project, repo.id)}
                                    title="Remove repository from project"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProjectList; 