import React from "react";
import Cell from "./Cell";

interface BoardProps {
  height: number;
  width: number;
  mines: number;
}

interface BoardData {
  x: number;
  y: number;
  isMine: boolean;
  neighbour: number;
  isRevealed: boolean;
  isEmpty: boolean;
  isFlagged: boolean;
}

export default class Board extends React.Component<BoardProps> {
  state = {
    boardData: this.initBoardData(
      this.props.height,
      this.props.width,
      this.props.mines
    ),
    gameWon: false,
    mineCount: this.props.mines,
  };

  /* Helper Functions */

  // get mines
  getMines(data: BoardData[][]) {
    let mineArray: BoardData[] = [];

    data.map((dataRow) => {
      dataRow.map((dataItem) => {
        if (dataItem.isMine) {
          mineArray.push(dataItem);
        }
      });
    });

    return mineArray;
  }

  // get Flags
  getFlags(data: BoardData[][]) {
    let mineArray: BoardData[] = [];

    data.map((dataRow) => {
      dataRow.map((dataItem) => {
        if (dataItem.isFlagged) {
          mineArray.push(dataItem);
        }
      });
    });

    return mineArray;
  }

  // get Hidden cells
  getHidden(data: BoardData[][]) {
    let mineArray: BoardData[] = [];

    data.map((dataRow) => {
      dataRow.map((dataItem) => {
        if (!dataItem.isRevealed) {
          mineArray.push(dataItem);
        }
      });
    });

    return mineArray;
  }

  // get random number given a dimension
  getRandomNumber(dimension: number) {
    // return Math.floor(Math.random() * dimension);
    return Math.floor(Math.random() * 1000 + 1) % dimension;
  }

  // Gets initial board data
  initBoardData(height: number, width: number, mines: number) {
    let data: BoardData[][] = [];

    for (let i = 0; i < height; i++) {
      data.push([]);
      for (let j = 0; j < width; j++) {
        data[i][j] = {
          x: i,
          y: j,
          isMine: false,
          neighbour: 0,
          isRevealed: false,
          isEmpty: false,
          isFlagged: false,
        };
      }
    }
    data = this.plantMines(data, height, width, mines);
    data = this.getNeighbours(data, height, width);
    console.log(data);
    return data;
  }

  // plant mines on the board
  plantMines(
    data: BoardData[][],
    height: number,
    width: number,
    mines: number
  ) {
    let randomX: number,
      randomY: number,
      minesPlanted = 0;

    while (minesPlanted < mines) {
      randomX = this.getRandomNumber(width);
      randomY = this.getRandomNumber(height);
      if (!data[randomX][randomY].isMine) {
        data[randomX][randomY].isMine = true;
        minesPlanted++;
      }
    }

    return data;
  }

