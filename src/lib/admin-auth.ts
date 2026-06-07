const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'billmensor_admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'billmensor2026';

export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function isAdminRequest(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  return verifyAdminCredentials(username, password);
}
