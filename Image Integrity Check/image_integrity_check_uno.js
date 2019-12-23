'use strict';

const { exec } = require('child_process');
const fs = require('fs');

const missingLog = "logs/missing.log"
const failLog = "logs/fail.log"
const successLog = "logs/success.log"

const debug = false

function logIt(message, settings) {
	if (settings === undefined) settings = {}
	if (settings.console === undefined) settings.console = true;
	if (settings.console == true) console.log(message);
	if (settings.file !== undefined) {
		try {
			fs.appendFileSync(settings.file, `${message}\n`)
		} catch (e) {
			console.log ( `${message}\tError: ${e}`) 
		}
	}
}

function Exec (command) {
  return new Promise((done, failed) => {
    exec(command, (err, stdout, stderr) => {
      done({ err, stdout, stderr })
      //failed(err)
    })
  })
}

try { fs.unlinkSync(missingLog) } catch (err) {}
try { fs.unlinkSync(failLog) } catch (err) {}
try { fs.unlinkSync(successLog) } catch (err) {}
try { fs.rmdirSync('logs', {recursive: true}) } catch (err) {}
try { fs.mkdirSync('logs') } catch (err) {}



async function probe(row){
  	
  	if (!fs.existsSync(row.AX_FILE_PATH)) {
		logIt(`${row.ID_OBJET}\t${row.AX_FILE_PATH}`, {file: missingLog, console: debug})
		return
	}

	try{
		
		let { err, stdout, stderr } = await Exec(`"magick" convert ${row.AX_FILE_PATH} -regard-warnings -resize 32x32 preview.jpg`)
		
		if (err) {
			
			logIt(`${row.ID_OBJET}\t${row.AX_FILE_PATH}`, {file: failLog, console: debug})
			
			var dataArray = `${stderr}`.split('\n')

			var filtered = dataArray.filter( (element) => {
				return element != null && element != '';
			});

			filtered.map( (element) => {
				logIt(`${element.replace(/ \`.+/gi, '')}`, {file: failLog, console: debug})
			})
			logIt('', {file: failLog, console: debug})

		} else {
		
			logIt(`${row.ID_OBJET}\t${row.AX_FILE_PATH}`, {file: successLog, console: debug})

		}
		
		try { fs.unlinkSync('preview.jpg') } catch (err) {}

	} catch (e) {
			logIt(`App error: ${e}`)
	}
}

async function run() {
	// corrupted
	await probe({AX_FILE_PATH:'samples/28br6JvzqEKAN-umGCH-Rt_2.jpg', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/8b32db4a-8c3f-4f6d-8fb1-2bf45ca824f0.tiff', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/b0013217-1.jpg', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/corrupted.jpg', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/DSC_4723.jpg', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/PA_Photos_45480741.jpg', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/partial.jpeg', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/run.jpg', ID_OBJET: 0});

	// incorrect profile
	await probe({AX_FILE_PATH:'samples/150502.jpg', ID_OBJET: 0});

	// good
	await probe({AX_FILE_PATH:'samples/9475671.jpg', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/Depositphotos_123918810_xl-2015.jpg', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/image14.jpeg', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/no.png', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/VGRD0421.JPG', ID_OBJET: 0});
	await probe({AX_FILE_PATH:'samples/yes.png', ID_OBJET: 0});
}

run()