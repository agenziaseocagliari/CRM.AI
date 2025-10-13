#!/usr/bin/env node

/**
 * Simple MCP Server for PostgreSQL operations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Create MCP server
const server = new Server(
  {
    name: 'postgres-mcp-server', 
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
        name: 'execute_query',
        description: 'Execute PostgreSQL query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL query to execute'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'describe_table',
        description: 'Describe table structure',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: 'Name of the table to describe'
            }
          },
          required: ['table_name']
        }
      }
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'execute_query':
        // This would connect to PostgreSQL and execute query
        // For now, returning placeholder
        return {
          content: [
            {
              type: 'text',
              text: `Would execute query: ${args.query}`
            }
          ]
        };

      case 'describe_table':
        // This would describe table structure
        return {
          content: [
            {
              type: 'text',
              text: `Would describe table: ${args.table_name}`
            }
          ]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PostgreSQL MCP server running on stdio');
}

main().catch(console.error);