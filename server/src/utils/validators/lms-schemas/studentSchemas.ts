import { z } from "zod";
import { ClassSectionEnum } from "../../../shared/enums";

export const enrollBodySchema = z.object({
  section: z.enum(Object.values(ClassSectionEnum) as [string, ...string[]]),
});
