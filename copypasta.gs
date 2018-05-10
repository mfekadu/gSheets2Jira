/**
 * prompt user to input JIRA data into "A1" if "A1" is empty
 * read data from "A1"
 * split values into a 2D array based on pipe delimiters ("||" and "|") and newlines
 * write rows and columns into the "Copypasta" sheet
 * return true/false if success/fail respectively
 */
function copypasta(input_sheet_name) {
  if (!input_sheet_name) {
    input_sheet_name = "Input";
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var in_sheet = ss.getSheetByName(input_sheet_name);
  var values = in_sheet.getDataRange().getValues();

  var first_cell = values[0][0];

  if (first_cell == "") {
    var message = "Please paste JIRA data into the cell \"A1\" of sheet ";
    message += "\"" + input_sheet_name + "\" then run this function again.";
    Browser.msgBox(message);
    in_sheet.clear();

    /* Make "A1" cell really big so that there is no way anyone will miss it xD */
    in_sheet.setColumnWidth(1, 1000);
    in_sheet.setRowHeight(1, 600);

    /* place the prompt mesage into cell "A2" */
    in_sheet.getRange(2,1).setValues([[message]]);

    return false;
  }

  in_sheet.setRowHeights(1, 15, 21)     // reset to default heights "21"
  in_sheet.setColumnWidths(1, 15, 100); // reset to default widths "100"

  /* https://regex101.com/
   * the regex = /\|\n|\|\t\n|\|\s+\n/
   * explained : /          \|\n                 |         \|\t\n                 |      \|\s+\n/
   *               ^pipe literal + newline^    ^or^    ^pipe + tab + newline^   ^or^    ^pipe + unlimited spaces + newline
   */
  var first_row = first_cell.split(/\r\n/); // just grab the first line
  var rows = first_cell.split(/\|\n|\|\t\n|\|\s+\n/g);

  /* if there is a mismatch, then the || is missing and needs fixing */
  if( first_row[0] != rows[0]) {
    rows[0] = rows[0].split(/\r\n/);
    rows.insert( 1, rows[0][1] );
    rows[0] = rows[0][0];
    rows[0] = rows[0] + "||";
  }

  var cells = [];
  var i = 0;
  var longest_row_len = 0;

  /* loop over each row from input
   * and split into cells by delimiters
   * "||" or "|"
   */
  rows.forEach(function each(row) {
    cells[i] = row.split(/\|\||\|/);
    currLen = cells[i].length;
    longest_row_len = (longest_row_len > currLen) ? longest_row_len : currLen;
    i++;
    Logger.log(row);
  });

  /* make sure each row in "cells" has length = "longest_row_len"
   * because range.setValues requires the dimensions of "cells"
   * to exactly match the specified dimensions.
   */
  var m = 0;
  var n = 0;
  cells.forEach(function each(row) {
    currLen = row.length;
    if (longest_row_len > currLen) {
      m = longest_row_len - currLen;
      /* push "" into row 'm' number of times */
      for(n = 0; n < m; n++){
        row.push("");
      }
    }
  });

  in_sheet.clear();

  /* set range of "i" rows and "longest_row_len" columns
   * with the values inside "cells"
   */
  var range = in_sheet.getRange(1,1,i, longest_row_len);
  range.setValues(cells);



  /* since JIRA tables are formatting with "|" or "||" a the start
   * the above code ends up leaving a NULL column
   * this deletes the NULL first column
   */
  in_sheet.deleteColumn(1); // Columns start at "1" - this deletes the first column
  /* then make sure to insert column a bug occurs
   * where there are too few columns
   * after calling copypasta too many times.
   * columns are labeled A-Z. After deletion colmns A-Y exist.
   */
  in_sheet.insertColumnAfter(25); // 'Y' is the 25th letter of the alphabet.

  /* now we should have a clean sheet
   * that looks similar to the "Input" sheet
   * such that there are 4 columns
   *
   * "	Step Name	"	"	Description	"	"	Expected Results "	 Notes
   */

  jiraMarkup(input_sheet_name); // and now jiraMarkup can do it's job :D

  return true;
}
