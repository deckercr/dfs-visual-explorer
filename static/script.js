// ============================================================================
// MAIN EVENT LISTENER - Wait for DOM to be fully loaded before running code
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    
    /**
     * Ensures a number input contains an odd value.
     * Used for maze dimensions which must be odd for the generation algorithm.
     * 
     * @param {HTMLInputElement} input - The input element to check/modify
     * @returns {number} The odd value
     */
    function ensureOdd(input) {
        let value = parseInt(input.value);
        // If the value is even, add 1 to make it odd
        if (value % 2 === 0) {
            value += 1;
            input.value = value;
        }
        return value;
    }

    // ========================================================================
    // TOWER OF HANOI LOGIC
    // ========================================================================
    
    // Get the "Generate & Solve" button for Tower of Hanoi
    const generateSolveHanoiBtn = document.getElementById('generateSolveHanoi');
    
    // Only attach event listener if the button exists on this page
    if (generateSolveHanoiBtn) {
        generateSolveHanoiBtn.addEventListener('click', async () => {
            // Get DOM elements we'll need
            const numDisks = document.getElementById('numDisks').value;
            const hanoiTimeSpan = document.getElementById('hanoiTime');
            const hanoiMemorySpan = document.getElementById('hanoiMemory');
            const hanoiMovesList = document.getElementById('hanoiMoves');
            const pegA = document.getElementById('pegA');
            const pegB = document.getElementById('pegB');
            const pegC = document.getElementById('pegC');

            // Clear previous results and show loading states
            hanoiMovesList.innerHTML = '';
            hanoiTimeSpan.textContent = 'Solving...';
            hanoiMemorySpan.textContent = 'Calculating...';

            // Clear any existing disks from all pegs
            [pegA, pegB, pegC].forEach(peg => {
                Array.from(peg.querySelectorAll('.disk')).forEach(disk => disk.remove());
            });

            // Create initial visualization with all disks on Peg A
            // Loop from largest (numDisks) to smallest (1)
            for (let i = numDisks; i >= 1; i--) {
                const disk = document.createElement('div');
                disk.classList.add('disk');
                // Make larger disks wider (40px base + 15px per disk size)
                disk.style.width = `${40 + i * 15}px`;
                // Store disk number as data attribute for later reference
                disk.dataset.disk = i;
                // Prepend so smallest disk ends up on top
                pegA.prepend(disk);
            }

            try {
                // Send request to Flask backend to solve the puzzle
                const response = await fetch('/generate_and_solve_hanoi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ num_disks: parseInt(numDisks) })
                });
                const data = await response.json();

                // Update performance metrics from backend
                hanoiTimeSpan.textContent = data.time_taken;
                hanoiMemorySpan.textContent = data.memory_used;

                // Animate the solution step by step
                await animateHanoi(data.solution, pegA, pegB, pegC, hanoiMovesList);

            } catch (error) {
                // Handle any errors (network issues, backend errors, etc.)
                console.error('Error:', error);
                hanoiTimeSpan.textContent = 'Error';
                hanoiMemorySpan.textContent = 'Error';
            }
        });
    }

    /**
     * Animates the Tower of Hanoi solution by moving disks between pegs.
     * Each move is displayed in the moves list and animated on screen.
     * 
     * @param {Array} moves - Array of move strings like "Move disk 1 from A to C"
     * @param {HTMLElement} pegA - DOM element for Peg A
     * @param {HTMLElement} pegB - DOM element for Peg B
     * @param {HTMLElement} pegC - DOM element for Peg C
     * @param {HTMLElement} movesListElement - List element to display moves
     */
    async function animateHanoi(moves, pegA, pegB, pegC, movesListElement) {
        // Create a lookup object to easily access pegs by name
        const pegs = { 'A': pegA, 'B': pegB, 'C': pegC };

        // Process each move one at a time
        for (const move of moves) {
            // Add move to the list display
            const li = document.createElement('li');
            li.textContent = move;
            movesListElement.appendChild(li);
            // Auto-scroll to show the latest move
            movesListElement.scrollTop = movesListElement.scrollHeight;

            // Parse the move string to extract information
            // Example: "Move disk 2 from A to C" -> ['Move', 'disk', '2', 'from', 'A', 'to', 'C']
            const parts = move.split(' ');
            const diskNumber = parts[2];        // '2'
            const sourcePegName = parts[4];     // 'A'
            const destPegName = parts[6];       // 'C'

            // Get the actual DOM elements for source and destination pegs
            const sourcePeg = pegs[sourcePegName];
            const destPeg = pegs[destPegName];

            // Find the disk element we need to move
            const diskToMove = sourcePeg.querySelector(`[data-disk="${diskNumber}"]`);
            
            if (diskToMove) {
                // ANIMATION PHASE 1: Lift the disk up
                const originalTop = diskToMove.offsetTop;
                diskToMove.style.transform = `translateY(-${originalTop + 50}px)`;
                await new Promise(r => setTimeout(r, 200)); // Wait 200ms

                // ANIMATION PHASE 2: Move the disk horizontally
                // Calculate the horizontal distance between pegs
                const destPegRect = destPeg.getBoundingClientRect();
                const sourcePegRect = sourcePeg.getBoundingClientRect();
                const offsetX = (destPegRect.left + destPegRect.width / 2) - 
                               (sourcePegRect.left + sourcePegRect.width / 2);
                diskToMove.style.transform += ` translateX(${offsetX}px)`;
                await new Promise(r => setTimeout(r, 200)); // Wait 200ms

                // ANIMATION PHASE 3: Drop the disk onto the destination peg
                // Remove from source peg and add to destination peg
                diskToMove.remove();
                destPeg.prepend(diskToMove);
                // Reset transform so disk sits naturally on new peg
                diskToMove.style.transform = `translateY(0) translateX(0)`;
                await new Promise(r => setTimeout(r, 300)); // Wait 300ms
            }
            
            // Small delay between moves for readability
            await new Promise(r => setTimeout(r, 100));
        }
    }

    // ========================================================================
    // SUDOKU LOGIC
    // ========================================================================
    
    // Get the "Generate & Solve" button for Sudoku
    const generateSolveSudokuBtn = document.getElementById('generateSolveSudoku');
    
    // Only attach event listener if the button exists on this page
    if (generateSolveSudokuBtn) {
        generateSolveSudokuBtn.addEventListener('click', async () => {
            // Get DOM elements we'll need
            const difficulty = document.getElementById('sudokuDifficulty').value;
            const sudokuTimeSpan = document.getElementById('sudokuTime');
            const sudokuMemorySpan = document.getElementById('sudokuMemory');
            const sudokuPuzzleGrid = document.getElementById('sudokuPuzzleGrid');
            const sudokuSolvedGrid = document.getElementById('sudokuSolvedGrid');

            // Clear previous results and show loading states
            sudokuPuzzleGrid.innerHTML = '';
            sudokuSolvedGrid.innerHTML = '';
            sudokuTimeSpan.textContent = 'Solving...';
            sudokuMemorySpan.textContent = 'Calculating...';

            try {
                // Send request to Flask backend to generate and solve puzzle
                const response = await fetch('/generate_and_solve_sudoku', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ difficulty: parseInt(difficulty) })
                });
                const data = await response.json();

                // Update performance metrics from backend
                sudokuTimeSpan.textContent = data.time_taken;
                sudokuMemorySpan.textContent = data.memory_used;

                // Display the puzzle and solution if successful
                if (data.success) {
                    // Render the original puzzle (with empty cells)
                    renderSudokuGrid(data.puzzle, sudokuPuzzleGrid, false);
                    // Render the solution (highlighting filled cells)
                    renderSudokuGrid(data.solution, sudokuSolvedGrid, true, data.puzzle);
                } else {
                    // Handle failure case
                    sudokuPuzzleGrid.textContent = 'Failed to generate a solvable puzzle or find a solution.';
                    sudokuSolvedGrid.textContent = 'No solution found.';
                }

            } catch (error) {
                // Handle any errors (network issues, backend errors, etc.)
                console.error('Error:', error);
                sudokuTimeSpan.textContent = 'Error';
                sudokuMemorySpan.textContent = 'Error';
            }
        });
    }

    /**
     * Renders a Sudoku grid to the DOM.
     * Creates a 9x9 grid of cells with appropriate styling.
     * 
     * @param {Array} grid - 9x9 array of numbers (0 for empty cells)
     * @param {HTMLElement} targetElement - Container element to render into
     * @param {boolean} isSolution - Whether this is showing the solution
     * @param {Array} originalPuzzle - The original puzzle (for highlighting)
     */
    function renderSudokuGrid(grid, targetElement, isSolution = false, originalPuzzle = null) {
        // Clear any existing content
        targetElement.innerHTML = '';
        
        // Loop through each row
        grid.forEach((row, rowIndex) => {
            // Loop through each cell in the row
            row.forEach((cellValue, colIndex) => {
                // Create a div for this cell
                const cell = document.createElement('div');
                cell.classList.add('sudoku-cell');
                
                // Only show non-zero values
                if (cellValue !== 0) {
                    cell.textContent = cellValue;
                    
                    // If showing solution, highlight cells that were solved by algorithm
                    if (isSolution && originalPuzzle && originalPuzzle[rowIndex][colIndex] === 0) {
                        cell.classList.add('solution-cell');
                    } 
                    // If showing puzzle, mark pre-filled cells
                    else if (!isSolution) {
                        cell.classList.add('filled');
                    }
                }
                
                // Add cell to the grid
                targetElement.appendChild(cell);
            });
        });
    }

    // ========================================================================
    // MAZE LOGIC
    // ========================================================================
    
    // Get DOM elements for maze
    const generateSolveMazeBtn = document.getElementById('generateSolveMaze');
    const mazeWidthInput = document.getElementById('mazeWidth');
    const mazeHeightInput = document.getElementById('mazeHeight');
    
    // Only set up maze functionality if button exists on this page
    if (generateSolveMazeBtn) {
        
        // Ensure width input is odd when user leaves the field
        if (mazeWidthInput) {
            mazeWidthInput.addEventListener('blur', function() {
                ensureOdd(this);
            });
        }
        
        // Ensure height input is odd when user leaves the field
        if (mazeHeightInput) {
            mazeHeightInput.addEventListener('blur', function() {
                ensureOdd(this);
            });
        }

        // Handle click on "Generate & Solve Maze" button
        generateSolveMazeBtn.addEventListener('click', async () => {
            // Get and ensure dimensions are odd (required for maze algorithm)
            const width = ensureOdd(mazeWidthInput);
            const height = ensureOdd(mazeHeightInput);
            
            // Get DOM elements we'll need
            const mazeTimeSpan = document.getElementById('mazeTime');
            const mazeMemorySpan = document.getElementById('mazeMemory');
            const mazeGridContainer = document.getElementById('mazeGrid');
            const mazeStatus = document.getElementById('mazeStatus');

            // Clear previous results and show loading states
            mazeGridContainer.innerHTML = '';
            mazeTimeSpan.textContent = 'Solving...';
            mazeMemorySpan.textContent = 'Calculating...';
            mazeStatus.textContent = '';

            try {
                // Send request to Flask backend to generate and solve maze
                const response = await fetch('/generate_and_solve_maze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ width: parseInt(width), height: parseInt(height) })
                });
                const data = await response.json();

                // Update performance metrics from backend
                mazeTimeSpan.textContent = data.time_taken;
                mazeMemorySpan.textContent = data.memory_used;

                // Display maze if generated successfully
                if (data.maze) {
                    // Render the maze structure (walls and paths)
                    renderMaze(data.maze, mazeGridContainer);
                    
                    // If a solution path was found, animate it
                    if (data.solution_path) {
                        mazeStatus.textContent = 'Maze Solved!';
                        await animateMazeSolution(data.solution_path, mazeGridContainer);
                    } else {
                        // No path exists from start to end
                        mazeStatus.textContent = 'No path found in maze.';
                    }
                } else {
                    // Maze generation failed
                    mazeStatus.textContent = 'Failed to generate maze.';
                }

            } catch (error) {
                // Handle any errors (network issues, backend errors, etc.)
                console.error('Error:', error);
                mazeTimeSpan.textContent = 'Error';
                mazeMemorySpan.textContent = 'Error';
            }
        });
    }

    /**
     * Renders a maze grid to the DOM.
     * Creates cells for each position, styling walls, paths, start, and end.
     * 
     * @param {Array} maze - 2D array where 1 = wall, 0 = path
     * @param {HTMLElement} targetElement - Container element to render into
     */
    function renderMaze(maze, targetElement) {
        // Clear any existing content
        targetElement.innerHTML = '';
        
        // Set up CSS Grid with appropriate number of columns
        // Each cell is 12px wide
        targetElement.style.gridTemplateColumns = `repeat(${maze[0].length}, 12px)`;

        // Loop through each row
        maze.forEach((row, rIndex) => {
            // Loop through each cell in the row
            row.forEach((cellValue, cIndex) => {
                // Create a div for this maze cell
                const cell = document.createElement('div');
                cell.classList.add('maze-cell');
                
                // Store row and column as data attributes for later reference
                // (needed when animating the solution path)
                cell.dataset.row = rIndex;
                cell.dataset.col = cIndex;

                // Style based on cell type
                if (cellValue === 1) {
                    // This is a wall
                    cell.classList.add('wall');
                } else {
                    // This is a path - check if it's start or end
                    // Start is at position (1, 1)
                    if (rIndex === 1 && cIndex === 1) {
                        cell.classList.add('start');
                    } 
                    // End is at position (height-2, width-2)
                    else if (rIndex === maze.length - 2 && cIndex === maze[0].length - 2) {
                        cell.classList.add('end');
                    }
                }
                
                // Add cell to the grid
                targetElement.appendChild(cell);
            });
        });
    }

    /**
     * Animates the solution path through the maze.
     * Highlights each cell in the path sequentially with a delay.
     * 
     * @param {Array} path - Array of [row, col] coordinates forming the solution path
     * @param {HTMLElement} mazeGridContainer - The maze grid container element
     */
    async function animateMazeSolution(path, mazeGridContainer) {
        // Process each position in the path sequentially
        for (let i = 0; i < path.length; i++) {
            // Get row and column from current path position
            const [r, c] = path[i];
            
            // Find the cell at this position using data attributes
            const cell = mazeGridContainer.querySelector(`.maze-cell[data-row="${r}"][data-col="${c}"]`);
            
            // If cell exists and isn't start/end, mark it as part of the path
            // (we don't want to change styling of start/end markers)
            if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                cell.classList.add('path');
            }
            
            // Wait 50ms before highlighting next cell
            // This creates the animated "path drawing" effect
            await new Promise(r => setTimeout(r, 50));
        }
    }
    
}); // End of DOMContentLoaded event listener

// ============================================================================
// SUMMARY OF ARCHITECTURE
// ============================================================================
/*
This file handles all frontend visualization and interaction for three
DFS algorithm demonstrations:

1. TOWER OF HANOI
   - Visualizes disks on three pegs
   - Animates disk movements with smooth transitions
   - Shows each move in a scrolling list
   - Uses CSS transforms for animation

2. SUDOKU
   - Displays puzzle and solution side-by-side
   - Highlights cells that were solved by the algorithm
   - Uses CSS Grid for 9x9 layout
   - Validates difficulty settings

3. MAZE
   - Generates random mazes with walls and paths
   - Visualizes maze as a grid of cells
   - Animates the solution path being discovered
   - Ensures dimensions are odd for proper generation

All three puzzles:
- Make async requests to Flask backend for solving
- Display performance metrics (time and memory)
- Handle loading states and errors gracefully
- Use modern JavaScript (async/await, arrow functions)
*/