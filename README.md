# Interactive Data Tool
A web application where a user can upload a data file (e.g. a CSV) and instantly get back a comprehensive, interactive dashboard for Exploratory Data Analysis (EDA) without writing a single line of code. Think of it as a simplified, web-based version of tools like Tableau or Power BI.

Allows users to upload a CSV file and instantly view:

- A data preview table

- A summary dashboard with row/column stats

- Column details (numeric stats, unique values, and histograms for numeric columns)

- Built with HTML, CSS, JavaScript, and Chart.js
 for visualisations.
- Requires a backend API to handle CSV uploads and summarisation.

# Features

- Upload a CSV file from your computer

- View the first few rows in a preview table

- Get overall dataset statistics (rows, columns, missing values)

- Explore per-column details:

   - Numeric columns → mean, std dev, min, max, histogram

   - Categorical columns → count of unique values

- Interactive charts powered by Chart.js

- Responsive design with styled dashboard cards

# Usage  
- Click “Upload CSV” and select your file.  
- The dashboard will load and display a preview table of the first 5 rows.  
- Navigate to “Summary” to see global stats.  
- Click on any column name to view detailed stats and a histogram or bar chart.  

