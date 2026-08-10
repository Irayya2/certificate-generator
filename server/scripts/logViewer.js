import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '..', 'logs');

const args = process.argv.slice(2);
const isErrorOnly = args.includes('--errors') || args.includes('-e');
const isClear = args.includes('--clear') || args.includes('-c');
const tailArgIdx = args.findIndex((a) => a === '--tail' || a === '-t');
const tailCount = tailArgIdx !== -1 && args[tailArgIdx + 1] ? parseInt(args[tailArgIdx + 1], 10) : 50;

const searchArgIdx = args.findIndex((a) => a === '--search' || a === '-s');
const searchQuery = searchArgIdx !== -1 && args[searchArgIdx + 1] ? args[searchArgIdx + 1].toLowerCase() : null;

const targetFile = isErrorOnly
  ? path.join(logsDir, 'error.log')
  : path.join(logsDir, 'app.log');

if (isClear) {
  ['app.log', 'error.log'].forEach((file) => {
    const filePath = path.join(logsDir, file);
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '');
      console.log(`[logViewer] Cleared ${file}`);
    }
  });
  process.exit(0);
}

if (!fs.existsSync(targetFile)) {
  console.log(`[logViewer] No log file found at: ${targetFile}`);
  process.exit(0);
}

try {
  const content = fs.readFileSync(targetFile, 'utf8').trim();
  if (!content) {
    console.log(`[logViewer] Log file is currently empty: ${targetFile}`);
    process.exit(0);
  }

  const rawLines = content.split('\n').filter(Boolean);
  let parsedLogs = rawLines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { message: line, raw: true };
    }
  });

  if (searchQuery) {
    parsedLogs = parsedLogs.filter((log) =>
      JSON.stringify(log).toLowerCase().includes(searchQuery)
    );
  }

  const slicedLogs = parsedLogs.slice(-tailCount);

  console.log(`\n================ LOG VIEWER (${isErrorOnly ? 'ERROR LOGS' : 'ALL LOGS'}) ================`);
  console.log(`File: ${targetFile}`);
  console.log(`Showing ${slicedLogs.length} of ${parsedLogs.length} entries\n`);

  slicedLogs.forEach((log) => {
    if (log.raw) {
      console.log(log.message);
      return;
    }

    const time = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
    const level = (log.level || 'INFO').toUpperCase();
    const reqId = log.requestId ? ` [ReqID: ${log.requestId}]` : '';
    const msg = log.message || '';
    const stack = log.stack ? `\n   Stack: ${log.stack.split('\n')[1] || log.stack}` : '';

    let colorPrefix = '\x1b[36m'; // Cyan for info
    if (level === 'ERROR') colorPrefix = '\x1b[31m'; // Red
    if (level === 'WARN') colorPrefix = '\x1b[33m'; // Yellow
    if (level === 'HTTP') colorPrefix = '\x1b[35m'; // Magenta

    console.log(`${colorPrefix}[${time}] [${level}]${reqId}\x1b[0m ${msg}${stack}`);
  });

  console.log(`========================================================================\n`);
} catch (err) {
  console.error('[logViewer] Error reading logs:', err.message);
}
