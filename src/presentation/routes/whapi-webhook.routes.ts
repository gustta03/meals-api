import { Elysia } from "elysia";
import { getSharedWhatsAppRepository } from "../../infrastructure/whatsapp/whatsapp.service";
import { logger } from "@shared/logger/logger";
import { WhapiWebhookPayload, WhapiMessage } from "../../infrastructure/whapi/types/whapi.types";
import { WhapiWhatsAppRepository } from "../../infrastructure/whapi/whapi-whatsapp.repository";

export function createWhapiWebhookRoutes() {
  const repository = getSharedWhatsAppRepository();
  const isWhapiRepository = repository instanceof WhapiWhatsAppRepository;

  return new Elysia()
    .post("/webhook/whapi", async ({ body }) => {
      return await handleWebhook(body, isWhapiRepository, repository);
    })
    .post("/*", async ({ body, path }) => {
      logger.debug({ path }, "Webhook received on dynamic route");
      return await handleWebhook(body, isWhapiRepository, repository);
    })
    .patch("/*", async ({ body, path }) => {
      logger.debug({ path }, "Webhook PATCH received on dynamic route");
      return await handleWebhook(body, isWhapiRepository, repository);
    })
    .get("/webhook/whapi", ({ query }) => {
      const mode = query["hub.mode"];
      const token = query["hub.verify_token"];
      const challenge = query["hub.challenge"];

      logger.debug({ mode, token, challenge }, "Whapi webhook verification");

      const verifyToken = process.env.WHAPI_WEBHOOK_VERIFY_TOKEN;

      if (mode === "subscribe" && token === verifyToken) {
        logger.info("Whapi webhook verified successfully");
        return challenge;
      }

      logger.warn({ mode, hasToken: !!token, expectedToken: !!verifyToken }, "Whapi webhook verification failed");
      return new Response("Forbidden", { status: 403 });
    })
    .get("/*", ({ query, path }) => {
      const mode = query["hub.mode"];
      const token = query["hub.verify_token"];
      const challenge = query["hub.challenge"];

      if (mode === "subscribe") {
        logger.debug({ path, mode, token, challenge }, "Whapi webhook verification on dynamic route");
        const verifyToken = process.env.WHAPI_WEBHOOK_VERIFY_TOKEN;

        if (token === verifyToken) {
          logger.info("Whapi webhook verified successfully");
          return challenge;
        }

        logger.warn({ mode, hasToken: !!token, expectedToken: !!verifyToken }, "Whapi webhook verification failed");
        return new Response("Forbidden", { status: 403 });
      }

      return { status: "ok" };
    });
}

async function handleWebhook(body: any, isWhapiRepository: boolean, repository: any): Promise<any> {
  try {
    logger.debug(
      {
        hasBody: !!body,
        bodyKeys: body ? Object.keys(body) : [],
        isWhapiRepository,
      },
      "Processing webhook payload"
    );

    if (!isWhapiRepository) {
      logger.warn("Repository is not WhapiWhatsAppRepository, cannot process incoming messages");
      return { status: "error", error: "Invalid repository type" };
    }

    const whapiRepository = repository as WhapiWhatsAppRepository;

    // Formato 1: Payload com event (formato esperado originalmente)
    if (body.event === "messages") {
      if (body.messages && Array.isArray(body.messages)) {
        for (const message of body.messages) {
          await processWhapiMessage(message, whapiRepository);
        }
      } else if (body.message) {
        await processWhapiMessage(body.message, whapiRepository);
      }
      return { status: "ok" };
    }

    if (body.messages && Array.isArray(body.messages)) {
      logger.info({ messageCount: body.messages.length }, "Processing messages array from webhook");
      for (const message of body.messages) {
        await processWhapiMessage(message, whapiRepository);
      }
      return { status: "ok" };
    }

    if (body.chats_updates && Array.isArray(body.chats_updates)) {
      logger.info({ updateCount: body.chats_updates.length }, "Processing chats_updates from webhook");
      for (const chatUpdate of body.chats_updates) {
        if (chatUpdate.after_update?.last_message) {
          const lastMessage = chatUpdate.after_update.last_message;
          if (!lastMessage.from_me && lastMessage.type === "text") {
            const whapiMessage = mapChatUpdateToWhapiMessage(lastMessage);
            if (whapiMessage) {
              await processWhapiMessage(whapiMessage, whapiRepository);
            }
          }
        }
      }
      return { status: "ok" };
    }

    if (body.message) {
      await processWhapiMessage(body.message, whapiRepository);
      return { status: "ok" };
    }

    logger.debug({ body }, "Webhook payload format not recognized, ignoring");
    return { status: "ok", message: "No messages to process" };
  } catch (error) {
    logger.error({ error, body }, "Error processing Whapi webhook");
    return { status: "error", error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function mapChatUpdateToWhapiMessage(chatMessage: any): WhapiMessage | null {
  try {
    if (!chatMessage || chatMessage.type !== "text") {
      return null;
    }

    const body = chatMessage.text?.body || chatMessage.body || "";
    if (!body) {
      return null;
    }

    const chatId = chatMessage.chat_id || "";
    const from = chatMessage.from || chatId;

    return {
      id: chatMessage.id || `${Date.now()}-${Math.random()}`,
      from: from,
      to: chatId,
      chat_id: chatId,
      timestamp: chatMessage.timestamp || Math.floor(Date.now() / 1000),
      body: body,
      text: { body: body },
      type: "text",
      from_name: chatMessage.from_name,
    };
  } catch (error) {
    logger.error({ error, chatMessage }, "Failed to map chat update to Whapi message");
    return null;
  }
}

async function processWhapiMessage(
  whapiMessage: WhapiMessage,
  repository: WhapiWhatsAppRepository
): Promise<void> {
  try {
    if (whapiMessage.type !== "text" && whapiMessage.type !== "image") {
      logger.debug({ type: whapiMessage.type }, "Message type not supported, skipping");
      return;
    }

    if (whapiMessage.context?.from) {
      logger.debug({ from: whapiMessage.context.from }, "Message is a reply, skipping");
      return;
    }

    await repository.processIncomingMessage(whapiMessage);
  } catch (error) {
    logger.error({ error, whapiMessage }, "Failed to process Whapi message");
  }
}

