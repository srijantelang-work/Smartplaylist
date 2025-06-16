import { supabase } from './supabase';

/**
 * Force logout utility function that can be called from anywhere
 * Provides an alternative mechanism for sign-out that bypasses any UI components
 */
export async function forceLogout() {
  try {
    // Clear any stored auth states
    sessionStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('auth_redirect');
    localStorage.removeItem('auth_state');
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear any browser cache for the auth tokens (for Supabase v2)
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    }).catch(() => {
      // Fail silently - the API endpoint might not exist
    });
    
    // Force a page reload and navigation to home
    window.location.replace('/?signed-out=true');
  } catch (error) {
    console.error('Force logout error:', error);
    // Still try to redirect even if there's an error
    window.location.replace('/?signed-out=true');
  }
}

/**
 * Checks if the user is authenticated by validating the session
 */
export async function isAuthenticated() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
} 