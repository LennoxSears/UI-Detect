## Project title
UI-Detect

## Motivation
This project is for desktop automation, using image recognition to identify screen location of UI elements. Combined with robotjs (or other mouse, keyboard automation library alike), this project can be used to finish many kinds of desktop automation tasks.

## Screenshots
![Screenshots](./img/UI-Detect.gif)

## Features
Detect UI elements included in assets folder every 500 ms, and return the screen location of each UI element.
This project is based [feature detecting function from opencv](https://docs.opencv.org/3.4/d7/d66/tutorial_feature_detection.html).

## Installation
1.Put screenshot of each UI element into assets folder.(Save as .png file and make sure the dimension of .png file is exactly same as the UI element when displayed on screen)
2.In terminal, run "node index.js". Location of each UI element would be printed in terminal.

## Related Project

- [opencv4nodejs](https://github.com/justadudewhohacks/opencv4nodejs)
- [robotjs](https://github.com/octalmage/robotjs)
- [jimp](https://github.com/oliver-moran/jimp)
