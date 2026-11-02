/**
 * ============================================================================
 * PROJECT TITLE:
 * Design and Implementation of a Sudoku Solver Using Digital Logic Concepts
 * 
 * B.Tech Mini-Project in Digital Electronics & Computer Science Engineering
 * 
 * TECH STACK:
 * HTML5, CSS3, Vanilla JavaScript (ES6+)
 * Local Browser Execution - Zero Backend - Zero External Libraries
 * 
 * CORE DIGITAL LOGIC CONCEPTS MODELED:
 * 1. 4-Bit Binary Register Encoding (B3, B2, B1, B0 for digits 1-9)
 * 2. Boolean Variables (Logic 1 = Safe / True, Logic 0 = Conflict / False)
 * 3. 3-Input AND Gate Formulation: VALID = ROW_SAFE · COL_SAFE · BOX_SAFE
 * 4. NOT Gate (Inverter) Conflict Conversion: SAFE = NOT(CONFLICT)
 * 5. Complete 8-State Truth Table Simulation
 * 6. Recursive Backtracking with Real-Time Asynchronous Visualization
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. DATA STRUCTURES & PRESET SAMPLE PUZZLES
  // --------------------------------------------------------------------------

  /**
   * Pre-configured test puzzles representing different difficulty levels
   * and edge cases required for academic evaluation:
   * 0 denotes an empty cell.
   */
  const SAMPLE_PUZZLES = {
    // Easy: Well-constrained classic puzzle with 36 clues
    easy: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ],

    // Medium: Standard puzzle with 28 clues
    medium: [
      [0, 0, 0, 6, 0, 0, 4, 0, 0],
      [7, 0, 0, 0, 0, 3, 6, 0, 0],
      [0, 0, 0, 0, 9, 1, 0, 8, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 5, 0, 1, 8, 0, 0, 0, 3],
      [0, 0, 0, 3, 0, 6, 0, 4, 5],
      [0, 4, 0, 2, 0, 0, 0, 6, 0],
      [9, 0, 3, 0, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 1, 0, 0]
    ],

    // Hard: Sparse puzzle with 23 clues requiring deeper backtracking
    hard: [
      [0, 0, 0, 8, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 0],
      [5, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 7, 0, 8, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 2, 0, 0, 3, 0, 0, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 7, 5],
      [0, 0, 3, 4, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 0, 0, 6, 0, 0]
    ],

    // Invalid Puzzle: Contains duplicate '5' in Row 0 and duplicate '8' in Box 0
    // Used to test the error detection system
    invalid: [
      [5, 3, 5, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 8, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ],

    // Unsolvable Puzzle: Valid initial clues (no duplicates anywhere),
    // but cell (0,0) has no valid candidate because row 0 contains 1-8
    // and column 0 contains 9 at cell (1,0). Mathematically unsolvable!
    unsolvable: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [9, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
  };

  // --------------------------------------------------------------------------
  // 2. STATE MANAGEMENT
  // --------------------------------------------------------------------------

  // 9x9 matrix tracking immutable initial clues (clues remain fixed during solve/reset)
  let initialBoard = createEmptyMatrix();

  // 9x9 matrix tracking the live current state of the board
  let currentBoard = createEmptyMatrix();

  // Array of 81 DOM cell elements cached for fast access
  let cellElements = [];

  // Selected cell coordinates { row: number, col: number } | null
  let selectedCell = null;

  // Visualizer Execution Controller State
  const visualState = {
    isRunning: false,
    isPaused: false,
    stepDelay: 20, // Milliseconds per step
    shouldStop: false,
    stepResolver: null, // Promise resolver for single-step manual stepping
    stats: {
      stepsCount: 0,
      backtracksCount: 0,
      startTime: 0
    }
  };

  // Helper: creates a 9x9 matrix initialized to 0
  function createEmptyMatrix() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
  }

  // --------------------------------------------------------------------------
  // 3. DOM ELEMENT REFERENCES
  // --------------------------------------------------------------------------
  const DOM = {
    // Grid & Alerts
    sudokuGrid: document.getElementById('sudokuGrid'),
    cluesCount: document.getElementById('cluesCountDisplay'),
    emptyCount: document.getElementById('emptyCountDisplay'),
    boardAlert: document.getElementById('boardAlert'),
    alertIcon: document.getElementById('alertIcon'),
    alertMessage: document.getElementById('alertMessage'),
    globalStatusPill: document.getElementById('globalStatusPill'),
    globalStatusDot: document.getElementById('globalStatusDot'),
    globalStatusText: document.getElementById('globalStatusText'),

    // Primary Buttons
    btnSolve: document.getElementById('btnSolve'),
    btnVisualSolve: document.getElementById('btnVisualSolve'),
    btnCheckPuzzle: document.getElementById('btnCheckPuzzle'),
    btnReset: document.getElementById('btnReset'),
    btnClear: document.getElementById('btnClear'),
    sampleSelect: document.getElementById('samplePuzzleSelect'),
    btnEraseCell: document.getElementById('btnEraseCell'),

    // Digital Logic HUD Elements
    candidateDecimal: document.getElementById('candidateDecimalDisplay'),
    candidateBinary: document.getElementById('candidateBinaryString'),
    bitCells: [
      document.getElementById('bit0'),
      document.getElementById('bit1'),
      document.getElementById('bit2'),
      document.getElementById('bit3')
    ],
    circuitModeBadge: document.getElementById('circuitModeBadge'),

    // SVG Circuit Components
    wireRow: document.getElementById('wireRow'),
    pinRow: document.getElementById('pinRow'),
    txtRowVal: document.getElementById('txtRowVal'),
    wireCol: document.getElementById('wireCol'),
    pinCol: document.getElementById('pinCol'),
    txtColVal: document.getElementById('txtColVal'),
    wireBox: document.getElementById('wireBox'),
    pinBox: document.getElementById('pinBox'),
    txtBoxVal: document.getElementById('txtBoxVal'),
    andGateBody: document.getElementById('andGateBody'),
    wireValid: document.getElementById('wireValid'),
    pinValid: document.getElementById('pinValid'),
    txtValidVal: document.getElementById('txtValidVal'),
    txtValidStatus: document.getElementById('txtValidStatus'),

    // Logic Chips
    chipRow: document.getElementById('chipRow'),
    chipRowStatus: document.getElementById('chipRowStatus'),
    chipCol: document.getElementById('chipCol'),
    chipColStatus: document.getElementById('chipColStatus'),
    chipBox: document.getElementById('chipBox'),
    chipBoxStatus: document.getElementById('chipBoxStatus'),
    chipOutput: document.getElementById('chipOutput'),
    chipOutputStatus: document.getElementById('chipOutputStatus'),

    // Visualizer Controls & Stats
    btnVisPlay: document.getElementById('btnVisPlay'),
    btnVisPause: document.getElementById('btnVisPause'),
    btnVisStep: document.getElementById('btnVisStep'),
    btnVisStop: document.getElementById('btnVisStop'),
    speedSlider: document.getElementById('speedSlider'),
    speedLabel: document.getElementById('speedValueLabel'),
    statSteps: document.getElementById('statSteps'),
    statBacktracks: document.getElementById('statBacktracks'),
    statTime: document.getElementById('statTime'),
    consoleOutput: document.getElementById('consoleOutput'),
    btnClearLog: document.getElementById('btnClearLog'),

    // Truth Table
    truthTable: document.getElementById('interactiveTruthTable')
  };

  // --------------------------------------------------------------------------
  // 4. CORE DIGITAL LOGIC & CONSTRAINT CHECKING FUNCTIONS
  // --------------------------------------------------------------------------

  /**
   * Concept A: Binary Representation (4-Bit Word)
   * Converts a decimal digit (1-9) to a 4-bit binary array [B3, B2, B1, B0]
   * and updates the HUD bit registers and LEDs.
   * 
   * @param {number} digit - Integer from 1 to 9 (or 0 for empty)
   */
  function updateBinaryRegisterDisplay(digit) {
    if (digit >= 1 && digit <= 9) {
      // Convert to 4-bit representation
      const b0 = (digit >> 0) & 1; // 2^0 = 1 (LSB)
      const b1 = (digit >> 1) & 1; // 2^1 = 2
      const b2 = (digit >> 2) & 1; // 2^2 = 4
      const b3 = (digit >> 3) & 1; // 2^3 = 8 (MSB)

      const bits = [b0, b1, b2, b3];

      DOM.candidateDecimal.textContent = `D = ${digit}`;
      DOM.candidateBinary.textContent = `0b${b3}${b2}${b1}${b0}`;

      // Update bit LED classes
      bits.forEach((bitVal, idx) => {
        const bitCell = DOM.bitCells[idx];
        const led = bitCell.querySelector('.bit-led');
        if (bitVal === 1) {
          bitCell.classList.add('on');
          led.textContent = '1';
        } else {
          bitCell.classList.remove('on');
          led.textContent = '0';
        }
      });
    } else {
      // Idle / Empty state
      DOM.candidateDecimal.textContent = 'D = ?';
      DOM.candidateBinary.textContent = '0b0000';
      DOM.bitCells.forEach(cell => {
        cell.classList.remove('on');
        cell.querySelector('.bit-led').textContent = '0';
      });
    }
  }

  /**
   * Concept B & C: Row Constraint Check
   * In digital logic terms:
   * ROW_CONFLICT = OR(Cell[row, 0..8] == num)
   * ROW_SAFE = NOT(ROW_CONFLICT)
   * 
   * @param {number[][]} board - The 9x9 grid
   * @param {number} row - Row index (0-8)
   * @param {number} num - Candidate digit (1-9)
   * @param {number} [excludeCol=-1] - Optional column to exclude (for validation of existing clues)
   * @returns {boolean} True (Logic 1) if row is safe; False (Logic 0) if conflict
   */
  function isRowSafe(board, row, num, excludeCol = -1) {
    for (let c = 0; c < 9; c++) {
      if (c !== excludeCol && board[row][c] === num) {
        return false; // Conflict detected -> NOT gate makes ROW_SAFE = 0
      }
    }
    return true; // No conflict -> ROW_SAFE = 1
  }

  /**
   * Concept B & C: Column Constraint Check
   * In digital logic terms:
   * COL_CONFLICT = OR(Cell[0..8, col] == num)
   * COL_SAFE = NOT(COL_CONFLICT)
   * 
   * @param {number[][]} board - The 9x9 grid
   * @param {number} col - Column index (0-8)
   * @param {number} num - Candidate digit (1-9)
   * @param {number} [excludeRow=-1] - Optional row to exclude
   * @returns {boolean} True (Logic 1) if column is safe; False (Logic 0) if conflict
   */
  function isColSafe(board, col, num, excludeRow = -1) {
    for (let r = 0; r < 9; r++) {
      if (r !== excludeRow && board[r][col] === num) {
        return false; // Conflict detected -> NOT gate makes COL_SAFE = 0
      }
    }
    return true; // No conflict -> COL_SAFE = 1
  }

  /**
   * Concept B & C: 3x3 Box Constraint Check
   * In digital logic terms:
   * BOX_CONFLICT = OR(Cell[subgrid] == num)
   * BOX_SAFE = NOT(BOX_CONFLICT)
   * 
   * @param {number[][]} board - The 9x9 grid
   * @param {number} boxStartRow - Starting row of 3x3 subgrid (0, 3, or 6)
   * @param {number} boxStartCol - Starting col of 3x3 subgrid (0, 3, or 6)
   * @param {number} num - Candidate digit (1-9)
   * @param {number} [excludeRow=-1] - Row to exclude
   * @param {number} [excludeCol=-1] - Col to exclude
   * @returns {boolean} True (Logic 1) if 3x3 box is safe; False (Logic 0) if conflict
   */
  function isBoxSafe(board, boxStartRow, boxStartCol, num, excludeRow = -1, excludeCol = -1) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const currR = boxStartRow + r;
        const currC = boxStartCol + c;
        if ((currR !== excludeRow || currC !== excludeCol) && board[currR][currC] === num) {
          return false; // Conflict detected -> NOT gate makes BOX_SAFE = 0
        }
      }
    }
    return true; // No conflict -> BOX_SAFE = 1
  }

  /**
   * Concept C: 3-Input AND Gate Evaluation
   * VALID = ROW_SAFE · COL_SAFE · BOX_SAFE
   * 
   * Computes the positive-logic 3-input AND gate output and returns individual
   * input states for hardware schematic visualization and truth table alignment.
   * 
   * @param {number[][]} board 
   * @param {number} row 
   * @param {number} col 
   * @param {number} num 
   * @returns {{ valid: boolean, rowSafe: boolean, colSafe: boolean, boxSafe: boolean }}
   */
  function evaluateCandidate(board, row, col, num) {
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;

    const rowSafe = isRowSafe(board, row, num);
    const colSafe = isColSafe(board, col, num);
    const boxSafe = isBoxSafe(board, boxStartRow, boxStartCol, num);

    // 3-Input AND Gate: All three must be 1 (HIGH)
    const valid = rowSafe && colSafe && boxSafe;

    return { valid, rowSafe, colSafe, boxSafe };
  }

  /**
   * Updates the SVG circuit diagram, chips, and truth table with the current
   * Boolean input signals (A, B, C) and output signal (VALID).
   */
  function updateCircuitHUD(rowSafe, colSafe, boxSafe, valid, num = 0) {
    // 1. Update Binary LEDs
    if (num > 0) updateBinaryRegisterDisplay(num);

    // 2. Wire A: ROW_SAFE
    if (rowSafe) {
      DOM.wireRow.className.baseVal = 'wire wire-input high';
      DOM.pinRow.className.baseVal = 'pin-circle high';
      DOM.txtRowVal.textContent = '1';
      DOM.chipRow.className = 'logic-chip high';
      DOM.chipRowStatus.textContent = 'SAFE (1)';
    } else {
      DOM.wireRow.className.baseVal = 'wire wire-input low';
      DOM.pinRow.className.baseVal = 'pin-circle low';
      DOM.txtRowVal.textContent = '0';
      DOM.chipRow.className = 'logic-chip low';
      DOM.chipRowStatus.textContent = 'CONFLICT (0)';
    }

    // 3. Wire B: COL_SAFE
    if (colSafe) {
      DOM.wireCol.className.baseVal = 'wire wire-input high';
      DOM.pinCol.className.baseVal = 'pin-circle high';
      DOM.txtColVal.textContent = '1';
      DOM.chipCol.className = 'logic-chip high';
      DOM.chipColStatus.textContent = 'SAFE (1)';
    } else {
      DOM.wireCol.className.baseVal = 'wire wire-input low';
      DOM.pinCol.className.baseVal = 'pin-circle low';
      DOM.txtColVal.textContent = '0';
      DOM.chipCol.className = 'logic-chip low';
      DOM.chipColStatus.textContent = 'CONFLICT (0)';
    }

    // 4. Wire C: BOX_SAFE
    if (boxSafe) {
      DOM.wireBox.className.baseVal = 'wire wire-input high';
      DOM.pinBox.className.baseVal = 'pin-circle high';
      DOM.txtBoxVal.textContent = '1';
      DOM.chipBox.className = 'logic-chip high';
      DOM.chipBoxStatus.textContent = 'SAFE (1)';
    } else {
      DOM.wireBox.className.baseVal = 'wire wire-input low';
      DOM.pinBox.className.baseVal = 'pin-circle low';
      DOM.txtBoxVal.textContent = '0';
      DOM.chipBox.className = 'logic-chip low';
      DOM.chipBoxStatus.textContent = 'CONFLICT (0)';
    }

    // 5. Output: VALID
    if (valid) {
      DOM.andGateBody.classList.add('firing');
      DOM.wireValid.className.baseVal = 'wire wire-output high';
      DOM.pinValid.className.baseVal = 'pin-circle out-pin high';
      DOM.txtValidVal.textContent = '1';
      DOM.txtValidStatus.textContent = 'ACCEPTED (1)';
      DOM.txtValidStatus.className.baseVal = 'wire-status high';
      DOM.chipOutput.className = 'logic-chip high';
      DOM.chipOutputStatus.textContent = 'ACCEPTED (1)';
    } else {
      DOM.andGateBody.classList.remove('firing');
      DOM.wireValid.className.baseVal = 'wire wire-output low';
      DOM.pinValid.className.baseVal = 'pin-circle out-pin low';
      DOM.txtValidVal.textContent = '0';
      DOM.txtValidStatus.textContent = 'REJECTED (0)';
      DOM.txtValidStatus.className.baseVal = 'wire-status low';
      DOM.chipOutput.className = 'logic-chip low';
      DOM.chipOutputStatus.textContent = 'REJECTED (0)';
    }

    // 6. Highlight corresponding state row in Truth Table
    // Calculate minterm index: m = (A * 4) + (B * 2) + (C * 1)
    const mintermIndex = (rowSafe ? 4 : 0) + (colSafe ? 2 : 0) + (boxSafe ? 1 : 0);
    highlightTruthTableRow(mintermIndex);
  }

  /**
   * Highlights the active minterm row (0-7) in the 8-state Truth Table
   */
  function highlightTruthTableRow(stateIndex) {
    const rows = DOM.truthTable.querySelectorAll('.truth-row');
    rows.forEach(row => {
      const state = parseInt(row.getAttribute('data-state'), 10);
      if (state === stateIndex) {
        row.classList.add('active-state');
      } else {
        row.classList.remove('active-state');
      }
    });
  }

  /**
   * Resets the Digital Circuit HUD to idle state
   */
  function resetCircuitHUD() {
    updateBinaryRegisterDisplay(0);
    DOM.wireRow.className.baseVal = 'wire wire-input';
    DOM.pinRow.className.baseVal = 'pin-circle';
    DOM.txtRowVal.textContent = '0';
    DOM.wireCol.className.baseVal = 'wire wire-input';
    DOM.pinCol.className.baseVal = 'pin-circle';
    DOM.txtColVal.textContent = '0';
    DOM.wireBox.className.baseVal = 'wire wire-input';
    DOM.pinBox.className.baseVal = 'pin-circle';
    DOM.txtBoxVal.textContent = '0';
    DOM.andGateBody.classList.remove('firing');
    DOM.wireValid.className.baseVal = 'wire wire-output';
    DOM.pinValid.className.baseVal = 'pin-circle out-pin';
    DOM.txtValidVal.textContent = '0';
    DOM.txtValidStatus.textContent = 'REJECTED (0)';
    DOM.txtValidStatus.className.baseVal = 'wire-status';

    DOM.chipRow.className = 'logic-chip';
    DOM.chipRowStatus.textContent = 'READY';
    DOM.chipCol.className = 'logic-chip';
    DOM.chipColStatus.textContent = 'READY';
    DOM.chipBox.className = 'logic-chip';
    DOM.chipBoxStatus.textContent = 'READY';
    DOM.chipOutput.className = 'logic-chip';
    DOM.chipOutputStatus.textContent = 'READY';

    DOM.circuitModeBadge.textContent = 'Simulation Idle';
    DOM.circuitModeBadge.classList.remove('active');

    // Remove truth table highlight
    DOM.truthTable.querySelectorAll('.truth-row').forEach(row => row.classList.remove('active-state'));
  }

  // --------------------------------------------------------------------------
  // 5. SUDOKU MATRIX VALIDATION ENGINE (CHECKING CONSTRAINTS)
  // --------------------------------------------------------------------------

  /**
   * Full board validation. Scans all rows, columns, and 3x3 boxes for duplicate
   * numbers. Detects conflicts and collects their coordinates.
   * 
   * @param {number[][]} board 
   * @returns {{ isValid: boolean, conflicts: Array<{ row: number, col: number, reason: string }> }}
   */
  function validateBoardIntegrity(board) {
    const conflicts = [];

    // 1. Check Row Uniqueness
    for (let r = 0; r < 9; r++) {
      const seen = new Map();
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            const firstCol = seen.get(val);
            conflicts.push({
              row: r,
              col: c,
              reason: `Row ${r + 1} contains duplicate digit '${val}' at columns ${firstCol + 1} and ${c + 1}.`
            });
            conflicts.push({
              row: r,
              col: firstCol,
              reason: `Row ${r + 1} contains duplicate digit '${val}'.`
            });
          } else {
            seen.set(val, c);
          }
        }
      }
    }

    // 2. Check Column Uniqueness
    for (let c = 0; c < 9; c++) {
      const seen = new Map();
      for (let r = 0; r < 9; r++) {
        const val = board[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            const firstRow = seen.get(val);
            conflicts.push({
              row: r,
              col: c,
              reason: `Column ${c + 1} contains duplicate digit '${val}' at rows ${firstRow + 1} and ${r + 1}.`
            });
            conflicts.push({
              row: firstRow,
              col: c,
              reason: `Column ${c + 1} contains duplicate digit '${val}'.`
            });
          } else {
            seen.set(val, r);
          }
        }
      }
    }

    // 3. Check 3x3 Box Uniqueness
    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
      for (let boxCol = 0; boxCol < 9; boxCol += 3) {
        const seen = new Map();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const currR = boxRow + r;
            const currC = boxCol + c;
            const val = board[currR][currC];
            if (val !== 0) {
              if (seen.has(val)) {
                const prev = seen.get(val);
                conflicts.push({
                  row: currR,
                  col: currC,
                  reason: `3×3 Box at [R${boxRow + 1}:C${boxCol + 1}] contains duplicate '${val}'.`
                });
                conflicts.push({
                  row: prev.r,
                  col: prev.c,
                  reason: `3×3 Box at [R${boxRow + 1}:C${boxCol + 1}] contains duplicate '${val}'.`
                });
              } else {
                seen.set(val, { r: currR, c: currC });
              }
            }
          }
        }
      }
    }

    // Deduplicate conflict cell positions
    const uniqueConflicts = [];
    const keySet = new Set();
    conflicts.forEach(item => {
      const key = `${item.row}-${item.col}`;
      if (!keySet.has(key)) {
        keySet.add(key);
        uniqueConflicts.push(item);
      }
    });

    return {
      isValid: uniqueConflicts.length === 0,
      conflicts: uniqueConflicts
    };
  }

  // --------------------------------------------------------------------------
  // 6. SOLVER ALGORITHMS (INSTANT & STEP-BY-STEP VISUALIZER)
  // --------------------------------------------------------------------------

  /**
   * Helper: Finds next empty cell (value == 0) in row-major order
   * @param {number[][]} board 
   * @returns {{ row: number, col: number } | null}
   */
  function findEmptyCell(board) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          return { row: r, col: c };
        }
      }
    }
    return null; // All 81 cells are filled
  }

  /**
   * Synchronous Recursive Backtracking Solver
   * Used for instantaneous solving. Highly optimized with constraint pruning.
   * 
   * @param {number[][]} board 
   * @param {{ steps: number }} telemetry - Pass-by-reference object to count steps
   * @returns {boolean} True if puzzle solved, False if unsolvable
   */
  function solveSudokuInstant(board, telemetry = { steps: 0 }) {
    const empty = findEmptyCell(board);
    if (!empty) {
      return true; // Base Case: All cells satisfied!
    }

    const { row, col } = empty;

    // Try candidates 1 through 9
    for (let num = 1; num <= 9; num++) {
      telemetry.steps++;

      // Digital Logic AND Gate check: VALID = ROW_SAFE · COL_SAFE · BOX_SAFE
      const boxStartRow = Math.floor(row / 3) * 3;
      const boxStartCol = Math.floor(col / 3) * 3;

      if (
        isRowSafe(board, row, num) &&
        isColSafe(board, col, num) &&
        isBoxSafe(board, boxStartRow, boxStartCol, num)
      ) {
        // Tentative assignment
        board[row][col] = num;

        // Recursive exploration
        if (solveSudokuInstant(board, telemetry)) {
          return true;
        }

        // Backtracking: Choice led to contradiction; revert cell
        board[row][col] = 0;
      }
    }

    // Exhausted digits 1-9 without resolution -> Backtrack to previous frame
    return false;
  }

  /**
   * Asynchronous Delay / Stepping Helper for Visualizer
   */
  function stepDelayPromise() {
    if (visualState.isPaused) {
      // In pause mode: wait for manual step or play button
      return new Promise(resolve => {
        visualState.stepResolver = resolve;
      });
    }

    // In auto-play mode: delay for selected milliseconds
    return new Promise(resolve => {
      setTimeout(resolve, visualState.stepDelay);
    });
  }

  /**
   * Asynchronous Recursive Backtracking Solver for Step-by-Step Visualization
   * Updates DOM cells, HUD, Truth Table, and Console Feed in real time.
   * 
   * @param {number[][]} board 
   * @returns {Promise<boolean>}
   */
  async function solveSudokuVisual(board) {
    if (visualState.shouldStop) return false;

    const empty = findEmptyCell(board);
    if (!empty) {
      return true; // Puzzle completely solved!
    }

    const { row, col } = empty;
    const cellEl = getCellElement(row, col);

    logMessage(`[SELECT] Checking cell [Row ${row + 1}, Col ${col + 1}]...`, 'system');
    setCellEvaluating(row, col, true);

    // Try candidates 1 through 9
    for (let num = 1; num <= 9; num++) {
      if (visualState.shouldStop) {
        setCellEvaluating(row, col, false);
        return false;
      }

      visualState.stats.stepsCount++;
      updateStatsDisplay();

      // Show candidate on cell and digital register
      setCellDisplay(cellEl, num);
      updateBinaryRegisterDisplay(num);

      // Evaluate 3-Input AND Gate
      const evalResult = evaluateCandidate(board, row, col, num);
      updateCircuitHUD(evalResult.rowSafe, evalResult.colSafe, evalResult.boxSafe, evalResult.valid, num);

      logMessage(
        `[EVAL] Cell [R${row + 1}:C${col + 1}] | Candidate ${num} (0b${((num >> 3) & 1)}${((num >> 2) & 1)}${((num >> 1) & 1)}${(num & 1)}) | ` +
        `ROW_SAFE=${evalResult.rowSafe ? 1 : 0}, COL_SAFE=${evalResult.colSafe ? 1 : 0}, BOX_SAFE=${evalResult.boxSafe ? 1 : 0} => VALID=${evalResult.valid ? 1 : 0}`,
        evalResult.valid ? 'gate-high' : 'gate-low'
      );

      // Wait for delay or step click
      await stepDelayPromise();

      if (evalResult.valid) {
        // Candidate accepted! Insert number into matrix
        board[row][col] = num;
        cellEl.classList.remove('evaluating');
        cellEl.classList.add('solved-value');
        logMessage(`[ACCEPTED] VALID=1. Candidate ${num} placed at [R${row + 1}:C${col + 1}]. Continuing recursive DFS...`, 'gate-high');

        // Recurse to next empty cell
        const nextSolved = await solveSudokuVisual(board);
        if (nextSolved) {
          return true;
        }

        // Backtrack path
        if (visualState.shouldStop) return false;
        visualState.stats.backtracksCount++;
        updateStatsDisplay();

        logMessage(`[BACKTRACK] Dead end reached at deeper level. Reverting cell [R${row + 1}:C${col + 1}] from ${num} to empty (0).`, 'backtrack');
        setCellBacktracking(row, col, true);
        board[row][col] = 0;
        setCellDisplay(cellEl, 0);
        cellEl.classList.remove('solved-value');

        await stepDelayPromise();
        setCellBacktracking(row, col, false);
      }
    }

    // None of 1..9 were valid in this cell
    setCellEvaluating(row, col, false);
    setCellDisplay(cellEl, 0);
    return false;
  }

  // --------------------------------------------------------------------------
  // 7. USER INTERFACE & INTERACTION HANDLERS
  // --------------------------------------------------------------------------

  /**
   * Sets value display in an input cell
   */
  function setCellDisplay(cellEl, val) {
    if (!cellEl) return;
    cellEl.value = (val > 0) ? String(val) : '';
  }

  /**
   * Configures whether a cell is an initial immutable clue
   */
  function setCellClue(cellEl, isClue) {
    if (!cellEl) return;
    cellEl.readOnly = isClue;
    if (isClue) {
      cellEl.classList.add('clue');
    } else {
      cellEl.classList.remove('clue');
    }
  }

  /**
   * Initializes the 9x9 DOM grid with 81 interactive native input cells
   */
  function initializeGrid() {
    DOM.sudokuGrid.innerHTML = '';
    cellElements = [];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('input');
        cell.type = 'text';
        cell.inputMode = 'numeric';
        cell.pattern = '[1-9]*';
        cell.maxLength = 1;
        cell.autocomplete = 'off';
        cell.spellcheck = false;
        cell.className = 'sudoku-cell';
        cell.setAttribute('data-row', r);
        cell.setAttribute('data-col', c);
        cell.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}`);

        // Click / Focus listeners
        cell.addEventListener('click', () => {
          handleCellSelect(r, c);
          cell.select();
        });
        cell.addEventListener('focus', () => {
          handleCellSelect(r, c);
          cell.select();
        });

        // Real-time input listener (handles typing, pasting, mobile virtual keyboards)
        cell.addEventListener('input', (e) => {
          if (visualState.isRunning) return;
          const val = cell.value.trim();
          const lastDigit = val.replace(/[^1-9]/g, '').slice(-1);
          if (lastDigit) {
            setDigitInCell(r, c, parseInt(lastDigit, 10));
          } else {
            setDigitInCell(r, c, 0);
          }
        });

        // Keyboard listener for navigation and erase
        cell.addEventListener('keydown', (e) => handleCellKeyDown(e, r, c));

        DOM.sudokuGrid.appendChild(cell);
        cellElements.push(cell);
      }
    }

    updateClueAndEmptyCounts();
  }

  /**
   * Retrieves cached cell element by (row, col)
   */
  function getCellElement(row, col) {
    return cellElements[row * 9 + col];
  }

  /**
   * Handles cell selection, highlighting active row, col, 3x3 box, and identical numbers
   */
  function handleCellSelect(row, col) {
    if (visualState.isRunning) return; // Disable during active visualization

    selectedCell = { row, col };
    const val = currentBoard[row][col];
    const cellEl = getCellElement(row, col);

    // Highlight candidate in binary HUD if populated
    if (val > 0) {
      updateBinaryRegisterDisplay(val);
      const evalResult = evaluateCandidate(currentBoard, row, col, val);
      updateCircuitHUD(evalResult.rowSafe, evalResult.colSafe, evalResult.boxSafe, evalResult.valid, val);
    } else {
      updateBinaryRegisterDisplay(0);
    }

    // Refresh visual highlight classes across the grid
    refreshCellHighlights();

    // Ensure input has active focus and selected text for immediate typing
    if (cellEl && document.activeElement !== cellEl) {
      cellEl.focus();
      cellEl.select();
    }
  }

  /**
   * Re-evaluates highlight classes across all 81 cells
   */
  function refreshCellHighlights() {
    if (!selectedCell) return;
    const { row: selR, col: selC } = selectedCell;
    const selVal = currentBoard[selR][selC];
    const boxStartR = Math.floor(selR / 3) * 3;
    const boxStartC = Math.floor(selC / 3) * 3;

    cellElements.forEach((cell, idx) => {
      const r = Math.floor(idx / 9);
      const c = idx % 9;
      const cellVal = currentBoard[r][c];

      cell.classList.remove('active-cell', 'highlight-related', 'highlight-same');

      if (r === selR && c === selC) {
        cell.classList.add('active-cell');
      } else if (
        r === selR ||
        c === selC ||
        (r >= boxStartR && r < boxStartR + 3 && c >= boxStartC && c < boxStartC + 3)
      ) {
        cell.classList.add('highlight-related');
      }

      if (selVal > 0 && cellVal === selVal && !(r === selR && c === selC)) {
        cell.classList.add('highlight-same');
      }
    });
  }

  /**
   * Keyboard event handler for grid navigation and direct digit entry
   */
  function handleCellKeyDown(e, row, col) {
    if (visualState.isRunning) return;

    // Arrow navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (row > 0) handleCellSelect(row - 1, col);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (row < 8) handleCellSelect(row + 1, col);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (col > 0) handleCellSelect(row, col - 1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (col < 8) handleCellSelect(row, col + 1);
      return;
    }

    // Direct key entry 1-9 (handles main keyboard & numpad)
    if (/^[1-9]$/.test(e.key) || /^Numpad[1-9]$/.test(e.code)) {
      e.preventDefault();
      const digit = parseInt(e.key.replace(/[^1-9]/, '') || e.code.replace('Numpad', ''), 10);
      setDigitInCell(row, col, digit);
      return;
    }

    // Backspace, Delete, 0, or Space clears cell
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0' || e.code === 'Numpad0' || e.key === ' ') {
      e.preventDefault();
      setDigitInCell(row, col, 0);
      return;
    }
  }

  /**
   * Inserts or clears a digit at (row, col)
   */
  function setDigitInCell(row, col, digit) {
    const cellEl = getCellElement(row, col);

    // If marked as an initial immutable clue, do not allow modification
    if (cellEl.classList.contains('clue') || cellEl.readOnly) {
      showAlert('warning', 'Original puzzle clues cannot be modified. Use "Reset Board" or "Clear Board" to start over.');
      return;
    }

    currentBoard[row][col] = digit;
    setCellDisplay(cellEl, digit);

    cellEl.classList.remove('user-value', 'solved-value', 'conflict');
    if (digit > 0) {
      cellEl.classList.add('user-value');
    }

    clearConflictHighlights();
    updateClueAndEmptyCounts();
    handleCellSelect(row, col);
  }

  /**
   * Clears any conflict styling across all cells
   */
  function clearConflictHighlights() {
    cellElements.forEach(cell => cell.classList.remove('conflict'));
  }

  /**
   * Updates stats banner showing count of clues vs empty cells
   */
  function updateClueAndEmptyCounts() {
    let clues = 0;
    let empty = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] !== 0) {
          clues++;
        } else {
          empty++;
        }
      }
    }

    DOM.cluesCount.textContent = `Filled: ${clues}`;
    DOM.emptyCount.textContent = `Empty: ${empty}`;
  }

  /**
   * Sets visual evaluation state on a cell during visualization
   */
  function setCellEvaluating(row, col, isEvaluating) {
    const cell = getCellElement(row, col);
    if (isEvaluating) {
      cell.classList.add('evaluating');
    } else {
      cell.classList.remove('evaluating');
    }
  }

  /**
   * Sets visual backtracking state on a cell during visualization
   */
  function setCellBacktracking(row, col, isBacktracking) {
    const cell = getCellElement(row, col);
    if (isBacktracking) {
      cell.classList.add('backtracking');
    } else {
      cell.classList.remove('backtracking');
    }
  }

  // --------------------------------------------------------------------------
  // 8. ACTION BUTTON IMPLEMENTATIONS
  // --------------------------------------------------------------------------

  /**
   * Feature: Solve Sudoku (Instant Execution)
   * 1. Validates board for initial conflicts.
   * 2. Runs recursive backtracking solver.
   * 3. Renders solved cells with distinct green styling.
   * 4. Reports execution time and decision steps.
   */
  function handleSolveInstant() {
    if (visualState.isRunning) return;

    // Step 1: Pre-validation for duplicate numbers
    const validation = validateBoardIntegrity(currentBoard);
    if (!validation.isValid) {
      highlightConflicts(validation.conflicts);
      showAlert('error', `Cannot solve puzzle! Detected conflict: ${validation.conflicts[0].reason}`);
      setGlobalStatus('error', 'Invalid Board Detected');
      logMessage(`[ERROR] Pre-validation failed! ${validation.conflicts[0].reason}`, 'gate-low');
      return;
    }

    // Step 2: Check if already completely filled and valid
    if (findEmptyCell(currentBoard) === null) {
      showAlert('success', 'The Sudoku board is already completely solved and valid!');
      setGlobalStatus('ready', 'Puzzle Complete');
      return;
    }

    // Step 3: Solve a clone of the matrix to measure time accurately
    setGlobalStatus('working', 'Solving Puzzle...');
    showAlert('info', 'Solving puzzle with recursive backtracking...');
    logMessage('[SOLVE] Starting instantaneous recursive backtracking...', 'system');

    const workingBoard = JSON.parse(JSON.stringify(currentBoard));
    const telemetry = { steps: 0 };
    const t0 = performance.now();
    const isSolved = solveSudokuInstant(workingBoard, telemetry);
    const t1 = performance.now();
    const elapsedMs = (t1 - t0).toFixed(2);

    if (isSolved) {
      // Step 4: Render solved values
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c] === 0) {
            currentBoard[r][c] = workingBoard[r][c];
            const cell = getCellElement(r, c);
            setCellDisplay(cell, workingBoard[r][c]);
            cell.className = 'sudoku-cell solved-value';
          }
        }
      }

      updateClueAndEmptyCounts();
      setGlobalStatus('ready', `Solved in ${elapsedMs} ms`);
      showAlert('success', `✓ Sudoku Solved Successfully! Time: ${elapsedMs} ms | Decision steps: ${telemetry.steps}.`);
      logMessage(`[SUCCESS] Puzzle solved in ${elapsedMs} ms across ${telemetry.steps} recursive iterations.`, 'success');
    } else {
      setGlobalStatus('error', 'Puzzle Unsolvable');
      showAlert('error', '✕ Unsolvable Puzzle! Recursive backtracking exhausted all candidate permutations (1–9). No valid mathematical solution exists for this configuration.');
      logMessage('[UNSOLVABLE] Exhaustive search returned false. Board contains contradictory constraints with zero valid solutions.', 'gate-low');
    }
  }

  /**
   * Feature: Check Puzzle
   * Validates current board state without solving.
   * Reports whether board is:
   * 1. Invalid (has duplicate numbers in row, col, or box)
   * 2. Valid and Complete (fully solved)
   * 3. Valid but Incomplete (no errors so far, empty cells remain)
   */
  function handleCheckPuzzle() {
    clearConflictHighlights();

    const validation = validateBoardIntegrity(currentBoard);
    if (!validation.isValid) {
      highlightConflicts(validation.conflicts);
      showAlert('error', `Conflict detected! ${validation.conflicts[0].reason}`);
      setGlobalStatus('error', 'Constraint Conflict');
      logMessage(`[CHECK] FAILED: ${validation.conflicts[0].reason}`, 'gate-low');
      return;
    }

    const empty = findEmptyCell(currentBoard);
    if (empty === null) {
      showAlert('success', '🎉 Outstanding! The puzzle is completely and correctly solved with zero constraint violations!');
      setGlobalStatus('ready', 'Completed & Valid');
      logMessage('[CHECK] SUCCESS: All 81 cells validated. Zero constraint violations.', 'success');
    } else {
      let emptyCount = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c] === 0) emptyCount++;
        }
      }
      showAlert('info', `✓ Valid so far! No conflicts found in rows, columns, or 3×3 boxes. ${emptyCount} empty cells remaining.`);
      setGlobalStatus('ready', `${emptyCount} Cells Remaining`);
      logMessage(`[CHECK] VALID: Current configuration satisfies all logic constraints. ${emptyCount} cells remaining.`, 'system');
    }
  }

  /**
   * Highlights conflicting cells in red and triggers visual shake
   */
  function highlightConflicts(conflicts) {
    conflicts.forEach(c => {
      const cell = getCellElement(c.row, c.col);
      cell.classList.add('conflict');
    });
  }

  /**
   * Feature: Reset Board
   * Reverts current board back to the initial clues of the active puzzle.
   * Wipes all user-entered and solved cells, preserving original clues.
   */
  function handleResetBoard() {
    stopVisualizer();

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        currentBoard[r][c] = initialBoard[r][c];
        const cell = getCellElement(r, c);
        cell.className = 'sudoku-cell';

        if (initialBoard[r][c] !== 0) {
          setCellDisplay(cell, initialBoard[r][c]);
          setCellClue(cell, true);
        } else {
          setCellDisplay(cell, 0);
          setCellClue(cell, false);
        }
      }
    }

    clearConflictHighlights();
    updateClueAndEmptyCounts();
    resetCircuitHUD();
    setGlobalStatus('ready', 'Board Reset');
    showAlert('info', 'Board reset to original clues.');
    logMessage('[RESET] Board reverted to initial puzzle clues.', 'system');
    selectedCell = null;
  }

  /**
   * Feature: Clear Board
   * Clears all 81 cells, resetting both currentBoard and initialBoard to empty (0).
   */
  function handleClearBoard() {
    stopVisualizer();

    initialBoard = createEmptyMatrix();
    currentBoard = createEmptyMatrix();

    cellElements.forEach(cell => {
      setCellDisplay(cell, 0);
      setCellClue(cell, false);
      cell.className = 'sudoku-cell';
    });

    DOM.sampleSelect.value = '';
    clearConflictHighlights();
    updateClueAndEmptyCounts();
    resetCircuitHUD();
    setGlobalStatus('ready', 'Clean Grid');
    showAlert('info', 'Board cleared. Enter your own custom puzzle or select a sample puzzle.');
    logMessage('[CLEAR] Board wiped completely empty. Ready for custom puzzle input.', 'system');
    selectedCell = null;
  }

  /**
   * Feature: Load Sample Puzzle
   * Loads selected preset from SAMPLE_PUZZLES and locks clues.
   */
  function handleLoadSamplePuzzle(puzzleKey) {
    stopVisualizer();

    const template = SAMPLE_PUZZLES[puzzleKey];
    if (!template) return;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = template[r][c];
        initialBoard[r][c] = val;
        currentBoard[r][c] = val;

        const cell = getCellElement(r, c);
        cell.className = 'sudoku-cell';

        if (val !== 0) {
          setCellDisplay(cell, val);
          setCellClue(cell, true);
        } else {
          setCellDisplay(cell, 0);
          setCellClue(cell, false);
        }
      }
    }

    clearConflictHighlights();
    updateClueAndEmptyCounts();
    resetCircuitHUD();
    selectedCell = null;

    let desc = '';
    if (puzzleKey === 'easy') desc = 'Easy puzzle loaded (36 initial clues).';
    if (puzzleKey === 'medium') desc = 'Medium puzzle loaded (28 initial clues).';
    if (puzzleKey === 'hard') desc = 'Hard puzzle loaded (23 initial clues).';
    if (puzzleKey === 'invalid') desc = 'Invalid puzzle loaded (contains intentional duplicate clues to demo conflict detection).';
    if (puzzleKey === 'unsolvable') desc = 'Unsolvable puzzle loaded (legal clues, but zero valid solutions exist mathematically).';

    showAlert('info', desc);
    setGlobalStatus('ready', `${puzzleKey.toUpperCase()} Loaded`);
    logMessage(`[LOAD] ${desc}`, 'system');

    // If invalid puzzle, run check immediately to show conflict highlighting
    if (puzzleKey === 'invalid') {
      setTimeout(handleCheckPuzzle, 250);
    }
  }

  // --------------------------------------------------------------------------
  // 9. VISUALIZER STEP-BY-STEP CONTROLLER
  // --------------------------------------------------------------------------

  /**
   * Launches step-by-step visual solving mode
   */
  async function startVisualSolver() {
    if (visualState.isRunning) return;

    // Validate board before running visualizer
    const validation = validateBoardIntegrity(currentBoard);
    if (!validation.isValid) {
      highlightConflicts(validation.conflicts);
      showAlert('error', `Cannot start visualizer! Detected conflict: ${validation.conflicts[0].reason}`);
      setGlobalStatus('error', 'Constraint Conflict');
      return;
    }

    if (findEmptyCell(currentBoard) === null) {
      showAlert('info', 'Board is already filled. Reset board or load a sample puzzle to visualize.');
      return;
    }

    // Initialize visual state
    visualState.isRunning = true;
    visualState.isPaused = false;
    visualState.shouldStop = false;
    visualState.stats.stepsCount = 0;
    visualState.stats.backtracksCount = 0;
    visualState.stats.startTime = performance.now();

    updateVisualizerButtonStates();
    DOM.circuitModeBadge.textContent = 'Active Simulation';
    DOM.circuitModeBadge.classList.add('active');
    setGlobalStatus('working', 'Visualizer Running...');
    showAlert('info', 'Visual step-by-step solving started. Watch the 4-bit register and 3-input AND gate in real time!');
    logMessage('[VISUAL] Step-by-step visualizer started.', 'system');

    // Run async solver
    const solved = await solveSudokuVisual(currentBoard);
    const elapsed = Math.round(performance.now() - visualState.stats.startTime);
    DOM.statTime.textContent = `${elapsed} ms`;

    visualState.isRunning = false;
    updateVisualizerButtonStates();
    DOM.circuitModeBadge.textContent = 'Simulation Idle';
    DOM.circuitModeBadge.classList.remove('active');

    if (visualState.shouldStop) {
      showAlert('warning', 'Visualizer stopped by user.');
      setGlobalStatus('ready', 'Visualizer Stopped');
      logMessage('[VISUAL] Execution aborted by user.', 'system');
      return;
    }

    if (solved) {
      updateClueAndEmptyCounts();
      setGlobalStatus('ready', 'Visual Solve Finished');
      showAlert('success', `🎉 Visual solve complete! Steps: ${visualState.stats.stepsCount} | Backtracks: ${visualState.stats.backtracksCount} | Time: ${elapsed} ms.`);
      logMessage(`[SUCCESS] Visual solve completed in ${elapsed} ms!`, 'success');
    } else {
      setGlobalStatus('error', 'No Solution Found');
      showAlert('error', '✕ Puzzle is unsolvable! All candidate permutations resulted in conflict (VALID = 0).');
      logMessage('[UNSOLVABLE] Visual solver proved puzzle has no solution.', 'gate-low');
    }
  }

  /**
   * Pauses the visualizer
   */
  function pauseVisualizer() {
    if (!visualState.isRunning || visualState.isPaused) return;
    visualState.isPaused = true;
    updateVisualizerButtonStates();
    setGlobalStatus('working', 'Visualizer Paused');
    logMessage('[PAUSE] Visualizer paused. Click "Step" to advance manually or "Play" to resume.', 'system');
  }

  /**
   * Resumes the visualizer from pause
   */
  function resumeVisualizer() {
    if (!visualState.isRunning) {
      startVisualSolver();
      return;
    }
    if (visualState.isPaused) {
      visualState.isPaused = false;
      updateVisualizerButtonStates();
      setGlobalStatus('working', 'Visualizer Running...');
      logMessage('[RESUME] Resuming automatic stepping.', 'system');

      // Resolve pending promise to wake stepping loop
      if (visualState.stepResolver) {
        visualState.stepResolver();
        visualState.stepResolver = null;
      }
    }
  }

  /**
   * Advances a single step manually
   */
  function stepVisualizer() {
    if (!visualState.isRunning) {
      // Start in paused step mode
      startVisualSolver().then(() => {});
      pauseVisualizer();
      return;
    }

    if (visualState.isPaused && visualState.stepResolver) {
      visualState.stepResolver();
      visualState.stepResolver = null;
    }
  }

  /**
   * Stops and aborts the visualizer
   */
  function stopVisualizer() {
    if (visualState.isRunning) {
      visualState.shouldStop = true;
      if (visualState.stepResolver) {
        visualState.stepResolver();
        visualState.stepResolver = null;
      }
    }
    visualState.isRunning = false;
    visualState.isPaused = false;
    updateVisualizerButtonStates();
    resetCircuitHUD();
  }

  /**
   * Updates state of Play, Pause, Step, Stop buttons
   */
  function updateVisualizerButtonStates() {
    if (visualState.isRunning) {
      DOM.btnSolve.disabled = true;
      DOM.btnVisualSolve.disabled = true;
      DOM.btnCheckPuzzle.disabled = true;
      DOM.btnReset.disabled = true;
      DOM.btnClear.disabled = true;
      DOM.sampleSelect.disabled = true;

      DOM.btnVisPlay.disabled = !visualState.isPaused;
      DOM.btnVisPause.disabled = visualState.isPaused;
      DOM.btnVisStep.disabled = !visualState.isPaused;
      DOM.btnVisStop.disabled = false;
    } else {
      DOM.btnSolve.disabled = false;
      DOM.btnVisualSolve.disabled = false;
      DOM.btnCheckPuzzle.disabled = false;
      DOM.btnReset.disabled = false;
      DOM.btnClear.disabled = false;
      DOM.sampleSelect.disabled = false;

      DOM.btnVisPlay.disabled = false;
      DOM.btnVisPause.disabled = true;
      DOM.btnVisStep.disabled = false;
      DOM.btnVisStop.disabled = true;
    }
  }

  /**
   * Updates stats readout (steps, backtracks, elapsed time)
   */
  function updateStatsDisplay() {
    DOM.statSteps.textContent = visualState.stats.stepsCount;
    DOM.statBacktracks.textContent = visualState.stats.backtracksCount;
    const elapsed = Math.round(performance.now() - visualState.stats.startTime);
    DOM.statTime.textContent = `${elapsed} ms`;
  }

  // --------------------------------------------------------------------------
  // 10. SYSTEM STATUS & LOGGING UTILITIES
  // --------------------------------------------------------------------------

  /**
   * Updates the global header status pill
   */
  function setGlobalStatus(statusType, message) {
    DOM.globalStatusDot.className = `status-dot ${statusType}`;
    DOM.globalStatusText.textContent = message;
  }

  /**
   * Displays message banner with icon and color theme
   * @param {'info' | 'success' | 'warning' | 'error'} type 
   * @param {string} message 
   */
  function showAlert(type, message) {
    DOM.boardAlert.className = `board-alert ${type}`;
    if (type === 'success') DOM.alertIcon.textContent = '✓';
    else if (type === 'error') DOM.alertIcon.textContent = '✕';
    else if (type === 'warning') DOM.alertIcon.textContent = '⚠';
    else DOM.alertIcon.textContent = 'ℹ';
    DOM.alertMessage.textContent = message;
  }

  /**
   * Appends an entry to the live console feed
   */
  function logMessage(text, className = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${className}`;
    entry.textContent = text;
    DOM.consoleOutput.appendChild(entry);
    DOM.consoleOutput.scrollTop = DOM.consoleOutput.scrollHeight;
  }

  // --------------------------------------------------------------------------
  // 11. INITIALIZATION & EVENT LISTENERS BINDING
  // --------------------------------------------------------------------------

  function init() {
    // 1. Render 9x9 interactive grid
    initializeGrid();

    // 2. Load default Easy sample puzzle to provide immediate demo experience
    handleLoadSamplePuzzle('easy');

    // 3. Primary action button event listeners
    DOM.btnSolve.addEventListener('click', handleSolveInstant);
    DOM.btnVisualSolve.addEventListener('click', startVisualSolver);
    DOM.btnCheckPuzzle.addEventListener('click', handleCheckPuzzle);
    DOM.btnReset.addEventListener('click', handleResetBoard);
    DOM.btnClear.addEventListener('click', handleClearBoard);

    // 4. Sample puzzle selector dropdown listener
    DOM.sampleSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        handleLoadSamplePuzzle(e.target.value);
      }
    });

    // 5. Visualizer control buttons
    DOM.btnVisPlay.addEventListener('click', resumeVisualizer);
    DOM.btnVisPause.addEventListener('click', pauseVisualizer);
    DOM.btnVisStep.addEventListener('click', stepVisualizer);
    DOM.btnVisStop.addEventListener('click', stopVisualizer);

    // 6. Speed slider listener
    DOM.speedSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      visualState.stepDelay = val;
      if (val < 15) DOM.speedLabel.textContent = `Ultra Fast (${val}ms)`;
      else if (val < 60) DOM.speedLabel.textContent = `Fast (${val}ms)`;
      else if (val < 180) DOM.speedLabel.textContent = `Normal (${val}ms)`;
      else DOM.speedLabel.textContent = `Slow (${val}ms)`;
    });

    // 7. Clear log button
    DOM.btnClearLog.addEventListener('click', () => {
      DOM.consoleOutput.innerHTML = '<div class="log-entry system">[SYSTEM] Log cleared. Ready.</div>';
    });

    // 8. Number pad click listener (for mobile or fast touch entry)
    document.querySelectorAll('.numpad-btn[data-num]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!selectedCell) {
          const firstEmpty = findEmptyCell(currentBoard) || { row: 0, col: 0 };
          handleCellSelect(firstEmpty.row, firstEmpty.col);
        }
        const digit = parseInt(btn.getAttribute('data-num'), 10);
        setDigitInCell(selectedCell.row, selectedCell.col, digit);
        const cell = getCellElement(selectedCell.row, selectedCell.col);
        if (cell) {
          cell.focus();
          cell.select();
        }
      });
    });

    DOM.btnEraseCell.addEventListener('click', (e) => {
      e.preventDefault();
      if (!selectedCell) {
        showAlert('info', 'Click any cell on the grid first to erase it.');
        return;
      }
      setDigitInCell(selectedCell.row, selectedCell.col, 0);
      const cell = getCellElement(selectedCell.row, selectedCell.col);
      if (cell) cell.focus();
    });

    // 9. Global window keyboard listener for smooth typing anywhere on the page
    window.addEventListener('keydown', (e) => {
      if (visualState.isRunning || !selectedCell) return;
      // Do not intercept if user is focusing a select dropdown
      if (e.target && e.target.tagName === 'SELECT') return;

      const { row, col } = selectedCell;
      if (/^[1-9]$/.test(e.key) || /^Numpad[1-9]$/.test(e.code)) {
        e.preventDefault();
        const digit = parseInt(e.key.replace(/[^1-9]/, '') || e.code.replace('Numpad', ''), 10);
        setDigitInCell(row, col, digit);
        const cell = getCellElement(row, col);
        if (cell) {
          cell.focus();
          cell.select();
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0' || e.code === 'Numpad0') {
        e.preventDefault();
        setDigitInCell(row, col, 0);
        const cell = getCellElement(row, col);
        if (cell) cell.focus();
      }
    });

    logMessage('[SYSTEM] Application initialized successfully. Ready for evaluation.', 'system');
  }

  // Initialize once DOM is completely parsed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

