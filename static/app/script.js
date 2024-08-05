document.addEventListener('DOMContentLoaded', function() {
    const paneGrid = document.getElementById('pane-grid');
    const rowSlider = document.getElementById('row-slider');
    const rowCountSpan = document.getElementById('row-count');
    const plotModal = document.getElementById('plot-modal');
    const matchSelect = document.getElementById('match-select');
    let activePane = null;

    function createGrid(rows) {
        paneGrid.innerHTML = ''; // Clear existing panes
        const totalPanes = rows * 3; // 3 columns
        for (let i = 1; i <= totalPanes; i++) {
            const pane = document.createElement('div');
            pane.className = 'pane';
            pane.setAttribute('data-id', `pane${i}`);
            pane.addEventListener('click', function() {
                activePane = this;
                plotModal.style.display = 'block';
            });
            paneGrid.appendChild(pane);
        }
    }

    document.getElementById('generate-plot').onclick = function() {
        let plotType = document.getElementById('plot-select').value;
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

    // Event listener for match selection change
    matchSelect.addEventListener('change', function() {
        let matchId = this.value;
        console.log('Selected match ID:', matchId);
        // Optionally, update the grid or perform other actions based on the selected match ID
    });

    // Initialize grid with default value (2 rows)
    createGrid(rowSlider.value);
});
