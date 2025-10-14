#!/usr/bin/env python3
"""
Simple Crime Data Scraper - No Emojis Version
"""

import os
import sys
from crime_data_scraper import AthensCrimeScraper

def main():
    print("Pathly Crime Data Scraper")
    print("=" * 40)
    print()
    
    scraper = AthensCrimeScraper()
    
    print("Choose your data source:")
    print("1. Generate sample data (1000 records) - Quick test")
    print("2. Scrape from Greek Police website")
    print("3. Scrape from Open Data Portal")
    print("4. Scrape from news websites")
    print("5. Import from manual file")
    print("6. All of the above")
    print()
    
    choice = input("Enter your choice (1-6): ").strip()
    
    if choice == "1":
        print("\nGenerating sample data...")
        scraper.generate_sample_data(1000)
        
    elif choice == "2":
        print("\nScraping Greek Police data...")
        print("Enter the base URL (e.g., https://www.astynomia.gr/incidents):")
        url = input("URL: ").strip()
        if url:
            scraper.scrape_greek_police_data(url, max_pages=5)
        else:
            print("No URL provided, generating sample data instead...")
            scraper.generate_sample_data(1000)
    
    elif choice == "3":
        print("\nScraping Open Data Portal...")
        print("Enter the API URL (e.g., https://data.gov.gr/api):")
        api_url = input("API URL: ").strip()
        if api_url:
            scraper.scrape_open_data_portal(api_url, "crime-data")
        else:
            print("No API URL provided, generating sample data instead...")
            scraper.generate_sample_data(1000)
    
    elif choice == "4":
        print("\nScraping news websites...")
        print("Enter news URLs (one per line, empty line to finish):")
        urls = []
        while True:
            url = input("URL: ").strip()
            if not url:
                break
            urls.append(url)
        
        if urls:
            scraper.scrape_news_sources(urls)
        else:
            print("No URLs provided, generating sample data instead...")
            scraper.generate_sample_data(1000)
    
    elif choice == "5":
        print("\nImporting manual data...")
        print("Enter the path to your data file (JSON or CSV):")
        file_path = input("File path: ").strip()
        if file_path and os.path.exists(file_path):
            scraper.scrape_manual_data(file_path)
        else:
            print("File not found, generating sample data instead...")
            scraper.generate_sample_data(1000)
    
    elif choice == "6":
        print("\nRunning all scraping methods...")
        
        # Generate sample data
        scraper.generate_sample_data(500)
        
        # Try to scrape from common sources
        print("\nTrying Greek Police...")
        try:
            scraper.scrape_greek_police_data("https://www.astynomia.gr/incidents", max_pages=2)
        except:
            print("   Greek Police scraping failed, continuing...")
        
        print("\nTrying Open Data Portal...")
        try:
            scraper.scrape_open_data_portal("https://data.gov.gr/api", "crime-data")
        except:
            print("   Open Data Portal scraping failed, continuing...")
        
        print("\nTrying news sources...")
        news_urls = [
            "https://www.kathimerini.gr/",
            "https://www.efsyn.gr/",
            "https://www.tanea.gr/"
        ]
        try:
            scraper.scrape_news_sources(news_urls)
        except:
            print("   News scraping failed, continuing...")
    
    else:
        print("Invalid choice, generating sample data...")
        scraper.generate_sample_data(1000)
    
    # Save the data
    print(f"\nSaving data...")
    success = scraper.save_to_csv('athens_crime_data.csv')
    
    if success:
        print("\nData Summary:")
        scraper.print_summary()
        
        print(f"\nSuccess! Crime data saved to athens_crime_data.csv")
        print("\nNext steps:")
        print("   1. Review the CSV file")
        print("   2. Run: python crime_data_processor.py")
        print("   3. Start the server: python app.py")
    else:
        print("\nFailed to save data!")

if __name__ == "__main__":
    main()
