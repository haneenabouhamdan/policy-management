import { expect, test } from "@playwright/test";
import { USERS, loginAs } from "./helpers";

test("viewer cannot create policies or products", async ({ page }) => {
  await loginAs(page, USERS.atomViewer);

  await expect(page.getByTestId("new-policy")).toHaveCount(0);
  await page.getByRole("link", { name: "Products" }).click();
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  await expect(page.getByTestId("new-product")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit schema" })).toHaveCount(0);
});
