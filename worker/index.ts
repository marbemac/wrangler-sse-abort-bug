import { actor, setup } from "@rivetkit/actor";
import { createServer } from "@rivetkit/cloudflare-workers";
import type { Join } from "type-fest";

type OrgId = string;
type UserId = string;

export type AgentNameParts = [OrgId, UserId];
export type AgentName = Join<AgentNameParts, ":">;

export const makeUserActor = async (nameParts: AgentNameParts) => {
  return client.user.getOrCreate(nameParts);
};

export const user = actor({
  state: { count: 0 },

  createVars: (c) => {
    console.log("createVars", c.key);
    const orgId = c.key[0];
    const userId = c.key[1];

    return {
      orgId,
      userId,
    } as const;
  },

  actions: {
    getCount: (c) => c.state.count,
    increment: (c, amount: number = 1) => {
      console.log("actorName", c.name, c.vars);
      c.state.count += amount;
      c.broadcast("countChanged", c.state.count);
      return c.state.count;
    },
  },
});

const registry = setup({
  use: { user },
});

const { client, createHandler } = createServer(registry, {
  studio: {
    defaultEndpoint: "http://localhost:5173",
    token: () => "password",
    // cors: {
    //   origin: "https://studio.rivet.gg",
    // },
  },
});

const { handler, ActorHandler } = createHandler();

export { ActorHandler };

export default {
  ...handler,
  fetch: async (request: Request, env, ctx) => {
    const url = new URL(request.url);

    if (url.pathname === "/debug/actor") {
      const user = await makeUserActor(["org_1", "ag_1"]);

      await user.increment(1);
      const newCount = await user.getCount();
      return new Response(`new count ${newCount}`);
    }

    return handler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler;
