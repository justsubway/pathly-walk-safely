# Athens Crime Data CSV Template

This template provides the structure for feeding accurate crime data into the Pathly AI system.

## File: `athens_crime_data_template.csv`

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `date` | Date | Date of incident (YYYY-MM-DD) | 2024-01-15 |
| `time` | Time | Time of incident (HH:MM:SS) | 14:30:00 |
| `datetime` | DateTime | Combined date and time | 2024-01-15 14:30:00 |
| `latitude` | Float | Latitude coordinate | 37.9755 |
| `longitude` | Float | Longitude coordinate | 23.7348 |
| `incident_type` | String | Primary incident category | Theft, Assault, Robbery |
| `offense` | String | Specific offense description | Petty Theft, Armed Robbery |
| `description` | String | Detailed incident description | Theft of personal belongings |
| `location` | String | Specific location name | Syntagma Square |
| `neighborhood` | String | Neighborhood/district | Plaka, Monastiraki |
| `district` | String | Administrative district | Athens |
| `severity` | String | Severity level | Low, Medium, High |
| `weapon_used` | String | Weapon involved | None, Knife, Gun |
| `arrest_made` | Boolean | Whether arrest was made | Yes, No |
| `victim_count` | Integer | Number of victims | 1, 2, 3 |
| `officer_id` | String | Officer identifier | OFF001 |
| `case_number` | String | Unique case identifier | ATH-2024-001 |
| `status` | String | Case status | Open, Closed |

### Data Quality Guidelines

1. **Geographic Accuracy**: Ensure coordinates are within Athens bounds:
   - Latitude: 37.85 to 38.1
   - Longitude: 23.55 to 23.95

2. **Time Format**: Use consistent 24-hour format for time fields

3. **Incident Types**: Use standardized categories:
   - Theft (Petty Theft, Burglary, Vehicle Theft)
   - Assault (Simple Assault, Aggravated Assault)
   - Robbery (Street Robbery, Armed Robbery)
   - Vandalism (Property Damage, Graffiti)
   - Drugs (Possession, Distribution)
   - Fraud (Identity Theft, Credit Card Fraud)

4. **Severity Levels**:
   - Low: Minor offenses, no injury
   - Medium: Moderate offenses, minor injury
   - High: Serious offenses, major injury or weapon use

### AI Training Impact

The AI system uses this data to:
- Learn crime patterns by time of day
- Identify high-risk areas geographically
- Predict safety scores for routes
- Generate risk explanations

### Data Processing

1. **Load the CSV** into the crime data processor
2. **Clean and validate** geographic and temporal data
3. **Categorize incidents** for safety scoring
4. **Train the AI model** on the processed data
5. **Generate spatial grid** for fast lookups

### Example Usage

```python
from crime_data_processor import AthensCrimeProcessor

processor = AthensCrimeProcessor('athens_crime_data_template.csv')
processor.load_and_inspect()
processor.clean_and_process_data()
```

### Performance Considerations

- Keep file size under 50MB for optimal processing
- Use consistent date/time formats
- Ensure all required fields are populated
- Validate geographic coordinates before processing

This template ensures the AI system receives high-quality, structured data for accurate safety predictions.
