// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get references to ALL the HTML elements ---
    const fileInput = document.getElementById('csv-upload');
    const statusMessage = document.getElementById('status-message');
    const previewContainer = document.getElementById('preview-container');

    // --- NEW: References for the dashboard components ---
    const dashboardContainer = document.getElementById('dashboard-container');
    const overallStatsContainer = document.getElementById('overall-stats-cards');
    const columnGridContainer = document.getElementById('column-details-grid');


    // --- 2. Add the event listener for the file input ---
    fileInput.addEventListener('change', handleFileSelect);

    /**
     * Handles the file selection event and the entire analysis workflow.
     */
    async function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            statusMessage.textContent = 'No file selected.';
            return;
        }

        // --- Clear previous results on new upload ---
        previewContainer.innerHTML = '';
        dashboardContainer.classList.add('hidden'); // Hide old dashboard

        // --- 3. Step 1: Upload the file ---
        statusMessage.textContent = `Uploading "${file.name}"...`;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadResponse = await fetch('http://127.0.0.1:8000/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed with status: ${uploadResponse.status}`);
            }

            const uploadResult = await uploadResponse.json();
            
            // --- 4. Display the initial preview table ---
            displayPreview(uploadResult.preview);
            statusMessage.textContent = 'Upload successful! Generating summary...';

            // --- 5. Step 2: Fetch the full summary analysis ---
            const summaryResponse = await fetch(`http://127.0.0.1:8000/summarize/${uploadResult.filename}`);
            if (!summaryResponse.ok) {
                throw new Error(`Summary failed with status: ${summaryResponse.status}`);
            }

            const summaryData = await summaryResponse.json();
            
            // --- 6. Build the dashboard with the summary data ---
            buildDashboard(summaryData);
            statusMessage.textContent = 'Analysis complete!';

        } catch (error) {
            console.error('Error:', error);
            statusMessage.textContent = `Error: ${error.message}`;
        }
    }

    /**
     * Renders the data preview as an HTML table.
     */
    function displayPreview(data) {
        if (!data || data.length === 0) {
            previewContainer.innerHTML = '<p>No preview data available.</p>';
            return;
        }
        const headers = Object.keys(data[0]);
        let tableHTML = '<table><thead><tr>';
        headers.forEach(header => tableHTML += `<th>${header}</th>`);
        tableHTML += '</tr></thead><tbody>';

        data.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach(header => tableHTML += `<td>${row[header]}</td>`);
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        previewContainer.innerHTML = tableHTML;
    }

    /**
     * --- NEW: Builds the entire summary dashboard from summary data ---
     */
    function buildDashboard(data) {
        // Clear previous results
        overallStatsContainer.innerHTML = '';
        columnGridContainer.innerHTML = '';

        // Build Overall Stat Cards
        const stats = data.overall_stats;
        overallStatsContainer.innerHTML = `
            <div class="stat-card"><h3>${stats.rows}</h3><p>Rows</p></div>
            <div class="stat-card"><h3>${stats.columns}</h3><p>Columns</p></div>
            <div class="stat-card"><h3>${stats.missing_cells}</h3><p>Missing Cells</p></div>
            <div class="stat-card"><h3>${stats.missing_cells_percent}%</h3><p>Missing (%)</p></div>
        `;

        // Build Column Detail Cards
        data.column_details.forEach(col => {
            const colCard = document.createElement('div');
            colCard.className = 'column-card';
            
            let cardContent = `
                <h3>${col.column_name}</h3>
                <p><strong>Type:</strong> ${col.data_type}</p>
                <p><strong>Missing:</strong> ${col.missing_values}</p>
            `;

            if (col.type === 'numeric') {
                cardContent += `
                    <p><strong>Mean:</strong> ${col.stats.mean}</p>
                    <p><strong>Std Dev:</strong> ${col.stats.std}</p>
                    <p><strong>Min:</strong> ${col.stats.min} | <strong>Max:</strong> ${col.stats.max}</p>
                    <canvas id="hist-${col.column_name}"></canvas>
                `;
            } else if (col.type === 'categorical') {
                cardContent += `<p><strong>Unique Values:</strong> ${col.unique_values}</p>`;
                // You can add a bar chart for value_counts here as well
            }
            
            colCard.innerHTML = cardContent;
            columnGridContainer.appendChild(colCard);

            // Render Charts
            if (col.type === 'numeric' && col.histogram) {
                const ctx = document.getElementById(`hist-${col.column_name}`).getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: col.histogram.bins.slice(1).map(b => b.toFixed(1)),
                        datasets: [{
                            label: 'Frequency',
                            data: col.histogram.counts,
                            backgroundColor: 'rgba(0, 123, 255, 0.5)',
                            borderColor: 'rgba(0, 123, 255, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: { 
                        scales: { x: { ticks: { maxRotation: 70, minRotation: 70 } } },
                        plugins: { legend: { display: false } } 
                    }
                });
            }
        });

        dashboardContainer.classList.remove('hidden'); // Show the populated dashboard
    }
});