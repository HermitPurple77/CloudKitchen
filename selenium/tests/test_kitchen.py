# selenium/tests/test_kitchen.py

"""
Selenium UI Tests — KitchenOS Kitchen Management System
Requires: docker-compose up --build (app running on localhost:3000 / 5000)

Run:
  cd selenium
  pip install -r requirements.txt
  pytest tests/ -v --html=report.html
"""

import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

BASE_URL  = "http://localhost:3000"
API_URL   = "http://localhost:5000"
WAIT      = 6   # seconds for explicit waits


# ─── Driver Fixture ───────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def driver():
    """Headless Chrome driver shared across all tests in this module."""
    opts = Options()
    opts.add_argument("--headless")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1280,900")

    drv = webdriver.Chrome(options=opts)
    drv.implicitly_wait(5)
    yield drv
    drv.quit()


def wait_for(driver, by, value, timeout=WAIT):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )

def wait_visible(driver, by, value, timeout=WAIT):
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((by, value))
    )


# ─── Page Load Tests ──────────────────────────────────────────────────────────

class TestPageLoads:

    def test_index_page_loads(self, driver):
        """Home / Tasks page should load with correct title."""
        driver.get(BASE_URL)
        assert "KitchenOS" in driver.title

    def test_staff_page_loads(self, driver):
        """Staff page should load."""
        driver.get(f"{BASE_URL}/staff.html")
        assert "KitchenOS" in driver.title

    def test_schedule_page_loads(self, driver):
        """Schedule page should load."""
        driver.get(f"{BASE_URL}/schedule.html")
        assert "KitchenOS" in driver.title

    def test_dashboard_page_loads(self, driver):
        """Dashboard page should load."""
        driver.get(f"{BASE_URL}/dashboard.html")
        assert "KitchenOS" in driver.title


# ─── Navigation Tests ─────────────────────────────────────────────────────────

class TestNavigation:

    def test_nav_links_present_on_index(self, driver):
        """All four nav links should be visible on the index page."""
        driver.get(BASE_URL)
        nav = driver.find_elements(By.CSS_SELECTOR, "nav.nav .nav-link")
        labels = [n.text for n in nav]
        assert "Tasks"     in labels
        assert "Staff"     in labels
        assert "Schedule"  in labels
        assert "Dashboard" in labels

    def test_nav_tasks_link_active_on_index(self, driver):
        """Tasks nav link should have 'active' class on index page."""
        driver.get(BASE_URL)
        active = driver.find_element(By.CSS_SELECTOR, "nav .nav-link.active")
        assert active.text == "Tasks"

    def test_nav_staff_link_navigates(self, driver):
        """Clicking Staff nav link should go to staff.html."""
        driver.get(BASE_URL)
        driver.find_element(By.LINK_TEXT, "Staff").click()
        assert "staff.html" in driver.current_url

    def test_nav_schedule_link_navigates(self, driver):
        """Clicking Schedule nav link should go to schedule.html."""
        driver.get(f"{BASE_URL}/staff.html")
        driver.find_element(By.LINK_TEXT, "Schedule").click()
        assert "schedule.html" in driver.current_url

    def test_nav_dashboard_link_navigates(self, driver):
        """Clicking Dashboard nav link should go to dashboard.html."""
        driver.get(BASE_URL)
        driver.find_element(By.LINK_TEXT, "Dashboard").click()
        assert "dashboard.html" in driver.current_url

    def test_logo_navigates_home(self, driver):
        """Clicking the logo should navigate back to index.html."""
        driver.get(f"{BASE_URL}/staff.html")
        driver.find_element(By.CSS_SELECTOR, "header .logo a").click()
        assert driver.current_url.rstrip("/").endswith(("index.html", ":3000"))


# ─── Tasks Page Tests ─────────────────────────────────────────────────────────

