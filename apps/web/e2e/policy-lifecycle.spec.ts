import { expect, test } from "@playwright/test";

test("login, create draft, activate, then reactivate with a reason", async ({
  page,
}) => {
  const policyName = `E2E Reactivate Cover ${Date.now()}`;

  await page.goto("/login");
  await page.getByLabel("MGA").selectOption("atom");
  await page.locator("#login-email").fill("maya.hassan@atomcover.com");
  await page.locator("#login-password").fill("Admin123!");
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("heading", { name: "Policies" })).toBeVisible();

  await page.getByTestId("new-policy").click();
  await expect(page.getByRole("heading", { name: "New policy" })).toBeVisible();

  const product = page.getByLabel("Product *");
  await product.selectOption({ label: "Travel" });

  await page.locator("#policy-name").fill(policyName);
  await page.getByRole("checkbox", { name: "UAE" }).check();
  await page.getByLabel("Max trip days *").fill("7");
  await page.getByLabel("Medical cover amount *").fill("50000");
  await page.getByLabel("Maximum age *").fill("40");
  await page.getByTestId("create-draft").click();

  await expect(page.getByRole("heading", { name: policyName })).toBeVisible();
  await expect(page.getByTestId("policy-status")).toHaveText("DRAFT");
  await expect(
    page.getByText("Required · Allowed: UAE, GCC, EU, US, Worldwide"),
  ).toBeVisible();

  await page.getByTestId("activate-policy").click();
  await page.getByTestId("confirm-status").click();
  await expect(page.getByTestId("policy-status")).toHaveText("ACTIVE");

  await page.getByTestId("deactivate-policy").click();
  await page.getByTestId("confirm-status").click();
  await expect(page.getByTestId("policy-status")).toHaveText("INACTIVE");

  await page.getByTestId("reactivate-policy").click();
  await page.getByTestId("status-reason").fill("Cover reinstated after review");
  await page.getByTestId("confirm-status").click();
  await expect(page.getByTestId("policy-status")).toHaveText("ACTIVE");
});
