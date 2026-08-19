import { expect, test } from "@playwright/test";
import { USERS, loginAs, signOut } from "./helpers";

test("rejects invalid credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("MGA").selectOption("atom");
  await page.locator("#login-email").fill("maya.hassan@atomcover.com");
  await page.locator("#login-password").fill("WrongPass1!");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("login-error")).toBeVisible();
});

test("switching tenant shows a different book", async ({ page }) => {
  await loginAs(page, USERS.atomAdmin);
  await expect(page.getByText("Atom Coverholder")).toBeVisible();

  await signOut(page);
  await loginAs(page, USERS.northwindAdmin);
  await expect(page.getByText("Northwind MGA")).toBeVisible();
});
