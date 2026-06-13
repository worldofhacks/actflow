export function getErrorMessage(error: string): string {
  switch (error) {
    case 'Configuration':
      return 'There is a problem with the server configuration.';
    case 'AccessDenied':
      return 'Access denied. You do not have permission to perform this action.';
    case 'Verification':
      return 'The verification failed. Please try again.';
    case 'CredentialsError':
      return 'Invalid credentials. Please check your email and password.';
    case 'UserNotFound':
      return 'User not found with this email.';
    case 'AuthenticationError':
      return 'Authentication failed. Please try again.';
    case 'NotLoggedIn':
      return 'You are not logged in. Please log in to continue.';
    case 'NoAccessToken':
      return 'You are not logged in. Please log in to continue.';
    case 'SessionExpired':
    case 'TokenValidationError':
      return 'Your session has expired. Please log in again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
