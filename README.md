# Nomad Code Challenge — API

API em **NestJS + Prisma** para processar arquivos de log de partidas e consultar estatísticas.

O repositório contém:
- Diagrama do banco de dados e relacionamentos
- `schema.prisma` com as tabelas
- Rotas para ingestão (POST) e consultas (GET)

---

## Rotas e exemplos

### 1) Upload de logs — **POST** `/matches/upload`

Recebe um arquivo `.txt` com várias partidas e:
- cria/atualiza **Match**, **Player**, **MatchPlayerTeam**
- insere **Event** (kills, world kills) e marca **Friendly Fire**
- calcula **MatchPlayerStats** ao encerrar cada partida

**Modo**:  
- `mode=preview` (padrão): só parseia e retorna um resumo (não grava no banco)  
- `mode=ingest`: processa e **grava tudo** no banco

**Exemplos:**

Multipart (arquivo):
```bash
curl -X POST "http://localhost:3000/matches/upload?mode=ingest"   -F "file=@/caminho/para/logs.txt"
```

Body (texto bruto):
```bash
curl -X POST "http://localhost:3000/matches/upload?mode=preview"   -H "Content-Type: application/json"   -d '{"content":"23/04/2019 15:34:22 - New match 11348965 has started
..."}'
```

**Resposta (preview, exemplo):**
```json
{
  "counts": {"START":3,"JOIN":8,"KILL":6,"WORLD":3,"END":3},
  "matches":[{"matchCode":"11348961","started":1,"ended":1,"ok":true}],
  "unknownLines":[],
  "sample":[{"type":"START","ts":"2019-04-23T18:34:22.000Z","matchCode":"11348965"}]
}
```

**Resposta (ingest, exemplo):**
```json
{
  "ok": true,
  "upsertedMatches": 3,
  "upsertedPlayers": 8,
  "upsertedTeams": 8,
  "insertedEvents": 9,
  "closedMatches": 3,
  "note": "Events gravados e partidas fechadas. FF e stats inclusos."
}
```

---

### 2) Ranking da partida — **GET** `/matches/:matchCode/ranking`

Retorna o ranking **ordenado** por: frags desc, deaths asc, playerId asc.

**Exemplo:**
```bash
curl http://localhost:3000/matches/11349000/ranking | jq
```

**Resposta (exemplo):**
```json
[
  { "name":"Alice","frags":6,"deaths":0,"maxStreak":6,"awards":["Untouchable","Rampage-5-in-1m"],"favoriteWeapon":"M16" },
  { "name":"Bob","frags":1,"deaths":2,"maxStreak":2,"awards":[],"favoriteWeapon":"SHOTGUN" }
]
```

---

### 3) Arma favorita do vencedor — **GET** `/matches/:matchCode/favorite-weapon`

Aplica os critérios de vencedor (frags desc, deaths asc, playerId asc) e retorna sua arma favorita.

**Exemplo:**
```bash
curl http://localhost:3000/matches/11349000/favorite-weapon | jq
```

**Resposta (exemplo):**
```json
{ "winner":"Alice","favoriteWeapon":"M16" }
```

---

### 4) Maior streak da partida — **GET** `/matches/:matchCode/top-streak`

Retorna o jogador com a **maior sequência de frags válidos** sem morrer (critério de desempate: frags desc).

**Exemplo:**
```bash
curl http://localhost:3000/matches/11349000/top-streak | jq
```

**Resposta (exemplo):**
```json
{ "name":"Alice","maxStreak":6 }
```

---

### 5) Times da partida — **GET** `/matches/:matchCode/teams`

Lista jogadores e seus times (RED/BLUE) para a partida.

**Exemplo:**
```bash
curl http://localhost:3000/matches/11349000/teams | jq
```

**Resposta (exemplo):**
```json
[
  { "team":"RED", "name":"Alice" },
  { "team":"RED", "name":"Bob" },
  { "team":"BLUE", "name":"Eve" }
]
```

---

### 6) Ranking global (todas as partidas) — **GET** `/players/ranking`

Soma os stats de todas as partidas por jogador e ordena por:
- total_frags desc
- total_deaths asc
- name asc (desempate)

**Exemplo:**
```bash
curl http://localhost:3000/players/ranking | jq
```

**Resposta (exemplo):**
```json
[
  { "name": "Alice", "total_frags": 12, "total_deaths": 1 },
  { "name": "Roman", "total_frags": 7, "total_deaths": 3 }
]
```

---

## Notas sobre regras
- **Frag válido**: kill de player **não**-FF.  
- **Friendly Fire (FF)**: marca `isFriendly=true`, penaliza **-1 frag** do atirador, **não** conta como frag na streak/arma favorita.  
- **WORLD**: só conta morte do victim.  
- **Untouchable**: jogadores do **time vencedor** com `deaths=0`.  
- **Rampage-5-in-1m**: 5 frags válidos em 60s.

---

## Exemplo de log (trecho)
```
25/04/2021 14:00:00 - New match 11349000 has started
25/04/2021 14:00:05 - Alice join in team red
...
25/04/2021 14:10:01 - Alice killed Eve using M16
25/04/2021 14:10:13 - Alice killed Frank using M16
25/04/2021 14:10:25 - Alice killed Grace using M16
25/04/2021 14:10:37 - Alice killed Henry using M16
25/04/2021 14:10:49 - Alice killed Eve using M16
25/04/2021 14:20:00 - Match 11349000 has ended
```
