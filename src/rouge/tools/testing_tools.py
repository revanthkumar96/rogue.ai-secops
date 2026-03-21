"""Testing tools for ROUGE agents - Playwright, pytest, API testing, and more.

All testing operations are scoped inside .rouge_operations/ and use uv for
package management and virtual environment creation.
"""

import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

from playwright.async_api import async_playwright

from ..utils.operations import PlatformHelper, RougeOperationsManager


class TestingTools:
    """Collection of testing tools for ROUGE agents"""

    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.ops_manager = RougeOperationsManager(repo_path)
        self.deliverables_path = self.ops_manager.deliverables_path
        self.deliverables_path.mkdir(exist_ok=True, parents=True)

    # ============================================
    # Browser Automation (Playwright)
    # ============================================

    async def execute_playwright_script(
        self,
        script: str,
        browser: str = "chromium",
        headless: bool = True,
    ) -> Dict[str, Any]:
        """
        Execute a Playwright browser automation script

        Args:
            script: Python code to execute with Playwright
            browser: Browser type ("chromium", "firefox", "webkit")
            headless: Run browser in headless mode

        Returns:
            Dict with execution results and any errors
        """
        try:
            # Create a temporary script file
            script_path = self.deliverables_path / "temp_playwright_script.py"

            # Wrap script with Playwright boilerplate
            full_script = f"""
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.{browser}.launch(headless={headless})
        page = await browser.new_page()

        # User's script
        {script}

        await browser.close()

asyncio.run(run())
"""
            script_path.write_text(full_script)

            # Execute the script using uv run python for isolation
            python_cmd = PlatformHelper.get_python_cmd()
            result = subprocess.run(
                ["uv", "run", python_cmd, str(script_path)],
                capture_output=True,
                text=True,
                timeout=120,
                cwd=str(self.repo_path),
            )

            # Clean up
            script_path.unlink(missing_ok=True)

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
            }

        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Script execution timeout (120s)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def capture_screenshot(
        self,
        url: str,
        filename: str,
        selector: Optional[str] = None,
        viewport_width: int = 1280,
        viewport_height: int = 720,
    ) -> Dict[str, Any]:
        """
        Capture a screenshot of a webpage or specific element

        Args:
            url: URL to navigate to
            filename: Output filename (saved to deliverables/)
            selector: Optional CSS selector to screenshot specific element
            viewport_width: Browser viewport width
            viewport_height: Browser viewport height

        Returns:
            Dict with screenshot path and success status
        """
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page(
                    viewport={"width": viewport_width, "height": viewport_height}
                )

                await page.goto(url, wait_until="networkidle", timeout=30000)

                screenshot_path = self.deliverables_path / filename

                if selector:
                    # Screenshot specific element
                    element = await page.query_selector(selector)
                    if element:
                        await element.screenshot(path=str(screenshot_path))
                    else:
                        return {"success": False, "error": f"Selector '{selector}' not found"}
                else:
                    # Full page screenshot
                    await page.screenshot(path=str(screenshot_path), full_page=True)

                await browser.close()

                return {
                    "success": True,
                    "screenshot_path": str(screenshot_path),
                    "url": url,
                }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def compare_screenshots(
        self,
        baseline: str,
        current: str,
        threshold: float = 0.1,
    ) -> Dict[str, Any]:
        """
        Compare two screenshots for visual regression testing

        Args:
            baseline: Path to baseline screenshot
            current: Path to current screenshot
            threshold: Difference threshold (0.0 = identical, 1.0 = completely different)

        Returns:
            Dict with comparison results
        """
        try:
            from PIL import Image, ImageChops

            baseline_img = Image.open(baseline)
            current_img = Image.open(current)

            # Ensure images are the same size
            if baseline_img.size != current_img.size:
                return {
                    "success": False,
                    "error": f"Image sizes don't match: {baseline_img.size} vs {current_img.size}",
                }

            # Calculate difference
            diff = ImageChops.difference(baseline_img, current_img)
            diff_pixels = sum(sum(pixel) for pixel in diff.getdata())
            total_pixels = baseline_img.size[0] * baseline_img.size[1] * 255 * 3
            difference_percentage = diff_pixels / total_pixels

            passed = difference_percentage <= threshold

            # Save diff image if there are differences
            diff_path = None
            if not passed:
                diff_path = str(self.deliverables_path / "screenshot_diff.png")
                diff.save(diff_path)

            return {
                "success": True,
                "passed": passed,
                "difference_percentage": difference_percentage,
                "threshold": threshold,
                "diff_image_path": diff_path,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # Test Execution (Pytest)
    # ============================================

    async def run_pytest_suite(
        self,
        test_path: str,
        markers: Optional[List[str]] = None,
        parallel: bool = False,
        verbose: bool = True,
        coverage: bool = False,
        create_venv: bool = True,
    ) -> Dict[str, Any]:
        """
        Execute pytest test suite using uv inside a .rouge_operations venv.

        Args:
            test_path: Path to tests (file or directory)
            markers: Pytest markers to filter tests (e.g., ["unit", "integration"])
            parallel: Run tests in parallel using pytest-xdist
            verbose: Verbose output
            coverage: Enable coverage reporting
            create_venv: Create isolated venv in .rouge_operations/venvs/testing

        Returns:
            Dict with test results, output, and metrics
        """
        try:
            # Create isolated venv for testing if requested
            if create_venv:
                venv_result = self.ops_manager.create_venv("testing")
                if not venv_result.get("success"):
                    return {
                        "success": False,
                        "error": f"Failed to create test venv: {venv_result.get('error')}",
                    }

            # Use uv run pytest for proper isolation
            cmd = ["uv", "run", "pytest", test_path]

            if verbose:
                cmd.append("-v")

            if markers:
                for marker in markers:
                    cmd.extend(["-m", marker])

            if parallel:
                cmd.extend(["-n", "auto"])  # Auto-detect CPU count

            if coverage:
                cmd.extend(["--cov", "--cov-report=html", "--cov-report=term"])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600,  # 10 minute timeout
                cwd=str(self.repo_path),
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
                "passed": "passed" in result.stdout.lower(),
                "failed": "failed" in result.stdout.lower(),
            }

        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Test execution timeout (10 minutes)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # API Testing
    # ============================================

    async def run_api_test(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[Dict[str, Any]] = None,
        assertions: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Execute API test with assertions

        Args:
            method: HTTP method (GET, POST, PUT, DELETE, PATCH)
            url: API endpoint URL
            headers: Request headers
            body: Request body (for POST/PUT/PATCH)
            assertions: List of assertions to validate response
                Example: [
                    {"type": "status_code", "expected": 200},
                    {"type": "json_path", "path": "$.data.id", "expected": "123"},
                    {"type": "response_time", "max_ms": 500}
                ]

        Returns:
            Dict with API response and assertion results
        """
        try:
            import time

            import requests

            # Prepare request
            request_kwargs = {
                "method": method.upper(),
                "url": url,
                "headers": headers or {},
            }

            if body and method.upper() in ["POST", "PUT", "PATCH"]:
                request_kwargs["json"] = body

            # Execute request
            start_time = time.time()
            response = requests.request(**request_kwargs, timeout=30)
            response_time_ms = (time.time() - start_time) * 1000

            # Collect response data
            response_data = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "response_time_ms": response_time_ms,
            }

            try:
                response_data["body"] = response.json()
            except (ValueError, Exception):
                response_data["body"] = response.text

            # Run assertions if provided
            assertion_results = []
            all_passed = True

            if assertions:
                for assertion in assertions:
                    assertion_type = assertion.get("type")
                    result = {"type": assertion_type, "passed": False}

                    if assertion_type == "status_code":
                        expected = assertion.get("expected")
                        result["passed"] = response.status_code == expected
                        result["expected"] = expected
                        result["actual"] = response.status_code

                    elif assertion_type == "response_time":
                        max_ms = assertion.get("max_ms")
                        result["passed"] = response_time_ms <= max_ms
                        result["max_ms"] = max_ms
                        result["actual_ms"] = response_time_ms

                    elif assertion_type == "json_path":
                        # Simple JSON path validation (would use jsonpath in production)
                        path = assertion.get("path")
                        expected = assertion.get("expected")
                        # Simplified - just check if key exists in top-level JSON
                        if isinstance(response_data["body"], dict):
                            actual = response_data["body"].get(path.replace("$.", ""))
                            result["passed"] = actual == expected
                            result["expected"] = expected
                            result["actual"] = actual

                    assertion_results.append(result)
                    if not result["passed"]:
                        all_passed = False

            return {
                "success": True,
                "response": response_data,
                "assertions": assertion_results,
                "all_assertions_passed": all_passed,
            }

        except requests.exceptions.Timeout:
            return {"success": False, "error": "Request timeout (30s)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================
    # Test Data Generation
    # ============================================

    async def generate_test_data(
        self,
        factory_type: str,
        count: int = 1,
        attributes: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate test data using factories

        Args:
            factory_type: Type of data to generate (e.g., "user", "product", "order")
            count: Number of records to generate
            attributes: Override specific attributes

        Returns:
            Dict with generated test data
        """
        try:
            from faker import Faker

            fake = Faker()
            generated_data = []

            # Basic factory types (can be extended)
            factories = {
                "user": lambda: {
                    "id": fake.uuid4(),
                    "name": fake.name(),
                    "email": fake.email(),
                    "username": fake.user_name(),
                    "phone": fake.phone_number(),
                    "address": fake.address(),
                    "created_at": fake.date_time_this_year().isoformat(),
                },
                "product": lambda: {
                    "id": fake.uuid4(),
                    "name": fake.commerce.product_name() if hasattr(fake, "commerce") else fake.word(),
                    "price": round(fake.random.uniform(10, 1000), 2),
                    "description": fake.text(max_nb_chars=200),
                    "category": fake.word(),
                    "in_stock": fake.boolean(),
                },
                "order": lambda: {
                    "id": fake.uuid4(),
                    "customer_id": fake.uuid4(),
                    "total": round(fake.random.uniform(50, 500), 2),
                    "status": fake.random_element(["pending", "processing", "shipped", "delivered"]),
                    "created_at": fake.date_time_this_month().isoformat(),
                },
            }

            factory_func = factories.get(factory_type)
            if not factory_func:
                return {
                    "success": False,
                    "error": f"Unknown factory type: {factory_type}. Available: {list(factories.keys())}",
                }

            for _ in range(count):
                data = factory_func()
                # Override with custom attributes
                if attributes:
                    data.update(attributes)
                generated_data.append(data)

            return {
                "success": True,
                "factory_type": factory_type,
                "count": count,
                "data": generated_data,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def database_seed(
        self,
        connection_string: str,
        data: List[Dict[str, Any]],
        table_name: str,
    ) -> Dict[str, Any]:
        """
        Seed database with test data

        Args:
            connection_string: Database connection string
            data: List of records to insert
            table_name: Target table name

        Returns:
            Dict with seeding results
        """
        # NOTE: In production, this would use actual database drivers (psycopg2, pymongo, etc.)
        # For now, return a placeholder
        return {
            "success": True,
            "message": f"Would seed {len(data)} records into {table_name}",
            "note": "Database seeding requires database driver configuration",
            "records_count": len(data),
        }

    # ============================================
    # Mobile Testing (Appium)
    # ============================================

    async def appium_start_session(
        self,
        platform: str,
        device: str,
        app_path: str,
    ) -> Dict[str, Any]:
        """
        Start Appium mobile testing session

        Args:
            platform: "android" or "ios"
            device: Device name or UDID
            app_path: Path to app binary (.apk or .ipa)

        Returns:
            Dict with session details
        """
        # NOTE: In production, this would use appium-python-client
        # For now, return a placeholder
        return {
            "success": True,
            "message": f"Would start Appium session for {platform} on {device}",
            "note": "Appium integration requires appium-python-client and Appium server",
            "session_id": "placeholder-session-id",
        }

    # ============================================
    # Performance Testing (k6)
    # ============================================

    async def run_k6_load_test(
        self,
        script_path: str,
        virtual_users: int = 10,
        duration: str = "30s",
    ) -> Dict[str, Any]:
        """
        Execute k6 load test

        Args:
            script_path: Path to k6 test script (.js)
            virtual_users: Number of virtual users
            duration: Test duration (e.g., "30s", "5m")

        Returns:
            Dict with load test results
        """
        try:
            cmd = [
                "k6",
                "run",
                "--vus",
                str(virtual_users),
                "--duration",
                duration,
                script_path,
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600,  # 10 minute timeout
                cwd=str(self.repo_path),
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "virtual_users": virtual_users,
                "duration": duration,
            }

        except FileNotFoundError:
            return {
                "success": False,
                "error": "k6 not found. Install from https://k6.io/docs/getting-started/installation/",
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Load test timeout (10 minutes)"}
        except Exception as e:
            return {"success": False, "error": str(e)}
