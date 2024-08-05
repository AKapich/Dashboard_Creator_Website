document.addEventListener('DOMContentLoaded', function() {
    const paneGrid = document.getElementById('pane-grid');
    const rowSlider = document.getElementById('row-slider');
    const rowCountSpan = document.getElementById('row-count');
    const plotModal = document.getElementById('plot-modal');
    const matchSelect = document.getElementById('match-select');
    const plotSelect = document.getElementById('plot-select');
    let activePane = null;

    function createGrid(rows) {
        paneGrid.innerHTML = ''; // Clear existing panes
        const totalPanes = rows * 3; // 3 columns
        for (let i = 1; i <= totalPanes; i++) {
            const pane = document.createElement('div');
            pane.className = 'pane';
            const column = (i - 1) % 3 + 1; // Determine the column (1, 2, or 3)
            pane.setAttribute('data-id', `pane${i}`);
            pane.setAttribute('data-column', column); // Set the column attribute
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

    document.getElementById('generate-plot').onclick = function() {
        let plotType = plotSelect.value;
        let matchId = matchSelect.value; // Get the selected match ID
        fetch('/generate_plot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'plot_type': plotType, 'match_id': matchId })
        })
        .then(response => response.json())
        .then(data => {
            if (activePane) {
                activePane.innerHTML = '<img src="data:image/png;base64,' + data.img_data + '" alt="Selected Plot">';
                plotModal.style.display = 'none';
            }
        });
    };

    rowSlider.addEventListener('input', function() {
        const rows = this.value;
        rowCountSpan.textContent = rows;
        createGrid(rows);
    });

    // Initialize grid with default value (2 rows)
    createGrid(rowSlider.value);
});
