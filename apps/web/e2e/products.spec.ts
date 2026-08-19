import { expect, test } from "@playwright/test";
import { USERS, loginAs } from "./helpers";

test("invalid product schema is blocked in the builder", async ({ page }) => {
  await loginAs(page, USERS.atomAdmin);
  await page.getByRole("link", { name: "Products" }).click();
  await page.getByTestId("new-product").click();

  await page.getByLabel("Product name *").fill(`E2E Invalid ${Date.now()}`);
  await page.getByLabel("Type").selectOption("select");
  await page.getByTestId("save-product").click();
  await expect(page.getByTestId("product-form-error")).toContainText(
    "Select fields need comma-separated options",
  );
});
