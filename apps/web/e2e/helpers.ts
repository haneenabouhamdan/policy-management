import { type Page, expect } from "@playwright/test";

export const USERS = {
  atomAdmin: {
    tenant: "atom",
    email: "maya.hassan@atomcover.com",
    password: "Admin123!",
  },
  atomViewer: {
    tenant: "atom",
    email: "lina.farhat@atomcover.com",
    password: "Viewer123!",
  },
  northwindAdmin: {
    tenant: "northwind",
    email: "james.okonkwo@northwindmga.com",
    password: "Admin123!",
  },
} as const;

export async function loginAs(
  page: Page,
  user: { tenant: string; email: string; password: string },
) {
  await page.goto("/login");
  await page.getByLabel("MGA").selectOption(user.tenant);
  await page.locator("#login-email").fill(user.email);
  await page.locator("#login-password").fill(user.password);
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("heading", { name: "Policies" })).toBeVisible();
}

export async function signOut(page: Page) {
  await page.getByTestId("user-menu").click();
  await page.getByTestId("sign-out").click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
}
