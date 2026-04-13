import { type Context, type Hono } from "hono";
import { getPriceFromRarity } from "../interactionReplies/commands/shop";
import { type ShopItem } from "../objects/types/ShopItem";
import { getItems as getAccessoryItems } from "../services/accessoryService";
import { getItems as getConsumableItems } from "../services/consumableService";
import { getInventoryItems } from "../services/inventoryService";
import { getAchievementsOverview, getAllQuestStatuses, getCharacterProgresses, getPlayerProfile, getPlayerRunSummary } from "../services/progressionService";
import { imageCacheHeaders } from "../utils/cacheHeaders";

function getApiLang(c: Context) {
  return c.req.query("lang") === "fr";
}

function requireUserId(c: Context, fr: boolean): string | null {
  const userId = (c.req.param("userId") || "").trim();
  if (!userId) {
    c.text(fr ? "Utilisateur invalide." : "Invalid user.", 400);
    return null;
  }
  return userId;
}

function getAllShopItems(): ShopItem[] {
  const accessoryItems: ShopItem[] = getAccessoryItems().map((item) => ({
    itemKey: item.id,
    itemType: "accessory",
    nameFr: item.nameFr,
    nameEn: item.nameEn,
    price: getPriceFromRarity(item.rarity, "accessory"),
    imagePath: `/assets/accessories/${item.fileName}`,
  }));
  const consumableItems: ShopItem[] = getConsumableItems().map((item) => ({
    itemKey: item.id,
    itemType: "consumable",
    nameFr: item.nameFr,
    nameEn: item.nameEn,
    price: getPriceFromRarity(item.rarity, "consumable"),
    imagePath: `/assets/consumables/${item.fileName}`,
  }));

  return [...accessoryItems, ...consumableItems];
}

