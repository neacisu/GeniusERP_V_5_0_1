import React from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { ProtectedRoute } from '@/lib/protected-route';

// Documents module pages
import ArchivePage from './pages/archive';
import RegistryPage from './pages/registry';
import TemplatesPage from './pages/templates';
import OcrPage from './pages/ocr';
import EditorPage from './pages/editor';
import SignaturesPage from './pages/signatures';
import SearchPage from './pages/search';

/**
 * Documents Module Routes
 */
export const DocumentsRoutes: React.FC = () => {
  const [location] = useLocation();
  
  // If at root documents path, redirect to the archive
  React.useEffect(() => {
    if (location === '/documents') {
      window.history.replaceState(null, '', '/documents/archive');
    }
  }, [location]);
  
  return (
    <Switch>
      <Route path="/documents/archive" component={ArchivePage} />
      <Route path="/documents/registry" component={RegistryPage} />
      <Route path="/documents/templates" component={TemplatesPage} />
      <Route path="/documents/ocr" component={OcrPage} />
      <Route path="/documents/editor" component={EditorPage} />
      <Route path="/documents/signatures" component={SignaturesPage} />
      <Route path="/documents/search" component={SearchPage} />
      <Route path="/documents">
        <ArchivePage />
      </Route>
    </Switch>
  );
};

export default DocumentsRoutes;