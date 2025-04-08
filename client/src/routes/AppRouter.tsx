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
import ProfilesList from '../pages/ProfilesList';
import ProfileForm from '../pages/ProfileForm';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import LinkRepositoriesToProject from '../pages/LinkRepositoriesToProject';

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
      <Route 
        path="/projects/:projectId/link-repositories" 
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
        path="/repositories/:repoId" 
        element={
          <Layout>
            <EditRepository />
          </Layout>
        } 
      />
      
      {/* Gource Profiles routes */}
      <Route 
        path="/profiles" 
        element={
          <Layout>
            <ProfilesList />
          </Layout>
        } 
      />
      <Route 
        path="/profiles/create" 
        element={
          <Layout>
            <ProfileForm />
          </Layout>
        } 
      />
      <Route 
        path="/profiles/:profileId" 
        element={
          <Layout>
            <ProfileForm />
          </Layout>
        } 
      />
      
      {/* Render routes */}
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