"""
FoodBridge — Comprehensive Selenium Test Suite
================================================
15 automated UI test cases covering:
  - Authentication (login, register, form toggle, validation)
  - Donor Dashboard (page load, donation form)
  - Volunteer Dashboard (page load, map section)
  - Admin Dashboard (metrics, user management)
  - Navigation & UX (navbar, logout, SEO, responsive design)

Run with:
    python3 -m pytest tests/test_foodbridge.py -v --html=tests/selenium_report.html --self-contained-html
"""

import pytest
import time
import uuid
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

BASE_URL = "http://localhost:3000"

# ── Unique test users (use uuid to avoid collisions between runs) ──
_uid = uuid.uuid4().hex[:6]
DONOR_EMAIL = f"testdonor_{_uid}@test.com"
DONOR_PASS = "TestPass123!"
DONOR_NAME = f"Test Donor {_uid}"

VOLUNTEER_EMAIL = f"testvol_{_uid}@test.com"
VOLUNTEER_PASS = "TestPass123!"
VOLUNTEER_NAME = f"Test Volunteer {_uid}"

ADMIN_EMAIL = f"testadmin_{_uid}@test.com"
ADMIN_PASS = "TestPass123!"
ADMIN_NAME = f"Test Admin {_uid}"
ADMIN_SECRET = "foodbridge-admin-2026"


# ═══════════════════════════════════════════════════
#  Helper utilities
# ═══════════════════════════════════════════════════

def _wait_for(driver, by, value, timeout=20):
    """Wait for an element to be present and return it."""
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def _wait_clickable(driver, by, value, timeout=20):
    """Wait for an element to be clickable and return it."""
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )


def _wait_visible(driver, by, value, timeout=20):
    """Wait for an element to be visible and return it."""
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((by, value))
    )


def _register_user(driver, name, email, password, role, admin_secret=None):
    """Complete registration flow for a user with smart waits."""
    driver.get(f"{BASE_URL}/auth")
    
    # Wait for page to load
    _wait_visible(driver, By.TAG_NAME, "form")

    # Switch to register view if needed
    try:
        # Check if we are on the register form already (name input exists)
        driver.find_element(By.XPATH, "//input[@placeholder='John Doe']")
    except NoSuchElementException:
        # Click toggle to register
        toggle_btn = _wait_clickable(driver, By.XPATH, "//button[contains(text(),'Join FoodBridge')]")
        toggle_btn.click()
    
    # Wait for the name field to be visible
    name_input = _wait_visible(driver, By.XPATH, "//input[@placeholder='John Doe']")
    name_input.clear()
    name_input.send_keys(name)

    # Fill email
    email_input = driver.find_element(By.XPATH, "//input[@placeholder='you@example.com']")
    email_input.clear()
    email_input.send_keys(email)

    # Fill password
    pass_input = driver.find_element(By.XPATH, "//input[@placeholder='••••••••']")
    pass_input.clear()
    pass_input.send_keys(password)

    # Select role
    role_select = Select(driver.find_element(By.TAG_NAME, "select"))
    role_select.select_by_value(role)

    # Admin secret if needed
    if role == "Admin" and admin_secret:
        secret_input = _wait_visible(driver, By.XPATH, "//input[@placeholder='Enter authorized key']")
        secret_input.clear()
        secret_input.send_keys(admin_secret)

    # Submit
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()

    # Smart Wait: wait for the form to switch back to login (Welcome Back heading) or an error
    # This handles the remote DB latency without fixed timeouts
    def check_register_result(d):
        try:
            return ("Welcome Back" in d.find_element(By.TAG_NAME, "h2").text) or len(d.find_elements(By.CSS_SELECTOR, "div[class*='text-red']")) > 0
        except Exception:
            return False

    WebDriverWait(driver, 45).until(check_register_result)
    
    # Assert no error means success
    errors = driver.find_elements(By.CSS_SELECTOR, "div[class*='text-red']")
    if errors:
        pytest.fail(f"Registration failed with error: {errors[0].text}")


