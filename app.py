from flask import Flask, render_template, request, jsonify
import time
import sys
import random

app = Flask(__name__)

# ============================================================================
# TOWER OF HANOI - DFS with Recursion
# ============================================================================

def solve_hanoi_dfs(n, source, destination, auxiliary, path_moves):
    """
    Solves the Tower of Hanoi puzzle using Depth-First Search (recursive approach).
    
    The algorithm uses divide-and-conquer: to move N disks, we:
    1. Move N-1 disks to the auxiliary peg (out of the way)
    2. Move the largest disk to the destination
    3. Move those N-1 disks from auxiliary to destination
    
    Args:
        n: Number of disks to move
        source: Starting peg (e.g., 'A')
        destination: Target peg (e.g., 'C')
        auxiliary: Helper peg (e.g., 'B')
        path_moves: List that collects all moves as strings
    """
    
    # BASE CASE: If only 1 disk, move it directly
    # This is the simplest problem we can solve without recursion
    if n == 1:
        path_moves.append(f"Move disk 1 from {source} to {destination}")
        return
    
    # RECURSIVE STEP 1: Move top N-1 disks to auxiliary peg
    # We use destination as temporary helper here
    # This gets the smaller disks out of the way
    solve_hanoi_dfs(n - 1, source, auxiliary, destination, path_moves)
    
    # STEP 2: Move the largest disk (disk N) to destination
    # Now that smaller disks are out of the way, this is safe
    path_moves.append(f"Move disk {n} from {source} to {destination}")
    
    # RECURSIVE STEP 3: Move those N-1 disks from auxiliary to destination
    # We use source as temporary helper now (it's empty!)
    # This completes the puzzle by stacking all disks on destination
    solve_hanoi_dfs(n - 1, auxiliary, destination, source, path_moves)

def generate_hanoi_puzzle(num_disks):
    # For Tower of Hanoi, generating a "random" puzzle is just defining the number of disks.
    # The complexity comes from the number of disks.
    return {"num_disks": num_disks}

@app.route('/hanoi')
def hanoi_page():
    return render_template('tower_of_hanoi.html')

@app.route('/generate_and_solve_hanoi', methods=['POST'])
def generate_and_solve_hanoi():
    num_disks = int(request.json.get('num_disks', 10)) # Default to 10 disks for complexity
    
    start_time = time.time()
    
    path_moves = []
    
    # Measure memory usage (approximate for DFS recursion)
    # This is a bit tricky for recursion directly. We'll capture sys.getsizeof for a representative structure.
    # A more accurate way might involve custom memory profiling or analyzing the recursion depth.
    initial_memory = sys.getsizeof(path_moves)
    solve_hanoi_dfs(num_disks, 'A', 'C', 'B', path_moves)
    final_memory = sys.getsizeof(path_moves)
    
    end_time = time.time()
    
    time_taken = (end_time - start_time) * 1000 # in milliseconds
    memory_used = (final_memory - initial_memory) / (1024 * 1024) # in MB
    
    return jsonify({
        "solution": path_moves,
        "time_taken": f"{time_taken:.2f} ms",
        "memory_used": f"{memory_used:.4f} MB"
    })

# ============================================================================
# SUDOKU - DFS with Backtracking
# ============================================================================

def solve_sudoku_dfs(board):
    """
    Solves a Sudoku puzzle using Depth-First Search with backtracking.
    
    The algorithm tries numbers 1-9 in each empty cell. If a number works,
    it recursively tries to solve the rest. If it hits a dead end, it
    backtracks by undoing the last move and trying a different number.
    
    Args:
        board: 9x9 list of lists, where 0 represents an empty cell
        
    Returns:
        True if puzzle is solved, False if no solution exists
    """
    
    # Find the next empty cell (returns position or None)
    find = find_empty(board)
    
    # BASE CASE: No empty cells left means puzzle is solved!
    if not find:
        return True
    else:
        # Unpack the position of the empty cell
        row, col = find

    # TRY each number from 1 to 9 in this empty cell
    for i in range(1, 10):
        # Check if this number is valid according to Sudoku rules
        if is_valid_sudoku_move(board, i, (row, col)):
            # Valid move! Place the number on the board
            board[row][col] = i

            # RECURSIVE CALL: Try to solve the rest of the puzzle
            # If this leads to a solution, we're done!
            if solve_sudoku_dfs(board):
                return True

            # BACKTRACK: That didn't work, so undo this move
            # Reset the cell to 0 and try the next number
            board[row][col] = 0
    
    # If we tried all numbers 1-9 and none worked, return False
    # This tells the previous recursion level to backtrack further
    return False

