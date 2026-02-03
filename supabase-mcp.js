#!/usr/bin/env node

const {
  Server,
} = require("@modelcontextprotocol/sdk/dist/cjs/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/dist/cjs/server/stdio.js");
const { createClient } = require("@supabase/supabase-js");

// Get credentials from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create MCP server
const server = new Server(
  {
    name: "supabase-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// List available tools
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "query_table",
        description: "Query a Supabase table with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "The name of the table to query",
            },
            select: {
              type: "string",
              description: "Columns to select (default: *)",
              default: "*",
            },
            filters: {
              type: "object",
              description: "Filter conditions (e.g., {column: value})",
            },
            limit: {
              type: "number",
              description: "Maximum number of rows to return",
            },
          },
          required: ["table"],
        },
      },
      {
        name: "insert_data",
        description: "Insert data into a Supabase table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "The name of the table",
            },
            data: {
              type: "object",
              description: "The data to insert",
            },
          },
          required: ["table", "data"],
        },
      },
      {
        name: "update_data",
        description: "Update data in a Supabase table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "The name of the table",
            },
            data: {
              type: "object",
              description: "The data to update",
            },
            filters: {
              type: "object",
              description: "Filter conditions to match rows",
            },
          },
          required: ["table", "data", "filters"],
        },
      },
      {
        name: "delete_data",
        description: "Delete data from a Supabase table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "The name of the table",
            },
            filters: {
              type: "object",
              description: "Filter conditions to match rows to delete",
            },
          },
          required: ["table", "filters"],
        },
      },
      {
        name: "list_tables",
        description: "List all tables in the Supabase database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "query_table": {
        let query = supabase.from(args.table).select(args.select || "*");

        if (args.filters) {
          Object.entries(args.filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (args.limit) {
          query = query.limit(args.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "insert_data": {
        const { data, error } = await supabase
          .from(args.table)
          .insert(args.data)
          .select();

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: `Successfully inserted: ${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case "update_data": {
        let query = supabase.from(args.table).update(args.data);

        Object.entries(args.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { data, error } = await query.select();

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated: ${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case "delete_data": {
        let query = supabase.from(args.table).delete();

        Object.entries(args.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { data, error } = await query.select();

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted: ${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case "list_tables": {
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public");

        if (error) {
          // Fallback: try to get schema info differently
          return {
            content: [
              {
                type: "text",
                text: "Unable to list tables. You may need to query specific tables directly.",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
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
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Supabase MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
