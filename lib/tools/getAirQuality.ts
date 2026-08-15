import { tool } from "ai";
import { z } from "zod";
import { createMcpClient } from "@/lib/mcp";

export const getAirQuality = tool({
  description: "Get the current air quality information for a city.",

  inputSchema: z.object({
    city: z.string().describe("The name of the city"),
  }),

  execute: async ({ city }) => {
    const client = await createMcpClient();

    try {
      const result = await client.callTool({
        name: "get_air_quality",
        arguments: {
          city,
        },
      });

      return result;
    } finally {
      await client.close();
    }
  },
});