from playwright.sync_api import sync_playwright
from dataclasses import dataclass, asdict, field
import pandas as pd
import openpyxl
import os
import sys
import argparse
import json  # Adicionado para trabalhar com JSON

@dataclass
class Business:
    """Holds business data"""
    name: str = None
    address: str = None
    website: str = None
    phone_number: str = None
    reviews_count: int = None
    reviews_average: float = None
    latitude: float = None
    longitude: float = None


@dataclass
class BusinessList:
    """Holds list of Business objects and saves to both Excel and CSV"""
    business_list: list[Business] = field(default_factory=list)
    save_at: str = 'output'

    def dataframe(self) -> pd.DataFrame:
        """Transforms business_list to a pandas DataFrame"""
        return pd.json_normalize(
            (asdict(business) for business in self.business_list), sep="_"
        )

    def save_to_excel(self, filename: str):
        """Saves pandas DataFrame to an Excel (xlsx) file"""
        if not os.path.exists(self.save_at):
            os.makedirs(self.save_at)
        self.dataframe().to_excel(os.path.join(self.save_at, f"{filename}.xlsx"), index=False)

    def save_to_csv(self, filename: str):
        """Saves pandas DataFrame to a CSV file"""
        if not os.path.exists(self.save_at):
            os.makedirs(self.save_at)
        self.dataframe().to_csv(os.path.join(self.save_at, f"{filename}.csv"), index=False)

    def to_json(self) -> str:
        """Converts the business list to a JSON string"""
        return json.dumps([asdict(business) for business in self.business_list], ensure_ascii=False, indent=4)


def extract_coordinates_from_url(url: str) -> tuple[float, float]:
    """Helper function to extract coordinates from a URL"""
    try:
        coordinates = url.split('/@')[-1].split('/')[0]
        latitude, longitude = map(float, coordinates.split(',')[:2])
        return latitude, longitude
    except (IndexError, ValueError) as e:
        print(f"Error extracting coordinates from URL '{url}': {e}")
        return None, None


def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Scrape Google Maps data.")
    parser.add_argument("--totalResults", type=int, required=True, help="Total number of results to scrape.")
    parser.add_argument("--state", type=str, required=True, help="State for the search.")
    parser.add_argument("--city", type=str, required=True, help="City for the search.")
    parser.add_argument("--segment", type=str, required=True, help="Business segment to search for.")
    args = parser.parse_args()

    total_results = args.totalResults
    state = args.state
    city = args.city
    segment = args.segment

    search_term = f"{segment} em {city} {state}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # Set headless=True for production
        page = browser.new_page()

        page.goto("https://www.google.com/maps", timeout=60000)
        page.wait_for_timeout(5000)

        search_box = page.locator('//input[@id="searchboxinput"]')
        search_box.fill(search_term)
        page.keyboard.press("Enter")
        page.wait_for_timeout(5000)

        page.hover('//a[contains(@href, "https://www.google.com/maps/place")]')

        business_list = BusinessList()
        previously_counted = 0

        while True:
            page.mouse.wheel(0, 10000)
            page.wait_for_timeout(3000)

            listings_locator = page.locator('//a[contains(@href, "https://www.google.com/maps/place")]')
            current_count = listings_locator.count()

            if current_count >= total_results:
                listings = listings_locator.all()[:total_results]
                break
            else:
                if current_count == previously_counted:
                    break
                else:
                    previously_counted = current_count

        for listing in listings:
            try:
                listing.click()
                page.wait_for_timeout(5000)

                business = Business()
                business.name = listing.get_attribute('aria-label')

                address = page.locator('//button[@data-item-id="address"]//div[contains(@class, "fontBodyMedium")]')
                business.address = address.first.inner_text() if address.count() > 0 else ""

                website = page.locator('//a[@data-item-id="authority"]//div[contains(@class, "fontBodyMedium")]')
                business.website = website.first.inner_text() if website.count() > 0 else ""

                phone = page.locator('//button[contains(@data-item-id, "phone:tel:")]//div[contains(@class, "fontBodyMedium")]')
                business.phone_number = phone.first.inner_text() if phone.count() > 0 else ""

                coordinates = extract_coordinates_from_url(page.url)
                business.latitude, business.longitude = coordinates

                business_list.business_list.append(business)
            except Exception as e:
                print(f"Error occurred while scraping listing: {e}")

        # Convert the list to JSON and write directly to stdout
        business_data_json = business_list.to_json()
        
        # Write JSON to standard output
        sys.stdout.write(business_data_json)

        # Optionally, save the data to a file
        filename_safe_search = f"google_maps_data_{segment}_{city}_{state}".replace(' ', '_').replace('/', '_')
        business_list.save_to_excel(filename_safe_search)
        business_list.save_to_csv(filename_safe_search)

        browser.close()


if __name__ == "__main__":
    main()
