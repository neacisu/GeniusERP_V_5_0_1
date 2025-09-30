/**
 * Collaboration API Hook
 * 
 * This hook provides access to all collaboration API endpoints,
 * including tasks, threads, notes, and notifications.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getCompanyId } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { TaskStatus, TaskPriority, CommunityCategory } from '../types';

// Pagination interface
interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: Date | string;
  companyId: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Extended properties
  progress?: number;
  estimatedHours?: number;
  isPublic?: boolean;
  type?: string;
  isRecurring?: boolean;
  commentCount?: number;
  attachments?: any[];
}

// Thread interface
export interface Thread {
  id: string;
  title: string;
  description?: string;
  category?: string;
  companyId: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  // Extended properties
  isPinned?: boolean;
  isPublic?: boolean;
  isPrivate?: boolean;
  isClosed?: boolean;
  lastMessageAt?: Date | string;
  viewCount?: number;
  replyCount?: number;
  likeCount?: number;
  expiryDate?: Date | string;
  metadata?: Record<string, any>;
}

// Note interface
export interface Note {
  id: string;
  content?: string;
  taskId: string;
  companyId: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Extended properties
  title?: string;
  isPublic?: boolean;
  isPrivate?: boolean;
  tags?: string[];
  attachments?: any[];
  attachmentCount?: number;
  relatedItems?: { id: string; type: 'task' | 'thread'; title?: string }[];
  createdBy?: string;
}

// Message interface
export interface Message {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Community Thread (extended Thread with community-specific fields)
export interface CommunityThread extends Thread {
  replyCount: number;
}

// Query options interfaces
export interface TaskQueryOptions {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  assignedTo?: string;
  dueBefore?: Date | string;
  dueAfter?: Date | string;
  search?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ThreadQueryOptions {
  category?: string;
  userId?: string;
  status?: 'open' | 'closed';
  isPinned?: boolean;
  search?: string;
  limit?: number;
  page?: number;
}

export interface NoteQueryOptions {
  taskId?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export interface CommunityQueryOptions {
  category?: CommunityCategory;
  isPinned?: boolean;
  search?: string;
  limit?: number;
  page?: number;
}

export default function useCollabApi() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Initialize the auth status
  useEffect(() => {
    if (user) {
      console.log('useCollabApi: User is authenticated', { 
        userId: user.id,
        companyId: user.companyId,
        hasToken: !!localStorage.getItem('user')
      });
    } else {
      console.warn('useCollabApi: User is not authenticated');
    }
  }, [user]);

  // Task-related queries and mutations
  const useTasks = (options?: TaskQueryOptions) => {
    // Get the query client for invalidating queries
    const queryClient = useQueryClient();
    
    return useQuery({
      queryKey: ['/api/collaboration/tasks', options],
      queryFn: async () => {
        try {
          console.log('TASK DEBUG: Starting task fetch process...');
          
          // Try to get user data from localStorage first to avoid potential HTML response errors
          let companyId: string | null = null;
          try {
            const userData = localStorage.getItem('user');
            if (userData) {
              const parsedUser = JSON.parse(userData);
              companyId = parsedUser.companyId || null;
              console.log('TASK DEBUG: Found company ID in localStorage:', companyId);
            }
          } catch (e) {
            console.warn('TASK DEBUG: Error parsing user data from localStorage', e);
          }
          
          // If we don't have a company ID from localStorage, try the API
          if (!companyId) {
            try {
              console.log('TASK DEBUG: Getting user information from API...');
              const userResponse = await apiRequest<any>('/api/auth/user');
              
              if (userResponse && userResponse.companyId) {
                companyId = userResponse.companyId;
                console.log('TASK DEBUG: Got company ID from API:', companyId);
              } else {
                console.error('TASK DEBUG: No company ID in user response:', userResponse);
              }
            } catch (error) {
              console.error('TASK DEBUG: Error fetching user data from API:', error);
              // If we've received an error from the user API, force a login state reset
              queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
              throw new Error('Authentication problem: Unable to fetch user information');
            }
          }
          
          // If we still don't have a company ID, we can't proceed
          if (!companyId) {
            console.error('TASK DEBUG: No company ID available for tasks query after all attempts');
            throw new Error('User info not available or missing company ID');
          }
          
          console.log('TASK DEBUG: Fetching tasks with company ID:', companyId);
          
          // Prepare request with company ID header
          const requestOptions = {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Company-ID': companyId
            },
            params: options // Add query params from options
          };
          
          console.log('TASK DEBUG: Sending request with options:', JSON.stringify(requestOptions, null, 2));
          
          // Make the API request for tasks
          const result = await apiRequest<{ tasks: Task[]; pagination: Pagination }>('/api/collaboration/tasks', requestOptions);
          
          // Process and return the results
          if (!result) {
            console.error('TASK DEBUG: Tasks response is null or undefined');
            return { 
              tasks: [], 
              pagination: { 
                totalItems: 0, 
                totalPages: 0, 
                currentPage: 1, 
                pageSize: 20 
              } 
            };
          }
          
          if (!result.tasks) {
            console.error('TASK DEBUG: Tasks array is missing from response:', result);
            return { 
              tasks: [], 
              pagination: { 
                totalItems: 0, 
                totalPages: 0, 
                currentPage: 1, 
                pageSize: 20 
              } 
            };
          }
          
          console.log(`TASK DEBUG: Tasks loaded successfully: ${result.tasks.length} tasks retrieved`);
          return result;
        } catch (error) {
          console.error('TASK DEBUG: Failed to load tasks - ERROR:', error);
          // Return empty results instead of throwing to prevent UI crashes
          return { 
            tasks: [], 
            pagination: { 
              totalItems: 0, 
              totalPages: 0, 
              currentPage: 1, 
              pageSize: 20 
            } 
          };
        }
      },
      // Explicitly enable retries for this query
      retry: 3,
      retryDelay: 1000,
      // Set a stale time to prevent too frequent refetching
      staleTime: 30000
    });
  };

  const useUpdateTaskStatus = () => {
    return useMutation({
      mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
        return apiRequest(`/api/collaboration/tasks/${id}/status`, {
          method: 'PATCH',
          body: { status }
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/tasks'] });
      }
    });
  };

  const useCreateTask = () => {
    return useMutation({
      mutationFn: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        return apiRequest('/api/collaboration/tasks', {
          method: 'POST',
          body: task
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/tasks'] });
      }
    });
  };

  const useUpdateTask = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
        return apiRequest(`/api/collaboration/tasks/${id}`, {
          method: 'PATCH',
          body: data
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/tasks'] });
      }
    });
  };
  
  const useDeleteTask = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        return apiRequest(`/api/collaboration/tasks/${id}`, {
          method: 'DELETE'
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/tasks'] });
      }
    });
  };

  // Thread-related queries and mutations
  const useThreads = (options?: ThreadQueryOptions) => {
    return useQuery({
      queryKey: ['/api/collaboration/threads', options],
      queryFn: async () => {
        try {
          console.log('THREAD DEBUG: Starting thread fetch process...');
          
          // Try to get company ID for request header
          const companyId = getCompanyId();
          if (!companyId) {
            console.error('THREAD DEBUG: No company ID available for threads query');
            return { 
              threads: [], 
              pagination: { 
                totalItems: 0, 
                totalPages: 0, 
                currentPage: 1, 
                pageSize: 20 
              } 
            };
          }
          
          // Make request with company ID header
          const result = await apiRequest<{ threads: Thread[]; pagination: Pagination }>('/api/collaboration/threads', {
            headers: {
              'X-Company-ID': companyId
            },
            params: options
          });
          
          if (!result || !result.threads) {
            console.error('THREAD DEBUG: Invalid response structure');
            return { 
              threads: [], 
              pagination: { 
                totalItems: 0, 
                totalPages: 0, 
                currentPage: 1, 
                pageSize: 20 
              } 
            };
          }
          
          console.log(`THREAD DEBUG: Threads loaded successfully: ${result.threads.length} threads`);
          return result;
        } catch (error) {
          console.error('THREAD DEBUG: Error loading threads:', error);
          return { 
            threads: [], 
            pagination: { 
              totalItems: 0, 
              totalPages: 0, 
              currentPage: 1, 
              pageSize: 20 
            } 
          };
        }
      },
      retry: 2,
      staleTime: 30000
    });
  };
  
  const useCreateThread = () => {
    return useMutation({
      mutationFn: async (thread: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>) => {
        return apiRequest('/api/collaboration/threads', {
          method: 'POST',
          body: thread
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/threads'] });
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/community'] });
      }
    });
  };
  
  const useUpdateThread = () => {
    return useMutation({
      mutationFn: async (thread: Partial<Thread> & { id: string }) => {
        return apiRequest(`/api/collaboration/threads/${thread.id}`, {
          method: 'PATCH',
          body: thread
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/threads'] });
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/community'] });
      }
    });
  };
  
  const useDeleteThread = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        return apiRequest(`/api/collaboration/threads/${id}`, {
          method: 'DELETE'
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/threads'] });
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/community'] });
      }
    });
  };
  
  const useToggleThreadPin = () => {
    return useMutation({
      mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
        return apiRequest(`/api/collaboration/threads/${id}/pin`, {
          method: 'PATCH',
          body: { isPinned }
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/threads'] });
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/community'] });
      }
    });
  };

  // Community-related queries
  const useCommunityThreads = (options?: CommunityQueryOptions) => {
    return useQuery({
      queryKey: ['/api/collaboration/community', options],
      queryFn: async () => {
        try {
          console.log('COMMUNITY DEBUG: Starting community threads fetch process...');
          
          // Try to get company ID for request header
          const companyId = getCompanyId();
          if (!companyId) {
            console.error('COMMUNITY DEBUG: No company ID available for community query');
            return { 
              threads: [], 
              pagination: { 
                totalItems: 0, 
                totalPages: 0, 
                currentPage: 1, 
                pageSize: 20 
              } 
            };
          }
          
          // Make request with company ID header
          const result = await apiRequest<{ threads: CommunityThread[]; pagination: Pagination }>('/api/collaboration/community', {
            headers: {
              'X-Company-ID': companyId
            },
            params: options
          });
          
          if (!result || !result.threads) {
            console.error('COMMUNITY DEBUG: Invalid response structure');
            return { 
              threads: [], 
              pagination: { 
                totalItems: 0, 
                totalPages: 0, 
                currentPage: 1, 
                pageSize: 20 
              } 
            };
          }
          
          console.log(`COMMUNITY DEBUG: Community threads loaded successfully: ${result.threads.length} threads`);
          return result;
        } catch (error) {
          console.error('COMMUNITY DEBUG: Error loading community threads:', error);
          return { 
            threads: [], 
            pagination: { 
              totalItems: 0, 
              totalPages: 0, 
              currentPage: 1, 
              pageSize: 20 
            } 
          };
        }
      },
      retry: 2,
      staleTime: 30000
    });
  };

  const useAddCommunityResource = () => {
    return useMutation({
      mutationFn: async (resource: { title: string; url: string; description?: string; category: string }) => {
        return apiRequest('/api/collaboration/community/resources', {
          method: 'POST',
          body: resource
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/community'] });
      }
    });
  };
  
  const useCreateCommunityThread = () => {
    return useMutation({
      mutationFn: async (thread: Omit<CommunityThread, 'id' | 'createdAt' | 'updatedAt' | 'replyCount'>) => {
        return apiRequest('/api/collaboration/community/threads', {
          method: 'POST',
          body: thread
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/community'] });
      }
    });
  };

  // Recent data queries
  const useRecentTasks = (limit: number = 5) => {
    // Get the query client for invalidating queries
    const queryClient = useQueryClient();
    
    return useQuery({
      queryKey: ['/api/collaboration/tasks', { recent: true, limit }],
      queryFn: async () => {
        try {
          console.log('TASK DEBUG: Starting recent tasks fetch process...');
          
          // Try to get user data from localStorage first to avoid potential HTML response errors
          let companyId: string | null = null;
          try {
            const userData = localStorage.getItem('user');
            if (userData) {
              const parsedUser = JSON.parse(userData);
              companyId = parsedUser.companyId || null;
              console.log('TASK DEBUG: Found company ID in localStorage for recent tasks:', companyId);
            }
          } catch (e) {
            console.warn('TASK DEBUG: Error parsing user data from localStorage for recent tasks', e);
          }
          
          // If we don't have a company ID from localStorage, try the API
          if (!companyId) {
            try {
              console.log('TASK DEBUG: Getting user information from API for recent tasks...');
              const userResponse = await apiRequest<any>('/api/auth/user');
              
              if (userResponse && userResponse.companyId) {
                companyId = userResponse.companyId;
                console.log('TASK DEBUG: Got company ID from API for recent tasks:', companyId);
              } else {
                console.error('TASK DEBUG: No company ID in user response for recent tasks:', userResponse);
              }
            } catch (error) {
              console.error('TASK DEBUG: Error fetching user data from API for recent tasks:', error);
              // If we've received an error from the user API, force a login state reset
              queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
              throw new Error('Authentication problem: Unable to fetch user information');
            }
          }
          
          // If we still don't have a company ID, we can't proceed
          if (!companyId) {
            console.error('TASK DEBUG: No company ID available for recent tasks query after all attempts');
            throw new Error('User info not available or missing company ID');
          }
          
          console.log('TASK DEBUG: Fetching recent tasks with company ID:', companyId);
          
          // Create a properly formatted request with company ID
          const result = await apiRequest<{ 
            tasks: Task[]; 
            stats: { 
              assigned: number;
              active: number;
              completed: number;
              created: number;
            } 
          }>('/api/collaboration/tasks', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Company-ID': companyId
            },
            params: { 
              recent: true,
              limit 
            }
          });
          
          console.log('TASK DEBUG: Recent tasks loaded successfully');
          return result;
        } catch (error) {
          console.error('TASK DEBUG: Failed to load recent tasks:', error);
          // Return empty results instead of throwing
          return { 
            tasks: [], 
            stats: {
              assigned: 0,
              active: 0,
              completed: 0,
              created: 0
            }
          };
        }
      },
      retry: 2,
      staleTime: 60000
    });
  };

  const useThread = (id?: string) => {
    return useQuery({
      queryKey: ['/api/collaboration/threads', id],
      queryFn: async () => {
        if (!id) return null;
        const result = await apiRequest<Thread>(`/api/collaboration/threads/${id}`);
        return result;
      },
      enabled: !!id
    });
  };
  
  const useThreadMessages = (threadId?: string) => {
    return useQuery({
      queryKey: ['/api/collaboration/threads', threadId, 'messages'],
      queryFn: async () => {
        if (!threadId) return { items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: 0, pageSize: 0 } };
        const result = await apiRequest<{ items: Message[]; pagination: Pagination }>(`/api/collaboration/threads/${threadId}/messages`);
        return result;
      },
      enabled: !!threadId
    });
  };
  
  const useSendMessage = () => {
    return useMutation({
      mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
        return apiRequest(`/api/collaboration/threads/${threadId}/messages`, {
          method: 'POST',
          body: { content }
        });
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/threads', variables.threadId, 'messages'] });
      }
    });
  };
  
  const useRecentThreads = (limit: number = 5) => {
    return useQuery({
      queryKey: ['/api/collaboration/threads', { recent: true, limit }],
      queryFn: async () => {
        const result = await apiRequest<{ 
          threads: Thread[]; 
          stats: { 
            active: number;
            created: number;
          } 
        }>('/api/collaboration/threads', {
          params: { 
            recent: true,
            limit 
          }
        });
        return result;
      }
    });
  };

  const useRecentNotes = (limit: number = 5) => {
    return useQuery({
      queryKey: ['/api/collaboration/notes', { recent: true, limit }],
      queryFn: async () => {
        const result = await apiRequest<{ 
          notes: Note[]; 
          stats: { 
            created: number;
            updated: number;
          } 
        }>('/api/collaboration/notes', {
          params: { 
            recent: true,
            limit 
          }
        });
        return result;
      }
    });
  };

  // Note-related queries
  const useNotes = (options?: NoteQueryOptions) => {
    return useQuery({
      queryKey: ['/api/collaboration/notes', options],
      queryFn: async () => {
        const result = await apiRequest<{ notes: Note[]; pagination: Pagination }>('/api/collaboration/notes', {
          params: options
        });
        return result;
      }
    });
  };

  const useCreateNote = () => {
    return useMutation({
      mutationFn: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
        return apiRequest('/api/collaboration/notes', {
          method: 'POST',
          body: note
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/notes'] });
      }
    });
  };
  
  const useUpdateNote = () => {
    return useMutation({
      mutationFn: async (note: Partial<Note> & { id: string }) => {
        return apiRequest(`/api/collaboration/notes/${note.id}`, {
          method: 'PATCH',
          body: note
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/notes'] });
      }
    });
  };
  
  const useDeleteNote = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        return apiRequest(`/api/collaboration/notes/${id}`, {
          method: 'DELETE'
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/notes'] });
      }
    });
  };
  
  const useToggleNotePin = () => {
    return useMutation({
      mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
        return apiRequest(`/api/collaboration/notes/${id}/pin`, {
          method: 'PATCH',
          body: { isPinned }
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/notes'] });
      }
    });
  };
  
  const useNoteTags = () => {
    return useQuery({
      queryKey: ['/api/collaboration/notes/tags'],
      queryFn: async () => {
        const result = await apiRequest<{ tags: string[]; counts: Record<string, number> }>('/api/collaboration/notes/tags');
        return result;
      }
    });
  };
  
  // Messages-related queries and mutations
  const useMessages = (options?: { filter?: 'all' | 'unread' | 'starred'; search?: string; refresh?: number }) => {
    return useQuery({
      queryKey: ['/api/collaboration/messages', options],
      queryFn: async () => {
        const result = await apiRequest<{ 
          messages: Message[]; 
          pagination: Pagination;
          stats: {
            total: number;
            unread: number;
            starred: number;
          }
        }>('/api/collaboration/messages', {
          params: options
        });
        return result;
      }
    });
  };
  
  const useStarMessage = () => {
    return useMutation({
      mutationFn: async ({ id, isStarred }: { id: string; isStarred: boolean }) => {
        return apiRequest(`/api/collaboration/messages/${id}/star`, {
          method: 'PATCH',
          body: { isStarred }
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/collaboration/messages'] });
      }
    });
  };

  return {
    // Task-related hooks
    useTasks,
    useUpdateTaskStatus,
    useCreateTask,
    useUpdateTask,
    useDeleteTask,
    useRecentTasks,
    
    // Thread-related hooks
    useThreads,
    useThread,
    useThreadMessages,
    useSendMessage,
    useRecentThreads,
    useCreateThread,
    useUpdateThread,
    useDeleteThread,
    useToggleThreadPin,
    
    // Note-related hooks
    useNotes,
    useCreateNote,
    useUpdateNote,
    useDeleteNote,
    useToggleNotePin,
    useNoteTags,
    useRecentNotes,
    
    // Community-related hooks
    useCommunityThreads,
    useAddCommunityResource,
    useCreateCommunityThread,
    
    // Messages-related hooks
    useMessages,
    useStarMessage
  };
}