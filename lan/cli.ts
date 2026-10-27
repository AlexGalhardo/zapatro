import { LAN_PORT } from '../src/net/protocol';
import { lanAddresses, startLanServer } from './server';

const port = Number(process.env.PORT ?? LAN_PORT);
await startLanServer(port);
console.log(`Zapatro LAN table on port ${port}. Players join at:`);
for (const ip of lanAddresses()) console.log(`  ${ip}:${port}`);