def _login_user(driver, email, password):
    """Complete login flow for a user and wait for dashboard redirect."""
    driver.get(f"{BASE_URL}/auth")
    
    _wait_visible(driver, By.TAG_NAME, "form")

    # Make sure we're on the login form
    try:
        driver.find_element(By.XPATH, "//input[@placeholder='John Doe']")
        # If name is present, we are on register, click login toggle
        login_toggle = _wait_clickable(driver, By.XPATH, "//button[contains(text(),'Log in')]")
        login_toggle.click()
        # wait for name input to disappear
        WebDriverWait(driver, 10).until(
            EC.invisibility_of_element_located((By.XPATH, "//input[@placeholder='John Doe']"))
        )
    except NoSuchElementException:
        pass  # Already on login form

    email_input = _wait_visible(driver, By.XPATH, "//input[@placeholder='you@example.com']")
    email_input.clear()
    email_input.send_keys(email)

    pass_input = driver.find_element(By.XPATH, "//input[@placeholder='••••••••']")
    pass_input.clear()
    pass_input.send_keys(password)

    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()

    # Smart Wait: wait for URL to not be /auth (redirect successful) or an error to appear
    WebDriverWait(driver, 30).until(
        lambda d: not d.current_url.endswith("/auth") or 
                   len(d.find_elements(By.CSS_SELECTOR, "div[class*='text-red']")) > 0
    )


def _login_and_navigate(driver, email, password, expected_path):
    """Login and do a full page load to ensure server-rendered layout (navbar) appears."""
    _login_user(driver, email, password)
    WebDriverWait(driver, 20).until(EC.url_contains(expected_path))
    # Force a full page reload
    driver.get(driver.current_url)
    _wait_visible(driver, By.TAG_NAME, "nav")


# ═══════════════════════════════════════════════════
#  1. AUTHENTICATION TESTS
# ═══════════════════════════════════════════════════

class TestAuthPage:
    """Tests for the /auth page — login and register forms."""

    def test_01_auth_page_loads(self, driver):
        """TC-01: Auth page loads with FoodBridge branding and login form."""
        driver.get(f"{BASE_URL}/auth")
        
        # Wait for rendering
        h1 = _wait_visible(driver, By.TAG_NAME, "h1")
        assert "FoodBridge" in h1.text

        assert "FoodBridge" in driver.title

        h2 = driver.find_element(By.TAG_NAME, "h2")
        assert "Welcome Back" in h2.text

        email_input = driver.find_element(By.XPATH, "//input[@type='email']")
        pass_input = driver.find_element(By.XPATH, "//input[@type='password']")
        assert email_input.is_displayed()
        assert pass_input.is_displayed()

        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        assert "Sign in" in submit_btn.text

    def test_02_toggle_to_register(self, driver):
        """TC-02: Clicking 'Join FoodBridge' shows registration form fields."""
        driver.get(f"{BASE_URL}/auth")
        
        toggle_btn = _wait_clickable(driver, By.XPATH, "//button[contains(text(),'Join FoodBridge')]")
        toggle_btn.click()

        # Heading should change
        h2 = _wait_visible(driver, By.TAG_NAME, "h2")
        assert "Create an Account" in h2.text

        name_input = driver.find_element(By.XPATH, "//input[@placeholder='John Doe']")
        assert name_input.is_displayed()

        select = driver.find_element(By.TAG_NAME, "select")
        assert select.is_displayed()

        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        assert "Create Account" in submit_btn.text

    def test_03_login_invalid_credentials(self, driver):
        """TC-03: Login with invalid credentials shows error message."""
        driver.get(f"{BASE_URL}/auth")
        
        email_input = _wait_visible(driver, By.XPATH, "//input[@placeholder='you@example.com']")
        email_input.send_keys("nobody@fake.com")

        pass_input = driver.find_element(By.XPATH, "//input[@placeholder='••••••••']")
        pass_input.send_keys("WrongPassword")

        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()

        # Wait for error message (text-red-700 in the UI block)
        error_div = _wait_visible(
            driver, By.CSS_SELECTOR,
            "div[class*='text-red']",
            timeout=20
        )
        assert error_div.is_displayed()
        assert len(error_div.text) > 0

    def test_04_register_donor(self, driver):
        """TC-04: Register a new Donor user successfully."""
        _register_user(driver, DONOR_NAME, DONOR_EMAIL, DONOR_PASS, "Donor")
        # _register_user handles the wait and success assertion

    def test_05_login_as_donor(self, driver):
        """TC-05: Login as registered Donor and verify redirect to /donor."""
        _login_user(driver, DONOR_EMAIL, DONOR_PASS)
        WebDriverWait(driver, 20).until(EC.url_contains("/donor"))
        assert "/donor" in driver.current_url


