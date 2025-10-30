import React from 'react';
import { Route, Switch } from 'wouter';
import AppLayout from '../../components/layout/AppLayout';

// Importă toate paginile
import OverviewPage from './pages/overview';
import TasksPage from './pages/tasks';
import TaskDetailsPage from './pages/tasks/TaskDetails';
import NotesPage from './pages/notes';
import NoteDetailsPage from './pages/notes/NoteDetails';
import ThreadsPage from './pages/threads';
import ThreadDetailsPage from './pages/threads/ThreadDetails';
import MessagesPage from './pages/messages';
import MessageDetailsPage from './pages/messages/MessageDetails';
import CommunityPage from './pages/community';
import CommunityAnnouncementsPage from './pages/community/Announcements';
import QuestionsPage from './pages/community/Questions';
import IdeasPage from './pages/community/Ideas';
import EventsPage from './pages/community/Events';
import ResourcesPage from './pages/community/Resources';
import TutorialsPage from './pages/community/Tutorials';
import NotFound from '../shared/pages/not-found';

/**
 * Modul de Colaborare
 * 
 * Componenta principală care gestionează rutele pentru secțiunea de colaborare
 * Înfășurat cu AppLayout pentru a asigura un sidebar și header consecvent
 */
function CollabModule() {
  return (
    <AppLayout>
      <Switch>
        {/* Pagina de start */}
        <Route path="/collab">
          <OverviewPage />
        </Route>
        
        {/* Sarcini */}
        <Route path="/collab/tasks/new">
          <TaskDetailsPage />
        </Route>
        <Route path="/collab/tasks/:id/edit">
          <TaskDetailsPage />
        </Route>
        <Route path="/collab/tasks/:id">
          <TaskDetailsPage />
        </Route>
        <Route path="/collab/tasks">
          <TasksPage />
        </Route>
        
        {/* Notițe */}
        <Route path="/collab/notes/new">
          <NoteDetailsPage />
        </Route>
        <Route path="/collab/notes/:id/edit">
          <NoteDetailsPage />
        </Route>
        <Route path="/collab/notes/:id">
          <NoteDetailsPage />
        </Route>
        <Route path="/collab/notes">
          <NotesPage />
        </Route>
        
        {/* Thread-uri */}
        <Route path="/collab/threads/new">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/threads/:id/edit">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/threads/:id">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/threads">
          <ThreadsPage />
        </Route>
        
        {/* Mesaje */}
        <Route path="/collab/messages/:id">
          <MessageDetailsPage />
        </Route>
        <Route path="/collab/messages">
          <MessagesPage />
        </Route>
        
        {/* Comunitate - important: ordinea rutelor contează, mai întâi cele mai specifice */}
        <Route path="/collab/community/announcements/:id">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/community/announcements">
          <CommunityAnnouncementsPage />
        </Route>
        
        <Route path="/collab/community/questions/:id">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/community/questions">
          <QuestionsPage />
        </Route>
        
        <Route path="/collab/community/ideas/:id">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/community/ideas">
          <IdeasPage />
        </Route>
        
        <Route path="/collab/community/events/:id">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/community/events">
          <EventsPage />
        </Route>
        
        <Route path="/collab/community/resources/:id">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/community/resources">
          <ResourcesPage />
        </Route>
        
        <Route path="/collab/community/tutorials/:id">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/community/TUTORIALE/:id">
          <ThreadDetailsPage />
        </Route>
        <Route path="/collab/community/tutorials">
          <TutorialsPage />
        </Route>
        <Route path="/collab/community/TUTORIALE">
          <TutorialsPage />
        </Route>
        
        {/* Ruta generală pentru comunitate trebuie să fie ultima */}
        <Route path="/collab/community">
          <CommunityPage />
        </Route>
        
        {/* Setări */}
        <Route path="/collab/settings">
          <div className="p-6">
            <h1 className="text-2xl font-bold">Setări Colaborare</h1>
            <p className="mt-4">Setările pentru modulul de colaborare vor fi disponibile în curând.</p>
          </div>
        </Route>
        
        {/* Fallback */}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </AppLayout>
  );
}

export default CollabModule;