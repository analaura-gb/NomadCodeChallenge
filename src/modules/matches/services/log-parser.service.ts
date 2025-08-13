import { Injectable } from '@nestjs/common';

export type ParsedEvent =
  | { type: 'START'; ts: Date; matchCode: string }
  | { type: 'JOIN'; ts: Date; player: string; team: 'RED'|'BLUE' }
  | { type: 'KILL'; ts: Date; killer: string; victim: string; weapon: string }
  | { type: 'WORLD'; ts: Date; victim: string; cause: string }
  | { type: 'END'; ts: Date; matchCode: string };

@Injectable()
export class LogParserService {
  private startRx = /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}) - New match (\d+) has started$/;
  private endRx   = /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}) - Match (\d+) has ended$/;
  private joinRx  = /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}) - (.+) join in team (RED|BLUE)$/i;
  private killRx  = /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}) - (.+) killed (.+) using (.+)$/;
  private worldRx = /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}) - <WORLD> killed (.+) by (.+)$/;

  parse(content: string): { events: ParsedEvent[]; unknownLines: string[] } {
    const events: ParsedEvent[] = [];
    const unknown: string[] = [];

    for (const raw of content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
      let m;
      if ((m = this.startRx.exec(raw))) { events.push({ type: 'START', ts: this.toDate(m[1]), matchCode: m[2] }); continue; }
      if ((m = this.endRx.exec(raw)))   { events.push({ type: 'END',   ts: this.toDate(m[1]), matchCode: m[2] }); continue; }
      if ((m = this.joinRx.exec(raw)))  { events.push({ type: 'JOIN',  ts: this.toDate(m[1]), player: m[2], team: m[3].toUpperCase() as any }); continue; }
      if ((m = this.killRx.exec(raw)))  { events.push({ type: 'KILL',  ts: this.toDate(m[1]), killer: m[2], victim: m[3], weapon: m[4] }); continue; }
      if ((m = this.worldRx.exec(raw))) { events.push({ type: 'WORLD', ts: this.toDate(m[1]), victim: m[2], cause: m[3] }); continue; }
      unknown.push(raw);
    }
    return { events, unknownLines: unknown };
  }

  private toDate(s: string) {
    const [d, t] = s.split(' ');
    const [dd, mm, yyyy] = d.split('/').map(Number);
    const [HH, MM, SS] = t.split(':').map(Number);
    return new Date(yyyy, mm - 1, dd, HH, MM, SS);
  }
}
