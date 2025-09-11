// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get references to the HTML elements ---
    const fileInput = document.getElementById('csv-upload');
    const statusMessage = document.getElementById('status-message');
    const previewContainer = document.getElementById('preview-container');

    // --- 2. Add the event listener for the file input ---
    fileInput.addEventListener('change', handleFileSelect);

    /**
     * Handles the file selection event.
     * @param {Event} event - The file input change event.
     */
    async function handleFileSelect(event) {
        const file = event.target.files[0];

        if (!file) {
            statusMessage.textContent = 'No file selected.';
            return;
        }

        // --- 3. Prepare and send the file to the backend ---
        statusMessage.textContent = `Uploading "${file.name}"...`;
        const formData = new FormData();
        formData.append('file', file); // 'file' is the key the backend expects

        try {
            const response = await fetch('http://127.0.0.1:8000/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();
            statusMessage.textContent = 'File processed successfully!';
            
            // --- 4. Call a function to display the results ---
            displayPreview(result.preview);

        } catch (error) {
            console.error('Upload Error:', error);
            statusMessage.textContent = `Error: ${error.message}`;
        }
    }

    /**
     * Renders the data preview as an HTML table.
     * @param {Array<Object>} data - An array of objects representing rows.
     */
    function displayPreview(data) {
        if (!data || data.length === 0) {
            previewContainer.innerHTML = '<p>No data to display.</p>';
            return;
        }

        // Create the table structure dynamically
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
});