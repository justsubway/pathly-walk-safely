#!/usr/bin/env python3
"""
Auto Crime Data Scraper - Non-interactive
Automatically generates sample data and tries to scrape from known sources
"""

import os
import sys
from crime_data_scraper import AthensCrimeScraper

def main():
    print("Pathly Crime Data Scraper - Auto Mode")
    print("=" * 45)
    print()
    
    scraper = AthensCrimeScraper()
    
    # Generate sample data first
    print("1. Generating sample data (1000 records)...")
    scraper.generate_sample_data(1000)
    
    # Try to scrape from Greek Police
    print("\n2. Trying Greek Police website...")
    try:
        scraper.scrape_greek_police_data("https://www.astynomia.gr/incidents", max_pages=2)
        print("   Greek Police data scraped successfully!")
    except Exception as e:
        print(f"   Greek Police scraping failed: {e}")
    
    # Try Open Data Portal
    print("\n3. Trying Greek Open Data Portal...")
    try:
        scraper.scrape_open_data_portal("https://data.gov.gr/api", "crime-data")
        print("   Open Data Portal data scraped successfully!")
    except Exception as e:
        print(f"   Open Data Portal scraping failed: {e}")
    
    # Try news sources
    print("\n4. Trying Greek news websites...")
    news_urls = [
        "https://www.kathimerini.gr/",
        "https://www.efsyn.gr/",
        "https://www.tanea.gr/"
    ]
    try:
        scraper.scrape_news_sources(news_urls)
        print("   News data scraped successfully!")
    except Exception as e:
        print(f"   News scraping failed: {e}")
    
    # Save the data
    print(f"\n5. Saving data...")
    success = scraper.save_to_csv('athens_crime_data.csv')
    
    if success:
        print("\nData Summary:")
        scraper.print_summary()
        
        print(f"\nSUCCESS! Crime data saved to athens_crime_data.csv")
        print(f"Total records: {len(scraper.scraped_data)}")
        print("\nNext steps:")
        print("   1. Review the CSV file")
        print("   2. Run: python crime_data_processor.py")
        print("   3. Start the server: python app.py")
    else:
        print("\nFAILED to save data!")

if __name__ == "__main__":
    main()
