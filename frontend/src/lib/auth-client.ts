import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Client Instance
 * Configured to connect with the CloudPulse Control Plane
 * Provides: signIn, signUp, signOut, useSession, getSession
 */
export const authClient = createAuthClient({
  baseURL: window.location.origin,
});

export const { signIn, signUp, signOut, useSession } = authClient;
