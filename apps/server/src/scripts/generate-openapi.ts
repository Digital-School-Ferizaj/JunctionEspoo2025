import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const spec = `openapi: 3.0.3
info:
  title: amily API
  version: 1.0.0
  description: Voice-first companion API for daily check-ins, memories, buddy pairing, and automations.
servers:
  - url: http://localhost:4000
paths:
  /api/v1/auth/register:
    post:
      summary: Register user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                passcode:
                  type: string
                name:
                  type: string
      responses:
        '201':
          description: Created
  /api/v1/auth/login:
    post:
      summary: Login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                passcode:
                  type: string
      responses:
        '200':
          description: Token pair
  /api/v1/auth/refresh:
    post:
      summary: Refresh token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                refresh_token:
                  type: string
      responses:
        '200':
          description: Refreshed tokens
  /api/v1/me:
    get:
      security:
        - bearerAuth: []
      summary: Current profile
      responses:
        '200':
          description: Profile
    patch:
      security:
        - bearerAuth: []
      summary: Update profile
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '200':
          description: Updated
  /api/v1/media/upload-audio:
    post:
      security:
        - bearerAuth: []
      summary: Upload audio to Supabase Storage
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                kind:
                  type: string
                  enum: [entries, memories, messages]
      responses:
        '200':
          description: Storage reference
  /api/v1/media/stream/{id}:
    get:
      security:
        - bearerAuth: []
      summary: Signed redirect to Supabase Storage object
      parameters:
        - in: path
          required: true
          name: id
          schema:
            type: string
      responses:
        '302':
          description: Redirect
  /api/v1/ai/stt:
    post:
      security:
        - bearerAuth: []
      summary: Transcribe audio via ElevenLabs
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                audio_url:
                  type: string
      responses:
        '200':
          description: Transcript
  /api/v1/ai/tts:
    post:
      security:
        - bearerAuth: []
      summary: Text-to-speech via ElevenLabs
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                text:
                  type: string
      responses:
        '200':
          description: Audio url
  /api/v1/ai/plan:
    post:
      security:
        - bearerAuth: []
      summary: Generate PlanJSON
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                transcript:
                  type: string
      responses:
        '200':
          description: Plan
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PlanJSON'
  /api/v1/ai/memory:
    post:
      security:
        - bearerAuth: []
      summary: Generate MemoryJSON
      responses:
        '200':
          description: Memory summary
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MemoryJSON'
  /api/v1/ai/summarize-note:
    post:
      security:
        - bearerAuth: []
      summary: Summarize buddy note
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SummaryJSON'
  /api/v1/entries:
    get:
      security:
        - bearerAuth: []
      summary: List entries
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
      responses:
        '200':
          description: Entries
    post:
      security:
        - bearerAuth: []
      summary: Create entry
      responses:
        '201':
          description: Entry w/ plan
  /api/v1/entries/{id}:
    delete:
      security:
        - bearerAuth: []
      summary: Soft delete entry
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Deleted
  /api/v1/memories:
    get:
      security:
        - bearerAuth: []
      summary: List memories
      responses:
        '200':
          description: Memories
    post:
      security:
        - bearerAuth: []
      summary: Create memory
      responses:
        '201':
          description: Memory summary
  /api/v1/memories/{id}/share:
    post:
      security:
        - bearerAuth: []
      summary: Create share snippet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                to_user_id:
                  type: string
      responses:
        '201':
          description: Share created
  /api/v1/memories/{id}:
    delete:
      security:
        - bearerAuth: []
      summary: Soft delete memory
      responses:
        '204':
          description: Deleted
  /api/v1/buddy:
    get:
      security:
        - bearerAuth: []
      summary: Current buddy
      responses:
        '200':
          description: Buddy info
  /api/v1/buddy/opt-in:
    post:
      security:
        - bearerAuth: []
      summary: Opt into buddy matching
      responses:
        '200':
          description: Pairing status
  /api/v1/buddy/leave:
    post:
      security:
        - bearerAuth: []
      summary: Leave buddy program
      responses:
        '204':
          description: Left
  /api/v1/buddy/message:
    post:
      security:
        - bearerAuth: []
      summary: Send buddy audio note
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                audio_url:
                  type: string
      responses:
        '201':
          description: Message stored
  /api/v1/buddy/block:
    post:
      security:
        - bearerAuth: []
      summary: Block buddy
      responses:
        '204':
          description: Blocked
  /api/v1/export/memories.json:
    get:
      security:
        - bearerAuth: []
      summary: Export memories JSON
      responses:
        '200':
          description: File
  /api/v1/export/memories.txt:
    get:
      security:
        - bearerAuth: []
      summary: Export memories TXT
      responses:
        '200':
          description: File
  /api/v1/shares:
    get:
      security:
        - bearerAuth: []
      summary: List share snippets
      responses:
        '200':
          description: Shares
  /api/v1/shares/{id}:
    get:
      security:
        - bearerAuth: []
      summary: Retrieve share snippet
      responses:
        '200':
          description: Share
    delete:
      security:
        - bearerAuth: []
      summary: Revoke share
      responses:
        '204':
          description: Revoked
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    PlanJSON:
      type: object
      properties:
        summary:
          type: string
        next_step:
          type: string
        mood:
          type: string
          enum: [low, ok, good]
        tags:
          type: array
          items:
            type: string
    MemoryJSON:
      type: object
      properties:
        title:
          type: string
        era:
          type: string
        story_3_sentences:
          type: string
        tags:
          type: array
          items:
            type: string
        quote:
          type: string
    SummaryJSON:
      type: object
      properties:
        summary:
          type: string
        tone:
          type: string
          enum: [warm, neutral]
        suggestion:
          type: string
`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const target = path.resolve(__dirname, '../../../docs/openapi.yml');

writeFileSync(target, spec, 'utf-8');
console.log(`OpenAPI spec generated at ${target}`);
