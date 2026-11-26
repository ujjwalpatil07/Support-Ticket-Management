import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ROLES } from './constants.js';

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [key, inlineVal] = arg.slice(2).split('=');
      if (inlineVal !== undefined) {
        parsed[key] = inlineVal;
      } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        parsed[key] = argv[i + 1];
        i += 1;
      }
    }
  }
  return parsed;
}

async function runSeed() {
  const args = parseArgs(process.argv.slice(2));
  const name = (args.name || env.adminSeedName || 'System Administrator').trim();
  const email = (args.email || env.adminSeedEmail || '').trim().toLowerCase();
  const password = args.password || env.adminSeedPassword || '';

  if (!env.mongodbUri) {
    console.error('Error: MONGODB_URI is required to run the admin seed script.');
    process.exit(1);
  }

  if (!email || !password) {
    console.error(
      'Error: Provide admin email and password via ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD or --email / --password.'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Admin password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDatabase(env.mongodbUri);

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === ROLES.ADMIN) {
        console.log(`Admin account already exists for ${existing.email}. No changes made.`);
      } else {
        console.error(
          `Error: Account ${existing.email} already exists with role '${existing.role}'. Refusing to overwrite.`
        );
        process.exitCode = 1;
      }
      return;
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: ROLES.ADMIN,
      isActive: true,
    });

    console.log(`Admin account created successfully: ${admin.email} (id: ${admin._id})`);
  } catch (err) {
    console.error('Failed to seed admin account:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

runSeed();