class TestTasksPage:

    def test_form_fields_present(self, driver):
        """Task form should have title input, staff select, shift select."""
        driver.get(BASE_URL)
        assert driver.find_element(By.ID, "title")
        assert driver.find_element(By.ID, "staff")
        assert driver.find_element(By.ID, "shift")

    def test_staff_field_is_dropdown(self, driver):
        """Staff field should be a <select> element, not a text input."""
        driver.get(BASE_URL)
        el = driver.find_element(By.ID, "staff")
        assert el.tag_name == "select"

    def test_staff_dropdown_has_options(self, driver):
        """Staff dropdown should have at least one selectable option
        (populated from localStorage defaults)."""
        driver.get(BASE_URL)
        time.sleep(1)   # allow JS to populate
        sel = Select(driver.find_element(By.ID, "staff"))
        # Filter out the placeholder option (value="")
        real_opts = [o for o in sel.options if o.get_attribute("value")]
        assert len(real_opts) >= 1

    def test_submit_button_present(self, driver):
        """Submit button should be visible."""
        driver.get(BASE_URL)
        btn = driver.find_element(By.ID, "submit-btn")
        assert btn.is_displayed()

    def test_task_list_section_present(self, driver):
        """Task list container should exist in the DOM."""
        driver.get(BASE_URL)
        assert driver.find_element(By.ID, "task-list")

    def test_add_task(self, driver):
        """Filling the form and submitting should add a task card."""
        driver.get(BASE_URL)
        time.sleep(1)

        driver.find_element(By.ID, "title").send_keys("Selenium Test Task")

        # Select first real staff option
        sel = Select(driver.find_element(By.ID, "staff"))
        real_opts = [o for o in sel.options if o.get_attribute("value")]
        if real_opts:
            sel.select_by_value(real_opts[0].get_attribute("value"))

        # Select first real shift option
        shift_sel = Select(driver.find_element(By.ID, "shift"))
        shift_opts = [o for o in shift_sel.options if o.get_attribute("value")]
        shift_sel.select_by_value(shift_opts[0].get_attribute("value"))

        driver.find_element(By.ID, "submit-btn").click()
        time.sleep(2)

        cards = driver.find_elements(By.CSS_SELECTOR, "#task-list .task-card")
        titles = [c.find_element(By.CLASS_NAME, "task-title").text for c in cards]
        assert "Selenium Test Task" in titles

    def test_task_shows_pending_status(self, driver):
        """Newly added task should show Pending status chip."""
        driver.get(BASE_URL)
        time.sleep(2)
        chips = driver.find_elements(By.CSS_SELECTOR, ".status-chip.pending")
        assert len(chips) >= 1

    def test_done_button_present_on_task(self, driver):
        """Each task card should have a toggle (Done) button."""
        driver.get(BASE_URL)
        time.sleep(2)
        btns = driver.find_elements(By.CSS_SELECTOR, ".task-card .btn-toggle")
        assert len(btns) >= 1

    def test_delete_button_present_on_task(self, driver):
        """Each task card should have a delete button."""
        driver.get(BASE_URL)
        time.sleep(2)
        btns = driver.find_elements(By.CSS_SELECTOR, ".task-card .btn-delete")
        assert len(btns) >= 1


# ─── Staff Page Tests ─────────────────────────────────────────────────────────

class TestStaffPage:

    def test_staff_form_fields_present(self, driver):
        """Staff form should have name, role, shift, phone fields."""
        driver.get(f"{BASE_URL}/staff.html")
        assert driver.find_element(By.ID, "s-name")
        assert driver.find_element(By.ID, "s-role")
        assert driver.find_element(By.ID, "s-shift")
        assert driver.find_element(By.ID, "s-phone")

    def test_default_staff_cards_loaded(self, driver):
        """Default staff (8 members) should be visible as cards."""
        driver.get(f"{BASE_URL}/staff.html")
        time.sleep(1)
        cards = driver.find_elements(By.CSS_SELECTOR, "#staff-grid .staff-card")
        assert len(cards) >= 1

    def test_staff_card_has_name(self, driver):
        """Staff cards should display a name."""
        driver.get(f"{BASE_URL}/staff.html")
        time.sleep(1)
        names = driver.find_elements(By.CSS_SELECTOR, ".staff-card .staff-name")
        assert any(n.text.strip() != "" for n in names)

    def test_staff_card_has_role_badge(self, driver):
        """Staff cards should display a role badge."""
        driver.get(f"{BASE_URL}/staff.html")
        time.sleep(1)
        badges = driver.find_elements(By.CSS_SELECTOR, ".staff-role-badge")
        assert len(badges) >= 1

    def test_add_new_staff_member(self, driver):
        """Adding a new staff member should create a new card."""
        driver.get(f"{BASE_URL}/staff.html")
        time.sleep(1)
        initial = len(driver.find_elements(By.CSS_SELECTOR, "#staff-grid .staff-card"))

        driver.find_element(By.ID, "s-name").send_keys("Selenium Staff")
        Select(driver.find_element(By.ID, "s-role")).select_by_visible_text("Line Cook")
        Select(driver.find_element(By.ID, "s-shift")).select_by_value("Morning (6AM–2PM)")
        driver.find_element(By.ID, "staff-btn").click()
        time.sleep(1)

        updated = driver.find_elements(By.CSS_SELECTOR, "#staff-grid .staff-card")
        assert len(updated) == initial + 1

    def test_staff_count_updates(self, driver):
        """Staff count label should reflect the number of members."""
        driver.get(f"{BASE_URL}/staff.html")
        time.sleep(1)
        count_text = driver.find_element(By.ID, "staff-count").text
        assert "member" in count_text


