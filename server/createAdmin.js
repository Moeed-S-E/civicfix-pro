import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import { hashAdminPassword } from './security/adminPassword.js';

function promptHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Admin creation requires an interactive terminal so the password is not echoed.');
  }

  return new Promise((resolve, reject) => {
    let value = '';
    const wasRaw = stdin.isRaw;
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();

    function finish(error) {
      stdin.removeListener('data', onData);
      stdin.setRawMode(wasRaw);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    }

    function onData(input) {
      for (const character of input.toString('utf8')) {
        if (character === '\u0003') {
          finish(new Error('Admin creation cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
        } else if (character >= ' ') {
          value += character;
        }
      }
    }

    stdin.on('data', onData);
  });
}

async function createAdmin() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in server/.env.');
  }

  const prompt = readline.createInterface({ input: stdin, output: stdout });
  let username;
  try {
    username = (await prompt.question('Admin username (3-32 letters, numbers, ".", "_" or "-"): '))
      .trim()
      .toLowerCase();
  } finally {
    prompt.close();
  }

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error('Username must be 3-32 characters and contain only letters, numbers, ".", "_" or "-".');
  }

  const password = await promptHidden('Admin password (minimum 12 characters): ');
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters.');
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Password must not exceed 72 bytes.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const passwordHash = await hashAdminPassword(password);
    await Admin.create({ username, passwordHash, passwordPeppered: true });
    console.log(`Created admin account "${username}".`);
  } catch (error) {
    if (error?.code === 11000) {
      throw new Error(`An admin account named "${username}" already exists.`);
    }
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin().catch((error) => {
  console.error('Failed to create admin account:', error.message);
  process.exitCode = 1;
});