def find_empty(board):
    """
    Scans the Sudoku board to find the next empty cell.
    
    Args:
        board: 9x9 Sudoku grid
        
    Returns:
        Tuple (row, col) of first empty cell, or None if board is full
    """
    # Loop through all rows
    for r in range(9):
        # Loop through all columns in this row
        for c in range(9):
            # If we find an empty cell (marked with 0), return its position
            if board[r][c] == 0:
                return (r, c)
    
    # No empty cells found - board is complete
    return None

def is_valid_sudoku_move(board, num, pos):
    """
    Checks if placing a number at a position is valid according to Sudoku rules.
    
    Sudoku rules: No duplicates in the same row, column, or 3x3 box.
    
    Args:
        board: 9x9 Sudoku grid
        num: Number to place (1-9)
        pos: Position tuple (row, col)
        
    Returns:
        True if move is valid, False otherwise
    """
    
    # CHECK ROW: Does this number already exist in this row?
    for col in range(9):
        # If we find the same number in this row (excluding the cell itself), invalid!
        if board[pos[0]][col] == num and pos[1] != col:
            return False

    # CHECK COLUMN: Does this number already exist in this column?
    for row in range(9):
        # If we find the same number in this column (excluding the cell itself), invalid!
        if board[row][pos[1]] == num and pos[0] != row:
            return False

    # CHECK 3x3 BOX: Does this number already exist in this box?
    # First, figure out which box this cell belongs to (0, 1, or 2 for each dimension)
    box_x = pos[1] // 3  # Column box number
    box_y = pos[0] // 3  # Row box number

    # Loop through all 9 cells in this 3x3 box
    for r in range(box_y * 3, box_y * 3 + 3):
        for c in range(box_x * 3, box_x * 3 + 3):
            # If we find the same number in this box (excluding the cell itself), invalid!
            if board[r][c] == num and (r, c) != pos:
                return False
    
    # Passed all three checks! This move is valid
    return True

def generate_sudoku_puzzle(difficulty=50): # difficulty is how many cells to remove (higher = harder)
    # Start with a solved Sudoku (can be fixed or randomly generated and solved)
    base_board = [
        [3, 1, 6, 5, 7, 8, 4, 9, 2],
        [5, 2, 9, 1, 3, 4, 7, 6, 8],
        [4, 8, 7, 6, 2, 9, 5, 3, 1],
        [2, 6, 3, 4, 1, 5, 9, 8, 7],
        [9, 7, 4, 8, 6, 3, 1, 2, 5],
        [8, 5, 1, 7, 9, 2, 6, 4, 3],
        [1, 3, 8, 9, 5, 7, 2, 0, 4], # Make one cell 0 to ensure it's solvable from here
        [6, 9, 2, 3, 4, 1, 8, 7, 5],
        [7, 4, 5, 2, 8, 6, 3, 1, 9]
    ]
    # For a truly random and complex puzzle, you'd generate a solved board first,
    # then randomly remove cells ensuring a unique solution.
    # This example uses a fixed base and removes cells.

    puzzle_board = [row[:] for row in base_board] # Deep copy
    
    # Remove cells
    cells_removed = 0
    while cells_removed < difficulty:
        row = random.randint(0, 8)
        col = random.randint(0, 8)
        if puzzle_board[row][col] != 0:
            puzzle_board[row][col] = 0
            cells_removed += 1
    
    return puzzle_board

@app.route('/sudoku')
def sudoku_page():
    return render_template('sudoku.html')

@app.route('/generate_and_solve_sudoku', methods=['POST'])
def generate_and_solve_sudoku():
    difficulty = int(request.json.get('difficulty', 60)) # More cells removed = harder
    
    puzzle = generate_sudoku_puzzle(difficulty)
    board_to_solve = [row[:] for row in puzzle] # Make a copy for solving

    start_time = time.time()
    
    # Measure memory usage for the board representation
    initial_memory = sys.getsizeof(board_to_solve) + sum(sys.getsizeof(row) for row in board_to_solve)
    
    success = solve_sudoku_dfs(board_to_solve)
    
    final_memory = sys.getsizeof(board_to_solve) + sum(sys.getsizeof(row) for row in board_to_solve)
    
    end_time = time.time()
    
    time_taken = (end_time - start_time) * 1000 # in milliseconds
    memory_used = (final_memory - initial_memory) / (1024 * 1024) # in MB
    
    return jsonify({
        "puzzle": puzzle,
        "solution": board_to_solve if success else "No solution found",
        "time_taken": f"{time_taken:.2f} ms",
        "memory_used": f"{memory_used:.4f} MB",
        "success": success
    })

