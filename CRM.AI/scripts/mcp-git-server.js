#!/usr/bin/env node

/**
 * Simple MCP Server for Git operations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';

// Create MCP server
const server = new Server(
  {
    name: 'git-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'git_status',
        description: 'Get git status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'git_log',
        description: 'Get git log',
        inputSchema: {
          type: 'object',
          properties: {
            lines: {
              type: 'number',
              description: 'Number of log entries to show',
              default: 10,
            },
          },
        },
      },
      {
        name: 'git_commit',
        description: 'Create git commit',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Commit message',
            },
          },
          required: ['message'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'git_status': {
        const status = execSync('git status --porcelain', {
          encoding: 'utf-8',
          cwd: '/workspaces/CRM.AI',
        });
        return {
          content: [
            {
              type: 'text',
              text: status || 'Working directory clean',
            },
          ],
        };
      }

      case 'git_log': {
        const lines = args.lines || 10;
        const log = execSync(`git log --oneline -${lines}`, {
          encoding: 'utf-8',
          cwd: '/workspaces/CRM.AI',
        });
        return {
          content: [
            {
              type: 'text',
              text: log,
            },
          ],
        };
      }

      case 'git_commit': {
        execSync('git add .', { cwd: '/workspaces/CRM.AI' });
        const commitResult = execSync(`git commit -m "${args.message}"`, {
          encoding: 'utf-8',
          cwd: '/workspaces/CRM.AI',
        });
        return {
          content: [
            {
              type: 'text',
              text: commitResult,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Git MCP server running on stdio');
}

main().catch(console.error);