# ─── Schedule Page Tests ──────────────────────────────────────────────────────

class TestSchedulePage:

    def test_week_grid_has_seven_columns(self, driver):
        """Weekly grid should always render 7 day columns."""
        driver.get(f"{BASE_URL}/schedule.html")
        time.sleep(1)
        cols = driver.find_elements(By.CSS_SELECTOR, "#week-grid .day-col")
        assert len(cols) == 7

    def test_all_days_present(self, driver):
        """All 7 day headers should be present."""
        driver.get(f"{BASE_URL}/schedule.html")
        time.sleep(1)
        headers = [h.text for h in driver.find_elements(By.CSS_SELECTOR, ".day-header")]
        days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
        for day in days:
            assert any(day in h for h in headers), f"{day} header not found"

    def test_staff_dropdown_on_schedule(self, driver):
        """Schedule page staff field should be a <select>."""
        driver.get(f"{BASE_URL}/schedule.html")
        el = driver.find_element(By.ID, "sc-staff")
        assert el.tag_name == "select"

    def test_assign_shift_slot(self, driver):
        """Assigning a slot should add a slot card to the correct day column."""
        driver.get(f"{BASE_URL}/schedule.html")
        time.sleep(1)

        sel = Select(driver.find_element(By.ID, "sc-staff"))
        real_opts = [o for o in sel.options if o.get_attribute("value")]
        if not real_opts:
            pytest.skip("No staff in localStorage")
        sel.select_by_value(real_opts[0].get_attribute("value"))

        Select(driver.find_element(By.ID, "sc-day")).select_by_visible_text("Monday")
        Select(driver.find_element(By.ID, "sc-shift")).select_by_value("morning")
        driver.find_element(By.ID, "sc-btn").click()
        time.sleep(1)

        slots = driver.find_elements(By.CSS_SELECTOR, ".slot.morning")
        assert len(slots) >= 1


# ─── Dashboard Page Tests ─────────────────────────────────────────────────────

class TestDashboardPage:

    def test_stat_cards_present(self, driver):
        """All 4 stat cards should be in the DOM."""
        driver.get(f"{BASE_URL}/dashboard.html")
        time.sleep(2)
        assert driver.find_element(By.ID, "stat-total")
        assert driver.find_element(By.ID, "stat-done")
        assert driver.find_element(By.ID, "stat-pending")
        assert driver.find_element(By.ID, "stat-staff")

    def test_stat_total_is_numeric(self, driver):
        """Total tasks stat should be a number."""
        driver.get(f"{BASE_URL}/dashboard.html")
        time.sleep(2)
        val = driver.find_element(By.ID, "stat-total").text
        assert val.isdigit(), f"Expected a number, got: '{val}'"

    def test_progress_bar_present(self, driver):
        """Completion progress bar should exist."""
        driver.get(f"{BASE_URL}/dashboard.html")
        assert driver.find_element(By.ID, "progress-fill")

    def test_progress_percentage_shown(self, driver):
        """Percentage label should be visible."""
        driver.get(f"{BASE_URL}/dashboard.html")
        time.sleep(2)
        pct = driver.find_element(By.ID, "pct-label").text
        assert "%" in pct

    def test_recent_tasks_section(self, driver):
        """Recent tasks section should be rendered."""
        driver.get(f"{BASE_URL}/dashboard.html")
        time.sleep(2)
        section = driver.find_element(By.ID, "recent-tasks")
        assert section.is_displayed()
