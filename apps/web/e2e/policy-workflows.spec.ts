import { expect, test } from "@playwright/test";
import { USERS, loginAs } from "./helpers";

test("duplicate clones a draft and edit saves attributes", async ({ page }) => {
  await loginAs(page, USERS.atomAdmin);
  await page.locator("#policy-search").fill("UAE Weekend Cover");
  await page.getByRole("link", { name: "UAE Weekend Cover", exact: true }).click();
  await expect(page.getByRole("heading", { name: "UAE Weekend Cover" })).toBeVisible();

  await page.getByTestId("duplicate-policy").click();
  await expect(page.getByRole("heading", { name: /UAE Weekend Cover \(copy\)/ })).toBeVisible();
  await expect(page.getByTestId("policy-status")).toHaveText("DRAFT");

  await page.getByTestId("edit-policy").click();
  await expect(page.getByRole("heading", { name: "Edit policy" })).toBeVisible();
  await page.getByLabel("Policy name *").fill("UAE Weekend Cover (copy) edited");
  await page.getByTestId("save-policy").click();
  await expect(
    page.getByRole("heading", { name: "UAE Weekend Cover (copy) edited" }),
  ).toBeVisible();
});
