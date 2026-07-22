// Quick smoke-test: generate a sample certificate without needing the server running.
import { createCertificateFiles } from './services/certificateService.js';

const result = await createCertificateFiles({ name: 'Aarav Shah', semester: 3 });
console.log('✅  Test certificate created:', result);
