import { InteractionDataOption } from "../objects/types/InteractionDataOption";
import { Lang } from "./Lang";

export interface Interaction {
  data: {
    custom_id: string;
    name?: string;
    options?: InteractionDataOption[];
  };
  options?: InteractionDataOption[];
  user: { id: string };
  member: { user: { id: string } };
  locale: Lang;
  guild_locale: Lang;
  guild: { features?: string[] };
  type: number;
}
