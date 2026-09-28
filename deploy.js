// Upload the built app to bristoljon.uk over FTP.
// Credentials come from FTP_USER / FTP_PASS, or creds.cjs (git-ignored):
//   module.exports = { user: '...', pass: '...' }
// (the old gulp creds.js works as-is once renamed to creds.cjs)
import { createRequire } from 'module';
import { Client } from 'basic-ftp';

const creds = process.env.FTP_USER
  ? { user: process.env.FTP_USER, pass: process.env.FTP_PASS }
  : createRequire(import.meta.url)('./creds.cjs');

const REMOTE = 'bristoljon.uk/public_html/projects/sudoku';
const FILES = [
  'index.html', 'main.js', 'sw.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
];

const client = new Client();
client.ftp.verbose = false;
try {
  await client.access({ host: 'ftp.bristoljon.uk', user: creds.user, password: creds.pass, secure: false });
  await client.ensureDir(REMOTE);
  await client.ensureDir(REMOTE + '/icons');
  for (const f of FILES) {
    await client.uploadFrom(f, `/${REMOTE}/${f}`);
    console.log('uploaded', f);
  }
} finally {
  client.close();
}
