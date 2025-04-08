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
import LinkRepositoriesToProject from '../pages/LinkRepositoriesToProject';
import NotFound from '../pages/NotFound';
import Settings from '../pages/Settings';

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
      
      {/* Project routes */}
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
        path="/projects/:projectIdOrSlug" 
        element={
          <Layout>
            <ProjectDetail />
          </Layout>
        } 
      />
      <Route 
        path="/projects/:projectIdOrSlug/edit" 
        element={
          <Layout>
            <EditProject />
          </Layout>
        } 
      />
      <Route 
        path="/projects/:projectIdOrSlug/gource" 
        element={
          <Layout>
            <NotFound />
          </Layout>
        } 
      />
      <Route 
        path="/projects/:projectIdOrSlug/link-repositories" 
        element={
          <Layout>
            <LinkRepositoriesToProject />
          </Layout>
        } 
      />
      
      {/* Repository routes */}
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
        path="/repositories/:repoIdOrSlug" 
        element={
          <Layout>
            <EditRepository />
          </Layout>
        } 
      />
      
      {/* Render routes */}
      <Route 
        path="/render" 
        element={
          <Layout>
            <NotFound />
          </Layout>
        } 
      />
      
      {/* Settings routes */}
      <Route 
        path="/settings" 
        element={
          <Layout>
            <Settings />
          </Layout>
        } 
      />
      
      {/* 404 route */}
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