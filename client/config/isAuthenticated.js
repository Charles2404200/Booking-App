// Check if we are in a browser environment
const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

export function getCookie(name) {
  if (!isBrowser) return null; // Return null if not in a browser environment

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export function isAuthenticated() {
  if (!isBrowser) return false; // Return false if not in a browser environment
  
  const token = getCookie('access_token');
  if (!token) {
    return false;
  }

  try {
    // Optionally, you could decode the JWT here and check its validity
    // but ideally, the server should handle token validation.
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode the JWT payload

    // Optional: Check token expiration (if desired)
    const currentTime = Date.now() / 1000; // current time in seconds
    if (payload.exp && payload.exp < currentTime) {
      return false; // Token is expired
    }

    return true; // Token is valid and present
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return false;
  }
}

