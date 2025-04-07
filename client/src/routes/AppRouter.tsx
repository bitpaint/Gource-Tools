import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import ProjectList from '../pages/ProjectList';
import CreateProject from '../pages/CreateProject';
import EditProject from '../pages/EditProject';
import ProjectDetail from '../pages/ProjectDetail';
import RepositoryList from '../pages/RepositoryList';
import AddRepository from '../pages/AddRepository';
import EditRepository from '../pages/EditRepository';
import GourceConfig from '../pages/GourceConfig';
import NotFound from '../pages/NotFound';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Layout>
            <Dashboard />
          </Layout>
        } 
      />
      
      {/* Routes pour les projets */}
      <Route 
        path="/projects" 
        element={
          <Layout>
            <ProjectList />
          </Layout>
        } 
      />
      <Route 
        path="/projects/create" 
        element={
          <Layout>
            <CreateProject />
          </Layout>
        } 
      />
      <Route 
        path="/projects/:projectId" 
        element={
          <Layout>
            <ProjectDetail />
          </Layout>
        } 
      />
      <Route 
        path="/projects/:projectId/edit" 
        element={
          <Layout>
            <EditProject />
          </Layout>
        } 
      />
      <Route 
        path="/projects/:projectId/gource" 
        element={
          <Layout>
            <GourceConfig />
          </Layout>
        } 
      />
      
      {/* Routes pour les dépôts */}
      <Route 
        path="/repositories" 
        element={
          <Layout>
            <RepositoryList />
          </Layout>
        } 
      />
      <Route 
        path="/repositories/add" 
        element={
          <Layout>
            <AddRepository />
          </Layout>
        } 
      />
      <Route 
        path="/repositories/:repoId/edit" 
        element={
          <Layout>
            <EditRepository />
          </Layout>
        } 
      />
      
      {/* Routes pour les rendus */}
      <Route 
        path="/renders" 
        element={
          <Layout>
            <NotFound />
          </Layout>
        } 
      />
      <Route 
        path="/renders/create" 
        element={
          <Layout>
            <NotFound />
          </Layout>
        } 
      />
      <Route 
        path="/renders/:renderId" 
        element={
          <Layout>
            <NotFound />
          </Layout>
        } 
      />
      
      {/* Routes pour les paramètres */}
      <Route 
        path="/settings" 
        element={
          <Layout>
            <NotFound />
          </Layout>
        } 
      />
      <Route
        path="/settings/gource"
        element={
          <Layout>
            <NotFound />
          </Layout>
        }
      />
      <Route
        path="/settings/app"
        element={
          <Layout>
            <NotFound />
          </Layout>
        }
      />
      
      {/* Route 404 */}
      <Route 
        path="*" 
        element={
          <Layout>
            <NotFound />
          </Layout>
        } 
      />
    </Routes>
  );
};

export default AppRouter; 