
import { bindActionCreators } from 'redux'

import { settable, reduxSettables } from './settable'
import { Toolbar } from './toolbar'

const FB_WIDTH = 40
const FB_HEIGHT = 25

function setChar(framebuf, {row, col, screencode, color}) {
  return framebuf.map((pixelRow, idx) => {
    if (row === idx) {
      return pixelRow.map((pix, x) => {
        if (col === x) {
          if (screencode === undefined) {
            return { ...pix, color }
          }
          return { code:screencode, color }
        }
        return pix
      })
    }
    return pixelRow
  })
}

function setBrush(framebuf, {row, col, brush}) {
  const { min, max } = brush.brushRegion
  return framebuf.map((pixelRow, y) => {
    const yo = y - row
    if (yo >= min.row && yo <= max.row) {
      return pixelRow.map((pix, x) => {
        const xo = x - col
        if (xo  >= min.col && xo <= max.col) {
          const bpix = brush.framebuf[yo - min.row][xo - min.col]
          return {
            code: bpix.code,
            color: bpix.color
          }
        }
        return pix
      })
    }
    return pixelRow
  })
}

function emptyFramebuf () {
  return Array(FB_HEIGHT).fill(Array(FB_WIDTH).fill({code: 32, color:14}))
}

const settables = reduxSettables([
  settable('Framebuffer', 'backgroundColor', 6),
  settable('Framebuffer', 'borderColor', 14)
])

export class Framebuffer {
  static SET_PIXEL = `${Framebuffer.name}/SET_PIXEL`
  static SET_BRUSH = `${Framebuffer.name}/SET_BRUSH`
  static IMPORT_FILE = `${Framebuffer.name}/IMPORT_FILE`

  static actions = {
    ...settables.actions,
    setPixel: ({row, col, screencode, color, undoId}, framebufIndex) => {
      return {
        type: Framebuffer.SET_PIXEL,
        data: { row, col, screencode, color },
        undoId,
        framebufIndex
      }
    },
    setBrush: ({row, col, brush, undoId}, framebufIndex) => {
      return {
        type: Framebuffer.SET_BRUSH,
        data: { row, col, brush },
        undoId,
        framebufIndex
      }
    },
    importFile: (contents, framebufIndex) => {
      return {
        type: Framebuffer.IMPORT_FILE,
        data: contents,
        framebufIndex
      }
    }
  }

  static reducer(state = {
      ...settables.initialValues,
      framebuf: emptyFramebuf(),
      width: 40,
      height: 25
    }, action) {
    switch (action.type) {
      case Framebuffer.SET_PIXEL:
        return {
          ...state,
          framebuf: setChar(state.framebuf, action.data)
        }
      case Framebuffer.SET_BRUSH:
        return {
          ...state,
          framebuf: setBrush(state.framebuf, action.data)
        }
      case Toolbar.CLEAR_CANVAS:
        return {
          ...state,
          framebuf: emptyFramebuf()
        }
      case Framebuffer.IMPORT_FILE:
        const c = action.data
        return {
          framebuf: c.framebuf,
          width: c.width,
          height: c.height,
          backgroundColor: c.backgroundColor,
          borderColor: c.borderColor
        }
      default:
        return settables.reducer(state, action)
    }
  }

  static bindDispatch (dispatch) {
    return bindActionCreators(Framebuffer.actions, dispatch)
  }
}