  // get number of neighbouring mines for each board cell
  getNeighbours(data: BoardData[][], height: number, width: number) {
    let updatedData = data,
      index = 0;

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (data[i][j].isMine !== true) {
          let mine = 0;
          const area = this.traverseBoard(data[i][j].x, data[i][j].y, data);
          area.map((value) => {
            if (value.isMine) {
              mine++;
            }
          });
          if (mine === 0) {
            updatedData[i][j].isEmpty = true;
          }
          updatedData[i][j].neighbour = mine;
        }
      }
    }

    return updatedData;
  }

  // looks for neighbouring cells and returns them
  traverseBoard(x: number, y: number, data: BoardData[][]) {
    const el = [];

    //up
    if (x > 0) {
      el.push(data[x - 1][y]);
    }

    //down
    if (x < this.props.height - 1) {
      el.push(data[x + 1][y]);
    }

    //left
    if (y > 0) {
      el.push(data[x][y - 1]);
    }

    //right
    if (y < this.props.width - 1) {
      el.push(data[x][y + 1]);
    }

    // top left
    if (x > 0 && y > 0) {
      el.push(data[x - 1][y - 1]);
    }

    // top right
    if (x > 0 && y < this.props.width - 1) {
      el.push(data[x - 1][y + 1]);
    }

    // bottom right
    if (x < this.props.height - 1 && y < this.props.width - 1) {
      el.push(data[x + 1][y + 1]);
    }

    // bottom left
    if (x < this.props.height - 1 && y > 0) {
      el.push(data[x + 1][y - 1]);
    }

    return el;
  }

  // reveals the whole board
  revealBoard() {
    let updatedData = this.state.boardData;
    updatedData.map((dataRow) => {
      dataRow.map((dataItem) => {
        dataItem.isRevealed = true;
      });
    });
    this.setState({
      boardData: updatedData,
    });
  }

  /* reveal logic for empty cell */
  revealEmpty(x: number, y: number, data: BoardData[][]) {
    let area = this.traverseBoard(x, y, data);
    area.map((value) => {
      if (!value.isRevealed && (value.isEmpty || !value.isMine)) {
        data[value.x][value.y].isRevealed = true;
        if (value.isEmpty) {
          this.revealEmpty(value.x, value.y, data);
        }
      }
    });
    return data;
  }

  // Handle User Events

  handleCellClick(x: number, y: number) {
    let win = false;

    // check if revealed. return if true.
    if (this.state.boardData[x][y].isRevealed) return null;

    // check if mine. game over if true
    if (this.state.boardData[x][y].isMine) {
      this.revealBoard();
      alert("game over");
    }

    let updatedData = this.state.boardData;
    updatedData[x][y].isFlagged = false;
    updatedData[x][y].isRevealed = true;

    if (updatedData[x][y].isEmpty) {
      updatedData = this.revealEmpty(x, y, updatedData);
    }

    if (this.getHidden(updatedData).length === this.props.mines) {
      win = true;
      this.revealBoard();
      alert("You Win");
    }

    this.setState({
      boardData: updatedData,
      mineCount: this.props.mines - this.getFlags(updatedData).length,
      gameWon: win,
    });
  }

  _handleContextMenu(e: React.MouseEvent, x: number, y: number) {
    e.preventDefault();
    let updatedData = this.state.boardData;
    let mines = this.state.mineCount;
    let win = false;

    // check if already revealed
    if (updatedData[x][y].isRevealed) return;

    if (updatedData[x][y].isFlagged) {
      updatedData[x][y].isFlagged = false;
      mines++;
    } else {
      updatedData[x][y].isFlagged = true;
      mines--;
    }

    if (mines === 0) {
      const mineArray = this.getMines(updatedData);
      const FlagArray = this.getFlags(updatedData);
      win = JSON.stringify(mineArray) === JSON.stringify(FlagArray);
      if (win) {
        this.revealBoard();
        alert("You Win");
      }
    }

    this.setState({
      boardData: updatedData,
      mineCount: mines,
      gameWon: win,
    });
  }

  renderBoard(data: BoardData[][]) {
    return data.map((dataRow) => {
      return dataRow.map((dataItem) => {
        return (
          <div key={dataItem.x * dataRow.length + dataItem.y}>
            <Cell
              onClick={() => this.handleCellClick(dataItem.x, dataItem.y)}
              cMenu={(e) => this._handleContextMenu(e, dataItem.x, dataItem.y)}
              value={dataItem}
            />
            {dataRow[dataRow.length - 1] === dataItem ? (
              <div className="clear" />
            ) : (
              ""
            )}
          </div>
        );
      });
    });
  }
  // Component methods
  componentWillReceiveProps(nextProps: BoardProps) {
    if (JSON.stringify(this.props) !== JSON.stringify(nextProps)) {
      this.setState({
        boardData: this.initBoardData(
          nextProps.height,
          nextProps.width,
          nextProps.mines
        ),
        gameWon: false,
        mineCount: nextProps.mines,
      });
    }
  }

  render() {
    return (
      <div className="board">
        <div className="game-info">
          <span className="info">mines: {this.state.mineCount}</span>
          <br />
          <span className="info">{this.state.gameWon ? "You Win" : ""}</span>
        </div>
        {this.renderBoard(this.state.boardData)}
      </div>
    );
  }
}
