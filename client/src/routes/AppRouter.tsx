import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Dashboard from '../pages/Dashboard';
import ProjectList from '../pages/ProjectList';
import CreateProject from '../pages/CreateProject';
import EditProject from '../pages/EditProject';
import ProjectDetail from '../pages/ProjectDetail';
import RepositoryList from '../pages/RepositoryList';
import AddRepository from '../pages/AddRepository';
import EditRepository from '../pages/EditRepository';
import ProjectRepositoriesManager from '../pages/ProjectRepositoriesManager';
import NotFound from '../pages/NotFound';
import Settings from '../pages/Settings';
import RepositoryProjectsManager from '../pages/RepositoryProjectsManager';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        } 
      />
      
      {/* Project routes */}
      <Route 
        path="/projects" 
        element={
          <AppLayout>
            <Outlet />
          </AppLayout>
        }
      >
        <Route index element={<ProjectList />} />
        <Route path="create" element={<CreateProject />} />
        <Route path=":projectIdOrSlug" element={<ProjectDetail />} />
        <Route path=":projectIdOrSlug/link-repositories" element={<ProjectRepositoriesManager />} />
      </Route>
      <Route 
        path="/projects/:projectIdOrSlug/edit" 
        element={
          <AppLayout>
            <EditProject />
          </AppLayout>
        } 
      />
      <Route 
        path="/projects/:projectIdOrSlug/gource" 
        element={
          <AppLayout>
            <NotFound />
          </AppLayout>
        } 
      />
      
      {/* Repository routes */}
      <Route 
        path="/repositories" 
        element={
          <AppLayout>
            <RepositoryList />
          </AppLayout>
        } 
      />
      <Route 
        path="/repositories/add" 
        element={
          <AppLayout>
            <AddRepository />
          </AppLayout>
        } 
      />
      <Route 
        path="/repositories/select-project" 
        element={
          <AppLayout>
            <RepositoryProjectsManager />
          </AppLayout>
        } 
      />
      <Route 
        path="/repositories/:repoIdOrSlug" 
        element={
          <AppLayout>
            <EditRepository />
          </AppLayout>
        } 
      />
      
      {/* Render routes */}
      <Route 
        path="/render" 
        element={
          <AppLayout>
            <Outlet />
          </AppLayout>
        } 
      >
        <Route index element={<NotFound />} />
        <Route path="queue" element={<NotFound />} />
      </Route>
      
      {/* Settings routes */}
      <Route 
        path="/settings" 
        element={
          <AppLayout>
            <Settings />
          </AppLayout>
        } 
      />
      
      {/* 404 route */}
      <Route 
        path="*" 
        element={
          <AppLayout>
            <NotFound />
          </AppLayout>
        } 
      />
    </Routes>
  );
};

export default AppRouter; 