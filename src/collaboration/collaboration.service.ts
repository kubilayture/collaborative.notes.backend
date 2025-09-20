import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server as HocusPocusServer } from '@hocuspocus/server';
import * as Y from 'yjs';
import { NotesService } from '../notes/notes.service';

@Injectable()
export class CollaborationService implements OnModuleInit {
  private readonly logger = new Logger(CollaborationService.name);
  private hocusPocusServer: HocusPocusServer;

  constructor(private readonly notesService: NotesService) {
    this.logger.log('CollaborationService constructor called');
  }

  async onModuleInit() {
    this.logger.log('CollaborationService onModuleInit called');
    try {
      await this.initializeServer();
      this.logger.log('HocusPocus collaboration server started successfully');
    } catch (error) {
      this.logger.error('Failed to initialize collaboration server:', error);
      // Don't throw the error to prevent the app from crashing
      // throw error;
    }
  }

  private async initializeServer() {
    this.hocusPocusServer = new HocusPocusServer({
      port: 8080,

      // eslint-disable-next-line @typescript-eslint/require-await
      async onAuthenticate(data) {
        const { token } = data;

        if (!token) {
          throw new Error('Authentication required');
        }

        return {
          user: { id: token }, // Use token as user ID for now
        };
      },

      onLoadDocument: async (data) => {
        const noteId = data.documentName;

        try {
          this.logger.log(`📂 Loading document: ${noteId}`);

          // Load the note from the database - bypass user access check for collaboration loading
          const noteRepository = this.notesService['noteRepository'];
          const note = await noteRepository.findOne({ where: { id: noteId } });

          this.logger.log(
            `🔍 Note found: ${!!note}, has content: ${!!note?.content}`,
          );
          if (note?.content) {
            this.logger.log(
              `📄 Raw content type: ${typeof note.content}, value: ${JSON.stringify(note.content).substring(0, 200)}...`,
            );
          }

          if (note && note.content) {
            // Convert the note content to Y.js format
            const ydoc = new Y.Doc();
            const ytext = ydoc.getText('content');

            // Insert the note content into the Y.js document
            let contentText = '';
            if (typeof note.content === 'string') {
              contentText = note.content;
              this.logger.log(
                `📝 Using string content: ${contentText.substring(0, 100)}...`,
              );
            } else if (note.content && typeof note.content === 'object') {
              if (note.content.data && typeof note.content.data === 'string') {
                // This is the format from the frontend: {data: "<p>content</p>", type: "text"}
                contentText = note.content.data;
                this.logger.log(
                  `📝 Using object.data content: ${contentText.substring(0, 100)}...`,
                );
              } else if (note.content.text) {
                contentText = note.content.text;
                this.logger.log(
                  `📝 Using object.text content: ${contentText.substring(0, 100)}...`,
                );
              } else if (note.content.type === 'doc' && note.content.content) {
                // Handle TipTap/ProseMirror JSON format
                contentText = this.convertTipTapToText(note.content);
                this.logger.log(
                  `📝 Using converted TipTap content: ${contentText.substring(0, 100)}...`,
                );
              } else {
                // Fallback: stringify the object
                contentText = JSON.stringify(note.content);
                this.logger.log(
                  `📝 Using stringified content: ${contentText.substring(0, 100)}...`,
                );
              }
            }

            if (contentText) {
              ytext.insert(0, contentText);
              this.logger.log(
                `✅ Loaded document ${noteId} with content length: ${contentText.length}`,
              );
              return Y.encodeStateAsUpdate(ydoc);
            }
          }

          this.logger.log(
            `❌ Document ${noteId} not found or empty, starting with empty document`,
          );
          return null; // Return null to start with empty document
        } catch (error) {
          this.logger.warn(
            `⚠️ Failed to load document ${noteId}:`,
            error.message,
          );
          return null;
        }
      },

      onStoreDocument: async (data) => {
        const noteId = data.documentName;

        try {
          // Convert Y.Doc back to content
          const ydoc = new Y.Doc();
          Y.applyUpdate(ydoc, data.document as unknown as Uint8Array);
          const ytext = ydoc.getText('content');
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          const textContent = ytext.toString();

          this.logger.log(
            `📝 Document ${noteId} content updated: ${textContent.substring(0, 100)}...`,
          );

          // Save to database - persist collaborative changes
          // Store as HTML content (TipTap format) not plain text
          await this.notesService.updateContent(noteId, textContent);
          this.logger.log(`💾 Saved document ${noteId} to database`);
        } catch (error) {
          this.logger.error(
            `❌ Failed to process document ${noteId}:`,
            error.message,
          );
        }
      },

      // eslint-disable-next-line @typescript-eslint/require-await
      onConnect: async (data) => {
        this.logger.log(
          `🔌 Client connected to document: ${data.documentName}, socketId: ${data.socketId}`,
        );
      },

      // eslint-disable-next-line @typescript-eslint/require-await
      onDisconnect: async (data) => {
        this.logger.log(
          `🔌 Client disconnected from document: ${data.documentName}, socketId: ${data.socketId}`,
        );
      },
    });

    await this.startServer();
  }

  private async startServer() {
    try {
      await this.hocusPocusServer.listen();
      this.logger.log(
        '🚀 HocusPocus collaboration server started on port 8080',
      );
    } catch (error) {
      this.logger.error('Failed to start HocusPocus server:', error);
      throw error;
    }
  }

  private convertTipTapToText(content: any): string {
    // Convert TipTap/ProseMirror JSON to plain text
    let text = '';

    const extractText = (node: any): string => {
      if (node.type === 'text') {
        return node.text || '';
      }

      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join('');
      }

      return '';
    };

    if (content.content && Array.isArray(content.content)) {
      text = content.content.map(extractText).join('\n');
    }

    return text;
  }

  getServer() {
    return this.hocusPocusServer;
  }
}
