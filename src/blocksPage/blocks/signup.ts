// Signup block: shadcn's `signup-01` — a centered card with name, email, and
// password fields plus a create-account button and an outline social button.
//
// Like the Login block, every field reuses the page-built Label + Input
// instances and every button reuses the page-built Button instances.

import {
  createBody,
  createBlockCanvas,
  createColumn,
  createSurface,
} from "../layout";
import type { BlocksInputs } from "../types";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../types";
import { countDescendants, fillWidth } from "../utils";
import { buildField, buildOutlineButton, buildPrimaryButton } from "../field";

const CARD_WIDTH = 360;
const FIELD_WIDTH = CARD_WIDTH - 48;

export async function addSignupBlock(
  page: PageNode,
  inputs: BlocksInputs,
): Promise<number> {
  const canvas = createBlockCanvas(
    inputs,
    "Signup",
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
  );
  canvas.primaryAxisAlignItems = "CENTER";
  canvas.counterAxisAlignItems = "CENTER";

  const card = createSurface(inputs, CARD_WIDTH, { gap: 24 });

  // Header.
  const header = createColumn("Header", 6);
  header.appendChild(
    createBody(inputs, "Create an account", 24, "card-foreground", "Medium"),
  );
  header.appendChild(
    createBody(
      inputs,
      "Enter your details below to create your account",
      14,
      "muted-foreground",
    ),
  );
  card.appendChild(header);
  fillWidth(header);

  // Fields.
  const fields = createColumn("Fields", 16);
  fields.appendChild(buildField(inputs, FIELD_WIDTH, "Name", "Jane Doe"));
  fields.appendChild(
    buildField(inputs, FIELD_WIDTH, "Email", "you@example.com"),
  );
  fields.appendChild(buildField(inputs, FIELD_WIDTH, "Password", "••••••••"));
  card.appendChild(fields);
  fillWidth(fields);
  for (const field of fields.children) fillWidth(field as SceneNode);

  // Actions.
  const actions = createColumn("Actions", 12);
  const submit = buildPrimaryButton(inputs, FIELD_WIDTH, "Create account");
  actions.appendChild(submit);
  fillWidth(submit);
  const social = buildOutlineButton(inputs, FIELD_WIDTH, "Sign up with Google");
  actions.appendChild(social);
  fillWidth(social);
  card.appendChild(actions);
  fillWidth(actions);

  // Footer prompt.
  const footer = createColumn("Footer", 0);
  footer.counterAxisAlignItems = "CENTER";
  footer.appendChild(
    createBody(
      inputs,
      "Already have an account? Login",
      14,
      "muted-foreground",
    ),
  );
  card.appendChild(footer);
  fillWidth(footer);

  canvas.appendChild(card);
  page.appendChild(canvas);
  return countDescendants(canvas);
}