export function registerApiRenderRoutes(app: Hono): void {
  app.get("/inventory/:userId", async (c: Context) => {
    const fr = getApiLang(c);
    const userId = requireUserId(c, fr);
    if (!userId) {
      return;
    }

    const renderSvg = c.req.query("renderSvg") === "true";
    if (renderSvg) {
      const items = await getInventoryItems(userId);
      const { buildSvg } = await import("../utils/renderInventoryImage.js");
      const image = await buildSvg(userId, items, fr);
      return c.text(image, 200, {
        ...imageCacheHeaders("image/svg+xml"),
      });
    }

    const items = await getInventoryItems(userId);
    const { renderInventoryImage } = await import("../utils/renderInventoryImage.js");
    const image = await renderInventoryImage(userId, items, fr);
    const responseBody = image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength);

    return new Response(responseBody as ArrayBuffer, {
      headers: imageCacheHeaders("image/webp"),
    });
  });

  app.get("/affinity/:userId", async (c: Context) => {
    const fr = getApiLang(c);
    const userId = requireUserId(c, fr);
    if (!userId) {
      return;
    }

    const progresses = await getCharacterProgresses(userId);
    if (!progresses) {
      return c.text(fr ? "Affinite indisponible pour le moment." : "Affinity is unavailable right now.", 404);
    }

    const renderSvg = c.req.query("renderSvg") === "true";
    if (renderSvg) {
      const { buildAffinitySvg } = await import("../utils/renderAffinityImage.js");
      const image = await buildAffinitySvg(userId, progresses, fr);
      return c.text(image, 200, {
        ...imageCacheHeaders("image/svg+xml"),
      });
    }

    const { renderAffinityImage } = await import("../utils/renderAffinityImage.js");
    const image = await renderAffinityImage(userId, progresses, fr);
    const responseBody = image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength);

    return new Response(responseBody as ArrayBuffer, {
      headers: imageCacheHeaders("image/png"),
    });
  });

  app.get("/quest/:userId", async (c: Context) => {
    const fr = getApiLang(c);
    const userId = requireUserId(c, fr);
    if (!userId) {
      return;
    }

    const statuses = await getAllQuestStatuses(userId);
    const renderSvg = c.req.query("renderSvg") === "true";

    if (renderSvg) {
      const { buildQuestSvg } = await import("../utils/renderQuestImage.js");
      const image = await buildQuestSvg(userId, statuses, fr);
      return c.text(image, 200, {
        ...imageCacheHeaders("image/svg+xml"),
      });
    }

    const { renderQuestImage } = await import("../utils/renderQuestImage.js");
    const image = await renderQuestImage(userId, statuses, fr);
    const responseBody = image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength);

    return new Response(responseBody as ArrayBuffer, {
      headers: imageCacheHeaders("image/webp"),
    });
  });

  app.get("/shop/:page", async (c: Context) => {
    const fr = getApiLang(c);
    const page = Math.max(1, Number(c.req.param("page")) || 1);
    const pageSize = 16;

    const allItems = getAllShopItems();
    const pageCount = Math.max(1, Math.ceil(allItems.length / pageSize));
    const pageIndex = Math.min(pageCount - 1, page - 1);
    const itemsOnPage = allItems.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

    const { renderShopImage } = await import("../utils/renderShopImage.js");
    const image = await renderShopImage(itemsOnPage, page, pageCount, fr);
    const responseBody = image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength);

    return new Response(responseBody as ArrayBuffer, {
      headers: imageCacheHeaders("image/webp"),
    });
  });

  app.get("/profile/:userId", async (c: Context) => {
    const fr = getApiLang(c);
    const userId = requireUserId(c, fr);
    if (!userId) {
      return;
    }

    const profile = await getPlayerProfile(userId);
    if (!profile) {
      return c.text(fr ? "Profil indisponible pour le moment." : "Profile is unavailable right now.", 404);
    }

    const [progresses, runSummary, achievements] = await Promise.all([getCharacterProgresses(userId), getPlayerRunSummary(userId), getAchievementsOverview(userId, fr)]);

    if (!progresses || !runSummary || !achievements) {
      return c.text(fr ? "Données de profil incomplètes." : "Incomplete profile data.", 404);
    }

    const renderSvg = c.req.query("renderSvg") === "true";

    if (renderSvg) {
      const { buildProfileSvg } = await import("../utils/renderProfileImage.js");
      const image = await buildProfileSvg(userId, profile, progresses, runSummary, achievements.filter((item) => item.unlocked).length, achievements.length, fr);
      return c.text(image, 200, {
        ...imageCacheHeaders("image/svg+xml"),
      });
    }

    const { renderProfileImage } = await import("../utils/renderProfileImage.js");
    const image = await renderProfileImage(userId, profile, progresses, runSummary, achievements.filter((item) => item.unlocked).length, achievements.length, fr);
    const responseBody = image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength);

    return new Response(responseBody as ArrayBuffer, {
      headers: imageCacheHeaders("image/png"),
    });
  });

  app.get("/achievements/:userId", async (c: Context) => {
    const fr = getApiLang(c);
    const userId = requireUserId(c, fr);
    if (!userId) {
      return;
    }

    const achievements = await getAchievementsOverview(userId, fr);
    if (!achievements) {
      return c.text(fr ? "Achievements indisponibles pour le moment." : "Achievements are unavailable right now.", 404);
    }

    const pageSize = 5;
    const page = Math.max(1, Number(c.req.query("page")) || 1);
    const pageCount = Math.max(1, Math.ceil(achievements.length / pageSize));
    const safePage = Math.min(pageCount, page);
    const start = (safePage - 1) * pageSize;
    const pageItems = achievements.slice(start, start + pageSize);

    const renderSvg = c.req.query("renderSvg") === "true";
    if (renderSvg) {
      const { buildAchievementsSvg } = await import("../utils/renderAchievementsImage.js");
      const image = await buildAchievementsSvg(userId, pageItems, fr);
      return c.text(image, 200, {
        ...imageCacheHeaders("image/svg+xml"),
      });
    }

    const { renderAchievementsImage } = await import("../utils/renderAchievementsImage.js");
    const image = await renderAchievementsImage(userId, pageItems, fr);
    const responseBody = image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength);

    return new Response(responseBody as ArrayBuffer, {
      headers: imageCacheHeaders("image/webp"),
    });
  });
}
