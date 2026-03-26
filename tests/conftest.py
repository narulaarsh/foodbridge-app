"""
Shared pytest fixtures for FoodBridge Selenium tests.
"""
import pytest
import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options


BASE_URL = "http://localhost:3000"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")

# Use the system-installed chromedriver directly
CHROMEDRIVER_PATH = "/opt/homebrew/bin/chromedriver"


def _make_chrome_options(window_size="1920,1080"):
    """Create Chrome options for headless testing."""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument(f"--window-size={window_size}")
    return chrome_options


@pytest.fixture(scope="session", autouse=True)
def create_screenshot_dir():
    """Create screenshots directory if it doesn't exist."""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)


@pytest.fixture(scope="function")
def driver():
    """
    Create a headless Chrome WebDriver instance for each test.
    """
    service = Service(CHROMEDRIVER_PATH)
    browser = webdriver.Chrome(service=service, options=_make_chrome_options())
    browser.implicitly_wait(10)

    yield browser

    browser.quit()


@pytest.fixture(scope="function")
def driver_mobile():
    """
    Create a headless Chrome WebDriver instance with mobile viewport.
    """
    service = Service(CHROMEDRIVER_PATH)
    browser = webdriver.Chrome(service=service, options=_make_chrome_options("375,812"))
    browser.implicitly_wait(10)

    yield browser

    browser.quit()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Capture screenshot on test failure."""
    outcome = yield
    report = outcome.get_result()

    if report.when == "call" and report.failed:
        driver = item.funcargs.get("driver") or item.funcargs.get("driver_mobile")
        if driver:
            test_name = item.name.replace(" ", "_")
            screenshot_path = os.path.join(SCREENSHOT_DIR, f"FAIL_{test_name}.png")
            source_path = os.path.join(SCREENSHOT_DIR, f"FAIL_{test_name}.html")
            try:
                driver.save_screenshot(screenshot_path)
                with open(source_path, "w", encoding="utf-8") as f:
                    f.write(driver.page_source)
                print(f"\n📸 Screenshot and source saved: {screenshot_path}")
            except Exception as e:
                print(f"\n⚠️ Failed to capture screenshot: {e}")