# ═══════════════════════════════════════════════════
#  2. DONOR DASHBOARD TESTS
# ═══════════════════════════════════════════════════

class TestDonorDashboard:
    """Tests for the /donor dashboard page."""

    def test_06_donor_dashboard_loads(self, driver):
        """TC-06: Donor dashboard loads with correct heading and donation form."""
        _login_user(driver, DONOR_EMAIL, DONOR_PASS)
        WebDriverWait(driver, 20).until(EC.url_contains("/donor"))

        h1 = _wait_visible(driver, By.TAG_NAME, "h1")
        assert "Donor Dashboard" in h1.text

        food_title = driver.find_element(By.ID, "foodTitle")
        assert food_title.is_displayed()

        quantity = driver.find_element(By.ID, "quantityKg")
        assert quantity.is_displayed()

        post_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Post Donation')]")
        assert post_btn.is_displayed()

    def test_07_donor_form_validation(self, driver):
        """TC-07: Submitting empty donation form triggers browser validation."""
        _login_user(driver, DONOR_EMAIL, DONOR_PASS)
        WebDriverWait(driver, 20).until(EC.url_contains("/donor"))

        post_btn = _wait_clickable(driver, By.XPATH, "//button[contains(text(),'Post Donation')]")
        post_btn.click()

        food_title = driver.find_element(By.ID, "foodTitle")
        is_valid = driver.execute_script(
            "return arguments[0].checkValidity();", food_title
        )
        assert not is_valid, "Empty food title should fail browser validation"


# ═══════════════════════════════════════════════════
#  3. VOLUNTEER DASHBOARD TESTS
# ═══════════════════════════════════════════════════

class TestVolunteerDashboard:
    """Tests for the /volunteer dashboard page."""

    def test_08_register_and_login_volunteer(self, driver):
        """TC-08: Register + Login as Volunteer, verify /volunteer dashboard loads."""
        _register_user(driver, VOLUNTEER_NAME, VOLUNTEER_EMAIL, VOLUNTEER_PASS, "Volunteer")
        _login_user(driver, VOLUNTEER_EMAIL, VOLUNTEER_PASS)

        WebDriverWait(driver, 20).until(EC.url_contains("/volunteer"))
        assert "/volunteer" in driver.current_url

    def test_09_volunteer_page_elements(self, driver):
        """TC-09: Volunteer dashboard shows heading, refresh button, and map area."""
        _login_user(driver, VOLUNTEER_EMAIL, VOLUNTEER_PASS)
        WebDriverWait(driver, 20).until(EC.url_contains("/volunteer"))

        h1 = _wait_visible(driver, By.TAG_NAME, "h1")
        assert "Volunteer Hub" in h1.text

        refresh_btn = _wait_visible(
            driver, By.XPATH,
            "//button[contains(.,'Refresh') or contains(.,'Refreshing')]"
        )
        assert refresh_btn.is_displayed()

        counter = _wait_visible(
            driver, By.XPATH,
            "//*[contains(.,'Active Donations')]"
        )
        assert counter.is_displayed()


# ═══════════════════════════════════════════════════
#  4. ADMIN DASHBOARD TESTS
# ═══════════════════════════════════════════════════

