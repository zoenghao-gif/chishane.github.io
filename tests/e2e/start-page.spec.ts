import { expect, test } from "@playwright/test";

test("start page keeps the mobile card layout and required copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "今天吃什么" })).toBeVisible();
  await expect(page.getByText("数据保存在云端，但当前设备身份无法跨设备找回")).toBeVisible();
  await expect(page.getByRole("link", { name: "隐私政策" })).toBeVisible();
  await expect(page.getByRole("link", { name: "用户协议" })).toBeVisible();
  await expect(page.locator("main")).toHaveCSS("max-width", "520px");
  await page.screenshot({
    path: `test-results/start-page-${test.info().project.name}.png`,
    fullPage: true,
  });
});