# --- Maze ---
def generate_maze(width, height):
    # Implement a maze generation algorithm (e.g., Kruskal's, Prim's, Recursive Backtracker)
    # For simplicity, let's start with a basic grid of walls and paths.
    # A more complex generator would ensure a single path from start to end.
    
    # Initialize grid with all walls
    maze = [[1 for _ in range(width)] for _ in range(height)] # 1 = wall, 0 = path
    
    # Simple recursive backtracking maze generator
    def carve_path(cx, cy):
        maze[cy][cx] = 0 # Carve current cell
        directions = [(0, -2), (0, 2), (-2, 0), (2, 0)] # Up, Down, Left, Right (2 steps to avoid immediate loops)
        random.shuffle(directions)
        
        for dx, dy in directions:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height and maze[ny][nx] == 1:
                maze[cy + dy // 2][cx + dx // 2] = 0 # Carve wall between
                carve_path(nx, ny)
                
    # Start carving from a random point (must be odd coordinates for the 2-step approach)
    start_x, start_y = random.randrange(1, width, 2), random.randrange(1, height, 2)
    carve_path(start_x, start_y)
    
    # Ensure start and end points (can be fixed or randomly chosen)
    maze[1][1] = 0 # Start
    maze[height - 2][width - 2] = 0 # End
    
    return maze

# ============================================================================
# MAZE SOLVER - DFS with Explicit Stack
# ============================================================================

def solve_maze_dfs(maze, start, end):
    """
    Solves a maze using Depth-First Search with an explicit stack.
    
    The algorithm explores paths by always going as deep as possible before
    backtracking. It uses a stack to track positions to explore and a set
    to remember visited cells (avoiding cycles).
    
    Args:
        maze: 2D grid where 0 = path, 1 = wall
        start: Starting position tuple (row, col)
        end: Goal position tuple (row, col)
        
    Returns:
        List of positions from start to end, or None if no path exists
    """
    
    # Get maze dimensions for boundary checking
    rows, cols = len(maze), len(maze[0])
    
    # Initialize stack with starting position and path
    # Stack stores tuples of (current_position, path_to_get_here)
    # Starting path contains just the start position
    stack = [(start, [start])]
    
    # Track visited cells to avoid going in circles
    # Using a set for O(1) lookup time
    visited = set()

    # MAIN LOOP: Continue while there are positions to explore
    while stack:
        # Pop the most recent position from stack (this makes it depth-first!)
        # Unpack into current position and the path taken to get here
        (r, c), path = stack.pop()

        # SUCCESS! We've reached the goal - return the winning path
        if (r, c) == end:
            return path

        # Skip if we've already visited this cell
        # This prevents infinite loops
        if (r, c) in visited:
            continue
        
        # Mark this cell as visited
        visited.add((r, c))

        # EXPLORE ALL FOUR NEIGHBORS (Right, Left, Down, Up)
        # Each tuple (dr, dc) represents a direction offset
        for dr, dc in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            # Calculate neighbor's position
            nr, nc = r + dr, c + dc
            
            # Check if this neighbor is valid:
            # 1. Within maze boundaries (0 <= nr < rows and 0 <= nc < cols)
            # 2. Is a path, not a wall (maze[nr][nc] == 0)
            # 3. Haven't visited it yet ((nr, nc) not in visited)
            if 0 <= nr < rows and 0 <= nc < cols and maze[nr][nc] == 0 and (nr, nc) not in visited:
                # Add this neighbor to stack for future exploration
                # Create new path that includes all previous positions plus this neighbor
                # Note: path + [(nr, nc)] creates a new list without modifying original
                stack.append(((nr, nc), path + [(nr, nc)]))
    
    # Exhausted all possibilities without reaching the end
    # No solution exists
    return None

@app.route('/maze')
def maze_page():
    return render_template('maze.html')

@app.route('/generate_and_solve_maze', methods=['POST'])
def generate_and_solve_maze():
    width = int(request.json.get('width', 31)) # Must be odd for current generator
    height = int(request.json.get('height', 31)) # Must be odd

    if width % 2 == 0: width += 1
    if height % 2 == 0: height += 1
    
    maze = generate_maze(width, height)
    
    start_pos = (1, 1) # Example start
    end_pos = (height - 2, width - 2) # Example end

    start_time = time.time()
    
    # Measure memory usage (approximate for stack and visited set)
    initial_memory = sys.getsizeof(maze) + sys.getsizeof(start_pos) + sys.getsizeof(end_pos)
    
    solution_path = solve_maze_dfs(maze, start_pos, end_pos)
    
    final_memory = sys.getsizeof(maze) + sys.getsizeof(start_pos) + sys.getsizeof(end_pos) + sys.getsizeof(solution_path) + sys.getsizeof(set()) # Add visited set approx
    
    end_time = time.time()
    
    time_taken = (end_time - start_time) * 1000 # in milliseconds
    memory_used = (final_memory - initial_memory) / (1024 * 1024) # in MB
    
    return jsonify({
        "maze": maze,
        "solution_path": solution_path,
        "time_taken": f"{time_taken:.2f} ms",
        "memory_used": f"{memory_used:.4f} MB"
    })

# --- Main Route ---
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)