import { changeWidth } from './changeWidth';
import { Control } from './Control';
import { rotationStyleHandler, rotationWithSnapping } from './rotate';
import { scaleCursorStyleHandler, scalingEqually } from './scale';
import {
  scaleOrSkewActionName,
  scaleSkewCursorStyleHandler,
  scalingXOrSkewingY,
  scalingYOrSkewingX,
} from './scaleSkew';

export const createObjectDefaultControls = (): Record<string, Control> => ({
  ml: new Control({
    x: -0.5,
    y: 0,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: scalingXOrSkewingY,
    getActionName: scaleOrSkewActionName,
  }),

  mr: new Control({
    x: 0.5,
    y: 0,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: scalingXOrSkewingY,
    getActionName: scaleOrSkewActionName,
  }),

  mb: new Control({
    x: 0,
    y: 0.5,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: scalingYOrSkewingX,
    getActionName: scaleOrSkewActionName,
  }),

  mt: new Control({
    x: 0,
    y: -0.5,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: scalingYOrSkewingX,
    getActionName: scaleOrSkewActionName,
  }),

  tl: new Control({
    x: -0.5,
    y: -0.5,
    cursorStyleHandler: scaleCursorStyleHandler,
    actionHandler: scalingEqually,
  }),

  tr: new Control({
    x: 0.5,
    y: -0.5,
    cursorStyleHandler: scaleCursorStyleHandler,
    actionHandler: scalingEqually,
  }),

  bl: new Control({
    x: -0.5,
    y: 0.5,
    cursorStyleHandler: scaleCursorStyleHandler,
    actionHandler: scalingEqually,
  }),

  br: new Control({
    x: 0.5,
    y: 0.5,
    cursorStyleHandler: scaleCursorStyleHandler,
    actionHandler: scalingEqually,
  }),

  mtr: new Control({
    x: 0,
    y: -0.5,
    actionHandler: rotationWithSnapping,
    cursorStyleHandler: rotationStyleHandler,
    offsetY: -40,
    withConnection: true,
    actionName: 'rotate',
  }),
});

export const createResizeControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
  }),
});