import { expect, test } from "@playwright/test";
import { USERS, loginAs } from "./helpers";

test("search, status, and product filters narrow the list", async ({
  page,
}) => {
  await loginAs(page, USERS.atomAdmin);

  await page.locator("#policy-search").fill("Marina Apartment");
  await expect(
    page.getByRole("link", { name: "Marina Apartment", exact: true }),
  ).toBeVisible();

  await page.getByTestId("status-filter-DRAFT").click();
  await expect(page.getByRole("heading", { name: "Policies" })).toBeVisible();
  await expect(page.getByText("No policies found")).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("button", { name: /^Travel/ }).click();
  await page.locator("#policy-search").fill("UAE Weekend Cover");
  await expect(
    page.getByRole("link", { name: "UAE Weekend Cover", exact: true }),
  ).toBeVisible();

  await page.getByTestId("stale-filter").click();
  await expect(page.getByRole("heading", { name: "Policies" })).toBeVisible();
});
