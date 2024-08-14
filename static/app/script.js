document.addEventListener('DOMContentLoaded', function() {
    const paneGrid = document.getElementById('pane-grid');
    const rowSlider = document.getElementById('row-slider');
    const rowCountSpan = document.getElementById('row-count');
    const plotModal = document.getElementById('plot-modal');
    const matchSelect = document.getElementById('match-select');
    const plotSelect = document.getElementById('plot-select');
    let activePane = null;
    let plotTypes = {}; // Object to store plot types for each pane


    function createGrid(rows) {
        const currentPanes = {}; // Store existing panes' content

        // Store current pane content and plot types
        document.querySelectorAll('.pane').forEach(pane => {
            const paneId = pane.getAttribute('data-id');
            currentPanes[paneId] = pane.innerHTML;
            plotTypes[paneId] = plotTypes[paneId] || null;
        });

        paneGrid.innerHTML = ''; // Clear existing panes
        const totalPanes = rows * 3; // 3 columns
        for (let i = 1; i <= totalPanes; i++) {
            const pane = document.createElement('div');
            pane.className = 'pane';
            const column = (i - 1) % 3 + 1; // Determine the column (1, 2, or 3)
            const paneId = `pane${i}`;
            pane.setAttribute('data-id', paneId);
            pane.setAttribute('data-column', column); // Set the column attribute
            
            // Restore the content if it exists
            if (currentPanes[paneId]) {
                pane.innerHTML = currentPanes[paneId];
            }

            pane.addEventListener('click', function() {
                activePane = this;
                showPlotOptions(column); // Show options based on the column
                plotModal.style.display = 'block';
            });

            paneGrid.appendChild(pane);
        }
    }


    function showPlotOptions(column) {
        plotSelect.innerHTML = ''; // Clear existing options
        let options = [];

        if (column === 2) {
            options = middleCharts;
        } else {
            options = sideCharts;
        }

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            plotSelect.appendChild(opt);
        });
    }


    function clearPlots() {
        const panes = document.querySelectorAll('.pane');
        panes.forEach(pane => {
            pane.innerHTML = ''; // Clear the content of each pane
        });
    }


    document.getElementById('generate-plot').onclick = function() {
        if (activePane) {
            let plotType = plotSelect.value;
            let paneId = activePane.getAttribute('data-id');
            plotTypes[paneId] = plotType; // Save the plot type for the active pane
            let matchId = matchSelect.value; // Get the selected match ID
            let column = activePane.getAttribute('data-column'); // Get the column number

            fetch('/generate_plot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 'plot_type': plotType, 'match_id': matchId, 'column': column })
            })
            .then(response => response.json())
            .then(data => {
                activePane.innerHTML = '<img src="data:image/png;base64,' + data.img_data + '" alt="Selected Plot">';
                plotModal.style.display = 'none';
            });
        }
    };

    function loadDashboardHeader() {
        let matchId = matchSelect.value;

        fetch('/create_dashboard_header', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'match_id': matchId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.img_data) {
                document.getElementById('header-image').src = 'data:image/png;base64,' + data.img_data;
            }
        });
    }
    window.onload = loadDashboardHeader;


    rowSlider.addEventListener('input', function() {
        const rows = this.value;
        rowCountSpan.textContent = rows;
        createGrid(rows);
    });


    matchSelect.addEventListener('change', function() {
        clearPlots(); // Clear all plots when the match changes
        loadDashboardHeader();
    });

    // Initialize grid with default value (2 rows)
    createGrid(rowSlider.value);

    document.getElementById('save-dashboard').addEventListener('click', function() {
        let matchId = matchSelect.value;
        const panes = document.querySelectorAll('.pane');
        let dashboardData = [];
        
        panes.forEach(pane => {
            const paneId = pane.getAttribute('data-id');
            const plotType = plotTypes[paneId] || 'None'; // Default to 'None' if no plot type
            const column = pane.getAttribute('data-column');
            dashboardData.push({ paneId, plotType, column });
        });
    
        fetch('/save_dashboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dashboard: dashboardData, 'match_id': matchId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Trigger the download of the dashboard image
                window.location.href = '/download_dashboard/' + data.filename;
            } else {
                alert('Failed to save the dashboard.');
            }
        });
    });
    

});