class TestAdminDashboard:
    """Tests for the /admin dashboard page."""

    def test_10_register_and_login_admin(self, driver):
        """TC-10: Register + Login as Admin with secret key, verify /admin dashboard."""
        _register_user(driver, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASS, "Admin", ADMIN_SECRET)
        _login_user(driver, ADMIN_EMAIL, ADMIN_PASS)

        WebDriverWait(driver, 20).until(EC.url_contains("/admin"))
        assert "/admin" in driver.current_url

    def test_11_admin_metrics_and_user_table(self, driver):
        """TC-11: Admin dashboard shows metric cards and user management table."""
        _login_user(driver, ADMIN_EMAIL, ADMIN_PASS)
        WebDriverWait(driver, 20).until(EC.url_contains("/admin"))

        h1 = _wait_visible(driver, By.TAG_NAME, "h1")
        assert "Admin Dashboard" in h1.text

        total_users = _wait_visible(driver, By.XPATH, "//*[contains(text(), 'Total Users')]")
        assert total_users.is_displayed()

        active_donations = driver.find_element(By.XPATH, "//*[contains(text(), 'Active Donations')]")
        assert active_donations.is_displayed()

        food_rescued = driver.find_element(By.XPATH, "//*[contains(text(), 'Total Food Rescued')]")
        assert food_rescued.is_displayed()

        user_mgmt = _wait_visible(driver, By.XPATH, "//*[contains(text(), 'User Management')]")
        assert user_mgmt.is_displayed()

        # Wait for table to load (so loading spinner goes away)
        WebDriverWait(driver, 45).until(
            lambda d: len(d.find_elements(By.TAG_NAME, "table")) > 0 or 
                       ("No users found" in d.page_source)
        )
        
        try:
            table = driver.find_element(By.TAG_NAME, "table")
            assert table.is_displayed()
            headers = driver.find_elements(By.TAG_NAME, "th")
            header_texts = [h.text for h in headers]
            assert any("NAME" in h.upper() for h in header_texts)
        except NoSuchElementException:
            no_users = driver.find_element(By.XPATH, "//*[contains(text(),'No users found')]")
            assert no_users.is_displayed()


# ═══════════════════════════════════════════════════
#  5. NAVIGATION & UX TESTS
# ═══════════════════════════════════════════════════

class TestNavigationAndUX:
    """Tests for navigation bar, logout, SEO, and responsive design."""

    def test_12_navbar_when_logged_in(self, driver):
        """TC-12: Navigation bar shows FoodBridge logo, role, and sign out button when logged in."""
        _login_and_navigate(driver, DONOR_EMAIL, DONOR_PASS, "/donor")

        nav_brand = _wait_visible(driver, By.XPATH, "//nav//span[contains(text(),'FoodBridge')]")
        assert nav_brand.is_displayed()
    
        role_label = _wait_visible(driver, By.XPATH, "//nav//*[contains(.,'Dashboard')]")
        assert role_label.is_displayed()

        signout_btn = driver.find_element(By.XPATH, "//nav//button[contains(text(),'Sign out')]")
        assert signout_btn.is_displayed()

    def test_13_logout_functionality(self, driver):
        """TC-13: Clicking Sign out redirects to /auth page."""
        _login_and_navigate(driver, DONOR_EMAIL, DONOR_PASS, "/donor")

        signout_btn = _wait_clickable(driver, By.XPATH, "//nav//button[contains(text(),'Sign out')]")
        signout_btn.click()

        WebDriverWait(driver, 20).until(EC.url_contains("/auth"))
        assert "/auth" in driver.current_url

    def test_14_page_title_and_meta(self, driver):
        """TC-14: Page has proper title and meta description for SEO."""
        driver.get(f"{BASE_URL}/auth")
        _wait_visible(driver, By.TAG_NAME, "h1")

        assert "FoodBridge" in driver.title

        meta_desc = driver.find_element(By.XPATH, "//meta[@name='description']")
        content = meta_desc.get_attribute("content")
        assert content and len(content) > 10

    def test_15_responsive_mobile_viewport(self, driver_mobile):
        """TC-15: App is accessible on mobile viewport."""
        driver_mobile.get(f"{BASE_URL}/auth")
        
        h1 = _wait_visible(driver_mobile, By.TAG_NAME, "h1")
        assert "FoodBridge" in h1.text

        email_input = driver_mobile.find_element(By.XPATH, "//input[@type='email']")
        assert email_input.is_displayed()

        submit_btn = driver_mobile.find_element(By.XPATH, "//button[@type='submit']")
        assert submit_btn.is_displayed()

        viewport_width = driver_mobile.execute_script("return window.innerWidth;")
        assert viewport_width <= 600
