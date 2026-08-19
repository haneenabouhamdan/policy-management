import { expect, test } from "@playwright/test";
import { USERS, loginAs } from "./helpers";

test("create form shows inline errors for missing required fields", async ({
  page,
}) => {
  await loginAs(page, USERS.atomAdmin);
  await page.getByTestId("new-policy").click();
  await page.getByLabel("Product *").selectOption({ label: "Travel" });
  await page.locator("#policy-name").fill("Incomplete travel");
  await page.getByTestId("create-draft").click();
  await expect(page.getByTestId("form-error")).toHaveText(
    "Fix the highlighted fields",
  );
  await expect(page.getByText("Required").first()).toBeVisible();
});
