import { type Button } from "discord-interactions";

export interface RawButton {
  type: number;
  components: Button[];
}
