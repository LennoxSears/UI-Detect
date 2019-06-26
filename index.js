const cv = require('opencv4nodejs');
const robot = require("robotjs");
var Jimp = require( 'jimp' );
var fs = require('fs');
var path = require('path');
const matchTH = 0.85;

/**
 * Promise all
 * @author Loreto Parisi (loretoparisi at gmail dot com)
 */
function promiseAllP(items, block) {
    var promises = [];
    items.forEach(function(item,index) {
        promises.push( function(item,i) {
            return new Promise(function(resolve, reject) {
                return block.apply(this,[item,index,resolve,reject]);
            });
        }(item,index))
    });
    return Promise.all(promises);
} //promiseAll

/**
 * read files
 * @param dirname string
 * @return Promise
 * @author Loreto Parisi (loretoparisi at gmail dot com)
 * @see http://stackoverflow.com/questions/10049557/reading-all-files-in-a-directory-store-them-in-objects-and-send-the-object
 */
function readFiles(dirname) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirname, function(err, filenames) {
            if (err) return reject(err);
            promiseAllP(filenames,
            (filename,index,resolve,reject) =>  {
                if(filename.endsWith('.png')) {
                  var fileMat = cv.imread(path.resolve(dirname, filename));
                  return resolve({filename: filename, contents: fileMat});
                }
                else {
                  return resolve({filename: filename, contents: null});
                }
            })
            .then(results => {
                return resolve(results);
            })
            .catch(error => {
                return reject(error);
            });
        });
  });
}


function screenCaptureToFile( robotScreenPic ) {
  return new Promise( ( resolve, reject ) => {
    try {
      //console.log( "screenCaptureToFile" );
      const image = new Jimp( robotScreenPic.width, robotScreenPic.height );
      let pos = 0;
      image.scan( 0, 0, image.bitmap.width, image.bitmap.height, ( x, y, idx ) => {
        /* eslint-disable no-plusplus */
        image.bitmap.data[ idx + 2 ] = robotScreenPic.image.readUInt8( pos++ );
        image.bitmap.data[ idx + 1 ] = robotScreenPic.image.readUInt8( pos++ );
        image.bitmap.data[ idx + 0 ] = robotScreenPic.image.readUInt8( pos++ );
        image.bitmap.data[ idx + 3 ] = robotScreenPic.image.readUInt8( pos++ );
        /* eslint-enable no-plusplus */
      } );
      resolve(image);
    } catch ( e ) {
      console.error( e );
      reject( e );
    }
  } );
}

function screenSave( image, file_name ) {
  return new Promise( ( resolve, reject ) => {
    image.write( `${file_name}.png`, ( err, ret ) => err ? reject( err ) : resolve( ret ) );
  } )
}

function imageToMatrix( image_path ) {
  return new Promise( ( resolve, reject ) => {
    cv.readImage( image_path, ( err, matrix ) => err ? reject( err ) : resolve( matrix ) );
  } )
}

function captureScreen() {
  return new Promise ((resolve, reject) => {
    var img = robot.screen.capture(0, 0);
    var image64;
    screenCaptureToFile(img).then(result => {return result.getBase64Async(Jimp.MIME_PNG)}).then(result => {
      var base64data = result.replace('data:image/jpeg;base64','').replace('data:image/png;base64','');
      var buffer64 = Buffer.from(base64data,'base64');
      image64 = cv.imdecode(buffer64);
      return image64;
    }).then(result => {resolve(result)});
  });
}

var UIs = new Array();
const UILocate = (tempPNG) => {

    captureScreen().then(function(result) {
    var originalMat = result;
    var waldoMat = tempPNG;

    var UIObj = new Array();
    waldoMat.forEach((item, index) => {
      if(item.contents != null) {
        const matched = originalMat.matchTemplate(item.contents, 5);
        //console.log(JSON.stringify(matched));
        for (var y = 0; y < matched.cols; y++) {
          for (var x = 0; x < matched.rows; x++) {
            if(matched.atRaw(x, y) > matchTH ) {
                UIObj.push({UIName:item.filename.replace('.png', ''), UILocationX: y + item.contents.cols/2, UILocationY: x + item.contents.rows/2});
            }
          }
        }
      }
    });
    return {Mat:originalMat, UI:UIObj};
  }).then(function(result) {
      for(var i = 0; i < result.UI.length; i++) {
        for(var j = 0; j < i; j++) {
          var distance = Math.pow((result.UI[i].UILocationX - result.UI[j].UILocationX),2) + Math.pow((result.UI[i].UILocationY - result.UI[j].UILocationY),2);
          //console.log('distance of (' + result.UI[i].UILocationX + ', ' + result.UI[i].UILocationY + ') and (' + result.UI[j].UILocationX + ', ' + result.UI[j].UILocationY + ') is ' + distance);

            if(distance < 4000) {
              result.UI.splice(i, 1);
              //console.log('UI length is ' + result.UI.length);
              i--;
              continue;
            }
        }
      }
      return result;
    }).then((result) => {
      UIs = result.UI.slice(0);
    })

};

var tempPic;
var init = async function() {
  tempPic = await readFiles(__dirname + '/' + 'assets');
  UILocate(tempPic);
};

var update = async function() {
  UILocate(tempPic);
};

init();
setInterval(() => {
  update();
  if(UIs.length < 1) {
    console.log('No UI element found.');
  }
  else {
    for(var i = 0; i <  UIs.length; i++) {
      console.log('UI on screen: ' + JSON.stringify(UIs[i]));
    }
  }
}, 500);
