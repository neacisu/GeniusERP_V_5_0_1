import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { captureException, setUserContext, clearUserContext, addBreadcrumb } from "@/lib/sentry";
import { logger, maskUUID } from "@/lib/utils/security-logger";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // When the application starts, check if there's a "clean_auth" query parameter
  // that indicates we should start fresh with no cached data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldCleanAuth = urlParams.get('clean_auth');
    
    // Clean localStorage auth data if 'clean_auth' parameter is present
    if (shouldCleanAuth === 'true') {
      logger.info('Auth: Cleaning cached auth data due to clean_auth parameter');
      localStorage.removeItem('user');
      
      // Remove the parameter from URL to avoid repeated cleaning
      urlParams.delete('clean_auth');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  
  // This effect checks if the user is coming from the login page or directly loading the page
  // If directly loading, we'll keep the existing token to prevent constant login prompts
  useEffect(() => {
    if (window.performance) {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      // Only clear cached data if coming from an external site, not internal navigation
      const referrer = document.referrer;
      const isSameDomain = referrer && (new URL(referrer).host === window.location.host);
      
      if (navigationEntry && navigationEntry.type === 'navigate' && !isSameDomain) {
        // Only log this warning - don't actually clear the token as it breaks functionality
        logger.debug('Auth: New page load detected from external site - token will be validated');
      }
    }
  }, []);
  
  // First check localStorage for cached user data
  const cachedUserString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let cachedUser: SelectUser | null = null;
  
  // Try to parse cached user data
  if (cachedUserString) {
    try {
      cachedUser = JSON.parse(cachedUserString);
      logger.debug('Auth: Found cached user data in localStorage');
      
      // Verify that the cached data has a token
      if (cachedUser && !('token' in cachedUser)) {
        logger.warn('Auth: Cached user data missing token, clearing invalid data');
        localStorage.removeItem('user');
        cachedUser = null;
      }
    } catch (e) {
      logger.error('Auth: Failed to parse cached user data', { error: e });
      localStorage.removeItem('user'); // Clear invalid data
    }
  }
  
  // Use query to fetch or validate user data
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    initialData: undefined, // Don't use cached data as initial value for security
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      logger.info('Attempting to login');
      
      try {
        const response = await apiRequest<SelectUser & { token?: string }>("/api/auth/login", {
          method: "POST",
          body: credentials
        });
        
        logger.info('Login response received', { success: !!response });
        return response;
      } catch (error) {
        logger.error('Login error', { error });
        
        // Capture login errors in Sentry (fără username pentru securitate)
        captureException(error as Error, {
          module: 'auth',
          operation: 'login',
        });
        
        throw error;
      }
    },
    onSuccess: (user: SelectUser & { token?: string, company_id?: string, first_name?: string, last_name?: string }) => {
      logger.info('Login successful, storing user data');
      
      // Make sure we have all required fields before storing
      if (!user || !user.id || !user.token) {
        logger.error('Missing critical user data in login response');
        toast({
          title: "Eroare",
          description: "Datele utilizatorului sunt incomplete. Contactați administratorul.",
          variant: "destructive",
        });
        return;
      }

      // Verifică dacă există companyId sau company_id
      if (!user.companyId && !user.company_id) {
        logger.error('No companyId in user response - this is required');
        toast({
          title: "Eroare",
          description: "ID-ul companiei lipsește din răspunsul serverului. Contactați administratorul.",
          variant: "destructive",
        });
        return;
      }
      
      // Folosește company_id pentru a seta companyId (dacă lipsește)
      if (!user.companyId && user.company_id) {
        logger.debug('Converting company_id to companyId for consistency');
        user.companyId = user.company_id;
      }
      
      // Convertește first_name și last_name în firstName și lastName
      if (user.first_name && !user.firstName) {
        user.firstName = user.first_name;
      }
      
      if (user.last_name && !user.lastName) {
        user.lastName = user.last_name;
      }
      
      logger.debug('Using company ID', { companyId: maskUUID(user.companyId) });
      
      // Store user data with token in localStorage for JWT auth
      localStorage.setItem('user', JSON.stringify(user));
      
      // Log successful storage
      logger.info('User data stored in localStorage successfully');
      
      // Also explicitly set in query cache
      queryClient.setQueryData(["/api/auth/user"], user);
      
      // Invalidate any stale queries
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/threads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/notes'] });
      
      toast({
        title: "Autentificare reușită",
        description: "Bine ați venit în sistemul GeniusERP!",
      });
    },
    onError: (error: Error) => {
      logger.error('Login error in mutation handler', { error });
      
      // Clear any existing invalid data
      localStorage.removeItem('user');
      
      toast({
        title: "Eroare de autentificare",
        description: error.message || "Nume de utilizator sau parolă incorectă",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      return await apiRequest("/api/auth/register", {
        method: "POST",
        body: credentials
      });
    },
    onSuccess: (user: SelectUser & { token?: string }) => {
      // Store user data with token in localStorage for JWT auth
      if (user.token) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      queryClient.setQueryData(["/api/auth/user"], user);
      
      // Set user context in Sentry
      setUserContext({
        id: user.id,
        email: user.email,
        username: user.username,
      });
      
      addBreadcrumb('User logged in successfully', 'auth', {
        userId: user.id,
        username: user.username,
      });
      toast({
        title: "Înregistrare reușită",
        description: "Contul dumneavoastră a fost creat cu succes!",
      });
    },
    onError: (error: Error) => {
      // Capture registration errors
      captureException(error, {
        module: 'auth',
        operation: 'register',
      });
      
      toast({
        title: "Eroare la înregistrare",
        description: error.message || "Nu am putut crea contul. Vă rugăm încercați din nou.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/auth/logout", {
        method: "POST"
      });
    },
    onSuccess: () => {
      // Remove user data from localStorage on logout
      localStorage.removeItem('user');
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Clear user context in Sentry
      clearUserContext();
      addBreadcrumb('User logged out', 'auth');
      
      toast({
        title: "Delogare reușită",
        description: "Ați fost deconectat din aplicație.",
      });
    },
    onError: (error: Error) => {
      // Capture logout errors
      captureException(error, {
        module: 'auth',
        operation: 'logout',
      });
      
      toast({
        title: "Eroare la delogare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
