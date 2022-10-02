const { launch } = require("puppeteer");

// TP Link admin dashboard url
let url = "http://192.168.0.1/";
// Default username
let username = "admin";
// Default password
let password = "admin";
// Hide browser window
let headless = true;
// Skip rebooting (for development only because i dont want my wifi to reboot everytime i test)
let skip = false;

async function main() {
  // Parse all the command line arguements
  if (process.argv.length > 2) {
    for (const arg of process.argv.slice(2)) {
      if (arg.startsWith("--url=")) {
        url = arg.replace("--url=", "");
      } else if (arg.startsWith("--username=")) {
        username = arg.replace("--username=", "");
      } else if (arg.startsWith("--password=")) {
        password = arg.replace("--password=", "");
      } else if (arg === "--show") {
        headless = false;
      } else if (arg === "--skip") {
        skip = true;
      }
    }
  }

  // launch the browser
  let browser;
  let page;
  try {
    browser = await launch({ headless });
    page = await browser.newPage();
    await page.goto(url);
  } catch (error) {
    console.error("Error: Cannot open url!", error);
  }

  // Try to login with given username and password
  try {
    await (await page.$("input#userName")).type(username);
    await (await page.$("input#pcPassword")).type(password);
    await (await page.$("#loginBtn")).click();
    await page.waitForNavigation({ waitUntil: "networkidle2" });
  } catch (error) {
    console.error("Error: Invalid tplink admin url!", error);
  }

  // Try to reboot the router
  try {
    const menuFrame = await page.waitForFrame((frame) => frame.name() === "bottomLeftFrame", {
      timeout: 1000,
    });
    const mainFrame = await page.waitForFrame((frame) => frame.name() === "mainFrame", {
      timeout: 1000,
    });

    console.info("Login successful!");

    await (await menuFrame.$("#a43")).click();
    await (await menuFrame.$("#a49")).click();

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await mainFrame.waitForSelector("#reboot");
    if (!skip) {
      await (await mainFrame.$("#reboot")).click();
      await delay(1000);
    }

    console.log("Successfully rebooted your tp-link router");
  } catch (error) {
    console.error("Error: login failed!", error);
  }
  await browser.close();
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = main;
