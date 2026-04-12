/**
 * Root route. The middleware handles the smart redirect (authenticated →
 * /dashboard, unauthenticated → /login) before this component renders, so
 * this is just a safety net for any request that somehow bypasses middleware.
 */
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
}
