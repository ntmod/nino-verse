import { getAuth } from '@/lib/account-auth';
export async function POST(request: Request) {
  return (await getAuth()).api.signOut({ headers: request.headers, asResponse: true });
}
