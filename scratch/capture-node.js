import { chromium } from "playwright";
import fs from "fs";

async function main() {
  // Launch the browser
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport size
  await page.setViewportSize({ width: 1280, height: 1000 });
  
  const destDir = "/Users/jackpark/.gemini/antigravity/brain/dbd377ad-3d86-4f69-8f71-8dd323765d10";
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const credentials = "http://jackpark:QWer%21%4034@localhost:3000";

  // 1. Visit Ingestion Dashboard (Light mode)
  console.log("Navigating to Ingestion Dashboard (Light)...");
  await page.goto(`${credentials}/admin/ingestion`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${destDir}/ingestion-light.png` });
  console.log("Ingestion Light screenshot saved.");

  // 2. Toggle Dark mode
  console.log("Switching to Dark Mode...");
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
  });
  // Wait a moment for transitions
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${destDir}/ingestion-dark.png` });
  console.log("Ingestion Dark screenshot saved.");

  // 3. Visit Chat Config (Light mode)
  console.log("Navigating to Chat Config (Light)...");
  // We navigate again to clear any forced dark mode state, although goto will reload the page anyway
  await page.goto(`${credentials}/admin/chat-config`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${destDir}/chat-config-light.png` });
  console.log("Chat Config Light screenshot saved.");

  // 4. Toggle Dark mode
  console.log("Switching to Dark Mode...");
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${destDir}/chat-config-dark.png` });
  console.log("Chat Config Dark screenshot saved.");

  // 5. Visit Documents list (Light mode)
  console.log("Navigating to Documents list (Light)...");
  await page.goto(`${credentials}/admin/documents`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${destDir}/documents-light.png` });
  console.log("Documents list Light screenshot saved.");

  // 6. Toggle Dark mode
  console.log("Switching to Dark Mode...");
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${destDir}/documents-dark.png` });
  console.log("Documents list Dark screenshot saved.");

  await browser.close();
  console.log("Done capturing screenshots!");
}

main().catch(err => {
  console.error("Capture failed:", err);
  process.exit(1);
});
